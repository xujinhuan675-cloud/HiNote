import { Platform } from "obsidian";

export interface CommentInputKeyboardOptions {
    onInlineAI: () => Promise<void>;
    onSave: () => Promise<void>;
}

export function setupCommentInputKeyboard(
    textarea: HTMLTextAreaElement,
    options: CommentInputKeyboardOptions
): void {
    textarea.onkeydown = async (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            await options.onInlineAI();
            return;
        }

        if (event.key !== 'Enter') {
            return;
        }

        if (Platform.isMobile || event.shiftKey) {
            return;
        }

        event.preventDefault();
        await options.onSave();
    };
}

export function autoResizeCommentTextarea(textarea: HTMLTextAreaElement | undefined): void {
    if (!textarea) return;

    window.requestAnimationFrame(() => {
        if (!textarea) return;

        const scrollTop = window.scrollY || activeDocument.documentElement.scrollTop;

        textarea.setCssProps({ height: 'auto' });
        textarea.setCssProps({ height: `${textarea.scrollHeight}px` });

        window.scrollTo(0, scrollTop);
    });
}
