import { type Translations } from './types'

export const en: Translations = {
    learn: 'Learn more',
    valueMayNotBeEmpty: 'A value is required.',
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
        'Comma-separated list of headers to identify a comment query. Use it as: ',
        ['code', { text: '%%dv <query-to-be-persisted> %%' }],
        ['br'],
        ['docs', 'comment-header'],
    ],
    commentHeaderHint: "like: 'dataview,dv'",
}
