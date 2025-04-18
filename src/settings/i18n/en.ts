import { type Translations } from './types'

export const en: Translations = {
    learn: 'Learn more',
    //
    // * General Section
    pluginLogLevelName: 'Log level',
    pluginLogLevelDesc: [
        'Control the logs printed to the console. ',
        ['docs', 'log-level'],
    ],
    //
    commentHeaderName: 'Comment header',
    commentHeaderDesc: [
        'Comma-separated list of headers to identify a comment query. ',
        ['docs', 'comment-header'],
        ['br'],
        'Example: ',
        ['code', { text: '%%dataview <query-to-be-persisted> %%' }],
    ],
    commentHeaderHint: "like: 'dataview,dv'",
}
