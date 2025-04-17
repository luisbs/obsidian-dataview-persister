import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    type App,
    MarkdownView,
    Notice,
    Plugin,
    type PluginManifest,
    type TFile,
} from 'obsidian'
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview'
import { type DataviewPersisterSettings, DEFAULT_SETTINGS } from './settings'
import { type BaseEditor, FileEditor } from './utility/editors'
import { asyncEval } from './utility/eval'
import { type CommentQuery, findQuery, identifyQuery } from './utility/queries'
import { type DataviewPersisterState, prepareState } from './utility/state'

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

        this.#registerTriggers()
        group.info('Registered Triggers')

        group.flush('Loaded DataviewPersister')
    }

    /** Allow running queries only after Dataview has been initialized  */
    #isReady(): boolean {
        if (!isPluginEnabled(this.app)) return false
        return getAPI(this.app)?.index.initialized ?? false
    }
    #getDataview(): DataviewApi | undefined {
        if (isPluginEnabled(this.app)) {
            const dataview = getAPI(this.app)
            if (dataview) return dataview
        }

        this.#log.warn(`Dataview is not enabled`)
        new Notice('Dataview is not enabled')
        return
    }

    #registerTriggers(): void {
        this.addCommand({
            id: 'persist-cursor',
            name: 'Persist Dataview query under the cursor',
            editorCheckCallback: (checking, editor, view) => {
                if (!view.file || !this.#isReady()) return false

                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // identify query under cursor
                const { line: l } = editor.getCursor()
                const query = identifyQuery(this.#state, l, lastLine, getLine)

                // cursor is not over a query comment
                if (!query) return false
                if (checking) return true

                void this.#persist(
                    'persist-cursor-command',
                    view.file,
                    editor,
                    query,
                )
                return true
            },
        })

        this.addCommand({
            id: 'persist-file',
            name: 'Persist all Dataview queries on the active file',
            checkCallback: (checking) => {
                console.log('checkCallback')
                const originFile = this.app.workspace.getActiveFile()
                if (!originFile || !this.#isReady()) return false
                if (checking) return true

                // defer file modification
                void this.#persistFile('persist-file-command', originFile)
                return true
            },
        })

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (!(leaf?.view instanceof MarkdownView)) return
                if (!leaf.view.file || !this.#isReady()) return

                // defer file modification
                return this.#persistFile(
                    'persist-on-change-event',
                    leaf.view.file,
                )
            }),
        )
    }

    async #persist(
        label: string,
        originFile: TFile,
        editor: BaseEditor,
        query: CommentQuery,
    ): Promise<void> {
        const dv = this.#getDataview()
        if (!dv) return

        const group = this.#log.group(label)
        const result = await this.#query(dv, query, originFile, group)
        if (!result) return

        group.debug(`Persisting result <${result}>`)
        editor.replaceRange(result, query.resultFrom, query.resultTo)

        group.flush('Persisted query under cursor')
        new Notice('Persisted query under cursor')
    }

    async #persistFile(label: string, originFile: TFile): Promise<void> {
        const dv = this.#getDataview()
        if (!dv) return

        // prepare note content
        const group = this.#log.group(label)
        const content = await this.app.vault.read(originFile)
        const editor = new FileEditor(content)

        // calculate data to be persisted
        let persistedCount = 0
        for (let index = 0; index <= editor.lastLine(); index++) {
            for (const matcher of this.#state.matchers) {
                const query = findQuery(
                    matcher,
                    index,
                    editor.lastLine(),
                    editor.getLine.bind(editor),
                )
                if (!query) continue

                // move the index, after the already identified query
                index = query.resultTo.line

                // persist each query when they are found
                const result = await this.#query(dv, query, originFile, group)
                if (!result) continue

                group.debug(`Persisting result <${result}>`)
                editor.replaceRange(result, query.resultFrom, query.resultTo)

                persistedCount++
            }
        }

        // if no queries where found, avoid changing the note
        if (persistedCount < 1) return

        // write the content with the persisted data
        await this.app.vault.modify(originFile, editor.getContent())

        group.flush(`Persisted queries on file`)
        new Notice('Persisted queries on file')
    }

    async #query(
        dataview: DataviewApi,
        { matcher, query }: CommentQuery,
        originFile: TFile,
        log: Logger,
    ): Promise<string | undefined> {
        if (/^(TABLE|LIST|TASK|CALENDAR)/gi.test(query)) {
            log.debug(`Executing query <${query}>`)
            const result = await dataview.queryMarkdown(query, originFile.path)
            return result.successful
                ? matcher.fenceResult(result.value)
                : matcher.fenceResult(result.error, true)
        }

        log.debug(`Executing dataviewjs <${query}>`)
        const result = await asyncEval(query)
        return result ? matcher.fenceResult(result) : undefined
    }
}
