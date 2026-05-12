/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

window.antica = window.antica || {};

antica.DOMUtils = class $Element {
    #elements = [];

    get raw() {
        return this.#elements[0];
    }
    get rawList() {
        return [...this.#elements];
    }
    rawGet(property) {
        return this.#elements.reduce((value, e) => e[property] ?? value, undefined);
    }
    rawSet(property, value) {
        this.#elements.forEach(e => e[property] = value);
        return this;
    }
    rawCall(name, ...args) {
        this.#elements.forEach(e => e[name](...args));
        return this;
    }

    constructor(...elements) {
        this.#elements = [...new Set(elements.flat(Infinity).map(e => e instanceof antica.DOMUtils || e == $ ? e.rawList  : e == window || e == document || e == document.children[0] ? document.body : e instanceof Element && !document.head.contains(e) ? e : undefined).flat(Infinity).filter(e => e))];
    }

    select(selector) {
        let newElements = new Set();
        this.#elements.forEach(e => e.querySelectorAll(selector).forEach(e => newElements.add(e)));
        return new antica.DOMUtils(...newElements);
    }
    matches(selector) {
        return this.#elements.every(e => e.matches(selector));
    }
    matching(selector) {
        return new antica.DOMUtils(this.#elements.filter(e => e.matches(selector)));
    }

    get count() {
        return this.#elements.length;
    }
    get exists() {
        return !!this.#elements.length;
    }
    get first() {
        return new antica.DOMUtils(this.#elements.at(0));
    }
    get last() {
        return new antica.DOMUtils(this.#elements.at(-1));
    }
    at(index) {
        return new antica.DOMUtils(this.#elements.at(index));
    }
    slice(start, end) {
        return new antica.DOMUtils(this.#elements.slice(start, end));
    }
    concat(...elements) {
        return new antica.DOMUtils(...this.#elements, ...elements);
    }
    every(callbackFn) {
        return this.#elements.every((e, i) => callbackFn(new antica.DOMUtils(e), i, this));
    }
    some(callbackFn) {
        return this.#elements.some((e, i) => callbackFn(new antica.DOMUtils(e), i, this));
    }
    includes(searchElement, fromIndex) {
        if (searchElement instanceof antica.DOMUtils || searchElement == $) {
            return searchElement.rawList.every(s => this.#elements.slice(fromIndex).some(e => e == s));
        }
        return this.#elements.slice(fromIndex).some(e => e == searchElement);
    }
    find(callbackFn) {
        return new antica.DOMUtils(this.#elements.find((e, i) => callbackFn(new antica.DOMUtils(e), i, this)));
    }
    findIndex(callbackFn) {
        return this.#elements.findIndex((e, i) => callbackFn(new antica.DOMUtils(e), i, this));
    }
    indexOf(searchElement, fromIndex) {
        let index = this.#elements.slice(fromIndex).indexOf(searchElement instanceof antica.DOMUtils || searchElement == $ ? searchElement.raw : searchElement);
        return index < 0 ? -1 : index + (fromIndex ?? 0);
    }
    forEach(callbackFn) {
        this.#elements.forEach((e, i) => callbackFn(new antica.DOMUtils(e), i, this));
        return this;
    }
    map(callbackFn) {
        let array = this.#elements.map((e, i) => callbackFn(new antica.DOMUtils(e), i, this));
        if (array.every(e => e instanceof antica.DOMUtils || e instanceof Element)) {
            return new antica.DOMUtils(array);
        }
        return array;
    }
    filter(callbackFn) {
        return new antica.DOMUtils(this.#elements.filter((e, i) => callbackFn(new antica.DOMUtils(e), i, this)));
    }
    reduce(callbackFn, initialValue) {
        return this.#elements.reduce((a, e, i) => callbackFn(a, new antica.DOMUtils(e), i, this), initialValue);
    }
    quals(other) {
        other = (other instanceof Array ? other.flat(Infinity) : [other]).map(o => o instanceof antica.DOMUtils || o == $ ? o.rawList : o).flat(Infinity);
        return this.count == other.length && other.every(e => this.#elements.includes(e));
    }

    get connected() {
        return this.#elements.every(e => {
            if (e.isConnected) {
                while (e && e != document.body) {
                    e = e.parentNode;
                }
                return e;
            }
        });
    }
    get outer() {
        return this.filter(e => !this.some(o => o.raw != e.raw && o.contains(e)));
    }
    get ancestors() {
        let elements = this.#elements.map(e => {
            let ancestors = [e];
            while (e.parentNode && e != document.body) {
                ancestors.unshift(e = e.parentNode);
            }
            return ancestors;
        }).reverse();
        let ancestors = new Set();
        while (elements.length) {
            elements.forEach(e => ancestors.add(e.shift()));
            elements = elements.filter(e => e.length);
        }
        return new antica.DOMUtils([...ancestors].reverse());
    }
    get parent() {
        let parents = new Set();
        this.#elements.forEach(e => parents.add(e.parentNode));
        return new antica.DOMUtils(...parents);
    }
    set parent(parent) {
        if (parent) {
            this.#elements.forEach(e => (parent instanceof antica.DOMUtils || parent == $ ? parent.raw : parent instanceof Array ? parent[0] : parent).appendChild(e));
        } else {
            this.delete();
        }
    }
    setParent(parent) {
        this.parent = parent;
        return this;
    }
    closest(selector) {
        let closest = new Set();
        this.#elements.forEach(e => closest.add(e.closest(selector)));
        return new antica.DOMUtils(...closest);
    }
    delete() {
        this.#elements.forEach(e => e.remove());
    }

    get children() {
        let children = new Set();
        this.#elements.forEach(e => [...e.children].forEach(c => children.add(c)));
        return new antica.DOMUtils(...children);
    }
    set children(children) {
        this.html = "";
        return this.add(children);
    }
    get childNodes() {
        let childNodes = new Set();
        this.#elements.forEach(e => [...e.childNodes].forEach(c => childNodes.add(c)));
        return new antica.DOMUtils(...childNodes);
    }
    set childNodes(childNodes) {
        this.html = "";
        return this.add(childNodes);
    }
    add(...children) {
        if (this.#elements.length) {
            children.flat(Infinity).map(child => child instanceof antica.DOMUtils ? child.rawList : child).flat(Infinity).filter(child => child).forEach(c => this.#elements[0].appendChild(typeof c == "string" ? document.createTextNode(c) : c));
        }
        return this;
    }
    insert(child, index) {
        if (this.#elements.length) {
            child = child instanceof antica.DOMUtils ? child.#elements : child instanceof Node ? [child] : child;
            index = index instanceof antica.DOMUtils ? index.#elements : index;
            index = index instanceof Array ? [...this.#elements[0].children].findIndex(e => index.includes(e)) : index instanceof Node ? [...this.#elements[0].children].indexOf(index) : index;
            index = index < 0 ? Infinity : index;
            child.forEach(c => this.#elements[0].insertBefore(typeof c == "string" ? document.createTextNode(c) : c, this.#elements[0].children[index++] || null));
        }
        return this;
    }
    insertNode(child, index) {
        if (this.#elements.length) {
            child = child instanceof antica.DOMUtils ? child.#elements : child instanceof Node ? [child] : child;
            index = index instanceof antica.DOMUtils ? index.#elements : index;
            index = index instanceof Array ? [...this.#elements[0].childNodes].findIndex(e => index.includes(e)) : index instanceof Node ? [...this.#elements[0].childNodes].indexOf(index) : index;
            index = index < 0 ? Infinity : index;
            child.forEach(c => this.#elements[0].insertBefore(typeof c == "string" ? document.createTextNode(c) : c, this.#elements[0].childNodes[index++] || null));
        }
        return this;
    }
    contains(...elements) {
        return !elements.flat(Infinity).map(e => e instanceof antica.DOMUtils ? e.#elements : e).flat(Infinity).some(e => !this.#elements.some(o => o.contains(e)));
    }
    clone(count) {
        let elements = [];
        for (let i = 0; i < count ?? 1; i++) {
            this.#elements.forEach(e => elements.push(e.cloneNode(true)));
        }
        return new antica.DOMUtils(elements);
    }
    empty() {
        this.#elements.forEach(e => e.innerHTML = "");
        return this;
    }

    get siblings() {
        let siblings = new Set();
        this.#elements.forEach(e => [...e.parentNode.children].forEach(s => siblings.add(s)));
        return new antica.DOMUtils(...siblings);
    }
    get siblingNodes() {
        let siblings = new Set();
        this.#elements.forEach(e => [...e.parentNode.childNodes].forEach(s => siblings.add(s)));
        return new antica.DOMUtils(...siblings);
    }
    get otherSiblings() {
        let siblings = new Set();
        this.#elements.forEach(e => [...e.parentNode.children].forEach(s => !this.#elements.includes(s) && siblings.add(s)));
        return new antica.DOMUtils(...siblings);
    }
    get otherSiblingNodes() {
        let siblings = new Set();
        this.#elements.forEach(e => [...e.parentNode.childNodes].forEach(s => !this.#elements.includes(s) && siblings.add(s)));
        return new antica.DOMUtils(...siblings);
    }

    get tag() {
        return this.#elements[0]?.tagName?.toLowerCase();
    }
    get tags() {
        let tags = new Set();
        this.#elements.forEach(e => tags.add(e.tagName.toLowerCase()));
        return [...tags];
    }
    get outerHtml() {
        return this.outer.#elements.map(e => e.outerHTML).join("");
    }
    get html() {
        return this.outer.#elements.map(e => e.innerHTML).join("");
    }
    set html(html) {
        this.outer.#elements.forEach(e => e.innerHTML = `${html}`);
        return this;
    }
    get text() {
        return this.outer.#elements.map(e => e.innerText).join("").replace(/[^\S\n]/g, " ");
    }
    set text(text) {
        this.outer.#elements.forEach(e => e.innerText = `${text}`.replace(/(?<=(?:^|[^ ]) (?:  )*) /g, "\u00A0"));
        return this;
    }

    get id() {
        return this.#elements.find(e => e.id)?.id;
    }
    set id(id) {
        if (id) {
            this.#elements.forEach(e => e.id = id);
        } else {
            this.#elements.forEach(e => e.removeAttribute("id"));
        }
    }
    setId(id) {
        this.id = id;
        return this;
    }

    get classes() {
        let classes = new Set();
        this.#elements.forEach(e => e.classList.forEach(c => classes.add(c)));
        return [...classes];
    }
    set classes(classes) {
        if ([classes].flat(Infinity).length) {
            this.#elements.forEach(e => e.className = [classes].flat(Infinity).join(" "));
        } else {
            this.#elements.forEach(e => e.removeAttribute("class"));
        }
    }
    setClasses(...classes) {
        this.classes = classes.flat(Infinity);
        return this;
    }
    addClass(...classes) {
        classes.flat(Infinity).forEach(c => this.#elements.forEach(e => e.classList.add(c)));
        return this;
    }
    removeClass(...classes) {
        classes.flat(Infinity).forEach(c => this.#elements.forEach(e => e.classList.remove(c)));
        this.#elements.forEach(e => !e.classList.length && e.removeAttribute("class"));
        return this;
    }

    #attributes = new Proxy({}, {
        get: (_, property) => {
            for (let e of this.#elements) {
                if (e.hasAttribute(property)) {
                    return e.getAttribute(property) || true;
                }
            }
        },
        set: (_, property, value) => {
            if (typeof value == "string" || typeof value == "number") {
                this.#elements.forEach(e => e.setAttribute(property, value));
            } else if (value == true) {
                this.#elements.forEach(e => e.setAttribute(property, ""));
            } else {
                this.#elements.forEach(e => e.removeAttribute(property));
            }
            return true;
        },
        has: (_, property) => isNaN(property) && this.#elements.some(e => property in e.attributes),
        ownKeys: () => {
            let keys = new Set();
            this.#elements.forEach(e => Object.entries(e.attributes).forEach(([key, value]) => !isNaN(key) && keys.add(value)));
            return [...keys];
        },
        getOwnPropertyDescriptor: (_, property) => property in this.#attributes ? {value: this.#attributes[property], writable: true, enumerable: true, configurable: true} : undefined,
    });
    get attributes() {
        return this.#attributes;
    }
    set(...attributes) {
        attributes.flat(Infinity).forEach(attribute => {
            if (typeof attribute == "string") {
                this.#elements.forEach(e => e.setAttribute(attribute.replace(/[A-Z]/g, "-$&").toLowerCase(), ""));
            } else if (attribute instanceof Object) {
                Object.entries(attribute).forEach(([attribute, value]) => {
                    attribute = attribute.replace(/[A-Z]/g, "-$&").toLowerCase();
                    this.#elements.forEach(e => {
                        if (attribute in e && typeof e[attribute] != "function" && 0) { // TODO Make Quill UI work with this.
                            console.log(e, attribute, value);
                            e[attribute] = value;
                        } else if (typeof value == "string" || typeof value == "number") {
                            e.setAttribute(attribute, value);
                        } else if (value == true) {
                            e.setAttribute(attribute, "");
                        } else if (value instanceof Array) {
                            e.setAttribute(attribute, value.flat(Infinity).join(" "));
                        } else if (value instanceof Object) {
                            e.setAttribute(attribute, JSON.stringify(value));
                        } else {
                            e.removeAttribute(attribute);
                        }
                    });
                });
            }
        });
        return this;
    } // TODO Replace all uses of "-" with capital letters in uses of this function.
    get(attribute) {
        if (attribute instanceof Array) {
            return attribute.map(attribute => this.get(attribute));
        } else {
            return this.#attributes[attribute.replace(/[A-Z]/g, "-$&").toLowerCase()];
        }
    }
    remove(...attributes) {
        return this.set(Object.fromEntries(attributes.flat(Infinity).map(attribute => [attribute, false])));
    }
    toggle(...attributes) {
        attributes.flat(Infinity).forEach(attribute => this.set(attribute, !this.get(attribute)));
        return this;
    }

    setField(...fields) {
        fields.flat(Infinity).forEach(field => Object.entries(field).forEach(([field, value]) => this.#elements.forEach(e => e[field] = value)));
        return this;
    }
    getField(field) {
        if (field instanceof Array) {
            return field.map(field => this.getField(field));
        } else {
            return this.#elements.reduce((value, e) => value ?? e[field], undefined);
        }
    }

    static #cssPropertyName(property) {
        return property.replace(/[A-Z]/g, "-$&").replace(/^\$/, "--").toLowerCase();
    }
    #styles = new Proxy({}, {
        get: (_, property) => {
            for (let e of this.#elements) {
                if (getComputedStyle(e).getPropertyValue($Element.#cssPropertyName(property))) {
                    return getComputedStyle(e).getPropertyValue($Element.#cssPropertyName(property));
                }
            }
        },
        set: (_, property, value) => {
            this.#elements.forEach(e => {
                e.getAnimations().forEach(e => e.effect.getKeyframes()[0]?.[$Element.#cssPropertyName(property)] != undefined && e.cancel());
                e.style.setProperty($Element.#cssPropertyName(property), value === false || value == undefined ? "" : `${value}`);
                if (!e.getAttribute("style")) {
                    e.removeAttribute("style");
                }
            });
            return true;
        },
        has: (_, property) => this.#elements.some(e => getComputedStyle(e).getPropertyValue($Element.#cssPropertyName(property))),
        ownKeys: () => {
            let keys = new Set();
            this.#elements.forEach(e => Object.keys(getComputedStyle(e)).forEach(key => isNaN(key) && keys.add(key)));
            return [...keys];
        },
        getOwnPropertyDescriptor: (_, property) => property in this.#styles ? {value: this.#styles[property], writable: true, enumerable: true, configurable: true} : undefined,
    });
    get styles() {
        return this.#styles;
    }
    get stylesMap() {
        return Object.fromEntries(Object.entries(this.styles));
    }
    get animations() {
        let animations = {};
        this.#elements.forEach(e => e.getAnimations().forEach(a => Object.keys(a.effect.getKeyframes()[0]).forEach(property => {
            if (!["composite", "computedOffset", "easing", "offset"].includes(property)) {
                animations[property] = {
                    progress: a.overallProgress,
                    duration: a.effect.getTiming().duration,
                    start: a.startTime ?? performance.now(),
                    now: (a.startTime ?? performance.now()) + a.effect.getTiming().duration * a.overallProgress,
                    end: (a.startTime ?? performance.now()) + a.effect.getTiming().duration,
                    passed: a.effect.getTiming().duration * a.overallProgress,
                    remaining: a.effect.getTiming().duration * (1 - a.overallProgress),
                    // TODO Make all of the above for the total animation instead of per iteration and add their current versions prefixed with "iteration".
                    timing: a.effect.getTiming().easing,
                    done: a.playState != "running",
                    donePromise: new Promise(resolve => a.finished.then(() => resolve(this)).catch(() => resolve(this))),
                    values: a.effect.getKeyframes().map(f => ({pos: f.computedOffset, value: f[property]})),
                    onFrame: callbackFn => {
                        let call = () => {
                            callbackFn(this);
                            if (a.playState == "running") {
                                requestAnimationFrame(() => call());
                            }
                        };
                        call();
                    },
                };
            }
        })));
        return animations;
    } // TODO Add iterations support, add option to cancel (to start, end or current).
    style(style, duration, timing) {
        if (typeof duration == "string") {
            if (isNaN(duration)) {
                let match = duration.trim().match(/^([\d.]+)\s*(ns|µs|us|ms|s|m|h|d)$/i);
                duration = match && +match[1] * {ns: 1e-6, µs: 1e-3, us: 1e-3, ms: 1e0, s: 1e3, m: 60e3, h: 3600e3, d: 86400e3}[match[2].toLowerCase()] || 0;
            } else {
                duration = +duration;
            }
        }
        this.#elements.forEach(e => Object.entries(style).forEach(([property, value]) => {
            property = $Element.#cssPropertyName(property);
            let currentValue = duration && getComputedStyle(e).getPropertyValue(property);
            e.style.setProperty(property, "");
            if (duration != undefined && duration !== false) {
                e.getAnimations().forEach(e => e.effect.getKeyframes()[0]?.[property] != undefined && e.cancel());
            }
            let defaultValue = duration && getComputedStyle(e).getPropertyValue(property);
            let targetValue = value instanceof Array ? value.flat(Infinity).at(-1) : value;
            e.style.setProperty(property, targetValue === false || targetValue == undefined ? "" : `${targetValue}`);
            if (!e.getAttribute("style")) {
                e.removeAttribute("style");
            }
            if (duration != undefined && duration !== false) {
                e.getAnimations().forEach(e => e.effect.getKeyframes()[0]?.[property] != undefined && e.cancel());
                if (duration) {
                    e.animate({[property]: value instanceof Array ? value.flat(Infinity).map(value => value === false || value == undefined || value === "" ? defaultValue : value) : [currentValue, value === false || value == undefined || value === "" ? defaultValue : value]}, {duration, easing: timing ?? "ease"});
                }
            }
        }));
        return this;
    } // TODO Replace all uses of "-" with capital letters in uses of this function.
    removeStyle(...properties) {
        if (properties.length) {
            properties.flat(Infinity).forEach(key => this.style({[key]: ""}, 0));
        } else {
            this.#elements.forEach(e => e.removeAttribute("style"));
        }
        return this;
    }
    forceStyle() {
        this.#elements.forEach(e => e.offsetHeight);
        return this;
    } // TODO Figure out if this is still needed and just make style() or styles auto force?
    editStyleTransition(style) {
        this.#elements.forEach(e => Object.entries(style).forEach(([property, value]) => {
            property = $Element.#cssPropertyName(property);
            let animations = e.getAnimations().filter(e => property in e.effect.getKeyframes()[0]);
            while (animations.length > 2) {
                animations.shift().cancel();
            }
            if (animations.length) {
                let currentValue = getComputedStyle(e).getPropertyValue(property);
                let effect = animations[0].effect;
                animations[0].effect = null;
                e.style.setProperty(property, "");
                let defaultValue = getComputedStyle(e).getPropertyValue(property);
                effect.setKeyframes({[property]: value instanceof Array ? value.flat(Infinity).map(value => value === false || value == undefined || value === "" ? defaultValue : value) : [currentValue, value === false || value == undefined || value === "" ? defaultValue : value]});
                animations[0].effect = effect;
            }
            let targetValue = value instanceof Array ? value.flat(Infinity).at(-1) : value;
            e.style.setProperty(property, targetValue === false || targetValue == undefined ? "" : `${targetValue}`);
            if (!e.getAttribute("style")) {
                e.removeAttribute("style");
            }
        }));
    }
    animate(style, duration, timing, iterations) {
        this.#elements.forEach(e => e.animate(style, {duration, easing: timing ?? "ease", iterations: iterations ?? 1}));
        return this;
    }

    get bounds() {
        let elements = this.#elements;
        return new class {
            get x() {
                return Math.round(elements.reduce((x, e) => Math.min(x, e.getBoundingClientRect().x), Infinity));
            }
            get y() {
                return Math.round(elements.reduce((y, e) => Math.min(y, e.getBoundingClientRect().y), Infinity));
            }
            get width() {
                return Math.round(elements.reduce((width, e) => Math.max(width, e.getBoundingClientRect().width), 0));
            }
            get height() {
                return Math.round(elements.reduce((height, e) => Math.max(height, e.getBoundingClientRect().height), 0));
            }
            get left() {
                return this.x;
            }
            get right() {
                return this.x + this.width;
            }
            get top() {
                return this.y;
            }
            get bottom() {
                return this.y + this.height;
            }
            get leftSpace() {
                return this.x;
            }
            get rightSpace() {
                return window.innerWidth - this.x - this.width;
            }
            get topSpace() {
                return this.y;
            }
            get bottomSpace() {
                return window.innerHeight - this.y - this.height;
            }
        }();
    }
    get scroll() {
        let bounds = this.bounds;
        let elements = this.#elements;
        return new class {
            get x() {
                return elements.reduce((x, e) => Math.min(x, e.scrollLeft), Infinity);
            }
            set x(x) {
                if (!isNaN(x)) {
                    elements.forEach(e => e.scrollLeft = +x);
                }
            }
            get y() {
                return elements.reduce((y, e) => Math.min(y, e.scrollTop), Infinity);
            }
            set y(y) {
                if (!isNaN(y)) {
                    elements.forEach(e => e.scrollTop = +y);
                }
            }
            get width() {
                return Math.round(elements.reduce((width, e) => Math.max(width, e.scrollWidth), 0));
            }
            get height() {
                return Math.round(elements.reduce((height, e) => Math.max(height, e.scrollHeight), 0));
            }
            get left() {
                return this.x;
            }
            set left(left) {
                this.x = left;
            }
            get right() {
                return this.x + bounds.width;
            }
            set right(right) {
                this.x = right - bounds.width;
            }
            get top() {
                return this.y;
            }
            set top(top) {
                this.y = top;
            }
            get bottom() {
                return this.y + bounds.height;
            }
            set bottom(bottom) {
                this.y = bottom - bounds.height;
            }
            get leftOverflow() {
                return this.x;
            }
            set leftOverflow(leftOverflow) {
                this.x = leftOverflow;
            }
            get rightOverflow() {
                return this.width - this.x - bounds.width;
            }
            set rightOverflow(rightOverflow) {
                return this.x = this.width - bounds.width - rightOverflow;
            }
            get topOverflow() {
                return this.y;
            }
            set topOverflow(topOverflow) {
                this.y = topOverflow;
            }
            get bottomOverflow() {
                return this.height - this.y - bounds.height;
            }
            set bottomOverflow(bottomOverflow) {
                return this.y = this.height - bounds.height - bottomOverflow;
            }
        }();
    }

    /*get selectionStart() {
        let selection = window.getSelection();
        let startNode = selection.baseNode;
        if (startNode) {
            let startElement = startNode.parentNode;
            let ancestors = $(startElement).ancestors;
            let search = elements => {
                let start = 0;
                for (let e of elements) {
                    if (e instanceof Text) {
                        if (e == startNode) {
                            return start + selection.baseOffset;
                        } else {
                            start += e.length;
                        }
                    } else if (e instanceof Element) {
                        if (e.contains(startElement)) {
                            return start + (e == startElement ? selection.baseOffset : search(e.childNodes));
                        } else {
                            let siblings = ancestors.find(a => a.contains(e)).children;
                            if (siblings.findIndex(s => s.contains(e)) > siblings.findIndex(s => s.contains(startElement))) {
                                return start;
                            } else {
                                start += e.textContent.length;
                            }
                        }
                    }
                }
                return start;
            };
            return search(this.outer.#elements);
        }
    }
    // (window.getSelection().getRangeAt(0).setStart(<text-node>, 5))*/
    get selection() {
        let e = this.#elements.find(e => e.selectionStart != undefined);
        return e && {start: e.selectionStart, end: e.selectionEnd};
    }
    set selection(selection) {
        if (selection instanceof Array) {
            this.#elements.forEach(e => e.selectionStart != undefined && (e.selectionStart = selection[0] ?? e.selectionStart));
            this.#elements.forEach(e => e.selectionEnd != undefined && (e.selectionEnd = selection[1] ?? e.selectionEnd));
        } else if (selection instanceof Object) {
            this.#elements.forEach(e => e.selectionStart != undefined && (e.selectionStart = selection.start ?? e.selectionStart));
            this.#elements.forEach(e => e.selectionEnd != undefined && (e.selectionEnd = selection.end ?? e.selectionEnd));
        }
    }
    setSelection(...selection) {
        this.selection = selection.flat(Infinity);
        return this;
    }
    selectContent() {
        this.#elements.forEach(e => e.selectionStart != undefined && (e.selectionStart = 0));
        this.#elements.forEach(e => e.selectionEnd != undefined && (e.selectionEnd = e.length ?? e.value?.length ?? 0));
        return this;
    }

    // TODO Maybe add .isFocusable and option to set .containsFocused?
    get containsFocused() {
        return this.#elements.some(e => e.contains(document.activeElement));
    }
    get focused() {
        return this.#elements.some(e => e == document.activeElement);
    }
    set focused(focused) {
        if (focused) {
            this.#elements[0]?.focus();
        } else {
            this.#elements.forEach(e => e.blur());
        }
    }
    setFocused(focused) {
        this.focused = focused;
        return this;
    }
    focus() {
        return this.setFocused(true);
    }
    defocus() {
        return this.setFocused(false);
    }

    // TODO Rename these to on and off.
    #listen(event, callbackFn, signal, options) {
        event = [event].flat(Infinity);
        callbackFn = [callbackFn].flat(Infinity);
        this.#elements.forEach(e => event.forEach(event => callbackFn.forEach(callbackFn => (e == document.body ? document : e).addEventListener(event, callbackFn, signal ? {...options, signal} : options))));
        return this;
    }
    listen(event, callbackFn, signal) {
        return this.#listen(event, callbackFn, signal, {});
    }
    nonBlockingListen(event, callbackFn, signal) {
        return this.#listen(event, callbackFn, signal, {passive: true});
    }
    singleListen(event, callbackFn, signal) {
        return this.#listen(event, callbackFn, signal, {once: true});
    }
    nonBlockingSingleListen(event, callbackFn, signal) {
        return this.#listen(event, callbackFn, signal, {passive: true, once: true});
    }
    quitListen(event, callbackFn) {
        event = [event].flat(Infinity);
        callbackFn = [callbackFn].flat(Infinity);
        this.#elements.forEach(e => event.forEach(event => callbackFn.forEach(callbackFn => (e == document.body ? document : e).removeEventListener(event, callbackFn))));
        return this;
    }
    dispatch(event) {
        if (this.#elements.length) {
            this.#elements[0].dispatchEvent(event);
        }
    }
};

let $ = new Proxy((...query) => {
    let elements = typeof query.flat(Infinity)[0] == "string" ? [document] : [];
    query.flat(Infinity).forEach(q => {
        if (q instanceof antica.DOMUtils || q == $) {
            elements.push(...q.rawList);
        } else if (q instanceof Node) {
            elements.push(q);
        } else if (q !== "" && !isNaN(q)) {
            elements = [elements[+q]].filter(e => e);
        } else if (typeof q == "string") {
            let newElements = new Set();
            elements.forEach(e => e.querySelectorAll(q).forEach(e => newElements.add(e)));
            elements = [...newElements];
        }
    });
    return new antica.DOMUtils(elements);
}, {
    get: (_, property) => {
        let instance = new antica.DOMUtils(document.body);
        if (property in instance) {
            let value = instance[property];
            return typeof value == "function" ? value.bind(instance) : value;
        }
    },
    set: (_, property, value) => {
        let instance = new antica.DOMUtils(document.body);
        if (property in instance) {
            instance[property] = value;
            return true;
        }
    },
    has: (_, property) => {
        let instance = new antica.DOMUtils(document.body);
        return property in instance;
    },
    ownKeys: () => Object.ownKeys(new antica.DOMUtils(document.body)),
    getOwnPropertyDescriptor: (_, property) => property in new antica.DOMUtils(document.body) ? {value: new antica.DOMUtils(document.body)[property], writable: true, enumerable: true, configurable: true} : undefined,
});
let $new = (...options) => $newNS(undefined, options);
let $newNS = (ns, ...options) => {
    let elements = [];
    options.flat(Infinity).forEach(option => {
        if (option instanceof antica.DOMUtils || option instanceof Node) {
            elements.forEach((e, i) => $(e).add(i ? (option instanceof antica.DOMUtils ? option : $(option)).clone() : option));
        } else if (typeof option == "string") {
            if (option.trim()[0] == "<") {
                let e = ns ? document.createElementNS(ns, "body") : document.createElement("body");
                e.innerHTML = option;
                elements.push(...e.children);
            } else {
                elements.push(ns ? document.createElementNS(ns, option) : document.createElement(option));
            }
        } else if (typeof option == "number") {
            elements = option ? $(elements, $(elements).clone(option)) : [];
        } else if (typeof option == "object") {
            $(elements).set(option);
        }
    });
    return new antica.DOMUtils(elements);
};
let $newForSVG = (...options) => $newNS("http://www.w3.org/2000/svg", options);
let $text = (...text) => {
    let elements = [];
    text.flat(Infinity).forEach(text => {
        if (typeof text == "string" || typeof text == "number") {
            elements.push(document.createTextNode(text));
        } else if (text instanceof Node) {
            elements.push(document.createTextNode(text.textContent));
        }
    });
    return elements;
};

Object.defineProperty(window, "$$", {get: () => $($0)});
