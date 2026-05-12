/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Controls = class Controls {
    static controlToString(control = {}, codeToString = code => Key.fromCode(code).name) {
        let required = [];
        let prohibited = [];
        if (control instanceof Array) {
            required = control;
        } else if (control instanceof Object) {
            required = control.required || required;
            prohibited = control.prohibited || prohibited;
            if (control.shortcutKeyRequired) {
                required = [...required, /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Meta" : "Control"];
            }
        } else if (typeof control == "string") {
            required = [control];
        } else {
            return;
        }
        return required.map(codeToString).join(" + ") + prohibited.map(code => ` - ${codeToString(code)}`);
    }
    static controlToHtml(control = {}) {
        return this.controlToString(control, code => Key.fromCode(code).tName ? `<a t="${Key.fromCode(code).tName.replaceAll("&", "&amp;").replaceAll("\"", "&quot;")}"></a>` : `<a>${Key.fromCode(code).name.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</a>`);
    }

    #KeyCollector = class KeyCollector {
        #obj;

        get controls() {
            return this.#obj.controls;
        }

        get keys() {
            return [...this.#obj.keys];
        }
        asControl(ignoreModifierSides = false, useShortcutKey = false) {
            let keys = ignoreModifierSides ? [...new Set(this.keys.map(key => key.modifierCode || key.code))] : this.keys.map(key => key.code);
            if (keys.length == 1 && useShortcutKey && keys[0].indexOf(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Meta" : "Control") > -1) {
                return {shortcutKeyRequired: true};
            } else if (keys.length == 1) {
                return keys[0];
            } else if (keys.length && useShortcutKey && keys.find(key => key.indexOf(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Meta" : "Control") > -1)) {
                return {required: keys.filter(key => key.indexOf(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Meta" : "Control") < 0), shortcutKeyRequired: true};
            } else if (keys.length) {
                return {required: keys};
            }
        }

        get onFinish() {
            return this.#obj.onFinish;
        }
        set onFinish(onFinish) {
            this.#obj.onFinish = onFinish instanceof Function ? onFinish : () => {};
        }

        get onChange() {
            return this.#obj.onChange;
        }
        set onChange(onChange) {
            this.#obj.onChange = onChange instanceof Function ? onChange : () => {};
        }

        get cancel() {
            return this.#obj.cancel;
        }

        get done() {
            return this.#obj.done;
        }

        constructor(obj) {
            this.#obj = obj;
        }
    };

    #time;
    get time() {
        return this.#time;
    }
    set time(time) {
        this.#time = time instanceof globalThis.Time ? time : undefined;
    }

    definedControls = {};
    activeControls = {};

    update() {
        this.#mouseActions.apply(!!(document.pointerLockElement || navigator.maxTouchPoints));
        if (this.#focused = document.hasFocus()) {
            for (let control in this.definedControls) {
                let controlsHeldKeys = {};
                for (let key of this.definedControls[control] instanceof Array ? this.definedControls[control] : [this.definedControls[control]]) {
                    if (this.heldKey(key)) {
                        controlsHeldKeys[key] = this.heldKey(key);
                    }
                }
                if (!Object.keys(controlsHeldKeys).length) {
                    delete this.activeControls[control];
                } else if (this.activeControls[control]) {
                    this.activeControls[control].heldKeys = controlsHeldKeys;
                    this.activeControls[control].pressed = false;
                } else {
                    this.activeControls[control] = {
                        time: this.time && this.time.snapshot(),
                        mouse: this.mouse.snapshot(),
                        heldKeys: controlsHeldKeys,
                        pressed: true,
                    };
                }
            }
        } else {
            for (let control in this.activeControls) {
                delete this.activeControls[control];
            }
        }
    }

    #heldKeys = {};
    heldKey(key) {
        if (!key) {
            return;
        } else if (this.#heldKeys[key]) {
            return this.#heldKeys[key];
        } else if (key instanceof Object) {
            let held = (key.required || []).reduce((held, requiredKey) => held && this.heldKey(requiredKey), (key.prohibited || []).reduce((held, prohibitedKey) => held && !this.heldKey(prohibitedKey), !key.shortcutKeyRequired || this.heldKey(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Meta" : "Control")));
            return (key.exclusivelyRequired ? Object.values(this.#heldKeys).reduce((held, heldKey) => held && (key.required.indexOf(heldKey) > -1 || key.required.indexOf(this.#heldKeys[heldKey].modifierCode) > -1), held) : held) || undefined;
        }
        return Object.values(this.#heldKeys).find(heldKey => heldKey.modifierCode == key);
    }
    heldKeys() {
        return this.heldKeyCodes().map(code => this.#heldKeys[code]);
    }
    heldKeyCodes() {
        let keys = Object.values(this.#heldKeys);
        let arrows = ["Up", "Down", "Left", "Right"];
        let groups = {};
        keys.forEach(key => {
            let group = "other";
            if (key.device == "Keyboard") {
                group = `keyboard${key.modifierCode ? "Modifiers" : key.code.length == 1 && key.code != key.code.toLowerCase() ? "Letters" : !isNaN(+key.code) ? "Numbers" : arrows.indexOf(key.code) > -1 ? "Arrows" : key.code.length > 1 ? "Named" : "Other"}`;
            } else if (key.device == "Mouse") {
                group = `mouse${key.index < 4 ? "Main" : key.index ? "Additional" : "Other"}`;
            }
            (groups[group] = groups[group] || []).push(key);
        });
        Object.values(groups).forEach(group => group.sort((a, b) => a.code.localeCompare(b.code)));
        let modifierOrder = ["Shift", "Control", "Alt", "Meta"];
        (groups.keyboardModifiers || []).sort((a, b) => (modifierOrder.indexOf(a.modifierCode) + 1 || modifierOrder.length + 1) - (modifierOrder.indexOf(b.modifierCode) + 1 || modifierOrder.length + 1));
        (groups.keyboardArrows || []).sort((a, b) => arrows.indexOf(a.code) - arrows.indexOf(b.code));
        let groupOrder = ["keyboardModifiers", "keyboardLetters", "keyboardNumbers", "keyboardArrows", "keyboardNamed", "keyboardOther", "mouseMain", "mouseAdditional", "mouseOther"];
        return Object.entries(groups).sort((a, b) => (groupOrder.indexOf(a[0]) + 1 || groupOrder.length + 1) - (groupOrder.indexOf(b[0]) + 1 || groupOrder.length + 1)).reduce((keys, group) => keys.concat(group[1]), []).map(key => key.code);
    }
    heldShortcutKey() {
        return this.heldKey({shortcutKeyRequired: true});
    }

    #keyCollectors = [];
    collectKeys(onFinish = () => {}, onChange = () => {}) {
        let obj = {
            controls: this,
            keys: this.heldKeys(),
            onFinish: onFinish instanceof Function ? onFinish : () => {},
            onChange: onChange instanceof Function ? onChange : () => {},
            cancel: () => this.#keyCollectors.remove(obj),
            done: false,
        };
        obj.collector = new this.#KeyCollector(obj);
        this.#keyCollectors.push(obj);
        obj.onChange(obj.collector);
        return obj.collector;
    }

    #mouseActions = {};
    #mouse = new Mouse(undefined, undefined, this.#mouseActions);
    get mouse() {
        return this.#mouse;
    }

    #mouseElement = document;
    get mouseElement() {
        return this.#mouseElement;
    }
    set mouseElement(mouseElement) {
        this.#mouseElement = mouseElement == document || mouseElement instanceof Element ? mouseElement : this.#mouseElement;
    }

    #focused = document.hasFocus();
    get focused() {
        return this.#focused;
    }

    #confirmExit = false;
    get confirmExit() {
        return this.#confirmExit;
    }
    set confirmExit(confirmExit) {
        this.#confirmExit = !!confirmExit;
    }

    #events = {};

    constructor(time = undefined, definedControls = {}, mouseElement = document, confirmExit = false) {
        this.time = time;
        this.definedControls = definedControls;
        this.mouseElement = mouseElement;
        this.confirmExit = confirmExit;
        // Keyboard
        this.#events.onKeyDown = e => {
            let key = Key.fromEvent(e, this.time, this.mouse);
            if (!this.#heldKeys[key.code]) {
                this.#heldKeys[key.code] = key;
                if (key.code == "Escape") {
                    this.#keyCollectors.forEach(obj => {
                        obj.keys = [];
                        obj.done = true;
                        obj.onChange(obj.collector);
                        obj.onFinish(obj.collector);
                    });
                    this.#keyCollectors = [];
                } else {
                    this.#keyCollectors.forEach(obj => {
                        obj.keys = this.heldKeys();
                        obj.onChange(obj.collector);
                    });
                }
            }
            if (this.#keyCollectors.length || this.mouse.captured && key.code == "Tab") {
                e.preventDefault();
            }
            Object.values(this.definedControls).filter(control => control).forEach(control => (control instanceof Array ? control : [control]).forEach(requiredKey => {
                (requiredKey == key.code || requiredKey == key.modifier) && e.preventDefault();
                (requiredKey && requiredKey.required || []).forEach(requiredKeyName => (requiredKeyName == key.code || requiredKeyName == key.modifier) && e.preventDefault());
            }));
        };
        window.addEventListener("keydown", this.#events.onKeyDown);
        this.#events.onKeyUp = e => {
            let key = this.#heldKeys[Key.fromEvent(e, this.time, this.mouse).code];
            if (key) {
                delete this.#heldKeys[key.code];
                if (!this.heldKeys().length) {
                    this.#keyCollectors.forEach(obj => {
                        obj.done = true;
                        obj.onFinish(obj.collector);
                    });
                    this.#keyCollectors = [];
                }
            }
        };
        window.addEventListener("keyup", this.#events.onKeyUp);
        // Mouse
        this.#events.onMouseDown = e => {
            if (this.mouseElement.contains(e.activeTarget)) {
                this.#events.onKeyDown(e);
                if (e.defaultPrevented && (e.button == 3 || e.button == 4)) {
                    if (history.state && history.state.trapped) {
                        this.#events.popStateActive = Time.ms;
                        history.back();
                    }
                    history.pushState({trapped: true}, "", location.href);
                }
            }
        };
        window.addEventListener("mousedown", this.#events.onMouseDown);
        this.#events.onMouseUp = e => {
            let key = Key.fromEvent(e, this.time, this.mouse);
            let preventNavigation = this.#keyCollectors.length;
            Object.values(this.definedControls).filter(control => control).forEach(control => (control instanceof Array ? control : [control]).forEach(requiredKey => {
                preventNavigation = preventNavigation || requiredKey == key.code || requiredKey == key.modifier;
                (requiredKey && requiredKey.required || []).forEach(requiredKeyName => preventNavigation = preventNavigation || requiredKeyName == key.code || requiredKeyName == key.modifier);
            }));
            preventNavigation && (this.#events.popStateActive = Time.ms);
            this.#events.onKeyUp(e);
        }
        this.#events.popStateActive = -Infinity;
        this.#events.onPopState = () => {
            if (this.#events.popStateActive + 100 > Time.ms) {
                history.pushState({trapped: true}, "", location.href);
            }
        };
        window.addEventListener("popstate", this.#events.onPopState);


        window.addEventListener("mouseup", this.#events.onMouseUp);
        this.#events.onContextMenu = e => this.mouseElement.contains(e.activeTarget) && e.preventDefault();
        window.addEventListener("contextmenu", this.#events.onContextMenu);
        this.#events.onMouseMove = e => this.mouseElement.contains(e.activeTarget) && this.#mouseActions.onMove(e);
        window.addEventListener("mousemove", this.#events.onMouseMove);
        this.#events.onWheel = e => this.mouseElement.contains(e.activeTarget) && this.#mouseActions.onScroll(e);
        window.addEventListener("wheel", this.#events.onWheel);
        // Touch
        this.#events.onTouchStart = e => {
            if (this.mouseElement.contains(e.activeTarget)) {
                this.#events.onTouchMove(e);
                if (e.touches.length == 1) {
                    this.#events.onKeyDown(new MouseEvent("mousedown", {button: 0}));
                } else {
                    this.#events.onKeyUp(new MouseEvent("mouseup", {button: 0}));
                    this.#events.onKeyDown(new MouseEvent("mousedown", {button: 2}));
                }
            }
        };
        window.addEventListener("touchstart", this.#events.onTouchStart);
        this.#events.onTouchEnd = e => {
            if (e.touches.length < 2) {
                if (e.touches.length == 0) {
                    this.#events.onKeyUp(new MouseEvent("mouseup", {button: 0}));
                } else {
                    this.#events.onKeyDown(new MouseEvent("mousedown", {button: 0}));
                }
                this.#events.onKeyUp(new MouseEvent("mouseup", {button: 2}));
            }
        };
        window.addEventListener("touchend", this.#events.onTouchEnd);
        this.#events.onTouchMove = e => {
            if (this.mouseElement.contains(e.activeTarget)) {
                let clientX = 0;
                let clientY = 0;
                for (let i = 0; i < e.touches.length; i++) {
                    clientX += e.touches[i].clientX / e.touches.length;
                    clientY += e.touches[i].clientY / e.touches.length;
                }
                this.#events.onMouseMove(new MouseEvent("mousemove", {clientX, clientY, movementX: e.type == "touchmove" ? clientX - this.mouse.pos.x : 0, movementY: e.type == "touchmove" ? clientY - this.mouse.pos.y : 0}));
            }
        };
        window.addEventListener("touchmove", this.#events.onTouchMove);
        // Window
        this.#events.onBlur = () => this.#heldKeys = {};
        window.addEventListener("blur", this.#events.onBlur);
        this.#events.onPointerLockChange = () => this.#heldKeys = document.pointerLockElement ? this.#heldKeys : {};
        document.addEventListener("pointerlockchange", this.#events.onPointerLockChange);
        this.#events.onBeforeUnload = () => this.confirmExit ? true : undefined;
        window.addEventListener("beforeunload", this.#events.onBeforeUnload);
    }

    remove() {
        // Keyboard
        window.removeEventListener("keydown", this.#events.onKeyDown);
        window.removeEventListener("keyup", this.#events.onKeyUp);
        // Mouse
        window.removeEventListener("mousedown", this.#events.onMouseDown);
        window.removeEventListener("mouseup", this.#events.onKeyUp);
        window.removeEventListener("popstate", this.#events.onPopState);
        window.removeEventListener("contextmenu", this.#events.onContextMenu);
        window.removeEventListener("mousemove", this.#events.onMouseMove);
        window.removeEventListener("onwheel", this.#events.onWheel);
        // Touch
        window.removeEventListener("ontouchstart", this.#events.onTouchStart);
        window.removeEventListener("ontouchend", this.#events.onTouchEnd);
        window.removeEventListener("ontouchmove", this.#events.onTouchMove);
        // Window
        window.removeEventListener("onblur", this.#events.onBlur);
        document.removeEventListener("onpointerlockchange", this.#events.onPointerLockChange);
        window.removeEventListener("onbeforeunload", this.#events.onBeforeUnload);
    }
};

globalThis.Key = class Key {
    static fromCode(code, time, mouse) {
        if (code.indexOf("Mouse") > -1) {
            return new MouseButton(code, time, mouse);
        } else {
            return new KeyboardKey(code, time, mouse);
        }
    }
    static fromEvent(event, time, mouse) {
        if (!event.type.indexOf("key")) {
            return new KeyboardKey(event, time, mouse);
        } else if (!event.type.indexOf("mouse")) {
            return new MouseButton(event, time, mouse);
        }
        return new Key(undefined, time, mouse);
    }

    #device;
    get device() {
        return this.#device;
    }
    #tDevice;
    get tDevice() {
        return this.#tDevice;
    }

    get code() {
        return "Unknown Device";
    }
    get name() {
        return "Unknown Device";
    }
    get tName() {
        return "key.unknown.unknown";
    }

    #time;
    get time() {
        return this.#time;
    }
    #mouse;
    get mouse() {
        return this.#mouse;
    }

    constructor(device = "Unknown", time, mouse) {
        this.#device = typeof device === "string" ? device : "Unknown";
        this.#tDevice = `key.${this.#device.toLowerCase()}`;
        this.#time = time && time.snapshot ? time.snapshot() : undefined;
        this.#mouse = mouse && mouse.snapshot ? mouse.snapshot() : undefined;
    }
};
globalThis.KeyboardKey = class KeyboardKey extends globalThis.Key {
    static userLayoutMap;
    static layoutMap(code, userLayout = true) {
        let defaultLayoutMap = {
            Backquote: "`",
            Backslash: "\\",
            BracketLeft: "[",
            BracketRight: "]",
            Comma: ",",
            Equal: "=",
            IntlBackslash: "＼",
            IntlRo: "ろ",
            IntlYen: "¥",
            Minus: "-",
            Period: ".",
            Quote: "\"",
            Semicolon: ";",
            Slash: "/",
        };
        let edit = name => name.toUpperCase().replace("SS", "ß").replace("＼", "^" /* IntlBackslash ＼ (U+FF3C) looks similar to a backslash and causes line shifts with some fonts, ⧵ (U+29F5) also looks similar but does not cause line shifts and ^ is clear and in the ASCII range, but does not look like a backslash.*/);
        if (userLayout && this.userLayoutMap) {
            if (this.userLayoutMap(code)) {
                return edit(this.userLayoutMap(code));
            } else if (this.userLayoutMap(`Key${code}`)) {
                return edit(this.userLayoutMap(`Key${code}`));
            } else {
                let inverseLayoutMap = Object.fromEntries(Object.entries(defaultLayoutMap).map(([key, value]) => [value, key]));
                if (inverseLayoutMap[code] && this.userLayoutMap(inverseLayoutMap[code])) {
                    return inverseLayoutMap[code] && edit(this.userLayoutMap(inverseLayoutMap[code]));
                }
            }
        }
        if (defaultLayoutMap[code]) {
            return edit(defaultLayoutMap[code]);
        } else if (!code.indexOf("Key")) {
            return edit(code[3]);
        }
    }
    static {
        if (navigator.keyboard) {
            navigator.keyboard.getLayoutMap().then(layoutMap => this.userLayoutMap = layoutMap.get.bind(layoutMap));
        }
    }

    #code = "Unknown Keyboard Key";
    get code() {
        return this.#code;
    }
    #name = "Unknown Keyboard Key";
    get name() {
        return this.#name;
    }
    #tName = "key.keyboard.unknown";
    get tName() {
        return this.#tName;
    }
    #modifierCode;
    get modifierCode() {
        return this.#modifierCode;
    }
    #modifierName;
    get modifierName() {
        return this.#modifierName;
    }
    #tModifierName;
    get tModifierName() {
        return this.#tModifierName;
    }
    #modifierSide;
    get modifierSide() {
        return this.#modifierSide;
    }
    #tModifierSide;
    get tModifierSide() {
        return this.#tModifierSide;
    }

    constructor(code = "Unknown Keyboard Key", time, mouse) {
        super("Keyboard", time, mouse);
        let translated = ["Escape", "Enter", "Tab", "Space", "Backspace", "Delete", "Caps Lock", "Scroll Lock", "Num Lock", "Home", "End", "Page Up", "Page Down", "Insert", "Pause", "Print Screen"];
        if (typeof code == "string") {
            this.#code = code;
            this.#name = KeyboardKey.layoutMap(code) || code;
            this.#tName = translated.indexOf(code) > -1 ? `key.keyboard.${Translations.toKey(code)}` : !code.indexOf("Numpad ") && code.length == 8 ? `key.keyboard.numpad[number:"${code[7]}"]` : undefined;
            this.#modifierCode = ["Shift", "Control", "Alt", "Meta"].find(modifier => code.indexOf(modifier) > -1);
            if (this.#modifierCode) {
                this.#modifierName = this.#modifierCode;
                if (this.#modifierCode == "Alt") {
                    this.#modifierName = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Option" : "Alt";
                } else if (this.#modifierCode == "Meta") {
                    this.#modifierName = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Command" : /Windows/i.test(navigator.userAgent) ? "Windows" : "Super";
                }
                this.#tModifierName = `key.keyboard.${Translations.toKey(this.modifierName)}`;
                this.#modifierSide = code.indexOf("Left") > -1 ? "Left" : code.indexOf("Right") > -1 ? "Right" : undefined;
                this.#tModifierSide = this.#modifierSide && `key.keyboard.modifier-side.${Translations.toKey(this.modifierSide)}`;
                this.#code = this.modifierSide ? `${this.modifierSide} ${this.modifierCode}` : this.modifierCode;
                this.#name = this.modifierSide ? `${this.modifierSide} ${this.modifierName}` : this.modifierName;
                this.#tName = this.modifierSide ? `key.keyboard.${Translations.toKey(this.modifierName)}.${Translations.toKey(this.modifierSide)}` : `key.keyboard.${Translations.toKey(this.modifierName)}`;
            }
        } else if (code instanceof UIEvent) {
            code = code.code;
            if (code == "ContextMenu") {
                code = "MetaRight";
            }
            if (!code.indexOf("Digit")) {
                this.#code = this.#name = code[5];
                this.#tName = undefined;
            } else if (!code.indexOf("Numpad")) {
                let value = "?";
                if (code.length == 7) {
                    value = code[6];
                } else if (code == "NumpadDecimal" || code == "NumpadComma") {
                    value = ".";
                } else if (code == "NumpadEqual") {
                    value = "=";
                } else if (code == "NumpadAdd") {
                    value = "+";
                } else if (code == "NumpadSubtract") {
                    value = "-";
                } else if (code == "NumpadMultiply") {
                    value = "*";
                } else if (code == "NumpadDivide") {
                    value = "/";
                } else if (code == "NumpadEnter") {
                    value = "key.keyboard.enter";
                }
                this.#code = this.#name = `Numpad ${value}`;
                this.#tName = `key.keyboard.numpad[value:${value.length > 1 ? value : `"${value}"`}]`;
            } else if (!code.indexOf("Arrow")) {
                this.#code = this.#name = code.slice(5);
                this.#tName = `key.keyboard.${Translations.toKey(this.code)}`;
            } else if (!code.indexOf("Shift")) {
                this.#modifierCode = this.#modifierName = "Shift";
            } else if (!code.indexOf("Control")) {
                this.#modifierCode = this.#modifierName = "Control";
            } else if (!code.indexOf("Alt")) {
                this.#modifierCode = "Alt";
                this.#modifierName = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Option" : "Alt";
            } else if (!code.indexOf("Meta") || !code.indexOf("OS")) {
                this.#modifierCode = "Meta";
                this.#modifierName = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "Command" : /Windows/i.test(navigator.userAgent) ? "Windows" : "Super";
            } else if (KeyboardKey.layoutMap(code)) {
                this.#code = KeyboardKey.layoutMap(code, false);
                this.#name = KeyboardKey.layoutMap(code);
                this.#tName = undefined;
            } else {
                this.#code = this.#name = code.replace(/(?!^)([A-Z])/g, " $1");
                this.#tName = translated.indexOf(this.#code) > -1 ? `key.keyboard.${Translations.toKey(this.code)}` : undefined;
            }
            if (this.modifierCode) {
                this.#tModifierName = `key.keyboard.${Translations.toKey(this.modifierName)}`;
                this.#modifierSide = code.indexOf("Left") > -1 ? "Left" : "Right";
                this.#tModifierSide = `key.keyboard.modifier-side.${Translations.toKey(this.modifierSide)}`;
                this.#code = `${this.modifierSide} ${this.modifierCode}`;
                this.#name = `${this.modifierSide} ${this.modifierName}`;
                this.#tName = `key.keyboard.${Translations.toKey(this.modifierName)}.${Translations.toKey(this.modifierSide)}`;
            }
        }
    }
};
globalThis.MouseButton = class MouseButton extends globalThis.Key {
    #code = "Unknown Mouse Tile";
    get code() {
        return this.#code;
    }
    #name = "Unknown Mouse Tile";
    get name() {
        return this.#name;
    }
    #tName = "key.mouse.unknown";
    get tName() {
        return this.#tName;
    }
    #index = 0;
    get index() {
        return this.#index;
    }

    constructor(code = "Unknown Mouse Tile", time, mouse) {
        super("Mouse", time, mouse);
        if (code instanceof UIEvent) {
            code = code.button + 1;
        }
        if (typeof code == "string" || typeof code == "number") {
            if (code == "Left Mouse Tile" || code == 1) {
                this.#code = this.#name = "Left Mouse Tile";
                this.#tName = "key.mouse.left";
                this.#index = 1;
            } else if (code == "Mouse Wheel" || code == 2) {
                this.#code = this.#name = "Mouse Wheel";
                this.#tName = "key.mouse.wheel";
                this.#index = 2;
            } else if (code == "Right Mouse Tile" || code == 3) {
                this.#code = this.#name = "Right Mouse Tile";
                this.#tName = "key.mouse.right";
                this.#index = 3;
            } else {
                if (typeof code == "string" && code.indexOf("th Mouse Tile") > -1) {
                    code = !isNaN(+code.replace("th Mouse Button", "")) &&  +code.replace("th Mouse Button", "") > 3 &&  +code.replace("th Mouse Button", "") < Infinity ?  +code.replace("th Mouse Button", "") : 0;
                }
                if (!isNaN(+code) && +code > 3 && +code < Infinity) {
                    this.#code = this.#name = `${code}th Mouse Button`;
                    this.#tName = `key.mouse.index[index:"${code}"]`;
                    this.#index = +code;
                } else {
                    this.#code = this.#name = `${code}`;
                    this.#tName = undefined;
                }
            }
        }
    }
};

globalThis.Mouse = class Mouse {
    #pos;
    get pos() {
        return {...this.#pos};
    }

    #moved = {x: 0, y: 0};
    get moved() {
        return {...this.#moved};
    }

    #scrolled = {x: 0, y: 0};
    get scrolled() {
        return {...this.#scrolled};
    }

    #captured;
    get captured() {
        return this.#captured;
    }

    snapshot() {
        return new MouseSnapshot(this);
    }

    constructor(pos = {x: 0, y: 0}, captured = false, actions = {}) {
        this.#pos = pos = {...pos};
        this.#captured = captured;
        let moved = {x: 0, y: 0};
        let scrolled = {x: 0, y: 0};
        actions.onMove = e => {
            pos.x = e.clientX;
            pos.y = e.clientY;
            moved.x += e.movementX;
            moved.y += e.movementY;
        };
        actions.onScroll = e => {
            scrolled.x += e.deltaX;
            scrolled.y += e.deltaY;
        };
        actions.apply = (captured = this.captured) => {
            this.#pos = {...pos};
            this.#moved = moved;
            this.#scrolled = scrolled;
            moved = {x: 0, y: 0};
            scrolled = {x: 0, y: 0};
            this.#captured = captured;
        };
    }
};
globalThis.MouseSnapshot = class MouseSnapshot {
    #pos;
    get pos() {
        return {...this.#pos};
    }

    #move;
    get move() {
        return {...this.#move};
    }

    #wheel;
    get wheel() {
        return {...this.#wheel};
    }

    #captured;
    get captured() {
        return this.#captured;
    }

    constructor(mouse = new Mouse()) {
        this.#pos = {...mouse.pos};
        this.#move = {...mouse.move};
        this.#wheel = {...mouse.wheel};
        this.#captured = mouse.captured;
    }
};
