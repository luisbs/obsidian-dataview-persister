import type { DataviewPersisterSettings } from '@/settings'

export interface DataviewPersisterState {
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
                    const shouldFence = force || content.includes('\n\n')
                    // the content is aimed to follow the commentEnd
                    // so a starting linebreak should be added
                    if (content.endsWith('\n')) {
                        return shouldFence
                            ? `\n${startFence}\n${content}${endFence}\n`
                            : `\n${content}`
                    }
                    return shouldFence
                        ? `\n${startFence}\n${content}\n${endFence}\n`
                        : `\n${content}`
                },
            })
        }
    }

    return { matchers }
}
