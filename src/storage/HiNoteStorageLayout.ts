import { App } from 'obsidian';
import { FilePathUtils } from './FilePathUtils';

export async function ensureHiNoteDirectoryStructure(app: App, vaultPath: string): Promise<void> {
    const directories = [
        FilePathUtils.getHiNoteDir(vaultPath),
        FilePathUtils.getHighlightsDir(vaultPath),
        FilePathUtils.getFlashcardsDir(vaultPath),
        FilePathUtils.getMetadataDir(vaultPath)
    ];

    for (const dir of directories) {
        try {
            await app.vault.adapter.mkdir(dir);
        } catch (error) {
            // 目录可能已存在，忽略错误
        }
    }
}

export async function detectHighlightFilesFromStorage(
    app: App,
    vaultPath: string,
    onMappingDetected: (originalPath: string, safeFileName: string) => void
): Promise<string[]> {
    try {
        const highlightsDir = FilePathUtils.getHighlightsDir(vaultPath);
        const files = await app.vault.adapter.list(highlightsDir);
        const detectedFiles: string[] = [];

        for (const file of files.files) {
            if (!file.endsWith('.json')) continue;

            const baseName = file.replace(/\.json$/, '').replace(highlightsDir + '/', '');
            const originalPath = FilePathUtils.fromSafeFileName(baseName);
            detectedFiles.push(originalPath);
            onMappingDetected(originalPath, baseName);
        }

        return detectedFiles;
    } catch (error) {
        console.warn('扫描高亮目录失败:', error);
        return [];
    }
}
