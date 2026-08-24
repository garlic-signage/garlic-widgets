"use strict";

export class Translator {
    constructor(dictionary) {
        this.dictionary = dictionary;
    }

    labelsFor(language) {
        return this.dictionary[language] || this.dictionary.de;
    }
}
