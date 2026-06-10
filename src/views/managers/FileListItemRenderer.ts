import { MarkdownView, TFile, setIcon } from "obsidian";
import CommentPlugin from "../../../main";
import { t } from "../../i18n";
import { FileListDataSource } from "./FileListDataSource";

interface FileListRenderState {
    currentFile: TFile | null;
    isDraggedToMainView: boolean;
}

interface FileListItemRendererOptions {
    plugin: CommentPlugin;
    dataSource: FileListDataSource;
    getState: () => FileListRenderState;
    onFileSelect: () => ((file: TFile | null) => void) | null;
    onAllHighlightsSelect: () => (() => void) | null;
}

export class FileListItemRenderer {
    constructor(private options: FileListItemRendererOptions) {}

    createAllHighlightsItem(fileList: HTMLElement): void {
        const state = this.options.getState();
        const allFilesItem = fileList.createEl("div", {
            cls: `highlight-file-item highlight-file-item-all ${state.currentFile === null ? "is-active" : ""}`
        });

        const allFilesLeft = allFilesItem.createEl("div", {
            cls: "highlight-file-item-left"
        });

        const allIcon = allFilesLeft.createEl("span", {
            cls: "highlight-file-item-icon"
        });
        setIcon(allIcon, "square-library");

        allFilesLeft.createEl("span", {
            text: t("All Highlight"),
            cls: "highlight-file-item-name"
        });

        allFilesItem.createEl("span", {
            text: `${this.options.dataSource.getTotalHighlightsCount()}`,
            cls: "highlight-file-item-count"
        });

        allFilesItem.addEventListener("click", () => {
            this.options.onAllHighlightsSelect()?.();
        });
    }

    updateAllHighlightsCount(container: HTMLElement): void {
        const countEl = container.querySelector(".highlight-file-item-all .highlight-file-item-count");
        if (countEl) {
            countEl.textContent = `${this.options.dataSource.getTotalHighlightsCount()}`;
        }
    }

    async createFileItem(fileList: HTMLElement, file: TFile): Promise<void> {
        const state = this.options.getState();
        const fileItem = fileList.createEl("div", {
            cls: `highlight-file-item ${state.currentFile?.path === file.path ? "is-active" : ""}`
        });
        fileItem.setAttribute("data-path", file.path);

        const fileItemLeft = fileItem.createEl("div", {
            cls: "highlight-file-item-left"
        });

        const fileIcon = fileItemLeft.createEl("span", {
            cls: "highlight-file-item-icon",
            attr: {
                "aria-label": t("Open (DoubleClick)")
            }
        });
        setIcon(fileIcon, "file-text");

        fileIcon.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            const leaf = this.getPreferredLeaf();
            void leaf.openFile(file);
        });

        const fileNameEl = fileItemLeft.createEl("span", {
            text: file.basename,
            cls: "highlight-file-item-name"
        });

        this.addPagePreview(fileNameEl, file);

        const highlightCount = await this.options.dataSource.getFileHighlightsCount(file);
        fileItem.createEl("span", {
            text: `${highlightCount}`,
            cls: "highlight-file-item-count"
        });

        fileItem.addEventListener("click", () => {
            this.options.onFileSelect()?.(file);
        });
    }

    updateSelection(container: HTMLElement): void {
        const state = this.options.getState();

        const allFilesItem = container.querySelector(".highlight-file-item-all");
        if (allFilesItem) {
            allFilesItem.classList.toggle("is-active", state.currentFile === null);
        }

        const fileItems = container.querySelectorAll(".highlight-file-item:not(.highlight-file-item-all)");
        fileItems.forEach((item: HTMLElement) => {
            const isActive = state.currentFile?.path === item.getAttribute("data-path");
            item.classList.toggle("is-active", isActive);
        });
    }

    destroy(): void {}

    private addPagePreview(element: HTMLElement, file: TFile): void {
        let hoverTimeout: number | undefined;

        element.addEventListener("mouseenter", (event) => {
            hoverTimeout = window.setTimeout(() => {
                const target = event.target as HTMLElement;

                this.options.plugin.app.workspace.trigger("hover-link", {
                    event,
                    source: "hi-note",
                    hoverParent: target,
                    targetEl: target,
                    linktext: file.path
                });
            }, 300);
        });

        element.addEventListener("mouseleave", () => {
            if (hoverTimeout) {
                window.clearTimeout(hoverTimeout);
            }
        });
    }

    private getPreferredLeaf() {
        const leaves = this.options.plugin.app.workspace.getLeavesOfType("markdown");

        if (this.options.getState().isDraggedToMainView) {
            const activeMarkdownLeaf = this.options.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
            const otherLeaf = leaves.find(leaf => leaf !== activeMarkdownLeaf);
            if (otherLeaf) {
                return otherLeaf;
            }
        }

        return this.options.plugin.app.workspace.getLeaf("split", "vertical");
    }
}
