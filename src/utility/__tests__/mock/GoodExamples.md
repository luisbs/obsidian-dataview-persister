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

## List Example

%%dv list from "books" %%

- The hobbit
  - The hobbit Screenplay
- Lord of the rings
    - The two towers

## Task Example

%%dv task from "books" %%

- [ ] Task 1
- [x] Task 2
  - [x] Subtask 2.1
  - [x] Subtask 2.2

## Table Example

%%dv table from "books" %%

| Author       | Title             |
| ------------ | ----------------- |
| J.R. Tolkien | The hobbit        |
| J.R. Tolkien | Lord of the rings |

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

## Forced Example

%%dv list from "books" %%

<!--dv-start KEEP THIS COMMENT -->

Usually will contain Dataview error messages

<!--dv-end KEEP THIS COMMENT -->

---
# Problematic Examples

## Unsupported Example

%%dv list from "books" %%

I think Dataview doesn't generate something like this,
so this behavior even if there are not blanklines inside the paragraph,
is ignored since it could lead the plugin to replace a user written content.

## User written list Example

%%dv list from "books" %%

- if the user writes a list directly after a comment query,
- it will be replaced by the plugin at least in the first run

%%dv list from "books" %%


- technically a double blankline, solves it
- it avoids the list to be identified as the result of the query
- but the double blankline may be reduced to one
- if the user uses some kind of formatter

%%dv list from "books" %%

<!--  -->

- the avoid upper behavior, an avoid the list from be mistaken
- any element different to a list can be placed before the list, ex:
  - `<!--  -->` HTML comment
  - `%% %%` Markdown comment
  - `---` Markdown section separator
  - any other element different from a markdown list like `- element`
