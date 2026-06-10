import type { AISettings } from './ai';
import { DEFAULT_SILICONFLOW_MODELS } from './ai';
import type { HighlightInfo, HighlightSettings } from './highlight';

export interface PluginSettings extends HighlightSettings {
    ai: AISettings;
    comments?: Record<string, Record<string, HighlightInfo>>;
    showCommentWidget?: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    excludePatterns: '',
    useCustomPattern: false,
    regexRules: [
        {
            id: 'default-md',
            name: 'Default Highlight',
            pattern: '==([^=\\n](?:[^=\\n]|=[^=\\n])*?[^=\\n])==',
            color: '#ffeb3b',
            enabled: true
        },
        {
            id: 'default-mark',
            name: 'Mark format',
            pattern: '<mark[^>]*>([\\s\\S]*?)</mark>',
            color: '#ffeb3b',
            enabled: true
        },
        {
            id: 'default-span',
            name: 'Span format',
            pattern: '<span[^>]*>([\\s\\S]*?)</span>',
            color: '#ffeb3b',
            enabled: true
        }
    ],
    ai: {
        provider: 'ollama',
        ollama: {
            host: 'http://localhost:11434',
            model: ''
        },
        gemini: {
            apiKey: '',
            model: 'gemini-pro',
            baseUrl: '',
            isCustomModel: false
        },
        openai: {
            apiKey: '',
            model: 'gpt-4o',
            baseUrl: ''
        },
        anthropic: {
            apiKey: '',
            model: 'claude-2',
            apiAddress: '',
            isCustomModel: false,
            lastCustomModel: ''
        },
        deepseek: {
            apiKey: '',
            model: 'deepseek-chat',
            baseUrl: ''
        },
        siliconflow: {
            apiKey: '',
            model: DEFAULT_SILICONFLOW_MODELS[0].id,
            baseUrl: '',
            isCustomModel: false,
            lastCustomModel: ''
        },
        prompts: {
            '贴行翻译': '请把下面高亮内容翻译成自然、准确、适合阅读理解的中文。不要重复原文，只输出译文。\n\n{{highlight}}',
            '主干提取': '请分析下面句子的主干结构，保留核心逻辑，输出要简洁，方便快速抓住句意。\n\n{{highlight}}',
            '白话改写': '请把下面高亮内容改写成更易懂的白话表达，避免术语堆叠，保持原意。\n\n{{highlight}}',
            '简明解释': '请对下面高亮内容做贴近原文的简明解释，帮助读者立刻理解它在说什么。\n\n{{highlight}}'
        }
    },
    export: {
        exportPath: ''
    },
    showCommentWidget: true
};
