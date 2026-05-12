/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Translations = class Translations {
    static toKey = (key = "") => key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").replace(/[_\s]+/g, "-").toLowerCase();
    static escapeVarValue = (value = "") => value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n");

    #index;
    #indexReady = false;
    #indexFailed = false;
    #indexResolve;
    #indexReject;
    #indexPromise = new Promise((resolve, reject) => {
        this.#indexResolve = resolve;
        this.#indexReject = reject;
    });
    #abort;
    #primary = Object.create(null);
    #available = Object.create(null);
    #lang = lang => this.#primary[lang] ? `${lang}-${this.#primary[lang]}` : lang;
    get index() {
        return this.#index;
    }
    set index(index) {
        let load = (parsed, path) => {
            try {
                this.#primary = Object.create(null);
                Object.entries(parsed.primary).forEach(([lang, reg]) => this.#primary[lang] = `${reg}`);
                this.#available = Object.create(null);
                Object.entries(parsed.langs).forEach(lang => {
                    this.#available[lang[0]] = {name: lang[1].name};
                    if (lang[1].translations) {
                        this.#available[lang[0]].translations = this.#parseTranslations(Object.create(null), lang[1].translations);
                    } else {
                        this.#available[lang[0]].path = new URL(lang[1].file, path).href;
                    }
                });
                this.#indexReady = true;
                this.#indexResolve(this);
                this.langs = this.langs;
            } catch (e) {
                this.#indexFailed = this.#failed = true;
                this.#indexReject(e);
                this.#reject(e);
            }
            return this;
        };
        this.#abort?.abort();
        this.#abort = new AbortController();
        Object.values(this.#available).forEach(lang => lang.abort?.abort());
        if (this.indexReady || this.indexFailed) {
            this.#indexReady = this.#indexFailed = false;
            this.#indexPromise = new Promise((resolve, reject) => {
                this.#indexResolve = resolve;
                this.#indexReject = reject;
            });
        }
        if (this.ready || this.failed) {
            this.#ready = this.#failed = false;
            this.#promise = new Promise((resolve, reject) => {
                this.#resolve = resolve;
                this.#reject = reject;
            });
        }
        try {
            let parsed = (this.#index = index) instanceof Object ? index : JSON.parse(index);
            load(parsed, window.location.origin);
        } catch (e) {
            let path = new URL(index, window.location.origin).href;
            fetch(path, {signal: this.#abort.signal}).then(r => r.json()).then(parsed => load(parsed, path)).catch(e => {
                this.#indexFailed = this.#failed = true;
                this.#indexReject(e);
                this.#reject(e);
            });
        }
    }
    get indexReady() {
        return this.#indexReady;
    }
    get indexFailed() {
        return this.#indexFailed;
    }
    get indexPromise() {
        return this.#indexPromise;
    }

    #langs = [];
    get langs() {
        return this.#langs.slice();
    }
    set langs(langs) {
        this.#langs = langs = Array.from(new Set([langs].flat(Infinity).filter(lang => typeof lang == "string" && lang)));
        if (this.#ready || this.#failed) {
            this.#ready = this.#failed = false;
            this.#promise = new Promise((resolve, reject) => {
                this.#resolve = resolve;
                this.#reject = reject;
            });
        }
        if (this.indexReady) {
            let active = this.activeLangs;
            Object.keys(this.#available).forEach(lang => {
                if (!active.includes(lang)) {
                    this.#available[lang].abort?.abort();
                }
            });
            let finish = () => {
                this.#translations = Object.assign({}, ...this.activeLangs.map(lang => this.#available[lang].translations).toReversed());
                this.#elements.forEach(elem => elem.translated && this.#translateElement(elem.e));
                this.#ready = true;
                this.#resolve(this);
            };
            let promises = active.map(this.#loadLang).filter(promise => promise);
            if (promises.length) {
                Promise.all(promises).then(() => {
                    if (this.#langs == langs) {
                        finish();
                    }
                }).catch(e => {
                    if (e.name != "AbortError") {
                        this.#failed = true;
                        this.#reject(e);
                    }
                });
            } else {
                finish();
            }
        }
    }
    get activeLangs() {
        return Array.from(new Set(this.#langs.map(this.#lang))).filter(lang => this.#available[lang]);
    }
    get activeLangsPromise() {
        return this.indexPromise.then(() => this.activeLangs);
    }
    get availableLangs() {
        return Object.fromEntries(Object.entries(this.#available).map(([code, lang]) => [code, lang.name]));
    }
    get availableLangsPromise() {
        return this.indexPromise.then(() => this.availableLangs);
    }

    #ready = false;
    #failed = false;
    #resolve;
    #reject;
    #promise = new Promise((resolve, reject) => {
        this.#resolve = resolve;
        this.#reject = reject;
    });
    get ready() {
        return this.#ready;
    }
    get failed() {
        return this.#failed;
    }
    get promise() {
        return this.#promise;
    }
    retry() {
        if (this.indexFailed) {
            this.index = this.index;
        } else if (this.failed) {
            this.langs = this.langs;
        }
        return this.promise;
    }

    #translations = Object.create(null);
    #loadLang = lang => {
        lang = this.#lang(lang);
        if (this.#available[lang]) {
            if (!this.#available[lang].translations) {
                let controller = new AbortController();
                this.#available[lang].translations = Object.create(null);
                this.#available[lang].promise = fetch(this.#available[lang].path, {signal: (this.#available[lang].abort = controller).signal}).then(r => r.text()).then(text => this.#parseTranslations(this.#available[lang].translations, text)).catch(e => {
                    delete this.#available[lang].translations;
                    throw e;
                }).finally(() => delete this.#available[lang].promise);
            }
            return this.#available[lang].promise;
        }
    };
    #parseTranslations = (translations, text) => {
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
                            current.values.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        translations[key] = stack[0].values;
                    }
                    key = "";
                    stack = [];
                }
            } else {
                if (!stack.length) {
                    if (c == " ") {
                        if (key) {
                            stack.push({values: [], chunk: {}});
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
                            current.values.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        translations[key] = stack[0].values;
                        key = "";
                        stack = [];
                    } else if (c == "{" && !esc) {
                        if (current.chunk && current.chunk.type) {
                            current.values.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                        }
                        current.chunk = {};
                        stack.push({values: [], chunk: {}});
                    } else if (c == "}" && !esc) {
                        if (stack.length > 1) {
                            if (current.chunk.type) {
                                current.values.push(current.chunk.type == "text" ? current.chunk.value : current.chunk);
                            }
                            let parent = stack[stack.length - 2];
                            parent.values.push({type: "t", values: stack.pop().values});
                            parent.chunk = {};
                        } else {
                            if (!current.chunk || current.chunk.type != "text") {
                                if (current.chunk.type) {
                                    current.values.push(current.chunk);
                                }
                                current.chunk = {type: "text", value: ""};
                            }
                            current.chunk.value += c;
                        }
                    } else if (current.chunk.type == "text") {
                        if (c == "<" && !esc) {
                            current.values.push(current.chunk.value);
                            current.chunk = {type: "var", value: ""};
                        } else {
                            current.chunk.value += esc && c == "n" ? "\n" : esc && (c == "s" || c == " ") ? "\u00A0" : c;
                        }
                    } else if (current.chunk.type == "var") {
                        if (c == ">") {
                            current.values.push(current.chunk);
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
                last.values.push(last.chunk.type == "text" ? last.chunk.value : last.chunk);
            }
            if (stack[0].values.length > 0) {
                translations[key] = stack[0].values;
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
                this.#missing.add(main);
            }
            if (stack.indexOf(main) > -1) {
                return {i, result: main};
            }
            let combine = values => values.map(c => c.type == "var" ? vars[c.value] ?? c.value : c.type == "t" ? subTranslate(combine(c.values), stack.concat(main)).result : c).join("");
            return {i, result: combine(this.#translations[main] ?? [main])};
        };
        return subTranslate(key, []).result;
    };
    translatePromise = (key = "" ?? Promise.resolve("")) => {
        if (key instanceof Promise) {
            return key.then(this.translatePromise);
        } else {
            return this.promise.then(() => this.translate(key));
        }
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
                    [...e.children].forEach(clear);
                };
                clear(elem.e);
            }
            this.#elements.splice(this.#elements.indexOf(elem), 1);
        }
    };

    #missing = new Set();
    get missing() {
        return Array.from(this.#missing);
    }
    clearMissing() {
        this.#missing.clear();
    }

    clear() {
        this.#index = undefined;
        this.#indexReady = this.#indexFailed = false;
        this.#indexPromise = new Promise((resolve, reject) => {
            this.#indexResolve = resolve;
            this.#indexReject = reject;
        });
        this.#abort?.abort();
        Object.values(this.#available).forEach(lang => lang.abort?.abort());
        this.#primary = Object.create(null);
        this.#available = Object.create(null);
        this.#langs = [];
        this.#ready = this.#failed = false;
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
        this.#translations = Object.create(null);
        this.#elements.forEach(elem => this.detachFromElement(elem.e));
    }

    constructor(index = {primary: {"en": "US"}, langs: {"en-US": {name: "English (United States)", translations: "", file: ""}}}, langs = [...navigator.languages, "en-US"]) {
        this.index = index;
        this.langs = langs;
    }
};
