import { CommentQuery } from '@/utility/queries'

type QuerySpec = [string[], string, CommentQuery]
type NoQuerySpec = [string[], string, number[]]

// SPACED
// FOR
// EASIER
// NUMBERS
export const GOOD_EXAMPLE = `
# Simple Examples

## Line Query Example
%%dv list from "books" %%
- The hobbit
- Lord of the rings

## Block Query Example
%%dv
list from "books"
%%
- The hobbit
- Lord of the rings

---
# Query Types Examples

> Next case works for formatters that adds spaces between elements

## Table Example
%%dv list from "books" %%

| Author       | Title             |
| ------------ | ----------------- |
| J.R. Tolkien | The hobbit        |
| J.R. Tolkien | Lord of the rings |

## List Example
%%dv list from "books" %%

- The hobbit
  - The hobbit Screenplay
- Lord of the rings
    - The two towers

---
# Complex Examples

## Spaced Example
%%dv list from "books" %%

<!--dv-start KEEP THIS COMMENT -->

### List of books

- The hobbit
- Lord of the rings

- Thrid element
- Fourth element

<!--dv-end KEEP THIS COMMENT -->
`.split('\n')

// prettier-ignore
export const GOOD_QUERIES: QuerySpec[] = [
    [GOOD_EXAMPLE,    'Line Query', { query: 'list from "books"', queryStart: 4, queryEnd: 4, resultEnd: 6 }],
    [GOOD_EXAMPLE,   'Block Query', { query: 'list from "books"', queryStart: 9, queryEnd: 11, resultEnd: 13 }],
    [GOOD_EXAMPLE,  'Table Result', { query: 'list from "books"', queryStart: 21, queryEnd: 21, resultEnd: 26 }],
    [GOOD_EXAMPLE,   'List Result', { query: 'list from "books"', queryStart: 29, queryEnd: 29, resultEnd: 34 }],
    [GOOD_EXAMPLE, 'Spaced Result', { query: 'list from "books"', queryStart: 40, queryEnd: 40, resultEnd: 52 }],
]

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
