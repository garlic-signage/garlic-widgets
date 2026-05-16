/**
 * I18n
 * Loads language resources and returns translated strings.
 * Falls back to 'en' if a key is missing in the selected language.
 */
export class I18n {

    /**
     * @param {Object} translations - { de: {...}, en: {...} }
     * @param {string} lang         - Language code (e.g. 'de', 'en')
     */
    constructor(translations, lang = 'en') {
        this.translations = translations;
        this.lang         = translations[lang] ? lang : 'en';
    }

    /**
     * Get a translated string. Supports placeholders:
     * t('greeting', { name: 'World' }) with "Hello {{name}}" → "Hello World"
     * @param {string} key
     * @param {Object} [vars]
     * @returns {string}
     */
    t(key, vars = {}) {
        const str = this.translations[this.lang]?.[key]
                 ?? this.translations['en']?.[key]
                 ?? key;

        return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    }

    /**
     * Change language at runtime.
     * @param {string} lang
     */
    setLang(lang) {
        if (this.translations[lang]) {
            this.lang = lang;
        } else {
            console.warn(`I18n: Language "${lang}" not available, staying with "${this.lang}".`);
        }
    }
}
