import { assert, describe, expect, test, vi } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '@/settings'
import { prepareState } from '@/utility/state'
import {
    identifyQuery,
    findAllQueries,
    findQuery,
    findQueryEnd,
    hasQueries,
} from '@/utility/queries'
import {
    ALL_QUERIES,
    GOOD_EXAMPLE,
    GOOD_QUERIES,
    MIXED_QUERIES,
    NO_END_EXAMPLE,
    NO_QUERY_EXAMPLE,
    OVERLAP_EXAMPLE,
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

        const mixedQueries = MIXED_QUERIES.map(([_, __, query]) => query)
        const noEndQueries = expect.arrayContaining(mockFn(NO_END_EXAMPLE))
        const overlapQueries = expect.arrayContaining(mockFn(OVERLAP_EXAMPLE))
        expect.soft(mixedQueries, 'No End Examples').toEqual(noEndQueries)
        expect.soft(mixedQueries, 'Overlap Examples').toEqual(overlapQueries)
    })

    test('identifyQuery', () => {
        const mockFn = vi.fn((lines: string[], testLine: number) =>
            identifyQuery(state, testLine, lines.length, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            const { queryStart: h, queryEnd: f, resultEnd: e } = q
            const b = Math.floor(Math.random() * (f - h + 1)) + h

            // testLine inside comment query
            expect.soft(mockFn(lines, h), `[header] ${name}`).toMatchObject(q)
            expect.soft(mockFn(lines, f), `[footer] ${name}`).toMatchObject(q)
            expect.soft(mockFn(lines, b), `[between] ${name}`).toMatchObject(q)

            // testLine outside comment query
            expect.soft(mockFn(lines, e), `[resultEnd] ${name}`).toBeUndefined()
        }
    })

    test('findQuery', () => {
        const mockFn = vi.fn((lines: string[], queryHeader: number) =>
            findQuery(matcher, queryHeader, lines.length, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            expect.soft(mockFn(lines, q.queryStart), name).toMatchObject(q)
        }
    })

    test('findQueryEnd', () => {
        const mockFn = vi.fn((lines: string[], queryFooter: number) =>
            findQueryEnd(matcher, queryFooter, lines.length, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            expect.soft(mockFn(lines, q.queryEnd), name).toBe(q.resultEnd)
        }
    })
})
