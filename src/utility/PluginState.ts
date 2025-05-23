import type { LogLevelValue } from '@luis.bs/obsidian-fnc'
import type { DataviewPersisterSettings } from './PluginSettings'

/**
 * Keep most of the `AttachmentsCacheSettings`
 * for the `AttachmentsCacheApi` to use only state.
 */
export type DataviewPersisterState = Omit<
    DataviewPersisterSettings,
    'plugin_level'
> & {
    /** Calculated the minimun level to log while running. */
    plugin_level: LogLevelValue
    /** Pre-calculated comment handlers. */
    matchers: CommentMatcher[]
}

export interface CommentMatcher {
    testHeader(text: string): boolean
    testFooter(text: string): boolean
    removeHeader(text: string): string
    removeFooter(text: string): string

    testStart(text: string): boolean
    testEnd(text: string): boolean
    fenceResult(content: string, force?: boolean): string
}

const affixes = [
    ['^%%{id}($|\\s+)', /(^|\s*)%%$/],
    ['^<!--{id}($|\\s+)', /(^|\s*)-->$/],
] as Array<[string, RegExp]>

export function prepareState(
    settings: DataviewPersisterSettings,
): DataviewPersisterState {
    const matchers = [] as CommentMatcher[]
    for (const id of settings.comment_header.split(',')) {
        for (const [opener, footerMatcher] of affixes) {
            const headerMatcher = RegExp(opener.replace('{id}', id))
            const startFence = `<!--${id}-start KEEP THIS COMMENT -->`
            const endFence = `<!--${id}-end KEEP THIS COMMENT -->`

            matchers.push({
                testHeader: (t) => headerMatcher.test(t),
                testFooter: (t) => footerMatcher.test(t),
                removeHeader: (t) => t.replace(headerMatcher, ''),
                removeFooter: (t) => t.replace(footerMatcher, ''),

                testStart: (t) => startFence === t,
                testEnd: (t) => endFence === t,
                fenceResult: (content, force = false) => {
                    // the content is aimed to follow the commentEnd
                    // so a starting linebreak should always be added
                    //
                    // when the query yields nothing keep the empty string
                    if (!content) {
                        return force ? `\n\n${startFence}\n${endFence}\n` : '\n'
                    }

                    const shouldFence =
                        force ||
                        // if content has empty lines
                        content.includes('\n\n') ||
                        // if content doesn't is DQL result
                        !/^[-|]/gi.test(content)

                    const postfix = content.endsWith('\n') ? '' : '\n'
                    return shouldFence
                        ? `\n\n${startFence}\n${content}${postfix}${endFence}\n`
                        : `\n\n${content}${postfix}`
                },
            })
        }
    }

    const plugin_level = {
        TRACE: 1,
        DEBUG: 2,
        INFO: 3,
        WARN: 4,
        ERROR: 5,
    }[settings.plugin_level] as LogLevelValue

    return {
        ...settings,
        plugin_level,
        matchers,
    }
}
