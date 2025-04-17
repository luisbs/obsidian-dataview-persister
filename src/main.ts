import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    type App,
    MarkdownView,
    Notice,
    Plugin,
    type PluginManifest,
} from 'obsidian'
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview'
import { type DataviewPersisterSettings, DEFAULT_SETTINGS } from './settings'
import { type BaseEditor, FileEditor } from './utility/editors'
import {
    CommentQuery,
    findQuery,
    hasQueries,
    identifyQuery,
} from './utility/queries'
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

    #isDisabled(): boolean {
        return !isPluginEnabled(this.app)
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
                if (!view.file || this.#isDisabled()) return false

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
                    view.file.path,
                    editor,
                    query,
                )
                return true
            },
        })

        this.addCommand({
            id: 'persist-all',
            name: 'Persist all Dataview queries on current editor',
            editorCheckCallback: (checking, editor, view) => {
                if (!view.file || this.#isDisabled()) return false

                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // only check if the editor contains any query
                if (checking) return hasQueries(this.#state, lastLine, getLine)

                void this.#persistAll(
                    'persist-file-command',
                    view.file.path,
                    editor,
                )
                return true
            },
        })

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', async (leaf) => {
                if (!(leaf?.view instanceof MarkdownView)) return
                if (!leaf.view.file || this.#isDisabled()) return

                // read the current content
                const content = await this.app.vault.read(leaf.view.file)
                const editor = new FileEditor(content)

                // calculate data to be persisted
                await this.#persistAll(
                    'persist-on-change-event',
                    leaf.view.file.path,
                    editor,
                )

                // write the content with the persisted data
                await this.app.vault.modify(leaf.view.file, editor.getContent())
            }),
        )
    }

    /** Dataview availability should be tested before this method */
    async #persist(
        label: string,
        filepath: string,
        editor: BaseEditor,
        query: CommentQuery,
    ): Promise<void> {
        const dv = this.#getDataview()
        if (!dv) return

        const group = this.#log.group(label)
        await this.#persistQuery(dv, query, filepath, editor, group)
        group.flush(`Persisted query under cursor`)
        new Notice('Persisted query under cursor')
    }

    /** Dataview availability should be tested before this method */
    async #persistAll(
        label: string,
        filepath: string,
        editor: BaseEditor,
    ): Promise<true | number> {
        const dv = this.#getDataview()
        if (!dv) return 0

        const group = this.#log.group(label)
        let persisted = 0
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

                // persist each query when is found
                await this.#persistQuery(dv, query, filepath, editor, group)
                persisted++
            }
        }

        if (persisted) {
            group.flush(`Persisted queries on file`)
            new Notice('Persisted queries on file')
        }
        return persisted
    }

    async #persistQuery(
        dataview: DataviewApi,
        { matcher, query, resultFrom, resultTo }: CommentQuery,
        filepath: string,
        editor: BaseEditor,
        log: Logger,
    ): Promise<void> {
        log.debug(`Executing query <${query}>`)
        const result = await dataview.queryMarkdown(query, filepath)
        const replacement = result.successful
            ? matcher.fenceResult(result.value)
            : matcher.fenceResult(result.error, true)

        log.info(`Persisting result of <${query}>`)
        editor.replaceRange(replacement, resultFrom, resultTo)
    }
}
