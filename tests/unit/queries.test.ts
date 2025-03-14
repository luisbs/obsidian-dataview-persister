import { describe, expect, test } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '@/settings'
import { prepareState } from '@/utility/state'
import { extractQuery } from '@/utility/queries'

const state = prepareState(SETTINGS)

describe('Testing utiltity functions', () => {
    test('extractQuery', () => {
        const output = 'list from "recipes"'
        const inputs: string[][] = [
            // line comments
            [`%%dv ${output} %%`],
            [`<!--dv ${output} -->`],
            // block comments
            ['%%dv', output, '%%'],
            ['<!--dv', output, '-->'],
        ]

        for (const lines of inputs) {
            const query = extractQuery(state, 0, lines.length, (i) => lines[i])
            expect.soft(query, `Example ${inputs.indexOf(lines)}`).toBe(output)
        }
    })

    test('extractQuery (example)', () => {
        // prettier-ignore
        const lines = `
            # Page title
            ## Recipes
            <!--dv list from "recipes" -->

            ---
            ## Books
            > Note about the books
            %%dv
            list from "books"
            %%
            Paragraph about the list of books

            ---
            ## Strangely write queries
            %%dv list from "strange1"
            %%
            %%dv
            list from "strange2" %%
            %%dv                      list
            from
            "strange3"                  %%
        `.split('\n').map((line) => line.trim())

        // console.log(lines)
        const tests: Array<[number, undefined | string, string]> = [
            [3, 'list from "recipes"', 'LineComment'],
            [5, undefined, 'Outside of LineComment'],
            [8, 'list from "books"', 'Start of BlockComment'],
            [9, 'list from "books"', 'Middle of BlockComment'],
            [10, 'list from "books"', 'End of BlockComment'],
            [11, undefined, 'Outside of BlockComment'],
            [15, 'list from "strange1"', 'Strange Query 1'],
            [16, 'list from "strange1"', 'Strange Query 1'],
            [17, 'list from "strange2"', 'Strange Query 2'],
            [18, 'list from "strange2"', 'Strange Query 2'],
            [19, 'list\nfrom\n"strange3"', 'Strange Query 3'],
            [20, 'list\nfrom\n"strange3"', 'Strange Query 3'],
            [21, 'list\nfrom\n"strange3"', 'Strange Query 3'],
            [50, undefined, 'Outside of Document'],
        ]

        for (const [testLine, result, testName] of tests) {
            const query = extractQuery(
                state,
                testLine,
                lines.length,
                (i) => lines[i],
            )
            expect.soft(query, testName).toBe(result)
        }
    })
})
