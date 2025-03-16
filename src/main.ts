import { App, Notice, Plugin, PluginManifest } from 'obsidian'
import { getAPI, isPluginEnabled } from 'obsidian-dataview'
import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import { DEFAULT_SETTINGS, type DataviewPersisterSettings } from '@/settings'
import { prepareState, type DataviewPersisterState } from '@/utility/state'
import {
    CommentQuery,
    findAllQueries,
    hasQueries,
    identifyQuery,
} from '@/utility/queries'

export default class DataviewPersisterPlugin extends Plugin {
    #log = Logger.consoleLogger(DataviewPersisterPlugin.name)
    #settings = {} as DataviewPersisterSettings
    #state = {} as DataviewPersisterState

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always print the first initial onload()
        // * after that, the user-defined level is used
        this.#log.setLevel(LogLevel.DEBUG)
        this.#log.setFormat('[hh:mm:ss.ms] level:')
    }

    // TODO: add SettingsTab
    // TODO: on settings change saveSettings, reloadState, etc

    async onload(): Promise<void> {
        const group = this.#log.group('Loading DataviewPersister')
        const primitives = ((await this.loadData()) ??
            {}) as Partial<DataviewPersisterSettings>

        // ensure a fallback value is present
        this.#settings = Object.assign({}, DEFAULT_SETTINGS, primitives)
        group.info('Loaded Settings')
        group.debug('Loaded: ', this.#settings)

        this.#state = prepareState(this.#settings)
        group.info('Prepared State')

        this.#registerCommands()
        // this.registerMarkdownPostProcessor((element, context) => {
        //     const info = context.getSectionInfo(element)
        //     if (!info) return

        //     const lines = info.text.split('\n')
        //     if (this.#isHeader(lines[info.lineStart])) {
        //         const query = lines.slice(info.lineStart + 1, info.lineEnd)
        //         this.#persistQueryResult(query.join('\n'))
        //     }
        // })

        group.flush('Loaded DataviewPersister')
    }

    #registerCommands(): void {
        this.addCommand({
            id: 'persist-cursor',
            name: 'Persist Dataview query under the cursor',
            editorCheckCallback: (checking, editor, view) => {
                // identify query on comment on cursor
                const { line } = editor.getCursor()
                const query = identifyQuery(
                    this.#state,
                    line,
                    editor.lastLine(),
                    (n) => editor.getLine(n),
                )

                // cursor is not over a query comment
                if (!query) return false
                if (checking) return true

                const group = this.#log.group(`Command persist-cursor`)
                this.#persistQueryResult(query, group)

                // prettier-ignore
                group.flush(`Persisted '${view.file?.basename}:${query.queryStart + 1}'`)
                new Notice('Persisted DQL under cursor')
                return true
            },
        })

        this.addCommand({
            id: 'persist-file',
            name: 'Persist all Dataview queries on current file',
            editorCheckCallback: (checking, editor, view) => {
                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // only check if the editor contains any query
                if (checking) return hasQueries(this.#state, lastLine, getLine)

                // search queries on current editor
                const queries = findAllQueries(this.#state, lastLine, getLine)
                if (queries.length < 1) return false

                // persist found queries
                const group = this.#log.group(`Command persist-file`)
                for (const query of queries) {
                    this.#persistQueryResult(query, group)
                }

                group.flush(`Persisted all Queries '${view.file?.basename}'`)
                new Notice('Persisted all DQL on editor')
                return true
            },
        })
    }

    #persistQueryResult(q: CommentQuery, log: Logger): boolean {
        if (!isPluginEnabled(this.app)) return false
        const api = getAPI(this.app)
        if (!api) return false

        log.info('Executing query')
        // TODO
        void api.query(q.query)

        // [ ] 1. Execute query against Dataview
        // [ ] 2. Transform query result into Markdown
        // [ ] 3. Persist Markdown into Note under the comment
        // [ ] 4. Remove previously persisted result in Note
        // [x] extra 1. Add command to persist all in-file queries
        // [ ] extra 2. Execute command on file-open event
        // [-] extra 3. Remove MarkdownPostProcessor

        log.debug('Persisted', q.query)
        return true
    }
}
