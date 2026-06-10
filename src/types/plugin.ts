import type { Plugin } from "obsidian";
import type { EventManager } from "../services/EventManager";
import type { HighlightService } from "../services/HighlightService";
import type { PluginSettings } from "./settings";

export interface AnchorGlossPluginContext extends Plugin {
    settings: PluginSettings;
    eventManager: EventManager;
    highlightService: HighlightService;
}
