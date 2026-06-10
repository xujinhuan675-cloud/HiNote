import { WidgetType } from "@codemirror/view";
import type { CommentItem } from "../../types/highlight";
import { getInterlinearLabel } from "./InterlinearCommentUtils";

export class InterlinearWidget extends WidgetType {
    constructor(private comments: CommentItem[]) {
        super();
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.className = "anchor-gloss-inline-block cm-anchor-gloss-inline-block";

        for (const comment of this.comments) {
            const item = document.createElement("div");
            item.className = "anchor-gloss-inline-item";

            const label = document.createElement("div");
            label.className = "anchor-gloss-inline-label";
            label.textContent = getInterlinearLabel(comment);

            const content = document.createElement("div");
            content.className = "anchor-gloss-inline-content";
            content.textContent = comment.content;

            item.append(label, content);
            wrapper.appendChild(item);
        }

        return wrapper;
    }

    get estimatedHeight(): number {
        return Math.max(48, this.comments.length * 56);
    }

    ignoreEvent(): boolean {
        return true;
    }
}
