function escapeStringForHtml(str = "") {
    return str.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;"
    }[char]));
}
function numberToString(n = 0) {
    return `${Math[+n > 0 ? "floor" : "ceil"](n).toLocaleString("en-US", {useGrouping: false})}${n.toString().indexOf("e") < 0 ? (n.toString().indexOf(".") < 0 ? "" : `.${n.toString().split(".")[1]}`) : n.toString().indexOf("e-") < 0 ? "" : `.${"0".repeat(+(n = Math.abs(n).toString().split("e-"))[1] - 1)}${n[0].replace(".", "")}`}`;
}
function roundDecimal(n = 0, d = 0, type = "round" || "floor" || "ceil") {
    if (n.toString().indexOf(".") < 0) {
        return +n;
    }
    let [a, b] = numberToString(n).split(".");
    return d < 0 ? Math.round(n / Math.pow(10, -d)) * Math.pow(10, -d) : b.length > d? +(+`${a}.${b.substring(0, d)}` + (+b[d] > (type == "round" ? 4 : type == (+n > 0 ? "ceil" : "floor") ? 0 : 9)) * Math.sign(n) / 10 ** d).toFixed(d) : +n;
} // TODO Improve support for negative decimal counts

class ResizeEvent extends Event {
    static dispatch(element) {
        Object.values($(element).animations).forEach(a => a.onFrame(e => e.dispatch(new ResizeEvent(element)))); // TODO This might attach to the same animation multiple times which would be very bad.
    }
    static listen(element, listener = resized => {}) {
        $(element).listen("resize", e => listener(e.element));
    }

    constructor(element) {
        super("resize", {
            composed: true,
            detail: {element},
            bubbles: true,
        });
        this.element = element;
    }
}

class QuillUiElement extends HTMLElement {
    #attributes = {};
    changeAttribute(attribute = "value", value = undefined, observe = false) {
        if (attribute instanceof Array) {
            attribute.forEach(name => this.changeAttribute(name, value, observe));
        } else {
            if (this.#attributes[attribute] != undefined && !observe) {
                this.#attributes[attribute]++;
            }
            if (typeof value == "string" || typeof value == "number") {
                this.setAttribute(attribute, value);
            } else if (value == true) {
                this.setAttribute(attribute, "");
            } else if (value instanceof Array) {
                this.setAttribute(attribute, value.flat(Infinity).join(" "));
            } else if (value instanceof Object) {
                this.setAttribute(attribute, JSON.stringify(value));
            } else {
                this.removeAttribute(attribute);
            }
        }
    }

    constructor(...attributes) {
        super();
        this.#attributes = Object.fromEntries(attributes.map(attribute => [attribute, 0]));
    }
    connectedCallback() {
        let attributeChangeCallback = attributeName => this[Array.from(attributeName).map(c => [c, 1]).filter((c, i, arr) => c[0] == "-" ? arr.length - 1 > i && (arr[i + 1][1] = 0) : true).map(c => c[1] ? c[0] : c[0].toUpperCase()).join("")] = this.getAttribute(attributeName) || this.getAttribute(attributeName) == "" || undefined;
        new MutationObserver(mutations => mutations.forEach(mutation => {
            if (mutation.type == "attributes" && this.#attributes[mutation.attributeName] != undefined) {
                if (this.#attributes[mutation.attributeName]) {
                    this.#attributes[mutation.attributeName]--;
                } else {
                    attributeChangeCallback(mutation.attributeName);
                }
            }
        })).observe(this, {attributes: true});
        Object.keys(this.#attributes).forEach(attributeChangeCallback);
        if (this.onconnect) {
            this.onconnect();
        }
    }
    disconnectedCallback() {
        if (this.ondisconnect) {
            this.ondisconnect();
        }
    }
}

class Popup extends QuillUiElement {
    static get container() {
        if (!$("body > main-container").exists) {
            $.add($new("main-container"));
        }
        return $("body > main-container");
    }
    static {
        document.addEventListener("DOMContentLoaded", () => {
            document.addEventListener("mousedown", e => Popup.container.children.slice(Popup.container.children.findIndex(popup => popup.contains(e.target)) + 1).rawList.forEach(popup => {
                if (!popup.stayOpen) {
                    popup.hidden = true;
                }
            }));
            document.addEventListener("mouseup", () => Popup.container.children.rawList.forEach(popup => popup.noQuickSelect = undefined));
            document.addEventListener("mousemove", e => Popup.container.children.rawList.forEach(popup => {
                let rect = popup.noQuickSelect;
                if (rect && (e.clientX < rect.x || e.clientX > rect.x + rect.w || e.clientY < rect.y || e.clientY > rect.y + rect.h)) {
                    popup.noQuickSelect = undefined;
                }
            }));
        });
    }

    #name = "";
    get name() {
        return this.#name;
    }
    set name(name) {
        this.changeAttribute("name", (this.#name = typeof name == "string" ? name : "") ? this.#name : false);
        if ($(this, ":scope > name")) {
            $(this, ":scope > name").text = this.name;
        }
    }

    #hidden = true;
    get hidden() {
        return this.#hidden;
    }
    set hidden(hidden) {
        this.#animationFrame = undefined;
        let changed = this.#hidden == !hidden;
        if (!(this.#hidden = !!hidden)) {
            let content = this.content;
            $(this).children = [
                (this.name || content && content.name) && $new("name").add(this.name, content?.name || undefined),
                $new("content").add(content?.newContent && content.newContent || content?.content && $new(content.content)),
            ];
            this.#reposition();
            $(this).style({height: [0, ""], opacity: [0, ""]}, 200);
            if (content.onload) {
                content.onload();
            }
            let animationFrame = this.#animationFrame = () => {
                this.animationFrameFunctions.forEach(updateFunction => updateFunction());
                this.#reposition();
                if (animationFrame == this.#animationFrame) {
                    requestAnimationFrame(animationFrame);
                }
            };
            requestAnimationFrame(animationFrame);
        } else if (changed) {
            $(this).style({height: ["", 0], opacity: ["", 0]}, 200);
        }
        this.changeAttribute(["hidden", "inert"], this.hidden);
    }

    #noQuickSelect;
    get noQuickSelect() {
        return this.#noQuickSelect;
    }
    set noQuickSelect(noQuickSelect) {
        this.#noQuickSelect = undefined;
        if (noQuickSelect instanceof Object && !isNaN(noQuickSelect.x) && !isNaN(noQuickSelect.y) && !isNaN(noQuickSelect.w ?? noQuickSelect.width) && !isNaN(noQuickSelect.h ?? noQuickSelect.height)) {
            this.#noQuickSelect = {x: +noQuickSelect.x + Math.min(0, +(noQuickSelect.w ?? noQuickSelect.width)), y: +noQuickSelect.y + Math.min(0, +(noQuickSelect.h ?? noQuickSelect.height)), w: Math.abs(noQuickSelect.w ?? noQuickSelect.width), h: Math.abs(noQuickSelect.h ?? noQuickSelect.height)};
        }
    }
    get quickSelect() {
        return !this.noQuickSelect;
    }

    #stayOpen = false;
    get stayOpen() {
        return this.#stayOpen;
    }
    set stayOpen(stayOpen) {
        this.changeAttribute("stay-open", this.#stayOpen = !!stayOpen);
    }

    #width = 200;
    get width() {
        return this.#width;
    }
    set width(width) {
        if (!isNaN(width) && width < Infinity && Math.max(0, width) != this.width) {
            this.#width = Math.max(0, width);
            this.#reposition();
        }
    }

    #maxHeight = 250;
    get maxHeight() {
        return this.#maxHeight;
    }
    set maxHeight(maxHeight) {
        if (!isNaN(maxHeight) && maxHeight < Infinity && Math.max(0, maxHeight) != this.maxHeight) {
            this.#maxHeight = Math.max(0, maxHeight);
            this.#reposition();
        }
    }

    #left = 0;
    get left() {
        return this.#left;
    }
    set left(left) {
        if (!isNaN(left) && left > -Infinity && left < Infinity && left != this.left) {
            this.#left = left;
            this.#reposition();
        }
    }

    #top = 0;
    get top() {
        return this.#top;
    }
    set top(top) {
        if (!isNaN(top) && top > -Infinity && top < Infinity && top != this.top) {
            this.#top = top;
            this.#reposition();
        }
    }

    #align = "middle";
    get align() {
        return this.#align;
    }
    set align(align) {
        if ((align == "left" || align == "right" || align == "middle") && align != this.align) {
            this.#align = align;
            this.#reposition();
        }
    }

    #reposition() {
       if ($(this).connected && !this.hidden) {
           if (Math.round(this.width) != $(this).bounds.width) {
               $(this).style({"width": `${Math.round(this.width)}px`});
           }
           let height = Math.round(Math.min(this.maxHeight, window.innerHeight - 3, ($(this, ":scope > name").count ? $(this, ":scope > name").bounds.height + 1 : 0) + ($(this, ":scope > content") ? $(this, ":scope > content").scroll.height : 0)));
           if (height != $(this).bounds.height) {
               $(this).editStyleTransition({height: `${height}px`});
               $(this, ":scope > name").style({height: "30px"});
               $(this, ":scope > content").style({"max-height": `${height - ($(this, ":scope > name").count ? 30 : 0)}px`});
           }
           let left = Math.round(Math.max(1, Math.min(window.innerWidth - this.width - 1, this.left - (this.align == "left" ? 0 : this.width / (this.align == "right" ? 1 : 2)))));
           if (left != $(this).bounds.left) {
               $(this).style({"left": `${left}px`});
           }
           let top = Math.round(Math.max(0, Math.min(window.innerHeight - height - 3, this.top))) + 1;
           if (top != $(this).bounds.top) {
               $(this).style({"top": `${top}px`});
           }
       }
    }

    animationFrameFunctions = [];
    #animationFrame;

    constructor(...attributes) {
        super("name", "hidden", "stay-open", ...attributes);
    }
} // TODO Support for elements in name

class TabContent extends QuillUiElement {
    #transitionDuration = 200;

    #hidden = false;
    get hidden() {
        return this.#hidden;
    }
    set hidden(hidden) {
        this.#hidden = !!hidden;
        if ($(this).connected) {
            if (!hidden || !$(this).parent.get("stacked")) {
                this.changeAttribute(["hidden", "inert"], this.hidden);
            }
            if (!hidden) {
                $(this).parent.raw.scrollTop = 0;
                let newIndex = $(this).siblings.indexOf(this);
                let oldIndex = $(this).siblings.findIndex(e => e.get("shown"));
                let old = oldIndex > -1 && newIndex != oldIndex && $(this).siblings.at(oldIndex);
                let stacked = $(this).parent.get("stacked") && $(this).parent.closest("tab-content");
                if (stacked && stacked.raw.hidden) {
                    $(this).parent.style({height: `${this.scrollHeight}px`});
                    $(this).removeStyle();
                    if (old) {
                        old.style({opacity: 0}).remove("shown");
                    }
                    stacked.raw.hidden = false;
                } else {
                    if (old) {
                        $(this).parent.style({height: `${this.scrollHeight}px`}, !$(this).matches("[hidden] *") && this.#transitionDuration);
                        $(this).style({transform: [`translateX(${oldIndex > newIndex ? -25 : 25}%)`, ""], opacity: [0, ""]}, !$(this).matches("[hidden] *") && this.#transitionDuration);
                        old.rawSet("hidden", true).remove("shown").style({transform: ["", `translateX(${oldIndex > newIndex ? 25 : -25}%)`], opacity: [1, 0]}, !$(this).matches("[hidden] *") && this.#transitionDuration);
                    } else {
                        $(this).parent.editStyleTransition({height: `${this.scrollHeight}px`});
                    }
                }
                $(this).set("shown");
                ResizeEvent.dispatch(this.parentElement);
            }
        }
    }

    constructor() {
        super("hidden");
        ResizeEvent.listen(this, () => {
            if ($(this).connected && !this.hidden) {
                $(this).parent.editStyleTransition({height: `${this.scrollHeight}px`});
            }
        });
    }
}
customElements.define("tab-content", TabContent);

class ToggleableSection extends QuillUiElement {
    #transitionDuration = 200;

    #hidden = undefined;
    get hidden() {
        return this.#hidden || false;
    }
    set hidden(hidden) {
        $(this).style({height: hidden ? 0 : undefined, opacity: hidden ? 0 : undefined}, this.#hidden == undefined ? 0 : this.#transitionDuration);
        this.#hidden = !!hidden;
        this.changeAttribute(["hidden", "inert"], this.hidden);
        ResizeEvent.dispatch(this);
    }

    constructor() {
        super("hidden");
        ResizeEvent.listen(this, element => {
            if (!this.hidden && this != element) {
                $(this).editStyleTransition({height: "", opacity: ""});
            }
        });
    }
}
customElements.define("toggleable-section", ToggleableSection);

class ToggleButton extends QuillUiElement  {
    static ToggleEvent = class ToggleEvent extends Event {
        constructor(toggled) {
            super("toggle", {composed: true, bubbles: true});
            this.toggled = this.value = toggled;
        }
    };

    #toggled = false;
    get toggled() {
        return this.#toggled;
    }
    set toggled(toggled) {
        if (this.group) {
            if (this.#multiSelecting) {
                if (toggled) {
                    this.#toggled = true;
                } else if ($(this).ancestors.at(this.groupHeight).select("toggle-button[group]").rawList.some(e => e.group == this.group && e.toggled && e != this)) {
                    this.#toggled = false;
                }
            } else if (toggled) {
                this.#toggled = true;
                $(this).ancestors.at(this.groupHeight).select("toggle-button[group]").rawList.filter(e => e.group == this.group && e != this).forEach(e => {
                    e.changeAttribute("toggled", e.#toggled = false);
                    e.#updateToggleElement();
                });
            } else if (!$(this).ancestors.at(this.groupHeight).select("toggle-button[group]").rawList.some(e => e.group == this.group && e.toggled)) {
                let e = $(this).ancestors.at(this.groupHeight).select("toggle-button[group]").rawList.find(e => e.group == this.group);
                e.changeAttribute("toggled", e.#toggled = true);
                e.#updateToggleElement();
            }
        } else {
            this.#toggled = !!toggled;
        }
        this.changeAttribute("toggled", this.toggled);
        this.#updateToggleElement();
    }

    #toggleElement;
    get toggleElement() {
        return this.#toggleElement;
    }
    set toggleElement(toggleElement) {
        if (typeof toggleElement == "string" && toggleElement.length) {
            this.changeAttribute("toggle-element", this.#toggleElement = toggleElement);
        } else {
            this.changeAttribute("toggle-element", this.#toggleElement = undefined);
        }
        this.toggled = this.toggled;
    }
    #updateToggleElement = () => {
        window.removeEventListener("load", this.#updateToggleElement);
        if (document.readyState == "complete") {
            if (this.#toggleElement) {
                this.toggleElement.split(";").forEach(toggleElement => $(this).ancestors.find(e => e.select(toggleElement).exists).select(toggleElement).rawSet("hidden", !this.toggled));
            }
        } else {
            window.addEventListener("load", this.#updateToggleElement);
        }
    };

    #multiSelect;
    get multiSelect() {
        return this.#multiSelect;
    }
    set multiSelect(multiSelect) {
        this.changeAttribute("multi-select", this.#multiSelect = this.#multiSelecting = !!multiSelect);
    }
    #multiSelecting = false;

    #groupHeight = 1;
    get groupHeight() {
        return this.#groupHeight;
    }
    set groupHeight(groupHeight) {
        if (!isNaN(groupHeight) && +groupHeight == Math.round(groupHeight) && +groupHeight > 0) {
            this.#groupHeight = +groupHeight;
        }
    }

    #group;
    get group() {
        return this.#group;
    }
    set group(group) {
        if (typeof group == "string") {
            this.changeAttribute("group", this.#group = group);
        } else {
            this.changeAttribute("group", this.#group = undefined);
        }
        this.toggled = this.toggled;
    }

    ontoggle;

    constructor() {
        super("toggled", "toggle-element", "multi-select", "group-height", "group");
    }
    onconnect() {
        if (!this.hasAttribute("tabindex")) {
            this.changeAttribute("tabindex", 0);
        }
        this.onclick = e => {
            this.#multiSelecting = this.#multiSelect && (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? e.metaKey : e.ctrlKey);
            this.toggled = this.group && !this.#multiSelecting || !this.toggled;
            this.#multiSelecting = this.#multiSelect;
            if (this.ontoggle instanceof Function) {
                this.ontoggle(new ToggleButton.ToggleEvent(this.toggled));
            }
            this.dispatchEvent(new ToggleButton.ToggleEvent(this.toggled));
        };
    }
}
customElements.define("toggle-button", ToggleButton);

class CheckBox extends ToggleButton {}
customElements.define("check-box", CheckBox);

class NumberInput extends QuillUiElement {
    static ChangeEvent = class ChangeEvent extends Event {
        constructor(value, values) {
            super("change", {composed: true, bubbles: true});
            this.value = value;
            this.values = values;
        }
    };

    static units = {
        number: {
            "": 1,
            "#": 1,
            "%": .01,
            "‰": .001,
        },
        length: {
            "pt": 1,
            "px": .75,
            "pc": 12,
            "cm": 28.3464567,
            "mm": 2.83464567,
            "in": 72,
        },
        angle: {
            "°": 1,
            "rad": 180 / Math.PI,
            "rev": 360,
        },
        time: {
            "h": 360000,
            "m": 60000,
            "s": 1000,
            "ms": 1,
        },
    };
    static defaultUnits = {
        number: "",
        length: "pt",
        angle: "°",
        time: "s",
    };

    static parseValue(value = 0 ?? "", type = "number", defaultUnit = "", min = -Infinity, max = Infinity, decimals = 2) {
        // TODO Full support for complex calculations. Check NumberInputParsingPlan.txt.
        value = `${value}`;
        let numberStr = "";
        let exponentStr;
        let unitStr;
        for (let char of value.replaceAll(",", ".")) {
            if (!exponentStr && (char == "e" || char == "E")) {
                exponentStr = " ";
            } else if (exponentStr && (char == "+" || char == "-" || char.charCodeAt(0) > 41 && char.charCodeAt(0) < 58)) {
                exponentStr += char;
            } else if (char == "." || char.charCodeAt(0) > 41 && char.charCodeAt(0) < 58) {
                numberStr += char;
            } else if (unitStr) {
                if (char == " ") {
                    break;
                }
                unitStr += char;
            } else if (char.toUpperCase() != char.toLowerCase() || Object.keys(NumberInput.units).map(type => Object.keys(NumberInput.units[type])).flat().indexOf(char) > -1) {
                unitStr = char;
            }
        }
        if (numberStr && !isNaN(+numberStr)) { // TODO More verification?
            let number = +numberStr * Math.pow(10, +exponentStr || 0) * (unitStr && NumberInput.units[type][unitStr.trim().toLowerCase()] || 1);
            let value = Math.max(roundDecimal(Math.min(min, max), decimals, "ceil"), Math.min(roundDecimal(number, decimals), roundDecimal(Math.max(min, max), decimals, "floor")));
            if (this.type == "angle") {
                return (value % 360 + 360) % 360;
            }
            return value;
        }
        return 0;
    }

    static valueInUnit(value = 0, type = "number", unit = "", decimals = 2) {
        return `${numberToString(roundDecimal(value / (NumberInput.units[type][unit] || NumberInput.units[type][unit]), decimals))}${unit ? ` ${unit}` : ""}`;
    }

    #name = "";
    get name() {
        return this.#name;
    }
    set name(name) {
        this.changeAttribute("name", (this.#name = typeof name == "string" ? name : "") ? this.#name : false);
        if ($(this).connected && this.innerHTML) {
            $(this, "input").set({name: (this.#name = typeof name == "string" ? name : "") ? this.#name : false});
        }
    }

    #type = "number"; // TODO The correct term is quantity.
    get type() {
        return this.#type;
    }
    set type(type) {
        type = typeof type == "string" ? type.toLowerCase() : "number";
        if (this.type != type && NumberInput.units[type]) {
            this.#type = type;
            this.#unit = NumberInput.defaultUnits[this.type];
            if (this.isConnected && this.innerHTML) {
                this.changeAttribute("type", this.type);
                this.changeAttribute("unit", this.unit);
                this.values = this.#values;
            }
        }
    }

    #unit = "";
    get unit() {
        return this.#unit;
    }
    set unit(unit) {
        unit = typeof unit == "string" ? unit.toLowerCase() : NumberInput.defaultUnits[this.type];
        if (this.unit != unit && NumberInput.units[this.type][unit]) {
            this.#unit = unit;
            if (this.isConnected && this.innerHTML) {
                this.changeAttribute("unit", this.unit || undefined);
                this.values = this.#values;
            }
        }
    }

    #values = [];
    get values() {
        return [...this.#values];
    }
    set values(values) {
        this.#values = [values].flat(Infinity).map(v => `${v}`.split(";")).flat().map(value => NumberInput.parseValue(value, this.#type, this.#unit, this.#min, this.#max, this.#decimals));
        if ($(this).connected && this.innerHTML) {
            this.changeAttribute("values", this.#values.map(v => numberToString(v)).join(";"));
            this.changeAttribute("value", numberToString(this.value));
            $(this, "div").empty();
            if (this.#values.length) {
                $(this, "div").set({contenteditable: "plaintext-only"});
                $(this, "button[action=increment]").set({disabled: this.#values.every(value => value >= this.#max)});
                $(this, "button[action=decrement]").set({disabled: this.#values.every(value => value <= this.#min)});
                $(this, "div").add($new("a").setClasses("initial-value", this.#values.length > 1 ? "multiple" : []).add(this.getValueInUnit()));
            } else {
                $(this, "div").remove("contenteditable");
                $(this, "button").set("disabled");
            }
        }
    }

    #value = 0;
    get value() {
        return this.#values[0];
    }
    set value(value) {
        this.values = value;
    }

    #min = -Infinity;
    get min() {
        return this.#min;
    }
    set min(min) {
        if (!isNaN(min)) {
            this.#min = +min;
            this.values = this.values;
            this.changeAttribute("min", this.min);
        }
    }

    #max = Infinity;
    get max() {
        return this.#max;
    }
    set max(max) {
        if (!isNaN(max)) {
            this.#max = +max;
            this.values = this.values;
            this.changeAttribute("max", this.max);
        }
    }

    #decimals = 2;
    get decimals() {
        return this.#decimals;
    }
    set decimals(decimals) {
        if (!isNaN(decimals)) {
            this.#decimals = Math.max(0, Math.round(decimals));
            this.values = this.values;
            this.changeAttribute("decimals", this.decimals);
        }
    }

    getValuesInUnit(unit = this.unit) {
        return this.#values.map(v => NumberInput.valueInUnit(v, this.#type, unit, this.#decimals));
    }
    getValueInUnit(unit = this.unit) {
        return this.getValuesInUnit(unit)[0];
    }

    #interval = 1;
    get interval() {
        return this.#interval;
    }
    set interval(interval) {
        if (!isNaN(interval) && Math.abs(interval) > 0 && Math.abs(interval) < Infinity) {
            this.#interval = Math.abs(interval);
            if ($(this).connected) {
                this.changeAttribute("interval", this.interval);
            }
        }
    }
    increment() {
        this.values = this.#values.map(v => roundDecimal(Math.floor(roundDecimal(v / this.interval, this.decimals + 10) + 1) * this.interval, this.decimals, "ceil"));
    }
    decrement() {
        this.values = this.#values.map(v => roundDecimal(Math.ceil(roundDecimal(v / this.interval, this.decimals + 10) - 1) * this.interval, this.decimals, "floor"));
    }

    onchange;

    constructor() {
        super("name", "type", "unit", "values", "value", "min", "max", "decimals", "interval");
    }
    onconnect() {
        $(this).empty().add(
            $new("div"),
            $new("number-input-buttons").add(
                $new("button").set({action: "increment", tabindex: -1}).add($new(`<svg viewBox="0 0 14 14"><path fill="none" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 9.5L7 5.5L11 9.5"/></svg>`)),
                $new("button").set({action: "decrement", tabindex: -1}).add($new(`<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 4.5L7 8.5L11 4.5"/></svg>`)),
            ),
        );
        let input = $(this, "div");
        let parseTyped = () => this.values = this.getValuesInUnit().map(v => input.children.reduce((value, e) => value + (e.classes.includes("initial-value") ? v : e.text), ""));
        let dispatchChangeEvent = () => {
            if (this.onchange instanceof Function) {
                this.onchange(new NumberInput.ChangeEvent(this.#value));
            }
            this.dispatchEvent(new NumberInput.ChangeEvent(this.#value));
        };
        let select = (start = input.text.length, end = input.text.length) => {
            let startIndex = 0;
            let endIndex = 0;
            while (input.children.count > startIndex + 1 && start > input.children.at(startIndex).text.length) {
                start -= input.children.at(startIndex).text.length;
                startIndex++;
            }
            while (input.children.count > endIndex + 1 && end > input.children.at(endIndex).text.length) {
                end -= input.children.at(endIndex).text.length;
                endIndex++;
            }
            window.getSelection().getRangeAt(0).setStart(input.children.at(startIndex).raw.childNodes[0], start);
            window.getSelection().getRangeAt(0).setEnd(input.children.at(endIndex).raw.childNodes[0], end);
        };
        input.listen("blur", () => {
            parseTyped();
            dispatchChangeEvent();
        })
        .listen("input", () => {
            let initialE = input.select(".initial-value");
            if (initialE.exists) {
                let selectionStart = window.getSelection().baseOffset;
                let selectionEnd = window.getSelection().extentOffset;
                for (let i = 0; i < input.children.count && i < input.children.indexOf(window.getSelection().baseNode.parentNode); i++) {
                    selectionStart += input.children.at(i).text.length;
                }
                for (let i = 0; i < input.children.count && i < input.children.indexOf(window.getSelection().extentNode.parentNode); i++) {
                    selectionEnd += input.children.at(i).text.length;
                }
                let initialV = this.getValueInUnit();
                let index = initialE.text.indexOf(initialV);
                if (index < 0) {
                    let text = input.text;
                    input.empty().add($new("a").add(text));
                } else if (initialE.length != initialV.length) {
                    let beforeInitialE = input.select(".before-initial-value");
                    let afterInitialE = input.select(".after-initial-value");
                    let beforeInitialV = initialE.text.slice(0, index);
                    let afterInitialV = initialE.text.slice(index + initialV.length);
                    initialE.text = initialV;
                    if (beforeInitialE.exists) {
                        beforeInitialE.text += beforeInitialV;
                    } else if (beforeInitialV) {
                        input.insert($new("a").setClasses("before-initial-value").add(beforeInitialV), 0);
                    }
                    if (afterInitialE.exists) {
                        afterInitialE.text = afterInitialV + afterInitialE.text;
                    } else if (afterInitialV) {
                        input.add($new("a").setClasses("after-initial-value").add(afterInitialV));
                    }
                }
                select(selectionStart, selectionEnd);
            }
        })
        .listen("keydown", event => {
            if (event.key == "Enter") {
                event.preventDefault();
                parseTyped();
                select(0);
                dispatchChangeEvent();
            } else if (event.key == "ArrowUp" || event.key == "ArrowDown") {
                event.preventDefault();
                parseTyped();
                this[event.key == "ArrowUp" ? "increment" : "decrement"]();
                select();
                dispatchChangeEvent();
            } else if (event.key == "Escape") {
                this.values = this.#values;
                input.defocus();
                dispatchChangeEvent();
            }
        });
        let actionLoop;
        $(this, "button").listen("mousedown", e => {
            if (this[$(e.target).get("action")]) {
                this[$(e.target).get("action")]();
                dispatchChangeEvent();
                let newActionLoop = actionLoop = () => {
                    if (actionLoop == newActionLoop) {
                        this[$(e.target).get("action")]();
                        dispatchChangeEvent();
                        setTimeout(newActionLoop, 100);
                    }
                };
                setTimeout(newActionLoop, 500);
            }
        }).listen(["mouseup", "mouseleave"], () => actionLoop = undefined);
        if (this.onload) {
            this.onload();
        }
        this.values = this.#values;
    }
} // TODO Calculation parsing
customElements.define("number-input", NumberInput);

class AngleInput extends QuillUiElement {
    static ChangeEvent = class ChangeEvent extends Event {
        constructor(value) {
            super("change", {composed: true, bubbles: true});
            this.value = value;
        }
    };

    #name = "";
    get name() {
        return this.#name;
    }
    set name(name) {
        this.changeAttribute("name", (this.#name = typeof name == "string" ? name : "") ? this.#name : false);
        this.#updateNumberInput();
    }

    #value = 0;
    get value() {
        return this.#value;
    }
    set value(value) {
        if (!isNaN(value) && Math.abs(value) < Infinity) {
            this.#value = (roundDecimal(value, this.decimals) % 360 + 360) % 360;
            this.changeAttribute("value", value);
            this.#updateNumberInput();
            if ($(this).connected) {
                $(this).html = `<svg viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M1.5 8H14M10 3.5L14.5 8L10 12.5" transform="rotate(${this.value} 8 8)"/></svg>`;
            }
        }
    }

    #decimals = 0;
    get decimals() {
        return this.#decimals;
    }
    set decimals(decimals) {
        if (!isNaN(decimals)) {
            this.#decimals = Math.max(0, Math.round(decimals));
            this.value = this.value;
            this.changeAttribute("decimals", this.decimals);
        }
    }

    #numberInput;
    get numberInput() {
        return this.#numberInput;
    }
    set numberInput(numberInput) {
        if (typeof numberInput == "string" && numberInput.length) {
            this.changeAttribute("number-input", this.#numberInput = numberInput);
        } else {
            this.changeAttribute("number-input", this.#numberInput = undefined);
        }
        this.value = this.value;
    }
    #updateNumberInput = () => {
        window.removeEventListener("load", this.#updateNumberInput);
        let input = $(this).ancestors.map(e => e.select(this.numberInput)).raw;
        if (input) {
            if (input.type) {
                input.name = this.name;
                input.type = "angle";
                input.min = -Infinity;
                input.max = Infinity;
                input.decimals = this.decimals;
                input.value = this.value;
                input.onchange = () => {
                    this.value = input.value;
                    if (this.onchange instanceof Function) {
                        this.onchange(new AngleInput.ChangeEvent(this.value));
                    }
                    this.dispatchEvent(new AngleInput.ChangeEvent(this.value));
                };
            } else {
                input.onload = this.#updateNumberInput;
            }
        }
    };

    onchange;

    constructor() {
        super("name", "value", "decimals", "number-input");
    }
    onconnect() {
        let onmousemove = e => {
            this.value = Math.atan2(e.clientY - ($(this).bounds.top + $(this).bounds.bottom) / 2, e.clientX - ($(this).bounds.left + $(this).bounds.right) / 2) * 180 / Math.PI;
            if (this.onchange instanceof Function) {
                this.onchange(new AngleInput.ChangeEvent(this.value));
            }
            this.dispatchEvent(new AngleInput.ChangeEvent(this.value));
        };
        let onmouseup = () => {
            $.quitListen("mousemove", onmousemove);
            $.quitListen("mouseup", onmouseup);
            $.quitListen("blur", onmouseup);
        };
        this.onmousedown = e => {
            e.stopPropagation();
            onmousemove(e);
            $.listen("mousemove", onmousemove);
            $.listen("mouseup", onmouseup);
            $.listen("blur", onmouseup);
        };
        this.changeAttribute("tab-index", "-1");
    }
}
customElements.define("angle-input", AngleInput);

class ListPopup extends Popup {
    static SelectEvent = class SelectEvent extends Event {
        constructor(group, option) {
            super("select", {composed: true, bubbles: true});
            this.group = group;
            this.option = option;
        }
    };

    #options = [];
    get options() {
        return structuredClone(this.#options);
    }
    set options(options) {
        if (typeof options == "string") {
            try {
                options = JSON.parse(options);
            } catch (e) {}
        }
        if (options instanceof Array) {
            this.#options = [];
            options.forEach(group => {
                if (group instanceof Object) {
                    let newGroup = {
                        id: typeof group.id == "string" || typeof group.id == "number" ? `${group.id}` : typeof group.name == "string" || typeof group.name == "number" ? `${group.name}` : "",
                        name: typeof group.name == "string" || typeof group.name == "number" ? `${group.name}` : typeof group.id == "string" || typeof group.id == "number" ? `${group.id}` : "",
                        tName: group.tName && typeof group.tName == "string" ? group.tName : undefined,
                        options: [],
                        add: !!group.add,
                        rename: !!group.rename,
                        remove: !!group.remove,
                    };
                    if (!this.#options.find(existingGroup => existingGroup.id == newGroup.id)) {
                        if (group.options instanceof Array) {
                            group.options.forEach(option => {
                                if (typeof option == "string") {
                                    option = {
                                        id: option,
                                        name: option,
                                        tName: undefined,
                                    };
                                }
                                if (option instanceof Object) {
                                    let newOption = {
                                        id: typeof option.id == "string" || typeof option.id == "number" ? `${option.id}` : typeof option.name == "string" || typeof option.name == "number" ? `${option.name}` : "",
                                        name: typeof option.name == "string" || typeof option.name == "number" ? `${option.name}` : typeof option.id == "string" || typeof option.id == "number" ? `${option.id}` : "",
                                        tName: option.tName && typeof option.tName == "string" ? option.tName : undefined,
                                    };
                                    if (option.rename != undefined) {
                                        newOption.rename = !!option.rename;
                                    }
                                    if (option.remove != undefined) {
                                        newOption.remove = !!option.remove;
                                    }
                                    if (!newGroup.options.find(existingOption => existingOption.id == option.id)) {
                                        newGroup.options.push(newOption);
                                    }
                                }
                            });
                        }
                        this.#options.push(newGroup);
                    }
                }
            });
            this.changeAttribute("options", JSON.stringify(this.#options));
            this.hidden = this.hidden;
        }
    }

    findOption(option) {
        let groupId;
        let optionId;
        if (typeof option == "string") {
            optionId = option;
        } else if (option instanceof Object) {
            if (typeof option.option == "string") {
                optionId = option.option;
            } else if (option.option instanceof Object) {
                optionId = typeof option.option.id == "string" ? option.option.id : typeof option.option.name == "string" ? option.option.name : undefined;
            } else {
                optionId = typeof option.id == "string" ? option.id : typeof option.name == "string" ? option.name : undefined;
            }
            if (typeof option.group == "string") {
                groupId = option.group;
            } else if (option.group instanceof Object) {
                groupId = typeof option.group.id == "string" ? option.group.id : typeof option.group.name == "string" ? option.group.name : undefined;
            }
        }
        if (optionId) {
            let group = this.#options.find(group => groupId != undefined ? group.id == groupId : group.options.find(option => option.id == optionId));
            if (group) {
                let option = group.options.find(option => option.id == optionId);
                if (option) {
                    return {group, option};
                }
            }
        }
    }

    #selected = [];
    get selected() {
        return this.#selected.map(selected => ({group: {id: selected.group.id, name: selected.group.name, tName: selected.group.tName}, option: {id: selected.option.id, name: selected.option.name, tName: selected.option.tName}}));
    }
    set selected(selected) {
        if (typeof selected == "string") {
            try {
                this.selected = JSON.parse(selected[0] == "[" ? selected : undefined);
            } catch (e) {
                this.#selected = [this.findOption(selected)].filter(selected => selected);
            }
        } else if (selected instanceof Array) {
            this.#selected = selected.map(option => this.findOption(option)).filter(selected => selected);
        } else if (selected instanceof Object) {
            this.#selected = [this.findOption(selected)].filter(selected => selected);
        } else {
            this.#selected = [];
        }
        this.changeAttribute("selected", JSON.stringify(this.#selected.map(selected =>({group: selected.group.id, option: selected.option.id}))));
    }

    get content() {
        let directAdd = this.#options.reduce((result, group) => result + (!group.name && group.add), 0) == 1;
        return {
            name: directAdd ? $new("add") : "",
            newContent: this.#options.map(group => $new("group").add(
                (group.name || group.tName || group.add && !directAdd) && $new("name").set({t: group.tName}).add(
                    group.name,
                    group.add && $new("add"),
                ),
                $new("options").add(
                    group.options.map(option => $new("entry").listen("mouseup", () => {
                        if (this.quickSelect) {
                            this.selected = {group, option};
                            if (this.onselect instanceof Function) {
                                this.onselect(new ListPopup.SelectEvent(group, option));
                            }
                            this.dispatchEvent(new ListPopup.SelectEvent(group, option));
                        }
                    }).add(
                        $new("a").setClasses(this.#selected.find(selected => selected.group.id == group.id && selected.option.id == option.id) ? "selected" : "").set({t: option.tName}).add(option.name),
                        $new("actions").listen("mouseup", e => e.stopPropagation()).add(
                            (option.rename ?? group.rename) && $new("rename"),
                            (option.remove ?? group.remove) && group.options.length > 1 && $new("remove"),
                        ),
                    )),
                ),
            )),
            // TODO Make the effect not lag behind.
            onload: () => $(this, "content").listen("scroll", () => $(this, "group").filter(group => group.select("name").exists && group.select("options").exists).forEach(group => group.select("options").style({clipPath: `inset(${group.select("name").bounds.bottom - group.select("options").bounds.top}px 0 0 0)`}))),
        };
    }

    onselect;

    constructor() {
        super("options", "selected");
    }
}
customElements.define("list-popup", ListPopup);

class ListSelect extends QuillUiElement {
    #popup = document.createElement("list-popup");
    #positionPopup = () => {
        this.#popup.left = (this.getBoundingClientRect().left + this.getBoundingClientRect().right) / 2;
        this.#popup.top = this.getBoundingClientRect().bottom;
        this.#popup.width = Math.max(150, this.getBoundingClientRect().width);
    };

    get name() {
        return this.#popup.name;
    }
    set name(name) {
        this.#popup.name = name;
        this.changeAttribute("name", this.#popup.getAttribute("name"));
    }

    get options() {
        return this.#popup.options;
    }
    set options(options) {
        this.#popup.options = options;
        this.changeAttribute("options", this.#popup.getAttribute("options"));
    }

    get selected() {
        return this.#popup.selected;
    }
    set selected(selected) {
        this.#popup.selected = selected;
        if (this.isConnected) {
            this.changeAttribute("selected", this.#popup.getAttribute("selected"));
            if (this.selected.length) {
                if (this.selected.length > 1) {
                    this.innerText = "Multiple";
                    this.changeAttribute("t", "list-select.multiple");
                    this.changeAttribute("style", "font-style: italic;");
                } else {
                    this.innerText = this.selected[0].option.name;
                    this.changeAttribute("t", this.selected[0].option.tName);
                    this.changeAttribute("style", undefined);
                }
            } else {
                this.innerText = "None";
                this.changeAttribute("t", "list-select.none");
                this.changeAttribute("style", "font-style: italic;");
            }
        }
    }

    onselect;

    constructor() {
        super("name", "options", "selected");
        this.#popup.animationFrameFunctions.push(this.#positionPopup);
    }
    onconnect() {
        if (!this.hasAttribute("tabindex")) {
            this.changeAttribute("tabindex", 0);
        }
        this.#popup.hidden = true;
        this.#popup.onselect = e => {
            this.selected = {group: e.group, option: e.option};
            this.#popup.hidden = true;
            if (this.onselect instanceof Function) {
                this.onselect(new ListPopup.SelectEvent(e.group, e.option));
            }
            this.dispatchEvent(new ListPopup.SelectEvent(e.group, e.option));
        };
        this.onmousedown = () => {
            if (this.#popup.hidden) {
                this.#popup.hidden = false;
                this.#popup.noQuickSelect = this.getBoundingClientRect();
                this.#popup.stayOpen = true;
                setTimeout(() => this.#popup.stayOpen = false);
            }
        };
        Popup.container.add(this.#popup);
    }
    ondisconnect() {
        this.#popup.remove();
    }
}
customElements.define("list-select", ListSelect);

class ColorPopup extends Popup {
    static ChangeEvent = class ChangeEvent extends Event {
        constructor(value) {
            super("change", {composed: true, bubbles: true});
            this.value = value;
        }
    };
    static colorToBackground(color, alpha = "true" || "fake" || "false") {
        alpha = alpha == "false" || !alpha ? false : alpha == "fake" ? "fake" : "true";
        let hex = color => `${Math.round(color.r * 255).toString(16).padStart(2, "0") + Math.round(color.g * 255).toString(16).padStart(2, "0") + Math.round(color.b * 255).toString(16).padStart(2, "0")}${alpha ? Math.round(color.a * 255).toString(16).padStart(2, "0") : ""}`.toUpperCase();
        if (color.type == "linear" || color.type == "radial") {
            let colors = (color.colors.length == 1 ? [color.colors[0], color.colors[0]] : color.colors.length ? color.colors : Array(2).fill({r: 0, g: 0, b: 0, a: 0, pos: 0})).map(color => `, #${hex(color)} ${numberToString(color.pos * 100)}%`).join("");
            if (color.type == "linear") {
                return `linear-gradient(${((color.angle || 0) + 90) % 360}deg${colors})${alpha == "fake" ? ", linear-gradient(45deg, #606060 25%, #0000 25%) 0 0 / 14px 14px, linear-gradient(-45deg, #606060 25%, #0000 25%) 0 7px / 14px 14px, linear-gradient(45deg, #0000 75%, #606060 75%) 7px -7px / 14px 14px, linear-gradient(-45deg, #404040 75%, #606060 75%) -7px 0 / 14px 14px" : ""}`;
            } else {
                return `radial-gradient(circle${colors})${alpha == "fake" ? ", linear-gradient(45deg, #606060 25%, #0000 25%) 0 0 / 14px 14px, linear-gradient(-45deg, #606060 25%, #0000 25%) 0 7px / 14px 14px, linear-gradient(45deg, #0000 75%, #606060 75%) 7px -7px / 14px 14px, linear-gradient(-45deg, #404040 75%, #606060 75%) -7px 0 / 14px 14px" : ""}`;
            }
        }
        return `linear-gradient(#${hex(color)}, #${hex(color)})${alpha == "fake" ? ", linear-gradient(45deg, #606060 25%, #0000 25%) 0 0 / 14px 14px, linear-gradient(-45deg, #606060 25%, #0000 25%) 0 7px / 14px 14px, linear-gradient(45deg, #0000 75%, #606060 75%) 7px -7px / 14px 14px, linear-gradient(-45deg, #404040 75%, #606060 75%) -7px 0 / 14px 14px" :""}`;
    }
    static averageColor(color) {
        if (color.type == "solid") {
            return {...color};
        }
        let cs = color.colors;
        let tw = 0;
        let r = {r: 0, g: 0, b: 0, a: 0};
        [{c: cs[0], p: 0}, {c: cs[cs.length - 1], p: 1}].forEach(cl => {
            let w = color.type == "linear" ? Math.abs(cl.c.pos - cl.p) : Math.abs(cl.c.pos ** 2 - cl.p ** 2);
            tw += w;
            for (let c of Object.keys(r)) {
                r[c] += cl.c[c] * w;
            }
        });
        for (let i = 0; i < cs.length - 1; i++) {
            let p1 = cs[i].pos;
            let p2 = cs[i + 1].pos;
            if (p2 > p1) {
                if (color.type == "linear") {
                    tw += p2 - p1;
                    for (let c of Object.keys(r)) {
                        r[c] += (cs[i][c] + cs[i + 1][c]) * (p2 - p1) / 2;
                    }
                } else {
                    tw += p2 ** 2 - p1 ** 2;
                    let w1 = p1 ** 3 / 3 * 2 + p2 ** 3 / 3 - p1 * p1 * p2;
                    let w2 = p1 ** 3 / 3 + p2 ** 3 / 3 * 2 - p1 * p2 * p2;
                    for (let c of Object.keys(r)) {
                        r[c] += (cs[i][c] * w1 + cs[i + 1][c] * w2) / (p2 - p1);
                    }
                }
            }
        }
        for (let c of Object.keys(r)) {
            r[c] = roundDecimal(r[c] / tw, 10);
        }
        return r;
    }
    static parseValue(value) {
        if (value instanceof Array) {
            return {
                type: "solid",
                r: isNaN(value[0]) ? 0 : Math.min(1, Math.max(0, value[0])),
                g: isNaN(value[1]) ? 0 : Math.min(1, Math.max(0, value[1])),
                b: isNaN(value[2]) ? 0 : Math.min(1, Math.max(0, value[2])),
                a: isNaN(value[3]) ? 0 : Math.min(1, Math.max(0, value[3])),
            };
        } else if (value instanceof Object) {
            if (value.type == "linear" || value.type == "radial") {
                let result = {type: value.type};
                if (value.type == "linear") {
                    result.angle = isNaN(value.angle) || Math.abs(value.angle) == Infinity ? 0 : +value.angle;
                }
                if (!value.colors || !(value.colors instanceof Array) || !value.colors.length) {
                    value = {...value, colors: [{...value, pos: 0}]};
                }
                let lastPos = 0;
                result.colors = value.colors.map(color => ({
                    r: isNaN(color.r) ? 0 : Math.min(1, Math.max(0, color.r)),
                    g: isNaN(color.g) ? 0 : Math.min(1, Math.max(0, color.g)),
                    b: isNaN(color.b) ? 0 : Math.min(1, Math.max(0, color.b)),
                    a: isNaN(color.a) ? 0 : Math.min(1, Math.max(0, color.a)),
                    pos: isNaN(color.pos) ? lastPos : lastPos = Math.min(1, Math.max(0, color.pos)),
                }));
                if (result.colors.length == 1) {
                    result.colors.push({...result.colors[0], ...(result.colors[0].pos ? {} : {pos: 1})});
                }
                return {...result, ...ColorPopup.averageColor(result)};
            }
            return {
                type: "solid",
                r: isNaN(value.r) ? 0 : Math.min(1, Math.max(0, value.r)),
                g: isNaN(value.g) ? 0 : Math.min(1, Math.max(0, value.g)),
                b: isNaN(value.b) ? 0 : Math.min(1, Math.max(0, value.b)),
                a: isNaN(value.a) ? 0 : Math.min(1, Math.max(0, value.a)),
            };
        } else if (typeof value == "string") {
            // TODO Add support for more formats
            if (value.startsWith("[") || value.startsWith("{")) {
                try {
                    return ColorPopup.parseValue(JSON.parse(value));
                } catch (e) {
                    return undefined;
                }
            }
            value = value.startsWith("#") ? value.slice(1) : value;
            if (value.length == 3 || value.length == 4) {
                value = `${value[0].repeat(2) + value[1].repeat(2) + value[2].repeat(2)}${value.length > 3 ? value[3].repeat(2) : ""}`;
            }
            if (value.length == 6) {
                value += "FF";
            }
            if (value.length == 8) {
                return {
                    type: "solid",
                    r: +`0x${value[0]}${value[1]}` / 255 || 0,
                    g: +`0x${value[2]}${value[3]}` / 255 || 0,
                    b: +`0x${value[4]}${value[5]}` / 255 || 0,
                    a: +`0x${value[6]}${value[7]}` / 255 || 0,
                };
            }
        }
        return undefined;
    }

    #types = {solid: true, linear: false, radial: false};
    get types() {
        return {...this.#types};
    }
    set types(types) {
        if (types == "*") {
            types = Object.keys(this.types);
        } else if (typeof types == "string" && types != "*") {
            types = types.split(" ").map(type => type.split(",")).flat().filter(type => type);
        } else if (types instanceof Object) {
            types = Object.keys(types).filter(type => types[type]);
        }
        if (types instanceof Array) {
            types = types.reduce((map, type) => ({...map, [type]: types.indexOf(type) > -1}), {});
            if (this.enabledTypes(types).length) {
                this.#types = types;
                this.changeAttribute("types", this.enabledTypes().join(" "));
                // TODO Refresh
            }
        }
    }
    enabledTypes(types = this.#types) {
        return Object.keys(types).reduce((enabled, type) => types[type] ? enabled.concat(type) : enabled, []);
    }

    #value = {type: "solid", r: 1, g: 1, b: 1, a: 1};
    get value() {
        return {...this.#value, ...(this.#value.type == "solid" ? {} : {colors: this.#value.colors.map(color => ({...color}))})};
    }
    set value(value) {
        if (ColorPopup.parseValue(value)) {
            this.#value = ColorPopup.parseValue(value);
            this.changeAttribute("value", `${JSON.stringify(this.value)}`);
            this.refresh();
        }
    }

    get hex() {
        return `${Math.round(this.value.r * 255).toString(16).padStart(2, "0") + Math.round(this.value.g * 255).toString(16).padStart(2, "0") + Math.round(this.value.b * 255).toString(16).padStart(2, "0")}${this.alpha ? Math.round(this.value.a * 255).toString(16).padStart(2, "0") : ""}`.toUpperCase();
    }
    set hex(value) {
        this.value = value;
    }

    #alpha = false;
    get alpha() {
        return this.#alpha;
    }
    set alpha(alpha) {
        this.changeAttribute("alpha", this.#alpha = !!alpha);
        this.querySelectorAll(".alpha").forEach(e => {
            e.parentElement.toggleAttribute("hidden", !alpha);
            ResizeEvent.dispatch(e.parentElement);
        });
        this.querySelectorAll("color-input").forEach(e => e.alpha = this.alpha);
        if (this.#value.type != "solid") {
            this.querySelectorAll(".advanced-gradient-slider").forEach(e => e.setAttribute("style", `background:${ColorPopup.colorToBackground({type: "linear", colors: this.#value.colors}, this.alpha && "fake")}`));
        }
        this.querySelectorAll(".cancel").forEach(e => e.style.background = ColorPopup.colorToBackground(JSON.parse(e.getAttribute("value")), this.alpha && "fake"));
        this.querySelectorAll(".done").forEach(e => e.style.background = ColorPopup.colorToBackground(this.#value, this.alpha && "fake"));
    }

    get refresh() {
        return (element = undefined) => {
            if ($(this).connected && this.innerHTML) {
                if (this.#value.type == "solid") {
                    let rgbToHsl = (r, g, b) => {
                        let max = Math.max(r, g, b);
                        let min = Math.min(r, g, b);
                        let d = max - min;
                        return d ? {h: (max == r ? (g - b) / d + (g < b ? 6 : 0) : max == g ? (b - r) / d + 2 : (r - g) / d + 4) / 6, s: d / (max + min > 1 ? 2 - max - min : max + min), l: (max + min) / 2} : {h: 0, s: 0, l: (max + min) / 2};
                    };
                    let hslToRgb = (h, s, l) => {
                        let f = n => {
                            let k = (n + h * 12) % 12;
                            return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
                        };
                        return {r: f(0), g: f(8), b: f(4)};
                    };
                    let rgbToHex = (r, g = r, b = r) => `#${Math.round((r.r ?? r) * 255).toString(16).padStart(2, "0")}${Math.round((g.g ?? g) * 255).toString(16).padStart(2, "0")}${Math.round((b.b ?? b) * 255).toString(16).padStart(2, "0")}`.toUpperCase();
                    let get = name => element.parentElement.parentElement.querySelector(`${$(element).tag}.${name}`).value / +element.parentElement.parentElement.querySelector(`input.${name}`).max;
                    if (element) {
                        if (element.className == "code") {
                            if (ColorPopup.parseValue(element.value)) {
                                this.#value = ColorPopup.parseValue(element.value);
                                this.changeAttribute("value", `${this.value}`);
                            }
                        } else if (["hsl", "rgb"].indexOf(element.parentElement.parentElement.className) > -1) {
                            Object.assign(this.#value, element.parentElement.parentElement.className == "hsl" ? hslToRgb(get("hue"), get("saturation"), get("lightness")) : {r: get("red"), g: get("green"), b: get("blue")});
                            this.#value.a = get("alpha");
                        }
                    }
                    let set = (tab, name, value) => ["input", "number-input"].forEach(input => {
                        if (!element || element.parentElement.parentElement.className != tab || element.className == name && $(element).tag != input) {
                            $(this, `.${tab} ${input}.${name}`).set({value: value * +$(this, `.${tab} input.${name}`).raw.max});
                        }
                    });
                    let hsl = element && element.parentElement.parentElement.className == "hsl" ? {h: get("hue"), s: get("saturation"), l: get("lightness")} : rgbToHsl(this.value.r, this.value.g, this.value.b);
                    set("hsl", "hue", hsl.h);
                    set("hsl", "saturation", hsl.s);
                    set("hsl", "lightness", hsl.l);
                    set("hsl", "alpha", this.value.a);
                    set("rgb", "red", this.value.r);
                    set("rgb", "green", this.value.g);
                    set("rgb", "blue", this.value.b);
                    set("rgb", "alpha", this.value.a);
                    $(this, ".hsl .hue").style({background: `linear-gradient(to right in hsl, ${rgbToHex(hslToRgb(0, hsl.s, hsl.l))}, ${rgbToHex(hslToRgb(1 / 3, hsl.s, hsl.l))}, ${rgbToHex(hslToRgb(2 / 3, hsl.s, hsl.l))}, ${rgbToHex(hslToRgb(1, hsl.s, hsl.l))})`});
                    $(this, ".hsl .saturation").style({background: `linear-gradient(to right, ${rgbToHex(hslToRgb(hsl.h, 0, hsl.l))}, ${rgbToHex(hslToRgb(hsl.h, 1, hsl.l))})`});
                    $(this, ".hsl .lightness").style({background: `linear-gradient(to right, ${rgbToHex(hslToRgb(hsl.h, hsl.s, 0))}, ${rgbToHex(hslToRgb(hsl.h, hsl.s, .5))}, ${rgbToHex(hslToRgb(hsl.h, hsl.s, 1))})`});
                    $(this, ".rgb .red").style({background: `linear-gradient(to right, ${rgbToHex(0, this.value.g, this.value.b)}, ${rgbToHex(1, this.value.g, this.value.b)})`});
                    $(this, ".rgb .green").style({background: `linear-gradient(to right, ${rgbToHex(this.value.r, 0, this.value.b)}, ${rgbToHex(this.value.r, 1, this.value.b)})`});
                    $(this, ".rgb .blue").style({background: `linear-gradient(to right, ${rgbToHex(this.value.r, this.value.g, 0)}, ${rgbToHex(this.value.r, this.value.g, 1)})`});
                    $(this, ".alpha").style({background: ColorPopup.colorToBackground({type: "linear", colors: [{...this.value, a: 0, pos: 0}, {...this.value, a: 1, pos: 1}]}, "fake")});
                    if (!element || element.className != "hex") {
                        $(this, ".color").set({value: `#${this.hex}`});
                    }
                }
                else {
                    if ($(this, "tab-content.solid").get("shown")) {
                        $(this, ".simple-toggle").raw.toggled = true;
                        $(this, ".simple-gradient").raw.hidden = false;
                    }
                    $(this, ".angle").raw.hidden = this.#value.type != "linear";
                    $(this, "angle-input").set({value: this.#value.angle});
                    if ($(this, ".simple-toggle").get("toggled")) {
                        if (element) {
                            if (element.matches("color-input")) {
                                Object.assign(this.#value.colors[$(element).parent.siblings.matching(":not(.removed)").indexOf($(element).parent)], element.value);
                            }
                        }
                        $(this, `.from`).raw.value = this.#value.colors[0];
                        $(this, `.to`).raw.value = this.#value.colors[1];
                        $(this, ".simple-gradient").raw.hidden = false;
                    } else {
                        let addAdvancedStep = (color, animated) => {
                            let changePos = (element, slider) => {
                                if (slider) {
                                    let value = element.value;
                                    element = $(this, ".advanced-gradient div > :not(.removed)", $(this, ".advanced-gradient-slider :not(.removed)").indexOf(element)).select("number-input").raw;
                                    element.value = value / 100;
                                }
                                let i = $(this, ".advanced-gradient div > :not(.removed)").indexOf($(element).parent);
                                $(this, ".advanced-gradient-slider :not(.removed)", i).raw.value = element.value * 100;
                                let j = i;
                                while (j && this.#value.colors[j - 1].pos > element.value || this.#value.colors[j + 1] && this.#value.colors[j + 1].pos < element.value) {
                                    j += this.#value.colors[j + 1] && this.#value.colors[j + 1].pos < element.value ? 1 : -1;
                                }
                                let color = this.#value.colors[i];
                                color.pos = element.value;
                                if (i - j) {
                                    let selection = $(element).containsFocused && $(document.activeElement).selection;
                                    this.#value.colors.splice(j, 0, this.#value.colors.splice(i, 1)[0]);
                                    let slider = $(this, ".advanced-gradient-slider > :not(.removed)", i).raw;
                                    let k = i;
                                    while (j - k) {
                                        $(slider).parent.insert($(slider).parent.select(":not(.removed)").at(k += Math.sign(j - i)), j > i ? $(slider) : $(slider).parent.select(":not(.removed)").at(k + 2));
                                    }
                                    let offsets = $(this, ".advanced-gradient div > :not(.removed)").map(e => parseFloat(e.styles.transform.split(",")[5]) || 0);
                                    k = i;
                                    while (j != k) {
                                        let e = $(this, ".advanced-gradient div span:not(.removed)", k).style({position: "", zIndex: ""}).style({transform: [`translateY(${32 * Math.sign(j - i) + offsets[k + Math.sign(j - i)]}px)`, ""]}, 200);
                                        e.select("number-input").raw.value = this.#value.colors[k].pos;
                                        e.select("color-input").raw.value = this.#value.colors[k];
                                        k += Math.sign(j - i);
                                    }
                                    let e = $(this, ".advanced-gradient div span:not(.removed)", j).style({position: "relative", zIndex: 1}).style({transform: [`translateY(${(i - j) * 32 + offsets[i]}px)`, ""]}, 200);
                                    e.select("number-input").raw.value = this.#value.colors[j].pos;
                                    e.select("color-input").raw.value = this.#value.colors[j];
                                    element = $(this, ".advanced-gradient div span:not(.removed)", j, "number-input").raw;
                                    if (selection) {
                                        $(element, "input").focus().selection = selection;
                                    }
                                }
                            };
                            $(this, ".advanced-gradient-slider").insert($new("input").set({tName: "color.gradient.advanced.position", type: "range", value: color.pos * 100, min: 0, max: 100, tabindex: -1}).style({opacity: [0, 1]}, animated * 200).listen("input", e => {
                                changePos(e.target, true);
                                this.refresh($new("a")); // TODO
                            }), $(this, ".advanced-gradient-slider :not(.removed)").at(animated ? color.i : Infinity));
                            let span = $new("span").setClasses(animated ? "added" : undefined).add(
                                $new("number-input").set({tName: "color.gradient.advanced.position", type: "number", unit: "%", min: 0, max: 1, interval: .01, value: color.pos}).listen("change", e => {
                                    changePos(e.target, false);
                                    this.refresh($new("a")); // TODO
                                }),
                                $new("color-input").set({tName: "color.gradient.advanced.color", value: JSON.stringify(color)}).listen("change", () => {
                                    Object.assign(this.#value.colors[$(this, ".advanced-gradient div > :not(.removed)").indexOf(span)], span.select("color-input").raw.value);
                                    this.refresh($new("a")); // TODO
                                }),
                                $new("button").setClasses("remove").listen("click", () => {
                                    let i = $(this, ".advanced-gradient div > :not(.removed)").indexOf(span);
                                    this.#value.colors.splice(i, 1);
                                    let slider = $(this, ".advanced-gradient-slider :not(.removed)").at(i).addClass("removed").set("inert").style({opacity: 0}, 200);
                                    span.addClass("removed").style({height: 0, opacity: .5}, 200);
                                    ResizeEvent.dispatch(span.raw);
                                    setTimeout(() => {
                                        slider.delete();
                                        span.delete();
                                    }, 200);
                                    this.refresh($new("a")); // TODO
                                }).add($new(`<svg height="16" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3 3L13 13M3 13L13 3"></svg>`)),
                            ).style({height: [0, "32px"], opacity: [.5, 1]}, animated * 200);
                            $(this, ".advanced-gradient div").insert(span, $(this, ".advanced-gradient div > :not(.removed)").at(animated ? color.i : Infinity));
                            ResizeEvent.dispatch(span.raw);
                        };
                        $(this, ".add").raw.onclick = () => {
                            if (this.#value.colors.length > 8) {
                                return;
                            }
                            let color = this.#value.colors.reduce((best, c, i, cs) => (cs[i + 1] ? (cs[i + 1].pos - c.pos) / 2 : 1 - c.pos) < best.dist ? best : {...(cs[i + 1] ? Object.fromEntries(["r", "g", "b", "a"].map(k => [k, (c[k] + cs[i + 1][k]) / 2])) : c), i: i + 1, pos: cs[i + 1] ? (c.pos + cs[i + 1].pos) / 2 : 1, dist: cs[i + 1] ? (cs[i + 1].pos - c.pos) / 2 : 0}, {...this.#value.colors[0], i: 0, pos: 0, dist: this.#value.colors[0].pos});
                            this.#value.colors.splice(color.i, 0, Object.fromEntries(["r", "g", "b", "a", "pos"].map(k => [k, color[k]])));
                            addAdvancedStep(color, true);
                        };
                        if (element) {
                        } else {
                            $(this, ".advanced-gradient-slider").empty();
                            $(this, ".advanced-gradient div").empty();
                            this.#value.colors.map(color => addAdvancedStep(color, false));
                        }
                        $(this, ".advanced-gradient-slider").style({background: ColorPopup.colorToBackground({type: "linear", colors: this.#value.colors}, this.alpha && "fake")});
                        $(this, ".advanced-gradient .add").set({disabled: this.#value.colors.length > 8});
                        $(this, ".advanced-gradient .remove").set({disabled: this.#value.colors.length < 3});
                        $(this, ".advanced-gradient").raw.hidden = false;
                    }
                }
                $(this, "list-select").raw.selected = this.#value.type;
                $(this, `tab-content.${this.#value.type == "solid" ? "solid" : "gradient"}`).raw.hidden = false;
                $(this, ".done").style({background: ColorPopup.colorToBackground(this.#value, this.alpha && "fake"), color: .299 * this.#value.r + .587 * this.#value.g + .114 * this.#value.b > .51 ? "var(--d4)" : "var(--bD)"});
                if (element) {
                    if (this.onchange instanceof Function) {
                        this.onchange(new ColorPopup.ChangeEvent(this.value));
                    }
                    this.dispatchEvent(new ColorPopup.ChangeEvent(this.value));
                }
            }
        };
    }

    get content() {
        let colorPalette = [
            ["FFFFFF", "D4D4D4", "ABABAB", "808080", "545454", "2B2B2B", "000000"], // Gray
            ["AAE4AA", "7FD77F", "54C954", "2ABC2A", "219621", "197119", "114B11"], // Green
            ["A3DEDE", "75CDCD", "47BCBC", "19ACAC", "148989", "0F6767", "0A4545"], // Cyan
            ["B4D1EE", "8FBAE6", "6AA3DE", "448CD5", "3770AB", "295480", "1B3855"], // Blue
            ["D2BEFA", "BB9EF7", "A57EF4", "9061F1", "744EC1", "573A90", "3A2760"], // Violet
            ["E7B7F1", "DB93EA", "CF6FE3", "C34BDB", "9C3CB0", "752D84", "4E1E58"], // Magenta
            ["F4BBBB", "EF9999", "EA7777", "E55454", "B74444", "893333", "5B2222"], // Red
            ["FFF2B3", "FFE980", "FFD300", "FFB100", "FF9300", "E65E00", "B33A00"] // Yellow/Orange
        ];
        let onChange = () => {
            if (this.onchange instanceof Function) {
                this.onchange(this.value);
            }
            this.dispatchEvent(new ColorPopup.ChangeEvent(this.value));
        };
        return {
            name: "",
            newContent: [
                $new("toggleable-section").set({hidden: this.enabledTypes().length < 2}).add(
                    $new("list-select").set({options: `[{"options":[${this.enabledTypes().map(type => `{"id":"${type}","tName":"color.${type}"}`).join(",")}]}]`, selected: this.value.type}).listen("select", e => {
                        this.value = Object.assign(this.value, {type: e.option});
                        onChange();
                    }),
                ),
                $new("tabs").add(
                    $new("tab-content").setClasses("solid").set({hidden: this.value.type != "solid"}).add(
                        $new("button-group").add(
                            $new("toggle-button", 3).set({group: "pickerType"}).forEach((e, i) => e.set({toggleElement: [".grid", ".hsl", ".rgb"][i], t: ["color.solid.grid", "color.solid.hsl", "color.solid.rgb"][i], toggled: !i})),
                        ),
                        $new("tabs").add(
                            $new("tab-content").setClasses("grid").add(
                                $new("button-grid").add(
                                    colorPalette.map(row => $new("span").add(
                                        row.map(color => $new("button").listen("mouseup", () => {
                                            if (this.quickSelect) {
                                                this.hidden = true;
                                            }
                                            this.value = `${color}`;
                                            onChange();
                                        }).style({background: `#${color}`})),
                                    )),
                                ),
                            ),
                            $new("tab-content").setClasses("sliders").set("hidden").add(
                                $new("tabs").set("stacked").add(
                                    $new("tab-content").setClasses("hsl").set("hidden").add(
                                        $new("span").add($new("input").setClasses("hue").set({tName: "color.solid.hue", type: "range", min: 0, max: 360, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("hue").set({tName: "color.solid.hue", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").add($new("input").setClasses("saturation").set({tName: "color.solid.saturation", type: "range", min: 0, max: 100, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("saturation").set({tName: "color.solid.saturation", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").add($new("input").setClasses("lightness").set({tName: "color.solid.lightness", type: "range", min: 0, max: 100, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("lightness").set({tName: "color.solid.lightness", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").set({hidden: !this.alpha}).add($new("input").setClasses("alpha").set({tName: "color.solid.alpha", type: "range", min: 0, max: 100, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("alpha").set({tName: "color.solid.alpha", decimals: 0}).listen(e => this.refresh(e.target))),
                                    ),
                                    $new("tab-content").setClasses("rgb").set("hidden").add(
                                        $new("span").add($new("input").setClasses("red").set({tName: "color.solid.red", type: "range", min: 0, max: 255, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("red").set({tName: "color.solid.red", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").add($new("input").setClasses("green").set({tName: "color.solid.green", type: "range", min: 0, max: 255, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("green").set({tName: "color.solid.green", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").add($new("input").setClasses("blue").set({tName: "color.solid.blue\"", type: "range", min: 0, max: 255, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("blue").set({tName: "color.solid.blue", decimals: 0}).listen(e => this.refresh(e.target))),
                                        $new("span").set({hidden: !this.alpha}).add($new("input").setClasses("alpha").set({tName: "color.solid.alpha", type: "range", min: 0, max: 255, tabindex: -1}).listen("input", e => this.refresh(e.target)), $new("number-input").setClasses("alpha").set({tName: "color.solid.alpha", decimals: 0}).listen(e => this.refresh(e.target))),
                                    ),
                                ),
                                $new("text-input").add(
                                    $new("input").setClasses("code").set({tName: "color.solid.code", value: "#"}).listen(e => this.refresh(e.target)),
                                ),
                                $new("span").add(
                                    $new("button").setClasses("cancel").set({value: JSON.stringify(this.value), t: "color.cancel"}).style({background: ColorPopup.colorToBackground(this.value, this.alpha && "fake"), color: .299 * this.value.r + .587 * this.value.g + .114 * this.value.b > .51 ? "var(--d4)" : "var(--bD)"}).listen("click", e => {
                                        this.hidden = true;
                                        this.value = JSON.parse($(e.target).get("value"));
                                        onChange();
                                    }),
                                    $new("button").setClasses("done").set({t: "color.done"}).listen("click", () => this.hidden = true),
                                ),
                            ),
                        ),
                    ),
                    $new("tab-content").setClasses("gradient").set({hidden: this.value.type == "solid"}).add(
                        $new("button-group").add(
                            $new("toggle-button").setClasses("simple-toggle").set({group: "Picker Variant", t: "color.gradient.simple", toggled: !this.value.colors || this.value.colors.length == 2 && this.value.colors[0].pos == 0 && this.value.colors[1].pos == 1}).listen("toggle", () => {
                                this.value = {...this.value, colors: [{...this.value.colors[0], pos: 0}, {...this.value.colors[this.value.colors.length - 1], pos: 1}]};
                                onChange();
                            }),
                            $new("toggle-button").setClasses("advanced-toggle").set({group: "Picker Variant", t: "color.gradient.advanced", toggled: this.value.colors && (this.value.colors.length > 2 || this.value.colors[0].pos > 0 || this.value.colors[1].pos < 1)}).listen("toggle", () => this.refresh()),
                        ),
                        $new("toggleable-section").setClasses("angle").set({hidden: this.value.type != "linear"}).add(
                            $new("button-group").add(
                                $new("button").listen("click", () => {
                                    $(this, ".angle angle-input").raw.value = 0;
                                    $(this, ".angle angle-input").dispatch(new AngleInput.ChangeEvent(0));
                                }).add($new(`<svg height="16" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M1.5 8H14M10 3.5L14.5 8L10 12.5"></svg>`)),
                                $new("button").listen("click", () => {
                                    $(this, ".angle angle-input").raw.value = 90;
                                    $(this, ".angle angle-input").dispatch(new AngleInput.ChangeEvent(90));
                                }).add($new(`<svg height="16" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M8 1.5V14M3.5 10L8 14.5L12.5 10"/></svg>`)),
                            ),
                            $new("angle-input").set({tName: "color.linear.direction", numberInput: "number-input", value: 0}).listen("change", e => {
                                this.value = {...this.value, angle: e.target.value};
                                onChange();
                            }),
                            $new("number-input").set({interval: 5}),
                        ),
                        $new("tabs").add(
                            $new("tab-content").setClasses("simple-gradient").set({hidden: this.value.colors && (this.value.colors.length > 2 || this.value.colors[0].pos > 0 || this.value.colors[1].pos < 1)}).add(
                                $new("color-input").setClasses("from").listen("change", e => {
                                    this.value = {...this.value, colors: [{...e.value, pos: 0}, this.value.colors[1]]};
                                    onChange();
                                }),
                                $new("color-input").setClasses("to").listen("change", e => {
                                    this.value = {...this.value, colors: [this.value.colors[0], {...e.value, pos: 1}]};
                                    onChange();
                                }),
                            ),
                            $new("tab-content").setClasses("advanced-gradient").set({hidden: !this.value.colors || this.value.colors.length == 2 && this.value.colors[0].pos == 0 && this.value.colors[1].pos == 1}).add(
                                $new("span").add(
                                    $new("span").setClasses("advanced-gradient-slider", "button-highlights"),
                                    $new("button").setClasses("add").listen("click", e => this.refresh(e.target)).add($new(`<svg height="16" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M2 8H14M8 2V14"></svg>`)),
                                ),
                                $new("div"),
                            )
                        ),
                        $new("span").add(
                            $new("button").setClasses("cancel").set({value: JSON.stringify(this.value), t: "color.cancel"}).style({background: ColorPopup.colorToBackground(this.value, this.alpha && "fake"), color: .299 * this.value.r + .587 * this.value.g + .114 * this.value.b > .51 ? "var(--d4)" : "var(--bD)"}).listen("click", e => {
                                this.hidden = true;
                                this.value = JSON.parse($(e.target).get("value"));
                                onChange();
                            }),
                            $new("button").setClasses("done").set({t: "color.done"}).listen("click", () => this.hidden = true),
                        ),
                    ),
                ),
            ],
            onload: this.refresh,
        };
    }

    onchange;

    constructor() {
        super("value", "alpha");
        this.maxHeight = 350;
    }
}
customElements.define("color-popup", ColorPopup);

class ColorInput extends QuillUiElement {
    #popup = document.createElement("color-popup");
    #positionPopup = () => {
        this.#popup.left = (this.getBoundingClientRect().left + this.getBoundingClientRect().right) / 2;
        this.#popup.top = this.getBoundingClientRect().bottom;
        this.#popup.width = 200;
    };

    get name() {
        return this.#popup.name;
    }
    set name(name) {
        this.#popup.name = name;
        this.changeAttribute("name", this.#popup.getAttribute("name"));
    }

    get types() {
        return this.#popup.types;
    }
    set types(types) {
        this.#popup.types = types;
        this.changeAttribute("types", this.#popup.getAttribute("types"));
    }

    get value() {
        return this.#popup.value;
    }
    set value(value) {
        this.#popup.value = value;
        this.changeAttribute("value", this.#popup.getAttribute("value"));
        this.changeAttribute("style", `background:${ColorPopup.colorToBackground(this.value, this.alpha && "fake")};`);
    }

    get hex() {
        return this.#popup.hex;
    }
    set hex(value) {
        this.#popup.hex = value;
    }

    get alpha() {
        return this.#popup.alpha;
    }
    set alpha(alpha) {
        this.#popup.alpha = alpha;
        this.changeAttribute("alpha", this.alpha);
        this.changeAttribute("style", `background:${ColorPopup.colorToBackground(this.value, this.alpha && "fake")};`);
    }

    onchange;

    constructor() {
        super("name", "types", "value", "alpha");
        this.#popup.animationFrameFunctions.push(this.#positionPopup);
        this.#popup.onchange = () => {
            this.changeAttribute("value", this.#popup.getAttribute("value"));
            this.changeAttribute("style", `background:${ColorPopup.colorToBackground(this.value, this.alpha && "fake")};`);
            if (this.onchange instanceof Function) {
                this.onchange(new ColorPopup.ChangeEvent(this.value));
            }
            this.dispatchEvent(new ColorPopup.ChangeEvent(this.value));
        };
    }
    onconnect() {
        if (!this.hasAttribute("tabindex")) {
            this.changeAttribute("tabindex", 0);
        }
        this.#popup.hidden = true;
        this.onmousedown = () => {
            if (this.#popup.hidden) {
                this.#popup.hidden = false;
                this.#popup.noQuickSelect = this.getBoundingClientRect();
                this.#popup.stayOpen = true;
                setTimeout(() => this.#popup.stayOpen = false);
            }
        };
        Popup.container.add(this.#popup);
    }
    ondisconnect() {
        this.#popup.remove();
    }
}
customElements.define("color-input", ColorInput);

class LineInput extends QuillUiElement {
    static ChangeEvent = class ChangeEvent extends Event {
        constructor(value) {
            super("change", {composed: true, bubbles: true});
            this.value = value;
        }
    };

    #value = {style: "none"}; // TODO Store default values somewhere and make them consistent.
    get value() {
        return structuredClone(this.#value);
    }
    set value(value) {
        if (value) {
            this.#value.style = ["none", "solid", "dashed", "dotted", "wave", "stacked"].indexOf(value?.style) > -1 ? value.style : value?.style ? "none" : this.#value.style;
            ["width", "length", "gap", "size", "color", "space"].forEach(option => this.#value[option] = value?.[option] ?? this.#value[option]);
            if (this.#value.style == "stacked" && value?.lines instanceof Array) {
                this.#value.lines = [];
                for (let i = 0; i < 5 && i < value.lines.length; i++) {
                    let line = {};
                    line.style = ["solid", "dashed", "dotted"].indexOf(value.lines[i]?.style) > -1 ? value.lines[i].style : "solid";
                    ["width", "length", "gap", "size", "color"].forEach(option => line[option] = value.lines[i]?.[option] ?? line[option]);
                    this.#value.lines.push(line);
                }
            }
            if (this.innerHTML.trim()) {
                this.#update();
                if (this.#value.color) {
                    this.#value.color = this.querySelector(".color").value;
                } else if (this.#value.lines) {
                    this.#value.lines.forEach((line, i) => line.color = this.querySelectorAll(".stacked-line:not(.removed)")[i].querySelector(".color").value);
                }
            }
        }
    }

    #sizeType = "length"; // TODO
    #sizeUnit = "px";

    #update() {
        let callEvent = () => {
            if (this.onchange instanceof Function) {
                this.onchange(new LineInput.ChangeEvent(this.value));
            }
            this.dispatchEvent(new LineInput.ChangeEvent(this.value));
        };
        this.querySelector(".style").selected = this.#value.style;
        if (this.#value.style == "stacked") {
            if (!this.#value.lines) {
                this.querySelector(".stacked div").innerHTML = "";
            }
            this.#value.lines ??= [];
            this.#value.space ??= this.#value.width ?? .04;
            if (!this.#value.lines.length) {
                this.#value.lines = [{}];
            }
            this.#value.lines.forEach(line => {
                line.style ??= this.#value.length != undefined ? "dashed" : this.#value.gap != undefined ? "dotted" : "solid";
                line.color ??= this.#value.color ?? {type: "solid", r: .26666666666666666, g: .5490196078431373, b: .8352941176470589, a: 1};
                line.width ??= this.#value.width ?? .04;
                if (line.style == "dashed" || line.style == "dotted") {
                    line.gap ??= this.#value.gap ?? .1;
                } else {
                    delete line.gap;
                }
                if (line.style == "dashed") {
                    line.length ??= this.#value.length ?? .1;
                } else {
                    delete line.length;
                }
            });
            if (this.#value.lines.length < 2) {
                this.#value.lines.push({...this.#value.lines[0]});
            }
            delete this.#value.width;
            delete this.#value.color;
            let addLine = (line, i) => {
                this.querySelector(".stacked div").innerHTML +=  `
                    <div class="stacked-line">
                        <span>
                            <a t="colon[t:line.n[n:&quot;${i + 1}&quot;]]"></a>
                            <span grow="2"><list-select class="style" t-name="line.style.n[n:&quot;${i + 1}&quot;]" options='[{"options":[{"id":"solid","tName":"line.solid"},{"id":"dashed","tName":"line.dashed"},{"id":"dotted","tName":"line.dotted"}]}]' selected="${line.style}"></list-select></span>
                        </span>
                        <tabs>
                            <tab-content class="solid" ${line.style == "solid" ? "shown" : "hidden"}>
                                <span>
                                    <span><number-input class="width" t-name="line.width" type="number" unit="%" min="0" value="0.04" interval="0.01"></number-input></span>
                                    <span><color-input class="color" t-name="line.color" types="*"></color-input></span>
                                </span>
                            </tab-content>
                            <tab-content class="dashed" ${line.style == "dashed" ? "shown" : "hidden"}>
                                <span>
                                    <span grow="3"><number-input class="width" t-name="line.width" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                                    <span grow="3"><number-input class="length" t-name="line.dash-length" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                                    <span grow="3"><number-input class="gap" t-name="line.dash-gap" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                                    <span grow="2"><color-input class="color" t-name="line.color" types="*"></color-input></span>
                                </span>
                            </tab-content>
                            <tab-content class="dotted" ${line.style == "dotted" ? "shown" : "hidden"}>
                                <span>
                                    <span><number-input class="width" t-name="line.width" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                                    <span><number-input class="gap" t-name="line.dot-gap" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                                    <span><color-input class="color" t-name="line.color" types="*"></color-input></span>
                                </span>
                            </tab-content>
                        </tabs>
                    </div>
                `.replaceAll("\n", "").replaceAll("    ", "");
            };
            if (this.querySelector(".stacked div").innerHTML) {
                this.#value.lines.forEach((line, i) => {
                    if (this.querySelectorAll(".stacked-line:not(.removed)").length > i) {
                        ["solid", "dashed", "dotted"].forEach(option => this.querySelectorAll(".stacked-line:not(.removed)")[i].querySelector(`.${option}`).hidden = line.style != option);
                    } else {
                        addLine(line, i);
                        let elem = this.querySelectorAll(".stacked-line")[this.querySelectorAll(".stacked-line").length - 1];
                        elem.setAttribute("style", "height: 0; opacity: .5;");
                        elem.offsetHeight;
                        elem.setAttribute("style", "height: 64px; overflow: hidden; transition: .2s height, .2s opacity;");
                        ResizeEvent.dispatch(elem);
                        setTimeout(() => {
                            if (elem.className == "added") {
                                elem.removeAttribute("class");
                                elem.removeAttribute("style");
                            }
                        }, 200);
                    }
                });
                while (this.querySelectorAll(".stacked-line:not(.removed)").length > this.#value.lines.length) {
                    let elem = this.querySelectorAll(".stacked-line:not(.removed)")[this.#value.lines.length];
                    elem.classList.add("removed");
                    elem.setAttribute("style", "height: 64px;");
                    elem.offsetHeight;
                    elem.setAttribute("style", "overflow: hidden; transition: .2s height, .2s opacity; height: 0; opacity: .5;");
                    ResizeEvent.dispatch(elem);
                    setTimeout(() => elem.remove(), 200);
                }
            } else {
                this.#value.lines.forEach((line, i) => addLine(line, i));
            }
            this.querySelector(".stacked .count").value = this.#value.lines.length;
            this.querySelector(".stacked .space").value = this.#value.space;
            this.#value.lines.forEach((line, i) => {
                let elem = this.querySelectorAll(`.stacked-line:not(.removed)`)[i].querySelector(".style");
                elem.selected = line.style;
                elem.onselect = e => {
                    this.#value.lines[i].style = e.option;
                    this.#update();
                    callEvent();
                };
                ["width", "length", "gap", "size", "color"].forEach(option => this.querySelectorAll(`.stacked-line:not(.removed)`)[i].querySelectorAll(`.${option}`).forEach(elem => elem.value = line[option] || 0));
            });
        } else {
            this.#value.color ??= this.#value.lines?.[0].color ?? {type: "solid", r: .26666666666666666, g: .5490196078431373, b: .8352941176470589, a: 1};
            this.#value.width ??= this.#value.lines?.[0].width ?? .04;
        }
        if (this.#value.style == "dashed" || this.#value.style == "dotted") {
            this.#value.gap ??= this.#value.lines?.[0].gap ?? .1;
        } else {
            delete this.#value.gap;
        }
        if (this.#value.style == "dashed") {
            this.#value.length ??= this.#value.lines?.[0].length ?? .1;
        } else {
            delete this.#value.length;
        }
        if (this.#value.style == "wave") {
            this.#value.size ??= this.#value.lines?.[0].size ?? .1;
        } else {
            delete this.#value.size;
        }
        if (this.#value.style != "stacked") {
            delete this.#value.lines;
            delete this.#value.space;
        }
        ["none", "solid", "dashed", "dotted", "wave", "stacked"].forEach(option => this.querySelector(`.${option}`).hidden = this.#value.style != option);
        ["width", "length", "gap", "size", "color"].forEach(option => this.querySelectorAll(`.${option}:not(.stacked *)`).forEach(e => e.value = this.#value[option]));
        this.querySelector(".style").onselect = e => {
            this.#value.style = e.option;
            this.#update();
            callEvent();
        };
        [{elem: this, value: this.#value}, ...(this.#value.style == "stacked" ? this.#value.lines.map((line, i) => ({elem: this.querySelectorAll(".stacked-line:not(.removed)")[i], value: line})) : [])].forEach(({elem, value}) => ["width", "length", "gap", "size", "color"].forEach(option => elem.querySelectorAll(`.${option}:not(:scope .stacked *)`).forEach(elem => elem.onchange = e => {
            value[option] = e.value;
            callEvent();
        })));
        this.querySelector(".count").onchange = e => {
            if (e.value < 2) {
                this.#value.style = this.#value.lines[0].style;
                this.#update();
            } else {
                while (e.value < this.#value.lines.length) {
                    this.#value.lines.pop();
                }
                while (e.value > this.#value.lines.length) {
                    this.#value.lines.push({...this.#value.lines[this.#value.lines.length - 1]});
                }
                this.#update();
            }
        };
        this.querySelector(".space").onchange = e => {
            this.#value.space = e.value;
            this.#update();
        };
    }

    onchange;

    constructor() {
        super("value");
    }
    onconnect() {
        this.innerHTML = `
            <span><list-select class="style" t-name="line.style" options='[{"options":[{"id":"none","tName":"line.none"},{"id":"solid","tName":"line.solid"},{"id":"dashed","tName":"line.dashed"},{"id":"dotted","tName":"line.dotted"},{"id":"wave","tName":"line.wave"},{"id":"stacked","tName":"line.stacked"}]}]' selected="${this.#value.style}"></list-select></span>
            <tabs class="line-main">
                <tab-content class="none" ${this.#value.style == "none" ? "shown" : "hidden"}></tab-content>
                <tab-content class="solid" ${this.#value.style == "solid" ? "shown" : "hidden"}>
                    <span>
                        <span><number-input class="width" t-name="line.width" type="number" unit="%" min="0" value="0.04" interval="0.01"></number-input></span>
                        <span><color-input class="color" t-name="line.color" types="*"></color-input></span>
                    </span>
                </tab-content>
                <tab-content class="dashed" ${this.#value.style == "dashed" ? "shown" : "hidden"}>
                    <span>
                        <span grow="3"><number-input class="width" t-name="line.width" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span grow="3"><number-input class="length" t-name="line.dash-length" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span grow="3"><number-input class="gap" t-name="line.dash-gap" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span grow="2"><color-input class="color" t-name="line.color" types="*"></color-input></span>
                    </span>
                </tab-content>
                <tab-content class="dotted" ${this.#value.style == "dotted" ? "shown" : "hidden"}>
                    <span>
                        <span><number-input class="width" t-name="line.width" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span><number-input class="gap" t-name="line.dot-gap" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span><color-input class="color" t-name="line.color" types="*"></color-input></span>
                    </span>
                </tab-content>
                <tab-content class="wave" ${this.#value.style == "wave" ? "shown" : "hidden"}>
                    <span>
                        <span><number-input class="width" t-name="line.width" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span><number-input class="size" t-name="line.wave-size" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                        <span><color-input class="color" t-name="line.color" types="*"></color-input></span>
                    </span>
                </tab-content>
                <tab-content class="stacked" ${this.#value.style == "stacked" ? "shown" : "hidden"}>
                    <span>
                        <span><number-input class="count" t-name="line.count" type="number" min="1" max="5"></number-input></span>
                        <span><number-input class="space" t-name="line.space" type="number" unit="%" min="0" interval="0.01"></number-input></span>
                    </span>
                    <div></div>
                </tab-content>
            </tabs>
        `.replaceAll("\n", "").replaceAll("    ", "");
        this.#update();
    }
}
customElements.define("line-input", LineInput);
