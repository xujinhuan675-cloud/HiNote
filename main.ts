import { Plugin } from 'obsidian';
import { HiNoteView, VIEW_TYPE_HINOTE } from './src/core/HiNoteView';
import { AISettingTab } from './src/settings/SettingTab';
import { PluginSettings } from './src/types/settings';
import { registerCommands, createWindowManager } from './src/commands';
import { InitializationManager } from './src/services/InitializationManager';
import { WindowManager } from './src/services/WindowManager';
import type { PluginServices } from './src/services/PluginServices';
import { migrateSettings, normalizeSettings } from './src/settings/SettingsMigration';

export default class CommentPlugin extends Plugin {
	settings: PluginSettings;
	private initManager: InitializationManager;
	private windowManager: WindowManager;

	// 公开服务实例供外部访问
	get services(): PluginServices | null { return this.initManager.currentServices; }
	get highlightDecorator() { return this.requireServices().highlightDecorator; }
	get fsrsManager() { return this.requireServices().fsrsManager; }
	get eventManager() { return this.requireServices().eventManager; }
	get highlightService() { return this.requireServices().highlightService; }
	get dataManager() { return this.requireServices().dataManager; }
	get canvasService() { return this.requireServices().canvasService; }
	
	// 架构层实例
	get highlightRepository() { return this.requireServices().highlightRepository; }
	get highlightManager() { return this.requireServices().highlightManager; }

	private requireServices(): PluginServices {
		const services = this.initManager.currentServices;
		if (!services) {
			throw new Error('HiNote services have not been initialized.');
		}
		return services;
	}

	async ensureServicesInitialized(): Promise<PluginServices> {
		return this.initManager.ensureInitialized();
	}

	async onload() {
		// 加载设置
		const loadedData = await this.loadData();
		this.settings = migrateSettings(loadedData);

		// 初始化管理器
		this.initManager = new InitializationManager(this);
		this.windowManager = createWindowManager(this);

		// 注册视图（延迟初始化）
		this.registerView(
			VIEW_TYPE_HINOTE,
			(leaf) => {
				this.ensureServicesInitialized();
				const services = this.requireServices();
				return new HiNoteView(leaf, this, services);
			}
		);

		// 添加功能按钮
		this.addRibbonIcon(
			'highlighter',
			'HiNote',
			async () => {
				await this.initManager.ensureInitialized();
				await this.windowManager.openCommentPanelInSidebar();
			}
		);

		// 注册所有命令
		registerCommands(this, this.windowManager, async () => {
			await this.ensureServicesInitialized();
		});

		// 添加设置标签页
		this.addSettingTab(new AISettingTab(this.app, this));

		// 监听文件重命名事件
		this.registerEvent(
			this.app.vault.on('rename', async (file, oldPath) => {
				if (this.initManager.initialized && this.highlightManager) {
					await this.highlightManager.handleFileRename(oldPath, file.path);
				}
			})
		);
	}


	async onunload() {
		// 清理初始化管理器
		if (this.initManager) {
			await this.initManager.cleanup();
		}
	}

	async saveSettings() {
		const existingData = await this.loadData();
		this.settings = normalizeSettings(this.settings, existingData);
		await this.saveData(this.settings);
	}
}
