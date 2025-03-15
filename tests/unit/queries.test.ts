import { assert, describe, expect, test, vi } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '@/settings'
import { prepareState } from '@/utility/state'
import {
    extractQuery,
    findAllQueries,
    findQuery,
    findQueryEnd,
    hasQueries,
} from '@/utility/queries'
import {
    ALL_QUERIES,
    GOOD_EXAMPLE,
    GOOD_QUERIES,
    NO_END_EXAMPLE,
    NO_QUERY_EXAMPLE,
    OVERLAP_EXAMPLE,
    OVERLAP_QUERIES,
} from './mock/QueryExamples'

const state = prepareState(SETTINGS)

describe('Testing Query functions', () => {
    const matcher = state.matchers.find((m) => m.testHeader('%%dv'))
    assert(matcher !== undefined, 'matcher should not be undefined')

    test('hasQueries', () => {
        const mockFn = vi.fn((lines: string[]) =>
            hasQueries(state, lines.length, (n) => lines[n]),
        )

        expect.soft(mockFn(GOOD_EXAMPLE)).toBe(true)
        expect.soft(mockFn(NO_END_EXAMPLE)).toBe(true)
        expect.soft(mockFn(OVERLAP_EXAMPLE)).toBe(true)
        expect.soft(mockFn(NO_QUERY_EXAMPLE)).toBe(false)
    })

    test('findAllQueries', () => {
        const mockFn = vi.fn((lines: string[]) =>
            findAllQueries(state, lines.length, (n) => lines[n]),
        )

        const goodQueries = GOOD_QUERIES.map(([_, __, query]) => query)
        expect.soft(mockFn(GOOD_EXAMPLE)).toMatchObject(goodQueries)

        const overlapQueries = OVERLAP_QUERIES.map(([_, __, query]) => query)
        expect.soft(mockFn(OVERLAP_EXAMPLE)).toMatchObject(overlapQueries)
    })

    test('findQuery', () => {
        const mockFn = vi.fn((lines: string[], queryHeader: number) =>
            findQuery(matcher, queryHeader, lines.length, (n) => lines[n]),
        )

        for (const [lines, name, [header], query] of ALL_QUERIES) {
            expect.soft(mockFn(lines, header), name).toMatchObject(query)
        }
    })

    test('findQueryEnd', () => {
        const mockFn = vi.fn((lines: string[], queryFooter: number) =>
            findQueryEnd(matcher, queryFooter, lines.length, (n) => lines[n]),
        )

        for (const [lines, name, [_, footer, end]] of ALL_QUERIES) {
            expect.soft(mockFn(lines, footer), name).toBe(end)
        }
    })

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
