import type { CommentMatcher, DataviewPersisterState } from '@/utility/state'

type LineProvider = (line: number) => string

export function extractQuery(
    state: DataviewPersisterState,
    testLine: number,
    lastLine: number,
    getLine: LineProvider,
): string | undefined {
    // testLine is out of document
    if (testLine > lastLine) return

    // search commentStart
    const header = identifyCommentHeader(state, testLine, getLine)
    // commentStart could not be located
    if (!header) return

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const [startLine, headerText, { testFooter, removeHeader, removeFooter }] =
        header

    // single line comment
    if (testFooter(headerText)) {
        if (startLine !== testLine) return
        return removeHeader(removeFooter(headerText))
    }

    // search commentEnd
    const lines = [removeHeader(headerText)]
    for (let lineIndex = startLine + 1; lineIndex <= lastLine; lineIndex++) {
        const line = getLine(lineIndex)
        if (!testFooter(line)) {
            lines.push(line)
            continue
        }
        // testLine is not between [commentEnd, commentStart]
        if (lineIndex < testLine) break
        // found query inside comment
        lines.push(removeFooter(line))
        return lines.join('\n').trim()
    }

    // commentEnd could not be located
    return
}

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
