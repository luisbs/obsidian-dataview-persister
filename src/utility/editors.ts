import type { EditorPosition } from 'obsidian'

export interface BaseEditor {
    lastLine(): number
    getLine(lineIndex: number): string
    posToOffset(pos: EditorPosition): number
    offsetToPos(offset: number): EditorPosition
    replaceRange(
        replacement: string,
        from: EditorPosition,
        to: EditorPosition,
    ): void
}

export class FileEditor implements BaseEditor {
    #lines: string[] = []
    #indexes: Record<number, number> = {}
    #content = ''
    #lastPos = 0
    #lastLine = 0

    constructor(content: string) {
        this.syncTo(content)
    }

    syncTo(content: string): void {
        this.#content = content
        this.#lines = content.split('\n')
        this.#lastPos = this.#content.length - 1
        this.#lastLine = this.#lines.length - 1

        this.#indexes = {}
        for (let i = 0; i < this.#lines.length; i++) {
            this.#indexes[i] = this.#lines[i].length
        }
    }

    getContent(): string {
        return this.#content
    }

    lastLine(): number {
        return this.#lastLine
    }

    getLine(lineIndex: number): string {
        if (lineIndex > this.#lastLine) return ''
        return this.#lines[lineIndex]
    }

    replaceRange(
        replacement: string,
        from: EditorPosition,
        to: EditorPosition,
    ): void {
        this.syncTo(
            this.#content.slice(0, this.posToOffset(from)) +
                replacement +
                this.#content.slice(this.posToOffset(to)),
        )
    }

    posToOffset(pos: EditorPosition): number {
        if (pos.line < 0 || pos.ch < 0) return 0
        if (pos.line === 0 && pos.ch === 0) return 0
        if (pos.line > this.#lastLine) return this.#lastPos + 1
        if (pos.line === this.#lastLine && pos.ch === Infinity)
            return this.#lastPos + 1

        // add up until the line before the requested
        // the extra +1 is to place it after the linebreak
        let offset = this.#indexes[0] + 1
        for (let i = 1; i <= this.#lastLine && i < pos.line; i++) {
            // adds 1 for the missing linebreaks
            offset += 1 + (this.#indexes[i] ?? 0)
        }

        // if `Infinity` is used offset to the end of the line
        if (pos.ch !== Infinity) return offset + pos.ch
        return offset + (this.#indexes[pos.line] ?? 0)
    }

    offsetToPos(offset: number): EditorPosition {
        if (offset < 1) return { line: 0, ch: 0 }
        if (offset >= this.#lastPos)
            return { line: this.#lastLine, ch: Infinity }

        let line = 0
        for (let i = 0; i < this.#lastLine; i++) {
            if (offset < 1) {
                line = i
                break
            }

            const ch = this.#indexes[i] ?? 0
            // subtract 1 for the missing linebreaks
            offset -= 1 + ch
        }

        return { line, ch: Math.abs(offset) }
    }
}
