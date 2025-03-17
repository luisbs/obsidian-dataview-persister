import type { CommentQuery } from '@/utility/queries'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type QuerySpec = [string[], string, Omit<CommentQuery, 'matcher'>]
type NoQuerySpec = [string[], string, number[]]

const goodExample = resolve(import.meta.dirname, './GoodExamples.md')
export const GOOD_EXAMPLE = [
    '', // insert an empty line to, make the lineIndex match with editor>shownumbers
    ...readFileSync(goodExample).toString().split('\n'),
]

function query(
    query: string,
    queryFrom: number,
    queryTo: number,
    resultLine: number,
    resultCh = 0,
): Omit<CommentQuery, 'matcher'> {
    return {
        query,
        queryFrom,
        queryTo,
        resultFrom: { line: queryTo, ch: Infinity },
        resultTo: { line: resultLine, ch: resultCh },
    }
}

// prettier-ignore
export const GOOD_QUERIES: QuerySpec[] = [
    [GOOD_EXAMPLE,          'Line Query', query('list from "books"',   4,   4,   7)],
    [GOOD_EXAMPLE,         'Block Query', query('list from "books"',   9,  11,  14)],
    [GOOD_EXAMPLE,         'List Result', query('list from "books"',  22,  22,  28)],
    [GOOD_EXAMPLE,         'Task Result', query('task from "books"',  31,  31,  37)],
    [GOOD_EXAMPLE,        'Table Result', query('table from "books"', 40,  40,  46)],
    [GOOD_EXAMPLE,       'Spaced Fences', query('list from "books"',  52,  52,  65)],
    [GOOD_EXAMPLE,       'Forced Fences', query('list from "books"',  68,  68,  75)],
    // problematic cases
    [GOOD_EXAMPLE,  'Unsupported Result', query('list from "books"',  81,  81,  82)],
    [GOOD_EXAMPLE,  'Mistaken user list', query('list from "books"',  89,  89,  93)],
    [GOOD_EXAMPLE,    'Spaced user list', query('list from "books"',  94,  94,  95)],
    [GOOD_EXAMPLE, 'Protected user list', query('list from "books"', 102, 102, 103)],
]

//
//
//
//
//
//
//
// SPACED
// FOR
// EASIER
// NUMBERS
export const EOF_EXAMPLE = `
%%dv list from "recipes" %%`.split('\n')

export const NO_END_EXAMPLE = `
%%dv list from "recipes" %%

<!--dv-start KEEP THIS COMMENT -->

- Hot Water
- Water Soup
`.split('\n')

//
export const OVERLAP_EXAMPLE = `
%%dv
list from "recipes"
%%

<!--dv-start KEEP THIS COMMENT -->

- Hot Water
- Water Soup

## Second list

%%dv list from "books" %%

<!--dv-start KEEP THIS COMMENT -->

- The hobbit
- Lord of the rings

<!--dv-end KEEP THIS COMMENT -->
`.split('\n')

// prettier-ignore
export const MIXED_QUERIES: QuerySpec[] = [
    [EOF_EXAMPLE,    'End of file', query('list from "recipes"', 1,  1,  1, Infinity)],
    [NO_END_EXAMPLE, 'Missing End', query('list from "recipes"', 1,  1,  2)],
    [OVERLAP_EXAMPLE,    'Overlap', query('list from "recipes"', 1,  3,  4)],
    [OVERLAP_EXAMPLE, 'No Overlap', query('list from "books"',  12, 12, 20)],
]

/** All examples that contain a valid query */
export const ALL_QUERIES = [...GOOD_QUERIES, ...MIXED_QUERIES]

//
//
//
// SPACED
// FOR
// EASIER
// NUMBERS
// prettier-ignore
export const NO_QUERY_EXAMPLE = `
# This query doesn't include any valid query

%%dvlist from "recipes" %%
%%da
list from "recipes"
%%
`.split('\n')

export const NO_QUERIES: NoQuerySpec[] = [
    [NO_QUERY_EXAMPLE, 'Bad Naming Example', [4, 6, -1, -1]],
    [NO_QUERY_EXAMPLE, 'Bad Spacing Example', [3, 3, -1, -1]],
]
