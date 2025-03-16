import {
    App,
    type Editor,
    type EditorPosition,
    Notice,
    Plugin,
    type PluginManifest,
} from 'obsidian'
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
                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // identify query under cursor
                const { line: l } = editor.getCursor()
                const query = identifyQuery(this.#state, l, lastLine, getLine)

                // cursor is not over a query comment
                if (!query) return false
                if (checking) return true

                // persist found query
                const group = this.#log.group(`Command persist-cursor`)
                void this.#persist([query], editor, group).then((persisted) => {
                    // prettier-ignore
                    if (persisted) {
                        group.flush(`Persisted Dataview query '${view.file?.basename}:${query.queryStart + 1}'`)
                        new Notice('Persisted Dataview query under cursor')
                    } else {
                        group.flush(`Problems persisting the Dataview query '${view.file?.basename}:${query.queryStart + 1}'`)
                        new Notice('Problems persisting the Dataview query under cursor')
                    }
                })
                return true
            },
        })

        this.addCommand({
            id: 'persist-all',
            name: 'Persist all Dataview queries on current editor',
            editorCheckCallback: (checking, editor, view) => {
                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // only check if the editor contains any query
                if (checking) return hasQueries(this.#state, lastLine, getLine)

                // search queries on current editor
                const queries = findAllQueries(this.#state, lastLine, getLine)
                if (queries.length < 1) return false

                // persist found queries
                // persisting on reverse avoids content shifting
                // and allows to use the previously found lineIndexes
                const group = this.#log.group(`persist-file-command`)
                void this.#persist(queries.reverse(), editor, group).then(
                    (persisted) => {
                        // prettier-ignore
                        if (persisted === queries.length) {
                        group.flush(`Persisted all Dataview queries on '${view.file?.basename}'`)
                        new Notice('Persisted all Dataview queries on editor')
                    } else if (persisted > 0) {
                        group.flush(`Problems persisting some Dataview queries on '${view.file?.basename}'`)
                        new Notice('Problems persisting some Dataview queries on editor')
                    } else {
                        group.flush(`Problems persisting all Dataview queries on '${view.file?.basename}'`)
                        new Notice('Problems persisting all Dataview queries on editor')
                    }
                    },
                )
                return true
            },
        })
    }

    /** @returns {number} the quantity of queries that were persisted */
    async #persist(
        queries: CommentQuery[],
        editor: Editor,
        log: Logger,
    ): Promise<number> {
        if (!isPluginEnabled(this.app)) return 0
        const dv = getAPI(this.app)
        if (!dv) return 0

        const lastLine = editor.lastLine()

        let persisted = 0
        log.debug('Persisting queries', queries)
        for (const query of queries) {
            const [start, end] = this.#prepareReplacePositions(query, lastLine)

            log.debug(`Executing query <${query.query}>`)
            const result = await dv.queryMarkdown(query.query)
            const replaced = result.successful
                ? query.matcher.fenceResult(result.value)
                : query.matcher.fenceResult(result.error, true)

            log.info(`Persisting result of <${query.query}>`)
            editor.replaceRange(replaced, start, end)

            // [x] 1. Execute query against Dataview
            // [x] 2. Transform query result into Markdown
            // [x] 3. Persist Markdown into Note under the comment
            // [x] 4. Remove previously persisted result in Note
            // [x] extra 1. Add command to persist all in-file queries
            // [ ] extra 2. Execute command on file-open event
            // [-] extra 3. Remove MarkdownPostProcessor
            persisted++
        }

        return persisted
    }

    #prepareReplacePositions(
        { queryEnd, resultEnd }: CommentQuery, //
        lastLine: number,
    ): [EditorPosition, EditorPosition] {
        if (queryEnd === lastLine) {
            return [
                { line: queryEnd, ch: Infinity },
                { line: queryEnd, ch: Infinity },
            ]
        }
        if (resultEnd < 0) {
            return [
                { line: queryEnd, ch: Infinity },
                { line: queryEnd + 1, ch: 0 },
            ]
        }
        return [
            { line: queryEnd, ch: Infinity },
            { line: resultEnd + 1, ch: 0 },
        ]
    }
}
