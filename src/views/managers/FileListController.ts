import { TFile } from "obsidian";
import { FileListManager } from "./FileListManager";
import type { ViewState } from "../hinote/ViewState";

interface FileListControllerOptions {
    state: ViewState;
    fileListManager: FileListManager;
    highlightContainer: HTMLElement;
    searchContainer: HTMLElement;
    updateViewLayout: () => Promise<void>;
    updateHighlights: () => Promise<void>;
    updateAllHighlights: () => Promise<void>;
}

export class FileListController {
    constructor(private options: FileListControllerOptions) {}

    getCallbacks() {
        return {
            onFileSelect: async (file: TFile | null) => this.selectFile(file),
            onAllHighlightsSelect: async () => this.selectAllHighlights(),
            onRefreshView: async () => this.refreshCurrentView()
        };
    }

    private async selectFile(file: TFile | null): Promise<void> {
        const { state } = this.options;

        state.currentFile = file;
        this.resetHighlightContainer();
        this.syncFileListState();
        this.showSearchActions();
        await this.enterContentPaneOnSmallMobile();
        await this.options.updateHighlights();
    }

    private async selectAllHighlights(): Promise<void> {
        const { state } = this.options;

        state.currentFile = null;
        this.resetHighlightContainer();
        this.syncFileListState();
        this.options.searchContainer.removeClass('highlight-display-none');
        this.hideSearchActions();
        await this.enterContentPaneOnSmallMobile();
        await this.options.updateAllHighlights();
    }

    private async refreshCurrentView(): Promise<void> {
        const { state } = this.options;

        if (state.currentFile === null) {
            await this.options.updateAllHighlights();
        } else {
            await this.options.updateHighlights();
        }
    }

    private resetHighlightContainer(): void {
        this.options.highlightContainer.empty();
    }

    private syncFileListState(): void {
        const { state, fileListManager } = this.options;
        fileListManager.updateState({
            currentFile: state.currentFile
        });
        fileListManager.updateFileListSelection();
    }

    private async enterContentPaneOnSmallMobile(): Promise<void> {
        const { state } = this.options;
        if (state.isMobileView && state.isSmallScreen && state.isDraggedToMainView) {
            state.isShowingFileList = false;
            await this.options.updateViewLayout();
        }
    }

    private showSearchActions(): void {
        this.options.searchContainer.removeClass('highlight-display-none');
        const iconButtons = this.getSearchActionsContainer();
        iconButtons?.removeClass('highlight-display-none');
    }

    private hideSearchActions(): void {
        const iconButtons = this.getSearchActionsContainer();
        iconButtons?.addClass('highlight-display-none');
    }

    private getSearchActionsContainer(): HTMLElement | null {
        return this.options.searchContainer.querySelector('.highlight-search-icons');
    }
}
