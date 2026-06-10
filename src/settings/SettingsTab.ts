import { App, PluginSettingTab } from 'obsidian';
import { GeneralSettingsTab } from './tabs/GeneralSettingsTab';
import { AIServiceTab } from './tabs/AIServiceTab';
import { t } from '../i18n';
import type CommentPlugin from '../../main';

export class AISettingTab extends PluginSettingTab {
    plugin: CommentPlugin;

    constructor(app: App, plugin: CommentPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        void this.render();
    }

    private async render(): Promise<void> {
        await this.plugin.ensureServicesInitialized();

        const { containerEl } = this;
        containerEl.empty();

        const tabContainer = containerEl.createEl('div', { cls: 'setting-tabs' });
        const contentContainer = containerEl.createEl('div', { cls: 'setting-tab-content' });

        const generalTab = tabContainer.createEl('div', {
            text: t('General'),
            cls: 'setting-tab-btn active',
            attr: { role: 'button', tabindex: '0' }
        });
        const aiTab = tabContainer.createEl('div', {
            text: t('AI service'),
            cls: 'setting-tab-btn',
            attr: { role: 'button', tabindex: '0' }
        });

        const generalContent = contentContainer.createEl('div', { cls: 'setting-tab-pane active' });
        const aiContent = contentContainer.createEl('div', { cls: 'setting-tab-pane' });

        const switchTab = (targetTab: HTMLElement, targetContent: HTMLElement) => {
            tabContainer.findAll('.setting-tab-btn').forEach(tab => tab.removeClass('active'));
            contentContainer.findAll('.setting-tab-pane').forEach(pane => pane.removeClass('active'));
            targetTab.addClass('active');
            targetContent.addClass('active');
        };

        generalTab.onclick = () => switchTab(generalTab, generalContent);
        aiTab.onclick = () => switchTab(aiTab, aiContent);

        new GeneralSettingsTab(this.plugin, generalContent).display();
        new AIServiceTab(this.plugin, aiContent).display();
    }
}
