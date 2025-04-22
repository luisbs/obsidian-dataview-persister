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
    onLeafChangeName: 'Persist when the active leaf changes?',
    onLeafChangeDesc:
        'Whether the comment queries should be persisted inmediatly when the active leaf changes.',
    //
    shortenLinksName: 'Shorten persisted links?',
    shortenLinksDesc:
        'Whether the vault-links on queries result should be shortened.',
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
