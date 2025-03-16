import type { CommentMatcher, DataviewPersisterState } from '@/utility/state'

type LineProvider = (line: number) => string

export interface CommentQuery {
    query: string
    queryStart: number
    queryEnd: number
    resultEnd: number
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
            lineIndex = query.resultEnd > -1 ? query.resultEnd : query.queryEnd
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
            // or if testline is not inside [queryStart, queryEnd]
            if (query && query.queryEnd >= testLine) return query
        }
    }
    return
}

/** Identity a comment query starting at `queryStart` */
export function findQuery(
    matcher: CommentMatcher,
    queryStart: number,
    lastLine: number,
    getLine: LineProvider,
): CommentQuery | undefined {
    const queryHeader = getLine(queryStart)
    if (!matcher.testHeader(queryHeader)) return

    // single-line query
    if (matcher.testFooter(queryHeader)) {
        return {
            query: matcher.removeHeader(matcher.removeFooter(queryHeader)),
            queryEnd: queryStart,
            queryStart,
            resultEnd: findQueryEnd(matcher, queryStart, lastLine, getLine),
            matcher,
        }
    }

    // multi-line query
    let query = matcher.removeHeader(queryHeader)
    for (let lineIndex = queryStart + 1; lineIndex <= lastLine; lineIndex++) {
        const line = getLine(lineIndex)
        // a query end is found
        if (matcher.testFooter(line)) {
            query += `\n${matcher.removeFooter(line)}`
            return {
                query: query.trim(),
                queryEnd: lineIndex,
                queryStart,
                resultEnd: findQueryEnd(matcher, lineIndex, lastLine, getLine),
                matcher,
            }
        }

        query += `\n${line}`
    }

    // comment closer could not be found
    return
}

/** Identify a query result end after `queryEnd` */
export function findQueryEnd(
    matcher: CommentMatcher,
    queryEnd: number,
    lastLine: number,
    getLine: LineProvider,
): number {
    // bad query indexing
    if (queryEnd > lastLine) return -1

    let lineIndex = queryEnd
    let line = getLine(++lineIndex)

    // formatting blackline
    if (/^\s*$/.test(line)) {
        if (lastLine <= lineIndex) return -1
        line = getLine(++lineIndex)
    }

    // if fences are been used, find the endFence
    if (matcher.testStart(line)) {
        for (++lineIndex; lineIndex < lastLine; lineIndex++) {
            const line = getLine(lineIndex)
            if (matcher.testEnd(line)) return lineIndex
            // a new queryComment was found
            if (matcher.testHeader(line)) return -1
        }
        // no endFence could be find
        return -1
    }

    // otherwise, find the next element change
    // TODO: test of CALENDAR types
    if (line.startsWith('|')) {
        // TABLEs start with '|'
        for (++lineIndex; lineIndex < lastLine; lineIndex++) {
            if (!getLine(lineIndex).startsWith('|')) return lineIndex - 1
        }
        return lineIndex
    } else if (/^ *-/.test(line)) {
        // LISTs and TASKs start with '-' but can have spaces as prefix
        for (++lineIndex; lineIndex < lastLine; lineIndex++) {
            if (!/^ *-/.test(getLine(lineIndex))) return lineIndex - 1
        }
        return lineIndex
    }

    return -1
}
