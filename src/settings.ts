import type { LogLevel } from '@luis.bs/obsidian-fnc/lib/logging/Logger'

export interface DataviewPersisterSettings {
    /** Defines the minimun level to log while running. */
    plugin_level: keyof typeof LogLevel
    /** User defined identifier for comment DQLs. */
    comment_header: string
}

export const DEFAULT_SETTINGS: DataviewPersisterSettings = {
    // * 'WARN' level to force the user to choose a lower level when is required
    // * this decition, prevents the console from been overpopulated by default
    plugin_level: 'WARN',
    //
    comment_header: 'dataview,dv',
}
