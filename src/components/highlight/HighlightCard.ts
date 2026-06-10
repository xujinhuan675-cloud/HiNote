import { HighlightInfo, CommentItem } from "../../types/highlight";
import type CommentPlugin from "../../../main";
import { Notice } from "obsidian";
import { t } from "../../i18n";
import { SelectionManager } from "../../views/selection";
import { HighlightDeletionManager } from "../../views/highlight";
import {
    HighlightCardClipboard,
    HighlightCardDragController,
    HighlightCardFileNavigator,
    HighlightCardMenuController,
    HighlightCardSelectionController,
    HighlightCardTitleBarRenderer
} from "./card";
import { defaultHighlightCardRegistry, HighlightCardRegistry } from "./HighlightCardRegistry";
import {
    createHighlightCardElement,
    renderHighlightCardComments,
    renderHighlightCardContent
} from "./HighlightCardView";

export class HighlightCard {
    private card: HTMLElement;
    private fileName: string | undefined;
    private dragController: HighlightCardDragController;
    private fileNavigator: HighlightCardFileNavigator;
    private selectionController: HighlightCardSelectionController;
    private titleBarRenderer: HighlightCardTitleBarRenderer;
    private menuController = new HighlightCardMenuController();
    
    // 管理器实例
    private deletionManager: HighlightDeletionManager;

    constructor(
        private container: HTMLElement,
        private highlight: HighlightInfo,
        private plugin: CommentPlugin,
        private options: {
            onHighlightClick: (highlight: HighlightInfo) => Promise<void>;
            onCommentAdd: (highlight: HighlightInfo) => void;
            onExport: (highlight: HighlightInfo) => void;
            onCommentEdit: (highlight: HighlightInfo, comment: CommentItem) => void;
            onAIResponse: (content: string, promptName: string) => Promise<void>;
        },
        private isInMainView: boolean = false,
        fileName?: string,
        private selectionManager?: SelectionManager,  // SelectionManager 实例
        private registry: HighlightCardRegistry = defaultHighlightCardRegistry
    ) {
        this.fileName = fileName;
        this.highlight = highlight;
        this.plugin = plugin;
        this.options = options;
        this.fileName = this.highlight.filePath?.split('/').pop();
        
        // 初始化管理器
        this.deletionManager = new HighlightDeletionManager(plugin);
        this.dragController = new HighlightCardDragController(plugin, () => this.highlight);
        this.selectionController = new HighlightCardSelectionController({
            getCard: () => this.card,
            getHighlight: () => this.highlight,
            getSelectionManager: () => this.selectionManager,
            onCommentAdd: (highlight) => this.options.onCommentAdd(highlight)
        });
        this.fileNavigator = new HighlightCardFileNavigator(
            plugin,
            () => this.highlight,
            () => this.fileName
        );
        this.titleBarRenderer = new HighlightCardTitleBarRenderer({
            plugin,
            getHighlight: () => this.highlight,
            getFileName: () => this.fileName,
            isInMainView: this.isInMainView,
            dragController: this.dragController,
            fileNavigator: this.fileNavigator,
            onAIResponse: async (content, promptName) => {
                await this.options.onAIResponse(content, promptName);
            },
            onMoreActions: (button) => this.toggleMoreActionsDropdown(button)
        });
        
        this.registry.register(this);
        
        this.render();
    }

    private render() {
        this.card = createHighlightCardElement(this.container, this.highlight);

        // 添加点击事件用于切换选中状态，支持多选
        this.card.addEventListener("click", (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (this.selectionController.shouldIgnoreCardClick(target)) {
                return;
            }
            
            this.selectCard(e);
        });
        
        this.titleBarRenderer.render(this.card);

        renderHighlightCardContent(
            this.card,
            this.highlight,
            this.plugin.app,
            this.isInMainView,
            this.options.onHighlightClick
        );

        this.renderComments();
    }
    
    /**
     * 显示评论输入框
     * 用于外部调用，直接触发评论输入框的显示
     */
    public showCommentInput(): void {
        // 清除所有卡片的不聚焦输入框
        this.registry.clearAllUnfocusedInputs();
        this.selectionController.showCommentInput();
    }

    // 添加选中卡片的方法，支持多选和取消选择
    private selectCard(event?: MouseEvent) {
        // 先清除所有卡片上的不聚焦输入框
        this.registry.clearAllUnfocusedInputs();
        this.selectionController.selectCard(event);
    }
    
    public getElement(): HTMLElement {
        return this.card;
    }

    public getHighlightId(): string | undefined {
        return this.highlight.id;
    }

    public clearUnfocusedInput(): void {
        this.selectionController.removeUnfocusedInput();
    }

    public handleInputShown(): void {
        this.selectionController.handleInputShown();
    }

    public handleInputClosed(): void {
        this.selectionController.handleInputClosed();
    }

    public update(highlight: HighlightInfo) {
        this.highlight = highlight;
        this.selectionController.resetEditing();
        this.card.empty();
        this.render();
    }

    /**
     * 复制高亮和批注内容
     */
    private copyHighlightContent(): void {
        HighlightCardClipboard.copyHighlightContent(this.highlight, this.fileName);
    }
    
    /**
     * 处理导出为图片功能
     */
    private handleExportAsImage(): void {
        this.options.onExport(this.highlight);
    }

    public async deleteHiCardForHighlight(_silent: boolean = false): Promise<boolean> {
        return false;
    }

    public async createHiCardForHighlight(_silent: boolean = false): Promise<boolean> {
        return false;
    }

    /**
     * 切换更多操作下拉菜单的显示/隐藏状态
     * @param dropdown 下拉菜单元素
     * @param button 触发菜单的按钮元素
     */
    private toggleMoreActionsDropdown(button: HTMLElement) {
        this.menuController.show(button, {
            onCopyHighlight: () => this.copyHighlightContent(),
            onExportImage: () => this.handleExportAsImage(),
            onDeleteHighlight: () => this.handleDeleteHighlight()
        });
    }

    /**
     * 处理删除高亮的逻辑
     * 这个方法会删除编辑器中的高亮格式和批注数据
     * @param skipConfirmation 是否跳过确认对话框，默认为 false
     * @param skipNotice 是否跳过成功通知，默认为 false
     */
    public async handleDeleteHighlight(skipConfirmation: boolean = false, skipNotice: boolean = false) {
        try {
            // 委托给删除管理器
            const success = await this.deletionManager.deleteHighlight(
                this.highlight,
                skipConfirmation,
                skipNotice
            );
            
            if (success) {
                // 移除卡片
                this.card.remove();
                
                this.registry.unregister(this);
            }
        } catch (error) {
            console.error('删除高亮时出错:', error);
            const message = error instanceof Error ? error.message : String(error);
            new Notice(t(`删除高亮失败: ${message}`));
        }
    }
    
    /**
     * 更新评论列表（只更新评论部分，不重新渲染整个卡片）
     */
    public updateComments(updatedHighlight: HighlightInfo): void {
        // 更新高亮数据
        this.highlight = updatedHighlight;
        
        // 重置编辑状态，允许重新选中卡片
        this.selectionController.resetEditing();
        
        // 查找评论列表容器
        const commentsSection = this.card.querySelector('.hi-notes-section');
        
        if (commentsSection) {
            // 如果有评论列表，移除它
            commentsSection.remove();
        }
        
        this.renderComments();
    }

    private renderComments(): void {
        renderHighlightCardComments(
            this.card,
            this.highlight,
            this.plugin.app,
            (comment) => {
                this.selectionController.markEditing();
                this.selectCard(); // 在进入编辑模式时选中卡片
                this.options.onCommentEdit(this.highlight, comment);
            }
        );
    }
    
    /**
     * 销毁方法，用于清理事件监听器和从静态集合中移除实例
     */
    public destroy(): void {
        // 移除事件监听器
        this.selectionController.destroy();
        
        this.registry.unregister(this);
    }
}
