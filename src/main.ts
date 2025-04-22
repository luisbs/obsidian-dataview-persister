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
import { PluginSettingTab } from './settings/PluginSettingTab'
import {
    type CommentQuery,
    findQuery,
    identifyQuery,
} from './utility/CommentQueries'
import { type BaseEditor, FileEditor } from './utility/ContentEditors'
import { shortenLinks } from './utility/PluginEditions'
import {
    type DataviewPersisterSettings,
    prepareSettings,
} from './utility/PluginSettings'
import {
    type CommentMatcher,
    type DataviewPersisterState,
    prepareState,
} from './utility/PluginState'

export default class DataviewPersisterPlugin extends Plugin {
    log = Logger.consoleLogger(DataviewPersisterPlugin.name)
    settings = {} as DataviewPersisterSettings
    state = {} as DataviewPersisterState

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always print the first initial onload()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')
    }

    async onload(): Promise<void> {
        const group = this.log.group('Loading DataviewPersister')

        // ensure a fallback value is present
        this.settings = prepareSettings(await this.loadData())
        group.debug('Loaded: ', this.settings)

        this.addSettingTab(new PluginSettingTab(this))

        this.#prepareState(group)
        this.#registerTriggers()
        group.flush('Loaded DataviewPersister')
    }

    async saveSettings(): Promise<void> {
        const group = this.log.group('Saving DataviewPersister settings')

        await this.saveData(this.settings)
        group.debug('Saved: ', this.settings)

        this.#prepareState(group)
        group.flush('Saved DataviewPersister settings')
    }

    #prepareState(log: Logger): void {
        log.info('Preparing DataviewPersister state')
        this.state = prepareState(this.settings)
        this.log.setLevel(this.state.plugin_level)
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

        this.log.warn(`Dataview is not enabled`)
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
                const query = identifyQuery(this.state, l, lastLine, getLine)

                // cursor is not over a query comment
                if (!query) return false
                if (checking) return true

                void this.#persist(
                    'persist-cursor-command',
                    editor,
                    query,
                    view.file.path,
                )
                return true
            },
        })

        this.addCommand({
            id: 'persist-file',
            name: 'Persist all Dataview queries on the active file',
            checkCallback: (checking) => {
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
                if (!this.state.persist_on_leaf_change) return
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
        editor: BaseEditor,
        query: CommentQuery,
        queryFile: string,
    ): Promise<void> {
        const dv = this.#getDataview()
        if (!dv) return

        const group = this.log.group(label)
        const result = await this.#query(dv, queryFile, query.query, group)
        if (!result) return

        group.debug(`Persisting result <${result}>`)
        const prepared = this.#prepareResult(result, query.matcher, group)
        editor.replaceRange(prepared, query.resultFrom, query.resultTo)

        group.flush('Persisted query under cursor')
        new Notice('Persisted query under cursor')
    }

    async #persistFile(label: string, queriesFile: TFile): Promise<void> {
        const dv = this.#getDataview()
        if (!dv) return

        // prepare note content
        const group = this.log.group(label)
        const queryFile = queriesFile.path
        const content = await this.app.vault.read(queriesFile)
        const editor = new FileEditor(content)

        // calculate data to be persisted
        let persistedCount = 0
        for (let index = 0; index <= editor.lastLine(); index++) {
            for (const matcher of this.state.matchers) {
                const q = findQuery(
                    matcher,
                    index,
                    editor.lastLine(),
                    editor.getLine.bind(editor),
                )
                if (!q) continue

                // move the index, after the already identified query
                index = q.resultTo.line

                // persist each query when they are found
                const result = await this.#query(dv, queryFile, q.query, group)
                if (!result) continue

                group.debug(`Persisting result <${result}>`)
                const prepared = this.#prepareResult(result, q.matcher, group)
                editor.replaceRange(prepared, q.resultFrom, q.resultTo)

                persistedCount++
            }
        }

        // if no queries where found, avoid changing the note
        if (persistedCount < 1) return

        // write the content with the persisted data
        await this.app.vault.modify(queriesFile, editor.getContent())

        group.flush(`Persisted queries on file`)
        new Notice('Persisted queries on file')
    }

    async #query(
        dataview: DataviewApi,
        queryFilepath: string,
        query: string,
        log: Logger,
    ): Promise<string | undefined> {
        if (/^(TABLE|LIST|TASK|CALENDAR)/gi.test(query)) {
            log.debug(`Executing query <${query}>`)
            const result = await dataview.queryMarkdown(query, queryFilepath)
            return result.successful ? result.value : result.error
        }

        log.debug(`Executing dataviewjs <${query}>`)
        const container = createDiv()
        await dataview.executeJs(query, container, this, queryFilepath)

        // timeout to for async/await scripts to end execution
        if (query.includes('await')) await sleep(500)
        return container.getHTML()
    }

    #prepareResult(result: string, matcher: CommentMatcher, log: Logger) {
        if (this.state.shorten_result_links) {
            log.debug('Shortening result links')
            result = shortenLinks(result)
        }

        return matcher.fenceResult(result)
    }
}
