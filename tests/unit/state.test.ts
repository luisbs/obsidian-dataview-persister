import { describe, expect, test } from 'vitest'
import { DEFAULT_SETTINGS as SETTINGS } from '@/settings'
import { prepareState } from '@/utility/state'

const state = prepareState(SETTINGS)

describe('Testing state matchers', () => {
    test('testHeader', () => {
        const headerMatch = (text: string) =>
            state.matchers.some((matcher) => matcher.testHeader(text))

        expect.soft(headerMatch('<!--dataview')).toBe(true)
        expect.soft(headerMatch('%%dataview')).toBe(true)
        expect.soft(headerMatch('%%dv')).toBe(true)
        expect.soft(headerMatch('%%dv      list from "recipes" %%')).toBe(true)

        expect.soft(headerMatch('%%dataviewjs')).toBe(false) // incorrect name
        expect.soft(headerMatch('%%%dataview')).toBe(false) // invalid prefix
        expect.soft(headerMatch('%% dataview')).toBe(false) // invalid space
        expect.soft(headerMatch('%%dvlist from "recipes" %%')).toBe(false) // missing space
    })

    test('testFooter', () => {
        const footerMatch = (text: string) =>
            state.matchers.some((matcher) => matcher.testFooter(text))

        expect.soft(footerMatch('-->')).toBe(true)
        expect.soft(footerMatch('%%')).toBe(true)
        expect.soft(footerMatch('%%dv list from "recipes"      %%')).toBe(true)

        expect.soft(footerMatch('%%%')).toBe(false) // invalid suffix
        expect.soft(footerMatch('--->')).toBe(false) // invalid suffix
        expect.soft(footerMatch('%%dv list from "recipes"%%')).toBe(false) // missing space
    })
})

describe('Testing state matchers together', () => {
    const output = 'list from "recipes"'
    const inputs: Array<[boolean, string]> = [
        // good
        [true, `%%dv ${output} %%`],
        [true, `<!--dv ${output} -->`],
        // bad
        [false, `%%dv ${output}%%`],
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
