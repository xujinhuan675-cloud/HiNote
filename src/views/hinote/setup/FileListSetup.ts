import CommentPlugin from "../../../../main";
import { HighlightService } from "../../../services/HighlightService";
import { HighlightListController } from "../../highlight";
import { FileListController, FileListManager } from "../../managers";
import { ViewState } from "../ViewState";

interface FileListSetupOptions {
    plugin: CommentPlugin;
    highlightService: HighlightService;
    state: ViewState;
    fileListContainer: HTMLElement;
    highlightContainer: HTMLElement;
    searchContainer: HTMLElement;
    highlightListController: HighlightListController;
    updateViewLayout: () => Promise<void>;
}

export function setupFileList(options: FileListSetupOptions): {
    fileListManager: FileListManager;
    fileListController: FileListController;
} {
    const {
        plugin,
        highlightService,
        state,
        fileListContainer,
        highlightContainer,
        searchContainer,
        highlightListController,
        updateViewLayout
    } = options;

    const fileListManager = new FileListManager(
        fileListContainer,
        plugin,
        highlightService
    );
    const fileListController = new FileListController({
        state,
        fileListManager,
        highlightContainer,
        searchContainer,
        updateViewLayout,
        updateHighlights: async () => await highlightListController.updateHighlights(),
        updateAllHighlights: async () => await highlightListController.updateAllHighlights()
    });
    fileListManager.setCallbacks(fileListController.getCallbacks());

    return {
        fileListManager,
        fileListController
    };
}
