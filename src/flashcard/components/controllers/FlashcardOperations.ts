import { FSRSRating } from "../../types/FSRSTypes";
import type { FlashcardComponentContext } from "../FlashcardComponentContext";
import {
    clearGroupCompletionMessage,
    findGroupByName,
    getCompletionMessage,
    getDueCardsForToday,
    resetGroupProgressForCompletion,
    restoreReviewPosition
} from "./FlashcardReviewQueue";

/**
 * 闪卡操作类，负责处理卡片的翻转、评分等操作
 */
export class FlashcardOperations {
    private component: FlashcardComponentContext;
    
    constructor(component: FlashcardComponentContext) {
        this.component = component;
    }
    
    /**
     * 翻转卡片
     */
    public flipCard(): void {
        const flipped = !this.component.isCardFlipped();
        this.component.setCardFlipped(flipped);
        
        // 只需要切换卡片的 CSS 类，所有的样式和动画效果都由 CSS 处理
        const cardElement = document.querySelector('.flashcard');
        if (cardElement) {
            if (flipped) {
                cardElement.classList.add('is-flipped');
            } else {
                cardElement.classList.remove('is-flipped');
            }
        }
        
        this.component.saveState();
    }
    
    /**
     * 下一张卡片
     */
    public nextCard(): void {
        const cards = this.component.getCards();
        if (cards.length === 0) return;
        
        let nextIndex = this.component.getCurrentIndex() + 1;
        if (nextIndex >= cards.length) {
            nextIndex = 0;
        }
        
        this.component.setCurrentIndex(nextIndex);
        this.component.setCardFlipped(false);
        this.component.saveState();
        this.component.getRenderer().render();
    }
    
    /**
     * 对卡片进行评分
     * @param rating 评分
     */
    public rateCard(rating: FSRSRating): void {
        const cards = this.component.getCards();
        const currentIndex = this.component.getCurrentIndex();
        
        if (cards.length === 0 || currentIndex >= cards.length) {
            return;
        }
        
        const currentCard = cards[currentIndex];
        if (!currentCard) return;
        
        // 调用 FSRS 管理器进行评分，使用统一的学习进度跟踪方法
        this.component.getFsrsManager().trackStudyProgress(currentCard.id, rating);
        
        // 移除当前卡片
        cards.splice(currentIndex, 1);
        
        // 如果没有更多卡片，显示完成消息
        if (cards.length === 0) {
            // 检查当前分组
            const groupName = this.component.getCurrentGroupName();
            const message = getCompletionMessage(this.component.getFsrsManager(), groupName);
            
            // 设置分组完成消息
            this.component.setGroupCompletionMessage(groupName, message);
            
            // 更新进度
            this.component.updateProgress();
            
            // 重新渲染
            this.component.getRenderer().render();
            
            // 不再显示通知，因为已经在界面上显示了完成消息
            
            return;
        }
        
        // 调整当前索引
        if (currentIndex >= cards.length) {
            this.component.setCurrentIndex(0);
        }
        
        // 重置翻转状态
        this.component.setCardFlipped(false);
        
        // 保存状态
        this.component.saveState();
        
        // 更新进度
        this.component.updateProgress();
        
        // 重新渲染
        this.component.getRenderer().render();
    }
    
    /**
     * 刷新当前卡片列表，考虑每日学习限制
     * 注意：此方法只从已有的卡片中获取数据，不会自动创建新卡片
     */
    public refreshCardList(): void {
        // 获取当前分组
        const groupName = this.component.getCurrentGroupName();
        const fsrsManager = this.component.getFsrsManager();
        
        // 获取分组 ID
        const group = findGroupByName(fsrsManager, groupName);
        if (!group) {
            console.error(`未找到名称为 ${groupName} 的分组`);
            return;
        }
        
        // 检查分组中是否有今天需要学习的卡片
        const allCards = fsrsManager.getCardsByGroupId(group.id);
        const cardsForToday = getDueCardsForToday(allCards, fsrsManager);
        
        // 如果没有今天需要学习的卡片，显示完成消息
        if (cardsForToday.length === 0) {
            const message = getCompletionMessage(fsrsManager, groupName);
            this.component.setGroupCompletionMessage(groupName, message);
            this.component.setCards([]);
            this.component.updateProgress();
            resetGroupProgressForCompletion(fsrsManager, groupName, message);
            this.component.getRenderer().render();
            
            // 保存状态
            this.component.saveState();
            return;
        }
        
        // 直接使用已筛选好的今天需要学习的卡片
        const cards = cardsForToday;
        
        // 获取保存的UI状态（在设置卡片列表之前）
        const savedProgress = this.component.getGroupProgress(groupName);
        
        // 有卡片需要学习，确保清除完成消息
        clearGroupCompletionMessage(fsrsManager, groupName);
        
        // 设置卡片列表
        this.component.setCards(cards);
        
        if (cards.length > 0) {
            const restoredPosition = restoreReviewPosition(cards, savedProgress);
            this.component.setCurrentIndex(restoredPosition.currentIndex);
            this.component.setCardFlipped(restoredPosition.isFlipped);
        } else {
            // If there are no cards, show completion message
            const message = getCompletionMessage(fsrsManager, groupName);
            this.component.setGroupCompletionMessage(groupName, message);
        }
        
        // 保存状态
        this.component.saveState();
    }
}
