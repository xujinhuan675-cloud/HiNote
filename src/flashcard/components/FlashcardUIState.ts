import type { FSRSManager } from "../services/FSRSManager";
import type { FlashcardState, GroupProgressState, HiCardState } from "../types/FSRSTypes";

export interface LoadedFlashcardUIState {
    currentGroupName: string;
    currentGroupId: string;
    currentIndex: number;
    isFlipped: boolean;
    completionMessage: string | null;
    groupProgress: Record<string, GroupProgressState>;
}

export interface SaveFlashcardUIStateOptions {
    currentGroupName: string;
    completionMessage: string | null;
    cards: FlashcardState[];
    currentIndex: number;
    isFlipped: boolean;
    groupProgress: Record<string, GroupProgressState>;
}

export function loadFlashcardUIState(fsrsManager: FSRSManager): LoadedFlashcardUIState {
    const uiState = fsrsManager.getUIState() || {};
    const currentGroupName = uiState.currentGroupName || '';
    const groupProgress = normalizeGroupProgress(uiState.groupProgress);
    const savedProgress = currentGroupName ? groupProgress[currentGroupName] : undefined;

    return {
        currentGroupName,
        currentGroupId: findGroupIdByName(fsrsManager, currentGroupName),
        currentIndex: savedProgress?.currentIndex || 0,
        isFlipped: savedProgress?.isFlipped || false,
        completionMessage: uiState.completionMessage || null,
        groupProgress
    };
}

export function findGroupIdByName(fsrsManager: FSRSManager, groupName: string): string {
    if (!groupName) return '';

    const group = fsrsManager.getCardGroups().find(g => g.name === groupName);
    return group?.id || '';
}

export function findGroupNameById(fsrsManager: FSRSManager, groupId: string): string {
    if (!groupId) return '';

    const group = fsrsManager.getCardGroups().find(g => g.id === groupId);
    return group?.name || '';
}

export function getGroupCompletionMessage(
    groupProgress: Record<string, GroupProgressState>,
    groupName: string
): string | null {
    return groupProgress[groupName]?.completionMessage || null;
}

export function setGroupCompletionMessage(
    fsrsManager: FSRSManager,
    groupProgress: Record<string, GroupProgressState>,
    groupName: string,
    message: string | null
): void {
    const localProgress = ensureGroupProgress(groupProgress, groupName);
    localProgress.completionMessage = message;

    const uiState = fsrsManager.getUIState();
    uiState.groupProgress = normalizeGroupProgress(uiState.groupProgress);

    const persistedProgress = ensureGroupProgress(uiState.groupProgress, groupName);
    persistedProgress.completionMessage = message;

    if (message) {
        persistedProgress.isFlipped = false;
        persistedProgress.currentCardId = undefined;
    }

    fsrsManager.updateUIState(uiState);
}

export function saveFlashcardUIState(
    fsrsManager: FSRSManager,
    options: SaveFlashcardUIStateOptions
): void {
    const uiState = fsrsManager.getUIState();

    uiState.currentGroupName = options.currentGroupName;
    uiState.completionMessage = options.completionMessage;
    uiState.groupProgress = normalizeGroupProgress(uiState.groupProgress);

    if (options.currentGroupName) {
        const progress = ensureGroupProgress(uiState.groupProgress, options.currentGroupName);
        progress.currentIndex = options.currentIndex;
        progress.isFlipped = options.isFlipped;
        progress.currentCardId = getCurrentCardId(options.cards, options.currentIndex);
        progress.completionMessage = getGroupCompletionMessage(
            options.groupProgress,
            options.currentGroupName
        );
    }

    fsrsManager.updateUIState(uiState);
}

function normalizeGroupProgress(
    groupProgress: HiCardState["groupProgress"]
): Record<string, GroupProgressState> {
    if (!groupProgress || typeof groupProgress !== 'object') {
        return {};
    }

    return { ...groupProgress };
}

function ensureGroupProgress(
    groupProgress: Record<string, GroupProgressState>,
    groupName: string
): GroupProgressState {
    if (!groupProgress[groupName]) {
        groupProgress[groupName] = {
            currentIndex: 0,
            isFlipped: false,
            completionMessage: null
        };
    }

    return groupProgress[groupName];
}

function getCurrentCardId(cards: FlashcardState[], currentIndex: number): string | undefined {
    return cards.length > 0 && currentIndex < cards.length
        ? cards[currentIndex].id
        : undefined;
}
