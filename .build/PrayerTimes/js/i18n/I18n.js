/**
 * I18n for Prayer Times
 * Supports RTL languages like Arabic.
 */
export class I18n
{
    #translations;
    #lang;
    #rtlLanguages = ['ar', 'fa', 'he', 'ur'];

    constructor(translations, lang = 'en')
    {
        this.#translations = translations;
        this.#lang = translations[lang] ? lang : 'en';
    }

    get lang()
    {
        return this.#lang;
    }

    get isRtl()
    {
        return this.#rtlLanguages.includes(this.#lang);
    }

    t(key, vars = {})
    {
        const str = this.#translations[this.#lang]?.[key]
                 ?? this.#translations['en']?.[key]
                 ?? key;

        return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
    }

    setLang(lang)
    {
        if (this.#translations[lang])
        {
            this.#lang = lang;
            document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        }
    }
}
