import type DataviewPersisterPlugin from '@/main'
import type { DataviewPersisterSettings } from '@/utility/PluginSettings'
import { PluginSettingTab as BaseSettingTab, Setting } from 'obsidian'
import { I18n } from './i18n'

const i18n = new I18n()

export class PluginSettingTab extends BaseSettingTab {
    #plugin: DataviewPersisterPlugin

    constructor(plugin: DataviewPersisterPlugin) {
        super(plugin.app, plugin)
        this.#plugin = plugin
    }

    #update<K extends keyof DataviewPersisterSettings>(
        key: K,
        value: DataviewPersisterSettings[K],
    ): void {
        this.#plugin.settings[key] = value
        void this.#plugin.saveSettings()
    }

    display(): void {
        this.containerEl.empty()
        this.containerEl.addClass('dataview-persister-settings')

        this.#displayGeneralSettings()
    }

    #displayGeneralSettings(): void {
        const pluginLogLevelSetting = new Setting(this.containerEl)
        pluginLogLevelSetting.setName(i18n.translate('pluginLogLevelName'))
        pluginLogLevelSetting.setDesc(i18n.translate('pluginLogLevelDesc'))
        pluginLogLevelSetting.addDropdown((dropdown) => {
            // options should be added before the value
            dropdown.addOptions({
                ERROR: 'ERROR',
                WARN: ' WARN',
                INFO: ' INFO',
                DEBUG: 'DEBUG',
                TRACE: 'TRACE',
            })
            dropdown.setValue(this.#plugin.settings.plugin_level)
            dropdown.onChange(this.#update.bind(this, 'plugin_level'))
        })

        const onLeafChangeSetting = new Setting(this.containerEl)
        onLeafChangeSetting.setName(i18n.translate('onLeafChangeName'))
        onLeafChangeSetting.setDesc(i18n.translate('onLeafChangeDesc'))
        onLeafChangeSetting.addToggle((toggle) => {
            toggle.setValue(this.#plugin.settings.persist_on_leaf_change)
            toggle.onChange(this.#update.bind(this, 'persist_on_leaf_change'))
        })

        const shortenLinksSetting = new Setting(this.containerEl)
        shortenLinksSetting.setName(i18n.translate('shortenLinksName'))
        shortenLinksSetting.setDesc(i18n.translate('shortenLinksDesc'))
        shortenLinksSetting.addToggle((toggle) => {
            toggle.setValue(this.#plugin.settings.shorten_result_links)
            toggle.onChange(this.#update.bind(this, 'shorten_result_links'))
        })

        const commentHeaderSetting = new Setting(this.containerEl)
        commentHeaderSetting.setName(i18n.translate('commentHeaderName'))
        commentHeaderSetting.setDesc(i18n.translate('commentHeaderDesc'))
        commentHeaderSetting.addText((input) => {
            input.setPlaceholder(i18n.translate('commentHeaderHint'))
            input.setValue(this.#plugin.settings.comment_header)
            input.onChange(this.#update.bind(this, 'comment_header'))
        })
    }
}
