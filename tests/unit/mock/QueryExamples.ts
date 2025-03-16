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

// prettier-ignore
export const GOOD_QUERIES: QuerySpec[] = [
    [GOOD_EXAMPLE,    'Line Query', { query: 'list from "books"', queryStart: 4, queryEnd: 4, resultEnd: 6 }],
    [GOOD_EXAMPLE,   'Block Query', { query: 'list from "books"', queryStart: 9, queryEnd: 11, resultEnd: 13 }],
    [GOOD_EXAMPLE,   'List Result', { query: 'list from "books"', queryStart: 22, queryEnd: 22, resultEnd: 27 }],
    [GOOD_EXAMPLE,   'Task Result', { query: 'task from "books"', queryStart: 31, queryEnd: 31, resultEnd: 36 }],
    [GOOD_EXAMPLE,  'Table Result', { query: 'table from "books"', queryStart: 40, queryEnd: 40, resultEnd: 45 }],
    [GOOD_EXAMPLE, 'Spaced Fences', { query: 'list from "books"', queryStart: 52, queryEnd: 52, resultEnd: 64 }],
    [GOOD_EXAMPLE, 'Forced Fences', { query: 'list from "books"', queryStart: 68, queryEnd: 68, resultEnd: 74 }],
    // problematic cases
    [GOOD_EXAMPLE, 'Unsupported Result', { query: 'list from "books"', queryStart: 81, queryEnd: 81, resultEnd: -1 }],
    [GOOD_EXAMPLE, 'Mistaken user list', { query: 'list from "books"', queryStart: 89, queryEnd: 89, resultEnd: 92 }],
    [GOOD_EXAMPLE,   'Spaced user list', { query: 'list from "books"', queryStart: 94, queryEnd: 94, resultEnd: -1 }],
    [GOOD_EXAMPLE, 'Protected user list', { query: 'list from "books"', queryStart: 102, queryEnd: 102, resultEnd: -1 }],
]

//
//
//
// SPACED
// FOR
// EASIER
// NUMBERS
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
    [NO_END_EXAMPLE, 'Missing End', { query: 'list from "recipes"', queryStart: 1, queryEnd: 1, resultEnd: -1 }],
    [OVERLAP_EXAMPLE,    'Overlap', { query: 'list from "recipes"', queryStart: 1, queryEnd: 3, resultEnd: -1 }],
    [OVERLAP_EXAMPLE, 'No Overlap', { query: 'list from "books"', queryStart: 12, queryEnd: 12, resultEnd: 19 }],
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
    [NO_QUERY_EXAMPLE, 'Bad Naming Example', [4, 6, -1]],
    [NO_QUERY_EXAMPLE, 'Bad Spacing Example', [3, 3, -1]],
]
