import type { CommentItem } from "../../types/highlight";
import type { CommentInputEditContext } from "./CommentInputView";

export interface CommentInputElements {
    card: HTMLElement;
    textarea?: HTMLTextAreaElement;
    actionHint?: HTMLElement;
    commentEl?: Element | null;
}

export function restoreOrRemoveCommentInput(
    elements: CommentInputElements,
    existingComment: CommentItem | undefined,
    editContext?: CommentInputEditContext | null
): void {
    const { card, textarea, actionHint } = elements;
    if (!textarea) return;

    if (existingComment && editContext?.contentEl && editContext?.footer) {
        textarea.replaceWith(editContext.contentEl);
        actionHint?.remove();
        editContext.footer.removeClass('hi-note-hidden');
        return;
    }

    const inputContainer = textarea.closest('.hi-note-input');
    if (inputContainer) {
        inputContainer.remove();
    }

    if (!card.querySelector('.hi-note')) {
        card.querySelector('.hi-notes-section')?.remove();
    }
}

export function removeCommentInputElements(elements: CommentInputElements, safe = false): void {
    removeElement(elements.textarea, safe);
    removeElement(elements.actionHint, safe);

    if (elements.commentEl && (!safe || elements.commentEl.isConnected)) {
        elements.commentEl.removeClass('editing');
    }
}

function removeElement(element: HTMLElement | undefined, safe: boolean): void {
    if (!element) return;
    if (safe && !element.isConnected) return;

    if (element.parentElement) {
        element.remove();
    }
}
