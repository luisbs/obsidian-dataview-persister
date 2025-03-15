import { CommentQuery } from '@/utility/queries'

// prettier-ignore
export const GOOD_QUERIES: Array<[string, number[], CommentQuery]> = [
    [ 'Line Query Example', [ 4,  4,  6], { query: 'list from "books"', queryStart: 4, queryEnd: 4, resultEnd: 6 }],
    ['Block Query Example', [ 9, 11, 13], { query: 'list from "books"', queryStart: 9, queryEnd: 11, resultEnd: 13 }],
    [      'Table Example', [21, 21, 26], { query: 'list from "books"', queryStart: 21, queryEnd: 21, resultEnd: 26 }],
    [       'List Example', [29, 29, 34], { query: 'list from "books"', queryStart: 29, queryEnd: 29, resultEnd: 34 }],
    [     'Spaced Example', [40, 40, 52], { query: 'list from "books"', queryStart: 40, queryEnd: 40, resultEnd: 52 }],
]

//
//
//
//
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
// prettier-ignore
export const NO_END_QUERIES: Array<[string, number[], CommentQuery]> = [
    ['No end Example', [1, 1, -1], { query: 'list from "recipes"', queryStart: 1, queryEnd: 1, resultEnd: -1 }],
]

export const NO_END_EXAMPLE = `
%%dv list from "recipes" %%

<!--dv-start KEEP THIS COMMENT -->

- Hot Water
- Water Soup

`.split('\n')

// SPACED
// FOR
// EASIER
// NUMBERS
// prettier-ignore
export const OVERLAP_QUERIES: Array<[string, number[], CommentQuery]> = [
    [   'Overlap Example', [ 1,  1, -1], { query: 'list from "recipes"', queryStart: 1, queryEnd: 3, resultEnd: -1 }],
    ['No Overlap Example', [12, 12, 19], { query: 'list from "books"', queryStart: 12, queryEnd: 12, resultEnd: 19 }],
]

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

export const NO_QUERY_EXAMPLE = `
# This query doesn't include any valid query

%%dvlist from "recipes" %%
%%da
list from "recipes"
%%
`.split('\n')

//
type QuerySpec = Array<[string[], string, number[], CommentQuery]>
export const ALL_QUERIES: QuerySpec = [
    ...(GOOD_QUERIES.map((v) => [GOOD_EXAMPLE, ...v]) as QuerySpec),
    ...(NO_END_QUERIES.map((v) => [NO_END_EXAMPLE, ...v]) as QuerySpec),
    ...(OVERLAP_QUERIES.map((v) => [OVERLAP_EXAMPLE, ...v]) as QuerySpec),
]
