import { LogLevel } from '@luis.bs/obsidian-fnc'

export interface DataviewPersisterSettings {
    /** Defines the minimun level to log while running. */
    plugin_level: keyof typeof LogLevel
    /** User defined identifier for comment DQLs. */
    comment_header: string
}
