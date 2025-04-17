import type { CommentMatcher, DataviewPersisterState } from '@/utility/state'
import type { EditorPosition } from 'obsidian'

type LineProvider = (line: number) => string

export interface CommentQuery {
    query: string
    queryFrom: number
    queryTo: number
    resultFrom: EditorPosition
    resultTo: EditorPosition
    matcher: CommentMatcher
}

/** Iterate lines to find if the source has any comment query */
export function hasQueries(
    state: DataviewPersisterState,
    lastLine: number,
    getLine: LineProvider,
): boolean {
    for (let lineIndex = 0; lineIndex <= lastLine; lineIndex++) {
        const line = getLine(lineIndex)
        for (const matcher of state.matchers) {
            const query = findQuery(matcher, lineIndex, lastLine, (n) => {
                // avoid re-requesting the queryHeader multiple times
                return n === lineIndex ? line : getLine(n)
            })
            if (query) return true
        }
    }
    return false
}

/** Identify all comment queries on a document */
export function findAllQueries(
    state: DataviewPersisterState,
    lastLine: number,
    getLine: LineProvider,
): CommentQuery[] {
    const queries = [] as CommentQuery[]
    for (let lineIndex = 0; lineIndex <= lastLine; lineIndex++) {
        const line = getLine(lineIndex)
        for (const matcher of state.matchers) {
            const query = findQuery(matcher, lineIndex, lastLine, (n) => {
                // avoid re-requesting the queryHeader multiple times
                return n === lineIndex ? line : getLine(n)
            })
            if (!query) continue

            // move the index, after the already identified query
            lineIndex = query.resultTo.line
            queries.push(query)
        }
    }
    return queries
}

/** Identify the comment query the `testLine` is part of */
export function identifyQuery(
    state: DataviewPersisterState,
    testLine: number,
    lastLine: number,
    getLine: LineProvider,
): CommentQuery | undefined {
    // testLine is out of document
    if (testLine > lastLine) return

    // search commentStart
    for (let lineIndex = testLine; lineIndex > -1; lineIndex--) {
        const line = getLine(lineIndex)
        for (const matcher of state.matchers) {
            if (!matcher.testHeader(line)) continue
            const query = findQuery(matcher, lineIndex, lastLine, (n) => {
                // avoid re-requesting the queryHeader multiple times
                return n === lineIndex ? line : getLine(n)
            })

            // fails if header was found but comment is incomplete
            // or if testline is not inside [queryFrom, queryTo]
            if (query && query.queryTo >= testLine) return query
        }
    }
    return
}

/** Identity a comment query starting at line `queryFrom` */
export function findQuery(
    matcher: CommentMatcher,
    queryFrom: number,
    lastLine: number,
    getLine: LineProvider,
): CommentQuery | undefined {
    const queryHeader = getLine(queryFrom)
    if (!matcher.testHeader(queryHeader)) return

    // single-line query
    if (matcher.testFooter(queryHeader)) {
        return {
            matcher,
            queryFrom,
            queryTo: queryFrom,
            query: matcher.removeHeader(matcher.removeFooter(queryHeader)),
            ...findResult(matcher, queryFrom, lastLine, getLine),
        }
    }

    // multi-line query
    let query = matcher.removeHeader(queryHeader)
    for (let lineIndex = queryFrom + 1; lineIndex <= lastLine; lineIndex++) {
        const line = getLine(lineIndex)
        if (!matcher.testFooter(line)) {
            query += `\n${line}`
            continue
        }

        // a query end is found
        query += `\n${matcher.removeFooter(line)}`
        return {
            matcher,
            queryFrom,
            queryTo: lineIndex,
            query: query.trim(),
            ...findResult(matcher, lineIndex, lastLine, getLine),
        }
    }

    // comment closer could not be found
    return
}

/** Identify a query result end after `queryTo` */
export function findResult(
    matcher: CommentMatcher,
    queryTo: number,
    lastLine: number,
    getLine: LineProvider,
): Pick<CommentQuery, 'resultFrom' | 'resultTo'> {
    const resultFrom = { line: queryTo, ch: Infinity }
    const result = (line: number, ch: number) =>
        ({
            resultFrom,
            resultTo: { line, ch },
        }) as Pick<CommentQuery, 'resultFrom' | 'resultTo'>

    // bad query indexing
    if (queryTo >= lastLine) return { resultFrom, resultTo: resultFrom }

    let index = queryTo
    let line = getLine(++index)

    // formatting blackline
    if (/^\s*$/.test(line)) line = getLine(++index)
    if (!line || index >= lastLine) return result(queryTo + 1, 0)

    // if fences are been used, find the endFence
    if (matcher.testStart(line)) {
        for (++index; index < lastLine; index++) {
            const line = getLine(index)
            if (matcher.testEnd(line)) return result(index + 1, 0)
            // a new queryComment was found
            if (matcher.testHeader(line)) return result(queryTo + 1, 0)
        }
        // no endFence could be find
        return result(queryTo + 1, 0)
    }

    // otherwise, find the next element change
    // TODO: test of CALENDAR types
    if (line.startsWith('|')) {
        // TABLEs start with '|'
        for (++index; index < lastLine; index++) {
            if (!getLine(index).startsWith('|')) return result(index, 0)
        }
        // EOF reached without element change
        return result(index, Infinity)
    } else if (/^ *-/.test(line)) {
        // LISTs and TASKs start with '-' but can have spaces as prefix
        for (++index; index < lastLine; index++) {
            if (!/^ *-/.test(getLine(index))) return result(index, 0)
        }
        // EOF reached without element change
        return result(index, Infinity)
    }

    // no regular Dataview result was found
    return result(queryTo + 1, 0)
}
