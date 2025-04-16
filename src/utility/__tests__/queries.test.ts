import { assert, describe, expect, test, vi } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '../../settings'
import {
    findAllQueries,
    findQuery,
    findResult,
    hasQueries,
    identifyQuery,
} from '../queries'
import { prepareState } from '../state'
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
            hasQueries(state, lines.length - 1, (n) => lines[n]),
        )

        expect.soft(mockFn(GOOD_EXAMPLE)).toBe(true)
        expect.soft(mockFn(NO_END_EXAMPLE)).toBe(true)
        expect.soft(mockFn(OVERLAP_EXAMPLE)).toBe(true)

        expect.soft(mockFn(NO_QUERY_EXAMPLE)).toBe(false)
    })

    test('findAllQueries', () => {
        const mockFn = vi.fn((lines: string[]) =>
            findAllQueries(state, lines.length - 1, (n) => lines[n]).map(
                // ignore dynamic matcher
                ({ matcher: _, ...query }) => query,
            ),
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
            identifyQuery(state, testLine, lines.length - 1, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            const { queryFrom: f, queryTo: t } = q
            const e = q.queryTo + 1
            const b = Math.floor(Math.random() * (t - f + 1)) + f

            // testLine inside comment query
            expect.soft(mockFn(lines, f), `[header] ${name}`).toMatchObject(q)
            expect.soft(mockFn(lines, t), `[footer] ${name}`).toMatchObject(q)
            expect.soft(mockFn(lines, b), `[between] ${name}`).toMatchObject(q)

            // testLine outside comment query
            expect.soft(mockFn(lines, e), `[resultEnd] ${name}`).toBeUndefined()
        }
    })

    test('findQuery', () => {
        const mockFn = vi.fn((lines: string[], queryFrom: number) =>
            findQuery(matcher, queryFrom, lines.length - 1, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            expect.soft(mockFn(lines, q.queryFrom), name).toMatchObject(q)
        }
    })

    test('findResult', () => {
        const mockFn = vi.fn((lines: string[], queryTo: number) =>
            findResult(matcher, queryTo, lines.length - 1, (n) => lines[n]),
        )

        for (const [lines, name, q] of ALL_QUERIES) {
            const range = { resultFrom: q.resultFrom, resultTo: q.resultTo }
            expect.soft(mockFn(lines, q.queryTo), name).toMatchObject(range)
        }
    })
})
