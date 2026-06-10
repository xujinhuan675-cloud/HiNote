import { setIcon } from "obsidian";
import { HighlightInfo } from "../../types/highlight";
import CommentPlugin from "../../../main";
import { ExportService } from "../../services/ExportService";
import { HighlightService } from "../../services/HighlightService";
import { t } from "../../i18n";
import { BatchHighlightDeletionOperations } from "./BatchHighlightDeletionOperations";
import { BatchExportOperations } from "./BatchExportOperations";

/**
 * 批量操作处理器
 * 负责处理选中高亮的批量操作，包括：
 * - 批量导出
 * - 批量删除高亮
 */
export class BatchOperationsHandler {
    private plugin: CommentPlugin;
    private exportService: ExportService;
    private highlightService: HighlightService;
    private containerEl: HTMLElement;
    private multiSelectActionsContainer: HTMLElement | null = null;
    private exportOperations: BatchExportOperations | null = null;
    private deletionOperations: BatchHighlightDeletionOperations | null = null;
    
    // 回调函数
    private getSelectedHighlightsCallback: () => Set<HighlightInfo>;
    
    constructor(
        plugin: CommentPlugin,
        exportService: ExportService,
        highlightService: HighlightService,
        containerEl: HTMLElement
    ) {
        this.plugin = plugin;
        this.exportService = exportService;
        this.highlightService = highlightService;
        this.containerEl = containerEl;
    }
    
    /**
     * 设置回调函数
     */
    setCallbacks(
        getSelectedHighlights: () => Set<HighlightInfo>,
        onClearSelection: () => void,
        onRefreshView: () => Promise<void>
    ) {
        this.getSelectedHighlightsCallback = getSelectedHighlights;
        this.exportOperations = new BatchExportOperations({
            exportService: this.exportService,
            getSelectedHighlights,
            clearSelection: onClearSelection
        });
        this.deletionOperations = new BatchHighlightDeletionOperations({
            plugin: this.plugin,
            highlightService: this.highlightService,
            getSelectedHighlights,
            clearSelection: onClearSelection
        });
    }
    
    /**
     * 显示多选操作按钮
     */
    async showMultiSelectActions(selectedCount: number) {
        if (selectedCount <= 1) {
            this.hideMultiSelectActions();
            return;
        }
        
        // 如果已经存在，先移除
        this.hideMultiSelectActions();
        
        // 创建多选操作容器
        if (!this.multiSelectActionsContainer) {
            this.multiSelectActionsContainer = this.containerEl.createEl('div', {
                cls: 'multi-select-actions'
            });
        }
        
        this.multiSelectActionsContainer.show();
        this.multiSelectActionsContainer.empty();
        
        // 添加标题
        this.multiSelectActionsContainer.createEl('div', {
            cls: 'selected-count',
            text: `selected ${selectedCount}`
        });
        
        // 添加导出按钮
        this.createExportButton();
        
        // 添加删除按钮
        this.createDeleteButton();
    }
    
    /**
     * 隐藏多选操作按钮
     */
    hideMultiSelectActions() {
        if (this.multiSelectActionsContainer) {
            this.multiSelectActionsContainer.empty();
            this.multiSelectActionsContainer.hide();
        }
    }
    
    /**
     * 创建导出按钮
     */
    private createExportButton() {
        if (!this.multiSelectActionsContainer) return;
        
        const exportButton = this.multiSelectActionsContainer.createEl('div', {
            cls: 'multi-select-action-button'
        });
        exportButton.setAttribute('aria-label', t('Export'));
        setIcon(exportButton, 'file-input');
        exportButton.addEventListener('click', () => {
            void this.exportOperations?.exportSelectedHighlights();
        });
    }
    
    /**
     * 创建删除按钮
     */
    private createDeleteButton() {
        if (!this.multiSelectActionsContainer) return;
        
        const deleteButton = this.multiSelectActionsContainer.createEl('div', {
            cls: 'multi-select-action-button'
        });
        deleteButton.setAttribute('aria-label', t('Delete'));
        setIcon(deleteButton, 'trash');
        deleteButton.addEventListener('click', () => {
            this.deletionOperations?.confirmDeleteSelectedHighlights();
        });
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.hideMultiSelectActions();
        if (this.multiSelectActionsContainer) {
            this.multiSelectActionsContainer.remove();
            this.multiSelectActionsContainer = null;
        }
    }
}
