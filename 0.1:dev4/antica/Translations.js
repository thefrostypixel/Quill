/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

window.antica = window.antica || {};

antica.Translations = class Translations {
    static toKey = (key = "") => key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
    static escapeVarValue = (value = "") => value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n");

    #langs = [];
    get langs() {
        return this.#langs.slice();
    }
    set langs(langs) {
        this.#setLangs(langs);
    }
    setLangs = (langs = [navigator.languages, "en-US"]) => this.#setLangs(langs) || Promise.resolve();
    #setLangs = (langs, update = true) => {
        langs = [...new Set([langs].flat().filter(lang => typeof lang == "string" && lang))];
        if (!update || langs.length != this.#langs.length || langs.findIndex((lang, i) => lang != this.#langs[i]) > -1) {
            this.#langs = langs;
            if (update) {
                return this.#indexPromise.then(this.#loadLangs);
            }
        }
    };

    #dir = new URL("/langs", window.location.origin).href.replace(/\/$/, "");
    get dir() {
        return this.#dir;
    }
    set dir(dir) {
        this.#setDir(dir);
    }
    setDir = (dir = "/langs") => this.#setDir(dir) || Promise.resolve();
    #setDir = (dir, force = false) => {
        dir = typeof dir == "string" ? new URL(dir, window.location.origin).href.replace(/\/$/, "") : this.#dir;
        if (force || this.#dir != dir) {
            this.#dir = dir;
            if (!this.#indexPromiseResolve) {
                this.#indexPromise = new Promise(resolve => this.#indexPromiseResolve = resolve);
            }
            return fetch(`${this.dir}/index.json`).then(response => response.json()).then(index => {
                if (this.#indexPromiseResolve && this.#dir == dir) {
                    this.#indexPromiseResolve();
                    this.#indexPromiseResolve = undefined;
                    this.#primary = index.primary || {};
                    this.#codes = index.codes;
                    this.#loadedTranslations = {};
                    this.#translations = {};
                    return this.#loadLangs();
                }
            }).catch(error => {
                if (this.#indexPromiseResolve && this.#dir == dir) {
                    this.#indexPromiseResolve();
                    this.#indexPromiseResolve = undefined;
                }
                console.error(error);
            });
        }
    };

    #indexPromise = Promise.resolve();
    #indexPromiseResolve;
    #primary = {};
    #codes = {};
    #activeLang = lang => this.#primary[lang] ? `${lang}-${this.#primary[lang]}` : lang;
    getActiveLangs = () => this.#indexPromise.then(() => [...new Set(this.#langs.map(this.#activeLang))].filter(lang => this.#loadedTranslations[lang]));
    getAllLangs = () => this.#indexPromise.then(() => Object.assign({}, this.#codes));

    #allLoadedPromise = Promise.resolve();
    #allLoadedPromiseResolve;
    #loadedTranslations = {};
    #translations = {};
    missing = [];
    #loadLangs = () => {
        Object.keys(this.#loadedTranslations).filter(lang => this.#langs.map(this.#activeLang).indexOf(lang) < 0).forEach(lang => delete this.#loadedTranslations[lang]);
        this.#langs.map(this.#activeLang).filter(lang => this.#codes[lang] && !this.#loadedTranslations[lang]).forEach(lang => {
            if (!this.#allLoadedPromiseResolve) {
                this.#allLoadedPromise = new Promise(resolve => this.#allLoadedPromiseResolve = resolve);
            }
            let promise = this.#loadedTranslations[lang] = fetch(`${this.#dir}/${lang}`).then(response => response.text()).then(text => {
                if (promise == this.#loadedTranslations[lang]) {
                    this.#loadedTranslations[lang] = this.#parseLangFile(text);
                    if (!Object.values(this.#loadedTranslations).find(translations => translations instanceof Promise)) {
                        this.#allLoadedPromiseResolve();
                        this.#allLoadedPromiseResolve = undefined;
                    } else {
                        let langs = [...new Set(this.#langs.map(lang => this.#activeLang(lang)))];
                        let lastLoadedIndex = langs.findIndex(lang => !(this.#loadedTranslations[lang] instanceof Promise));
                        if (lastLoadedIndex < 0) {
                            lastLoadedIndex = langs.length;
                        }
                        this.#translations = Object.assign({}, this.#loadedTranslations[lang], this.#translations, ...langs.slice(0, lastLoadedIndex).map(lang => this.#loadedTranslations[lang]));
                        this.#elements.forEach(elem => elem.translated && this.#translateElement(elem.e));
                    }
                }
            }).catch(error => {
                if (promise == this.#loadedTranslations[lang] && !Object.values(this.#loadedTranslations).find(translations => translations instanceof Promise)) {
                    this.#allLoadedPromiseResolve();
                    this.#allLoadedPromiseResolve = undefined;
                }
                console.error(error);
            });
        });
        if (this.#allLoadedPromiseResolve && !Object.values(this.#loadedTranslations).find(translations => translations instanceof Promise)) {
            this.#allLoadedPromiseResolve();
            this.#allLoadedPromiseResolve = undefined;
        }
        return this.#allLoadedPromise.then(() => {
            this.#translations = Object.assign({}, ...[...new Set(this.#langs.map(lang => this.#loadedTranslations[this.#activeLang(lang)]))].filter(lang => lang).toReversed());
            this.missing = [];
            this.#elements.forEach(elem => elem.translated && this.#translateElement(elem.e));
        });
    };
    #parseLangFile = text => {
        let translations = {};
        let i = 0;
        let com = undefined;
        let key = "";
        let esc = false;
        let stack = [];
        while (i < text.length) {
            let c = text[i];
            if (com == "*") {
                if (c == "*" && text[i + 1] == "/") {
                    com = undefined;
                    i++;
                }
            } else if (com == "/") {
                if (c == "\n") {
                    com = undefined;
                }
            } else if (c == "\\" && !esc) {
                esc = true;
            } else if (!esc && c == "/" && (text[i + 1] == "/" || text[i + 1] == "*")) {
                com = text[++i];
                if (com == "/") {
                    if (stack.length > 0) {
                        let current = stack[stack.length - 1];
                        if (current.chunk.type) {
                            current.value.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        translations[key] = stack[0].value;
                    }
                    key = "";
                    stack = [];
                }
            } else {
                if (!stack.length) {
                    if (c == " ") {
                        if (key) {
                            stack.push({value: [], chunk: {}});
                        }
                    } else if (c == "\n") {
                        key = "";
                    } else {
                        key += c;
                    }
                } else {
                    let current = stack[stack.length - 1];
                    if (c == "\n") {
                        if (current.chunk.type) {
                            current.value.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        translations[key] = stack[0].value;
                        key = "";
                        stack = [];
                    } else if (c == "{" && !esc) {
                        if (current.chunk && current.chunk.type) {
                            current.value.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        current.chunk = {};
                        stack.push({value: [], chunk: {}});
                    } else if (c == "}" && !esc) {
                        if (stack.length > 1) {
                            if (current.chunk.type) {
                                current.value.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                            }
                            let parent = stack[stack.length - 2];
                            parent.value.push({type: "t", values: stack.pop().value});
                            parent.chunk = {};
                        } else {
                            if (!current.chunk || current.chunk.type != "text") {
                                if (current.chunk.type) {
                                    current.value.push(current.chunk);
                                }
                                current.chunk = {type: "text", value: ""};
                            }
                            current.chunk.value += c;
                        }
                    } else if (current.chunk.type == "text") {
                        if (c == "<" && !esc) {
                            current.value.push(current.chunk.value);
                            current.chunk = {type: "var", value: ""};
                        } else {
                            current.chunk.value += esc && c == "n" ? "\n" : esc && (c == "s" || c == " ") ? "\u00A0" : c;
                        }
                    } else if (current.chunk.type == "var") {
                        if (c == ">") {
                            current.value.push(current.chunk);
                            current.chunk = {};
                        } else {
                            current.chunk.value += c;
                        }
                    } else {
                        current.chunk = c == "<" && !esc ? {type: "var", value: ""} : {type: "text", value: esc && c == "n" ? "\n" : esc && (c == "s" || c == " ") ? "\u00A0" : c};
                    }
                }
                esc = false;
            }
            i++;
        }
        if (key && stack.length > 0) {
            let last = stack[stack.length - 1];
            if (last.chunk && last.chunk.type) {
                last.value.push(last.chunk.type == "text" ? last.chunk.value : last.chunk);
            }
            if (stack[0].value.length > 0) {
                translations[key] = stack[0].value;
            }
        }
        Object.values(translations).forEach(values => values.forEach((value, i) => typeof value == "string" && (values[i] = value.replace(/ {2,}/g, " "))));
        return translations;
    };
    translate = (key = "") => {
        key = key || "";
        let subTranslate = (str, stack) => {
            let ends = ["[", "]", ","];
            let i = Math.min(...ends.map(end => str.indexOf(end) > -1 ? str.indexOf(end) : str.length));
            let main = str.slice(0, i);
            let vars = {};
            if (str[i] == "[") {
                i++;
                while (str[i] && str[i] != "]") {
                    let key = "";
                    while (str[i] && str[i] != "]" && str[i] != "," && str[i] != ":") {
                        key += str[i++];
                    }
                    if (str[i] && str[i] != "]") {
                        if (str[i] == ",") {
                            i++;
                        } else {
                            while (str[i] == ":") {
                                i++;
                            }
                            if (str[i] == "\"") {
                                let value = "";
                                i++;
                                while (str[i] && str[i] != "\"") {
                                    if (str[i] == "\\") {
                                        if (str[++i]) {
                                            value += str[i] == "n" ? "\n" : str[i] == "s" || str[i] == " " ? " " : str[i];
                                        }
                                    } else {
                                        value += str[i];
                                    }
                                    i++;
                                }
                                vars[key] = value;
                            } else if (str[i] && str[i] != "]" && str[i] != ",") {
                                let sub = subTranslate(str.slice(i), stack);
                                vars[key] = sub.result;
                                i += Math.max(1, sub.i);
                            } else {
                                i++;
                            }
                        }
                    }
                }
            }
            if (!this.#translations[main]) {
                this.missing = [...new Set([...this.missing, main])];
            }
            if (stack.indexOf(main) > -1) {
                return {i, result: main};
            }
            let combine = values => values.map(c => c.type == "var" ? vars[c.value] ?? c.value : c.type == "t" ? subTranslate(combine(c.values), stack.concat(main)).result : c).join("");
            return {i, result: combine(this.#translations[main] ?? [main])};
        };
        return subTranslate(key, []).result;
    };

    #elements = [];
    #translateElement = e => [e, ...e.querySelectorAll("*")].forEach(e => [...e.attributes].forEach(a => {
        if (a.name == "t") {
            e.innerText = this.translate(e.getAttribute(a.name));
        } else if (!a.name.indexOf("t-")) {
            e.setAttribute(a.name.slice(2), this.translate(e.getAttribute(a.name)));
        }
    }));
    attachToElement = (e = document || document.body) => {
        let elem = {
            e,
            observer: new MutationObserver(mutations => mutations.forEach(mutation => {
                (mutation.addedNodes || []).forEach(e => e.nodeType == 1 && this.#translateElement(e));
                if (mutation.attributeName == "t") {
                    mutation.target.innerText = this.translate(mutation.target.getAttribute(mutation.attributeName));
                } else if (mutation.type == "attributes" && !mutation.attributeName.indexOf("t-")) {
                    mutation.target[mutation.target.hasAttribute(mutation.attributeName) ? "setAttribute" : "removeAttribute"](mutation.attributeName.slice(2), this.translate(mutation.target.getAttribute(mutation.attributeName)));
                }
            })),
        };
        this.#elements.push(elem);
        let observe = () => {
            this.#translateElement(elem.e = e == document ? e.body : e);
            elem.observer.observe(elem.e, {childList: true, subtree: true, attributes: true});
            elem.translated = true;
        };
        if (document.readyState == "interactive" || document.readyState == "complete") {
            observe();
        } else {
            requestAnimationFrame(observe);
        }
    };
    detachFromElement = (e = document || document.body) => {
        let elem = this.#elements.find(elem => elem.e == e || (e == document && elem.e == document.body || e == document.body && elem.e == document));
        if (elem) {
            elem.observer.disconnect();
            if (elem.translated) {
                let clear = e => {
                    if (e.hasAttribute("t")) {
                        e.innerText = "";
                    }
                    Object.values(e.attributes).forEach(attr => !attr.name.indexOf("t-") && e.removeAttribute(attr.name.slice(2)));
                    [...e.components].forEach(clear);
                };
                clear(elem.e);
            }
            this.#elements.splice(this.#elements.indexOf(elem), 1);
        }
    };

    get loaded() {
        return !this.#indexPromiseResolve && !this.#allLoadedPromiseResolve;
    }
    get promise() {
        return this.loaded ? Promise.resolve(this) : this.#indexPromise.then(() => this.#allLoadedPromise).then(() => this.promise);
    }

    constructor(langs = [navigator.languages, "en-US"], dir = "/lang") {
        this.#setLangs(langs, false);
        this.#setDir(dir, true);
    }
};
