// Allow usage of global reference of the DataviewAPI
const PREAMBLE = `"use strict";
const dataview = app.plugins.plugins.dataview.api;
const dv = app.plugins.plugins.dataview.api;
`

/**
 * Similar to: https://github.com/blacksmithgu/obsidian-dataview/blob/master/src/api/inline-api.ts
 */
export function syncEval(script: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return (Function(PREAMBLE + script) as () => unknown)()
}

/**
 * Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
 *
 * Similar to: https://github.com/blacksmithgu/obsidian-dataview/blob/master/src/api/inline-api.ts
 */
export async function asyncEval(script: string): Promise<string | undefined> {
    if (script.includes('await')) {
        return syncEval('(async () => { ' + script + ' })()') as Promise<string>
    }
    return Promise.resolve(syncEval(script) as string)
}
