import { App } from 'obsidian';
import { FSRSStorage } from '../flashcard';
import { DataValidator } from './DataValidator';
import { FilePathUtils } from './FilePathUtils';

export class FlashcardDataStore {
    constructor(
        private app: App,
        private vaultPath: string
    ) {}

    async load(): Promise<FSRSStorage | null> {
        try {
            const content = await this.app.vault.adapter.read(this.getFlashcardPath());
            const data = JSON.parse(content);

            const validation = DataValidator.validateFlashcardData(data);
            if (!validation.valid) {
                console.warn('闪卡数据验证失败:', validation.errors);
                return null;
            }

            return data;
        } catch {
            return null;
        }
    }

    async save(data: FSRSStorage): Promise<void> {
        await this.app.vault.adapter.write(this.getFlashcardPath(), JSON.stringify(data, null, 2));
    }

    private getFlashcardPath(): string {
        return `${FilePathUtils.getFlashcardsDir(this.vaultPath)}/cards.json`;
    }
}
