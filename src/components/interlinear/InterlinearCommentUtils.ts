import type { CommentItem } from "../../types/highlight";

export function getInlineComments(comments?: CommentItem[]): CommentItem[] {
    return (comments || []).filter(comment => comment.inline && Boolean(comment.content?.trim()));
}

export function getInterlinearLabel(comment: CommentItem): string {
    switch (comment.kind) {
        case "translation":
            return "Translation";
        case "structure":
            return "Structure";
        case "rewrite":
            return "Rewrite";
        case "explanation":
            return "Gloss";
        default:
            return comment.promptName || "Gloss";
    }
}
