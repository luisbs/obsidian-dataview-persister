import type { DataviewPersisterSettings } from '@/settings'

export interface DataviewPersisterState {
    matchers: CommentMatcher[]
}

export interface CommentMatcher {
    testHeader(text: string): boolean
    testFooter(text: string): boolean
    removeHeader(text: string): string
    removeFooter(text: string): string
}

const affixes = [
    ['^%%{id}($|\\s+)', /(^|\s+)%%$/],
    ['^<!--{id}($|\\s+)', /(^|\s+)-->$/],
] as Array<[string, RegExp]>

export function prepareState(
    settings: DataviewPersisterSettings,
): DataviewPersisterState {
    const matchers = [] as CommentMatcher[]
    for (const id of settings.comment_header.split(',')) {
        for (const [prefix, footerMatcher] of affixes) {
            const headerMatcher = RegExp(prefix.replace('{id}', id))
            matchers.push({
                testHeader: (t) => headerMatcher.test(t),
                testFooter: (t) => footerMatcher.test(t),
                removeHeader: (t) => t.replace(headerMatcher, ''),
                removeFooter: (t) => t.replace(footerMatcher, ''),
            })
        }
    }

    return { matchers }
}
