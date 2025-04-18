import type { I18nSegments } from '@luis.bs/obsidian-fnc'

export type TranslationKeys = TextTranslation | FlexibleTranslation
export type Translations = Record<TextTranslation, string> &
    Record<FlexibleTranslation, string | I18nSegments>

type Name_Desc = 'Name' | 'Desc'
type true_false = boolean

/** Translations that REQUIRE to be strings */
export type TextTranslation =
    | 'learn'
    // * General Section
    | 'commentHeaderHint'

/** Translations that not require to be strings */
export type FlexibleTranslation =
    // * General Section
    `pluginLogLevel${Name_Desc}` | `commentHeader${Name_Desc}`
