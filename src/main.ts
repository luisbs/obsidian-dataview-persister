import { type DataviewPersisterSettings, DEFAULT_SETTINGS } from '@/settings'
import { type BaseEditor, FileEditor } from '@/utility/editors'
import {
    CommentQuery,
    findQuery,
    hasQueries,
    identifyQuery,
} from '@/utility/queries'
import { type DataviewPersisterState, prepareState } from '@/utility/state'
import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    type App,
    MarkdownView,
    Notice,
    Plugin,
    type PluginManifest,
} from 'obsidian'
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview'

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

    #getDataview(): DataviewApi | undefined {
        if (isPluginEnabled(this.app)) {
            const dataview = getAPI(this.app)
            if (dataview) return dataview
        }

        this.#log.warn(`Dataview is not enabled`)
        new Notice('Dataview is not enabled')
        return
    }

    async #persist(
        query: CommentQuery,
        editor: BaseEditor,
        label: string,
    ): Promise<void> {
        const dataview = this.#getDataview()
        if (!dataview) return

        const group = this.#log.group(label)
        await this.#persistQuery(query, dataview, editor, group)
        group.flush(`Persisted query under cursor`)
        new Notice('Persisted query under cursor')
    }

    #registerTriggers(): void {
        this.addCommand({
            id: 'persist-cursor',
            name: 'Persist Dataview query under the cursor',
            editorCheckCallback: (checking, editor, _view) => {
                const dv = this.#getDataview()
                if (!dv) return false

                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // identify query under cursor
                const { line: l } = editor.getCursor()
                const query = identifyQuery(this.#state, l, lastLine, getLine)

                // cursor is not over a query comment
                if (!query) return false
                if (checking) return true

                void this.#persist(query, editor, 'persist-cursor-command')
                return true
            },
        })

        this.addCommand({
            id: 'persist-all',
            name: 'Persist all Dataview queries on current editor',
            editorCheckCallback: (checking, editor, _view) => {
                const dv = this.#getDataview()
                if (!dv) return false

                const lastLine = editor.lastLine()
                const getLine = (n: number) => editor.getLine(n)

                // only check if the editor contains any query
                if (checking) return hasQueries(this.#state, lastLine, getLine)

                void this.#persistAll(editor, 'persist-file-command')
                return true
            },
        })

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', async (leaf) => {
                if (!(leaf?.view instanceof MarkdownView)) return
                if (!leaf.view.file) return

                // read the current content
                const content = await this.app.vault.read(leaf.view.file)
                const editor = new FileEditor(content)

                // calculate data to be persisted
                await this.#persistAll(editor, 'persist-on-change-event')

                // write the content with the persisted data
                await this.app.vault.modify(leaf.view.file, editor.getContent())
            }),
        )
    }

    async #persistAll(
        editor: BaseEditor,
        label: string,
    ): Promise<true | number> {
        const dataview = this.#getDataview()
        if (!dataview) return 0

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
                await this.#persistQuery(query, dataview, editor, group)
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
        { matcher, query, resultFrom, resultTo }: CommentQuery,
        dataview: DataviewApi,
        editor: BaseEditor,
        log: Logger,
    ): Promise<void> {
        log.debug(`Executing query <${query}>`)
        const result = await dataview.queryMarkdown(query)
        const replacement = result.successful
            ? matcher.fenceResult(result.value)
            : matcher.fenceResult(result.error, true)

        log.info(`Persisting result of <${query}>`)
        editor.replaceRange(replacement, resultFrom, resultTo)
    }
}
