import { describe, expect, test } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '@/settings'
import { prepareState } from '@/utility/state'

const state = prepareState(SETTINGS)

describe('Testing state matchers', () => {
    test('testHeader', () => {
        const matcher = (text: string) =>
            state.matchers.some((matcher) => matcher.testHeader(text))

        expect.soft(matcher('<!--dataview')).toBe(true)
        expect.soft(matcher('%%dataview')).toBe(true)
        expect.soft(matcher('%%dv')).toBe(true)
        expect.soft(matcher('%%dv      list from "recipes" %%')).toBe(true)

        expect.soft(matcher('%%dataviewjs')).toBe(false) // incorrect name
        expect.soft(matcher('%%%dataview')).toBe(false) // invalid prefix
        expect.soft(matcher('%% dataview')).toBe(false) // invalid space
        expect.soft(matcher('%%dvlist from "recipes" %%')).toBe(false) // missing space
    })

    test('testFooter', () => {
        const matcher = (text: string) =>
            state.matchers.some((matcher) => matcher.testFooter(text))

        expect.soft(matcher('-->')).toBe(true)
        expect.soft(matcher('%%')).toBe(true)
        expect.soft(matcher('%%dv list from "recipes"      %%')).toBe(true)

        // allowed behavior
        expect.soft(matcher('%%%')).toBeTruthy()
        expect.soft(matcher('--->')).toBeTruthy()
        expect.soft(matcher('%%dv list from "recipes"%%')).toBeTruthy()
    })

    test('testStart', () => {
        const matcher = (text: string) =>
            state.matchers.some((matcher) => matcher.testStart(text))

        expect.soft(matcher('<!--dv-start KEEP THIS COMMENT -->')).toBe(true)
        expect.soft(matcher('<!--dv-start KEEP THIS COMMENT-->')).toBe(false)
        expect.soft(matcher('<!--dv KEEP THIS COMMENT -->')).toBe(false)
    })

    test('testEnd', () => {
        const matcher = (text: string) =>
            state.matchers.some((matcher) => matcher.testEnd(text))

        expect.soft(matcher('<!--dv-end KEEP THIS COMMENT -->')).toBe(true)
        expect.soft(matcher('<!--dv-end KEEP THIS COMMENT-->')).toBe(false)
        expect.soft(matcher('<!--dv KEEP THIS COMMENT -->')).toBe(false)
    })

    test('getStart', () => {
        const items = state.matchers.map((matcher) => matcher.getStart())

        expect.soft(items).toContain('<!--dataview-start KEEP THIS COMMENT -->')
        expect.soft(items).toContain('<!--dv-start KEEP THIS COMMENT -->')
    })

    test('getEnd', () => {
        const items = state.matchers.map((matcher) => matcher.getEnd())

        expect.soft(items).toContain('<!--dataview-end KEEP THIS COMMENT -->')
        expect.soft(items).toContain('<!--dv-end KEEP THIS COMMENT -->')
    })
})

describe('Testing state matchers together', () => {
    const output = 'list from "recipes"'
    const inputs: Array<[boolean, string]> = [
        // good
        [true, `%%dv ${output} %%`],
        [true, `<!--dv ${output} -->`],
        [true, `%%dv ${output}%%`],
        // bad
        [false, `%%dv ${output} -->`],
        [false, `<!--dv ${output} %%`],
    ]

    test('testHeader + testFooter', () => {
        for (const [result, input] of inputs) {
            for (const { testHeader, testFooter } of state.matchers) {
                if (!testHeader(input)) continue

                expect.soft(testFooter(input), input).toBe(result)
                break
            }
        }
    })

    test('removeHeader + removeFooter', () => {
        for (const [yes, input] of inputs) {
            for (const {
                testHeader,
                removeHeader,
                removeFooter,
            } of state.matchers) {
                if (!testHeader(input)) continue

                const headerFooter = removeHeader(removeFooter(input))
                const footerHeader = removeFooter(removeHeader(input))
                // order should not affect result
                expect.soft(headerFooter).toBe(footerHeader)

                if (yes) expect.soft(headerFooter, input).toBe(output)
                else expect.soft(headerFooter, input).not.toBe(output)
                break
            }
        }
    })
})
