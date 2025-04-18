# Settings

## General Settings

### `Log level`

By default **Log level** is set to `'WARN'` this prevents the package from over-logging into the user console.

Changing the **Log level** to `'INFO'` or `'DEBUG'` will print to the console valuable information of the inner-workings of the plugging, details about the persistence process of each comment query, etc.

### `Persist when the active leaf changes?`

It may be prefered in some cases to only persist the queries manually with the _HotKey_. This toggle allows to stop trying to persist comment queries when the active leaf changes.

### `Comment Header`

A list of names used to identify a _query-comment_ that should be persisted.

````md
## The next comments **ARE NOT** a _query-comment_

<!-- this a normal HTML comment -->

%% this is a normal Markdown comment %%

%%
this is a multiline comment
that is not a query
%%

## The next comments **ARE** _query-comments_

> Is assumed that `Comment Header` setting is set to `dataview,dv`

<!--dv LIST FROM "recipes" -->

%%dataview TASKS FROM "activities" %%

%%dv
// this is a DataviewJS multiline script that is also accepted
// **** with some restrictions

const tasks = dv.pages('"recipes"').file.tasks
return dv.markdownTaskList(tasks)
%%

````
