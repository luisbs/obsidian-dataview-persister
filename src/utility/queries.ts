import type { CommentMatcher, DataviewPersisterState } from '@/utility/state'

type LineProvider = (line: number) => string

export interface CommentQuery {
    query: string
    queryStart: number
    queryEnd: number
    resultEnd: number
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
    let lineIndex = queryEnd
    let line = getLine(++lineIndex)

    // formatting spaces
    while (/^\s*$/.test(line)) {
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
    // TODO: test behavior of TASK and CALENDAR types
    if (line.startsWith('|')) {
        for (++lineIndex; lineIndex < lastLine; lineIndex++) {
            if (!getLine(lineIndex).startsWith('|')) return lineIndex - 1
        }
    } else if (/^ *-/.test(line)) {
        for (++lineIndex; lineIndex < lastLine; lineIndex++) {
            if (!/^ *-/.test(getLine(lineIndex))) return lineIndex - 1
        }
    }

    return -1
}

//
//

export function extractQuery(
    state: DataviewPersisterState,
    testLine: number,
    lastLine: number,
    getLine: LineProvider,
): CommentQuery | undefined {
    // testLine is out of document
    if (testLine > lastLine) return

    // search commentStart
    const header = identifyCommentHeader(state, testLine, getLine)
    // commentStart could not be located
    if (!header) return

    const [startLine, headerText, matcher] = header
    return findQuery(matcher, startLine, lastLine, (n) => {
        // avoid re-requesting the queryHeader multiple times
        return n === startLine ? headerText : getLine(n)
    })
}

// TODO: join this function into extractQuery
// TODO: retest extractQuery
function identifyCommentHeader(
    state: DataviewPersisterState,
    testLine: number,
    getLine: LineProvider,
): undefined | [number, string, CommentMatcher] {
    for (let lineIndex = testLine; lineIndex > -1; lineIndex--) {
        const line = getLine(lineIndex)
        for (const matcher of state.matchers) {
            if (matcher.testHeader(line)) {
                return [lineIndex, line, matcher]
            }
        }
    }
    return
}
