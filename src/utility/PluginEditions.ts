function shortenLink(source: string) {
    return source.replaceAll(/(?<=\[\[)[^|]+\|/gi, '')
}

export function shortenLinks(source: string): string {
    const lines = source.split('\n')
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index]

        // only markdown table have an special treatment
        if (!line.startsWith('|')) {
            lines[index] = shortenLink(line)
            continue
        }

        // update the index to jump the table
        index = shortenTableLinks(lines, index)
    }

    return lines.join('\n')
}

export function shortenTableLinks(lines: string[], startIndex: number): number {
    // break the table into a more accessible estructure
    const table: Record<number, string[]> = {}
    const changed: Record<number, number> = {}

    // shorten the links
    let rowIndex = startIndex
    for (; rowIndex < lines.length; rowIndex++) {
        const line = lines[rowIndex]

        // the table has ended
        if (!line.startsWith('|')) break
        table[rowIndex] = line.split(' | ')

        // the line doesnt contain links
        if (!line.includes('[[')) continue

        // edit the row
        for (let colIndex = 0; colIndex < table[rowIndex].length; colIndex++) {
            const before = table[rowIndex][colIndex]
            const after = shortenLink(before)
            const length = before.length - after.length
            if (length < 1) continue

            // pad the remove space, to be removed after
            table[rowIndex][colIndex] = after.padEnd(before.length)

            // columns should fit the largest value
            if (!changed[colIndex]) changed[colIndex] = length
            else if (changed[colIndex] < length) changed[colIndex] = length
        }
    }

    // columns width should be adjusted
    for (const colIndex in changed) {
        if (!Object.prototype.hasOwnProperty.call(changed, colIndex)) continue
        const shorter = changed[colIndex]

        // adjust each cell on the column
        for (let index = startIndex; index < rowIndex; index++) {
            const value = table[index][colIndex]
            table[index][colIndex] = value.substring(0, value.length - shorter)
        }
    }

    // apply changes
    for (const rowIndex in table) {
        if (!Object.prototype.hasOwnProperty.call(table, rowIndex)) continue
        lines[rowIndex] = table[rowIndex].join(' | ')
    }

    return rowIndex - 1
}
