import type { DataviewPersisterSettings } from '@/types'
import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import { App, Plugin, PluginManifest } from 'obsidian'

const DEFAULT_SETTINGS: DataviewPersisterSettings = {
    // * 'WARN' level to force the user to choose a lower level when is required
    // * this decition, prevents the console from been overpopulated by default
    plugin_level: 'WARN',
    //
    comment_header: 'dataview',
}

export default class DataviewPersisterPlugin extends Plugin {
    #log = Logger.consoleLogger(DataviewPersisterPlugin.name)
    #settings = {} as DataviewPersisterSettings

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first initial onload()
        // * after that, the user-defined level is used
        this.#log.setLevel(LogLevel.DEBUG)
        this.#log.setFormat('[hh:mm:ss.ms] level:')
    }

    async onload(): Promise<void> {
        const group = this.#log.group('Loading DataviewPersister')
        const primitives = ((await this.loadData()) ??
            {}) as Partial<DataviewPersisterSettings>

        // ensure a fallback value is present
        this.#settings = Object.assign({}, DEFAULT_SETTINGS, primitives)
        group.debug('Loaded: ', this.#settings)

        this.registerMarkdownPostProcessor((element, context) => {
            const info = context.getSectionInfo(element)
            if (!info) return

            const l = info.text.split('\n')
            if (l[info.lineStart] === `%%${this.#settings.comment_header}`) {
                const query = l.slice(info.lineStart + 1, info.lineEnd)
                this.#persistQueryResult(query.join('\n'))
            }
        })
        group.debug('Registered PostProcessor')

        group.flush('Loaded DataviewPersister')
    }

    #persistQueryResult(query: string): void {
        console.log(`Persisting <${query}>`)
        // 1. Execute query against Dataview
        // 2. Transform query result into Markdown
        // 3. Persist Markdown into Note under the comment
        // 4. Remove previously persisted result in Note
        // extra 1. Add command to persist in-file queries
        // extra 2. Execute command on file-open event
        // extra 3. Remove MarkdownPostProcessor
    }
}
