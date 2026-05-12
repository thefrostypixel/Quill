let style = {
    floatingBackground: Color.okLab({L: .25}, .6),
    floatingSaturation: 1.5,
    floatingBlur: 10,
    floatingRadius: 40,
    floatingOutline: Color.okLab({L: .5}, .6),
    floatingAccel: 20000,

    fixedBackground: Color.okLab({L: .25}),
    fixedSaturation: 1.5,
    fixedBlur: 20,
    fixedRadius: 0,
    fixedOutline: Color.okLab({L: .5}, 0),
    fixedAccel: 20000,

    floatingWidthMin: 300,
    floatingWidthMax: 400,
    floatingHeightMax: Infinity,
    visibilityAccel: 20000,
    stateAccel: 20,

    gap: 20,
    padding: 25,
    lineWidth: 2,
    spacerColor: Color.okLab({L: .95}, .1),

    textSize: 1, // 16 px by default
    textColor: Color.okLab({L: .95}),
    descriptionSize: .875, // 14 px by default
    descriptionColor: Color.okLab({L: .8}),
    titleSize: 1, // 16 px by default
    titleColor: Color.okLab({L: .9}),

    buttonPadding: 7,
    buttonRadius: 10,
    toggleSwitchAccel: 500,
    checkmarkAccel: 200,
    buttonColorUnchecked: Color.okLab({L: .95}, .3),
    buttonColorChecked: Color.okLab({L: .7, a: -.06, b: -.15}),
    tabBarHighlight: Color.okLab({L: .95}, .25),
};

// Colors: https://developer.apple.com/design/human-interface-guidelines/color#Specifications

let tapDistance = 10;
let secondaryTouchDuration = .5;

let time = new Time();
time.repeat();
let now = () => time?.sec ?? performance.now() / 1e3;

let popupContainer = $("#popups");

let definedStyle = "";
let defineStyle = style => {
    Object.entries(style).forEach(([selector, properties]) => definedStyle += `${selector}{${Object.entries(properties).map(([key, value]) => `${key.replace(/[A-Z]/g, "-$&").replace(/^\$/, "--").toLowerCase()}:${value};`).join("")}}`);
    $("#defined-style").text = definedStyle;
};

let genID = () => Math.floor(Math.random() * 0x100000000).toString(16).toUpperCase().padStart(8, "0");

let e = (...id) => `custom${id.map(id => ((typeof id == "object" ? id.constructor : id).name ?? id).replace(/[A-Z]/g, "-$&").toLowerCase()).join("")}`;
let eNew = (...id) => $new(e(...id));

defineStyle({
    "html": {
        overscrollBehavior: "none", // Disable pulling down to reload. Also disables overscroll on the main content.
        font: "-apple-system-body", // Sets the font to Apple's font on their devices and sets the font size (and thus also rem-units) to the users preferred font size.
        "--safe-area-inset-left": "env(safe-area-inset-left, 0)",
        "--safe-area-inset-right": "env(safe-area-inset-right, 0)",
        "--safe-area-inset-top": "env(safe-area-inset-top, 0)",
        "--safe-area-inset-bottom": "env(safe-area-inset-bottom, 0)",
        color: style.textColor.hex(),
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTextSizeAdjust: "none",
    },
});
$.listen([
    "contextmenu", // Disable the right click menu on desktop.
], e => e.preventDefault());
$.listen([
    "gesturestart", // Disable pinch zooming on iOS, iPadOS and potentially Android.
    "touchend" // Disable double tap zooming on iOS, iPadOS and potentially Android.
], e => window.visualViewport.scale == 1 && e.preventDefault());

class CascadingEvent {
    static CascadedEvent = class CascadedEvent extends Event {
        constructor(cascadingEvent, target, stopPropagation, properties) {
            super(cascadingEvent.type, {composed: true, bubbles: false});
            Object.assign(this, properties, {
                cascades: true,
                stopPropagation,
                preventDefault: cascadingEvent.preventDefault,
            });
            Object.defineProperties(this, {
                target: {get: () => target},
                srcElement: {get: () => target},
            });
        }
    }

    constructor(type = "") {
        this.#type = type;
    }

    #type;
    get type() {
        return this.#type;
    }

    #defaultPrevented = false;
    get defaultPrevented() {
        return this.#defaultPrevented;
    }
    set defaultPrevented(defaultPrevented) {
        this.#defaultPrevented = defaultPrevented;
    }
    preventDefault = () => this.defaultPrevented = true;

    #dispatchOn(target, element, skip) {
        let propagate = true;
        if (!skip) {
            element.dispatchEvent?.(new CascadingEvent.CascadedEvent(this, target, () => propagate = false, this));
        }
        if (propagate && element.children) {
            [...element.children].forEach(child => this.#dispatchOn(target, child));
        }
    }
    dispatchOn(element) {
        this.#dispatchOn(element, element);
        return this;
    }
    dispatchOnChildren(element) {
        this.#dispatchOn(element, element, true);
        return this;
    }
}

class InteractionStartedEvent extends CascadingEvent {
    constructor() {
        super("interaction-started");
    }
}
class PrimaryEvent extends Event {
    constructor(x, y) {
        super("primary", {composed: true, bubbles: true});
        this.x = x;
        this.y = y;
    }
}
class SecondaryEvent extends Event {
    constructor(x, y) {
        super("secondary", {composed: true, bubbles: true});
        this.x = x;
        this.y = y;
    }
}
$.listen("pointerdown", event => {
    let target = event.target;
    while (target.parentNode && target.tagName.toLowerCase() != e(Menu)) {
        target = target.parentNode;
    }
    if (!new InteractionStartedEvent().dispatchOnChildren(target).defaultPrevented) {
        if (event.pointerType == "mouse") {
            if (event.button == 0) { // Left click
                $(event.target).dispatch(new PrimaryEvent(event.clientX, event.clientY));
            } else if (event.button == 2) { // Right click
                $(event.target).dispatch(new SecondaryEvent(event.clientX, event.clientY));
            }
        } else { // Touch
            let holdStart = {x: event.clientX, y: event.clientY, time: now(), target: event.target};
            let onMove, onUp, timeout;
            let cleanUp = () => {
                $.quitListen("pointermove", onMove);
                $.quitListen("pointerup", onUp);
                clearTimeout(timeout);
            };
            $.listen("pointermove", onMove = e => {
                if ((holdStart.x - e.clientX) ** 2 + (holdStart.y - e.clientY) ** 2 > tapDistance ** 2) {
                    cleanUp();
                }
            });
            $.listen("pointerup", onUp = () => {
                $(holdStart.target).dispatch(new PrimaryEvent(holdStart.x, holdStart.y));
                cleanUp();
            });
            timeout = setTimeout(() => {
                $(holdStart.target).dispatch(new SecondaryEvent(holdStart.x, holdStart.y));
                cleanUp();
            }, secondaryTouchDuration * 1e3);
        }
    }
});

// TODO Rename to ContentChangedEvent.
class ContentHeightChanged extends Event {
    constructor(height) {
        super("content-height-changed", {composed: true, bubbles: true});
        this.height = height;
    }
}
class ContainerWidthChangedEvent extends CascadingEvent {
    constructor(width) {
        super("container-width-changed");
        this.width = width;
    }
}
class ContainerPositionChangedEvent extends CascadingEvent {
    constructor() {
        super("container-position-changed");
    }
}

let screen = {};
let onResize = []; // TODO Replace this with a cascading event.
let resized = () => {
    let computed = getComputedStyle(document.body);
    let unsafe = {
        left: parseFloat(computed.getPropertyValue("--safe-area-inset-left")),
        right: parseFloat(computed.getPropertyValue("--safe-area-inset-right")),
        top: parseFloat(computed.getPropertyValue("--safe-area-inset-top")),
        bottom: parseFloat(computed.getPropertyValue("--safe-area-inset-bottom")),
    };
    screen = {
        full: {
            width: window.innerWidth,
            height: window.innerHeight,
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
        },
        safe: {
            width: window.innerWidth - unsafe.left - unsafe.right,
            height: window.innerHeight - unsafe.top - unsafe.bottom,
            left: unsafe.left,
            right: window.innerWidth - unsafe.right,
            top: unsafe.top,
            bottom: window.innerHeight - unsafe.bottom,
        },
        padded: {
            width: window.innerWidth - Math.max(unsafe.left, style.gap) - Math.max(unsafe.right, style.gap),
            height: window.innerHeight - Math.max(unsafe.top, style.gap) - Math.max(unsafe.bottom, style.gap),
            left: Math.max(unsafe.left, style.gap),
            right: window.innerWidth - Math.max(unsafe.right, style.gap),
            top: Math.max(unsafe.top, style.gap),
            bottom: window.innerHeight - Math.max(unsafe.bottom, style.gap),
        },
    };
    onResize.forEach(fn => fn());
};
window.addEventListener("resize", resized);
resized();

let translations = new Translations("/src/lang/index.json", [/*cookies.lang,*/ navigator.languages, "en-US"]);
// translations.getActiveLangs().then(langs => cookies.lang = langs[0]);

let scheduled = new Set();
let executingScheduled = false;
let schedule = task => {
    scheduled.delete(task);
    scheduled.add(task);
    if (!executingScheduled) {
        executingScheduled = true;
        queueMicrotask(() => {
            for (let task of scheduled) {
                scheduled.delete(task);
                task();
            }
            executingScheduled = false;
        });
    }
};

class Widget {
    static defaultStyle(...e) {
        defineStyle(Object.fromEntries(e.flat(Infinity).map(e => [e, {
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            fontSize: `${style.textSize}rem`,
            lineHeight: "1",
            color: "inherit",
            overflow: "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
        }])));
    }

    element = eNew(this);

    constructor() {
        this.element.listen("primary", e => this.primary(e)).listen("secondary", e => this.secondary(e));
    }

    #height = 0;
    heightChanged() {
        let height = this.element.bounds.height;
        if (height != this.#height) {
            this.element.dispatch(new ContentHeightChanged(this.element.bounds.height));
        }
    }

    #anims = Object.create(null);
    createAnims(anims) {
        Object.keys(anims).forEach(anim => (this.#anims[anim] = new (anims[anim].color ? ColorAnim : Anim)(anims[anim].axes || anims[anim].color, anims[anim].accel, time)).callback = anims[anim].callback);
        console.log(...Object.values(this.#anims));
        this.instantAnim(true);
    }
    anim(anim, axis = anim, target) {
        if (this.#anims[anim]) {
            if (this.#anims[anim] instanceof ColorAnim) {
                if (axis) {
                    if (this.#instantAnims[anim]) {
                        this.#anims[anim].target = this.#anims[anim].value = axis;
                        this.#anims[anim].callback?.();
                    } else {
                        this.#anims[anim].target = axis;
                    }
                } else {
                    return this.#anims[anim].value;
                }
            } else if (this.#anims[anim].axes[axis]) {
                if (target != undefined) {
                    if (this.#instantAnims[anim]) {
                        if (this.#anims[anim].axes[axis].value != target || this.#anims[anim].axes[axis].target != target || this.#anims[anim].axes[axis].vel) {
                            this.#anims[anim].axes[axis] = target;
                            this.#anims[anim].callback?.();
                        }
                    } else {
                        this.#anims[anim].values[axis] = target;
                    }
                } else {
                    return this.#anims[anim].values[axis];
                }
            }
        }
    }
    animTarget(anim, axis, target) {
        if (this.#anims[anim]) {
            if (this.#anims[anim] instanceof ColorAnim) {
                if (axis) {
                    this.#anims[anim].target = axis;
                } else {
                    return this.#anims[anim].target;
                }
            } else if (this.#anims[anim].axes[axis]) {
                if (target != undefined) {
                    this.#anims[anim].values[axis] = target;
                } else {
                    return this.#anims[anim].axes[axis].target;
                }
            }
        }
    }
    offsetAnim(anim, axis, offset) {
        if (this.#anims[anim] && this.#anims[anim].axes[axis]) {
            this.#anims[anim].axes[axis].value += offset;
            this.#anims[anim].axes[axis].target += offset;
        }
    }

    #instantAnims = Object.create(null);
    instantAnim(instant) {
        if (typeof instant == "object") {
            Object.keys(instant).forEach(anim => {
                if (anim in this.#anims && instant[anim] != undefined) {
                    this.#instantAnims[anim] = !!instant[anim];
                }
            });
        } else if (instant != undefined) {
            Object.keys(this.#anims).forEach(anim => this.#instantAnims[anim] = !!instant);
        }
        Object.keys(this.#anims).forEach(anim => {
            if (this.#instantAnims[anim]) {
                Object.keys(this.#anims[anim].axes).forEach(axis => {
                    console.log(this.#anims[anim], axis);
                    // this.#anims[anim].axes[axis] = this.#anims[anim].axes[axis].target 0.1!dev4
                });
            }
        });
        requestAnimationFrame(() => this.#instantAnims = Object.create(null));
    }

    mixNum(anim, axis, n0, n1) {
        return n0 + (n1 - n0) * this.anim(anim, axis);
    }
    mixColor(anim, axis, c0, c1) {
        return c0.copy.mix(c1, this.anim(anim, axis));
    }

    #primaryListeners = [];
    #stopPrimaryPropagation = new Map();
    primary(e) {
        this.#primaryListeners.forEach(listener => {
            listener(e);
            if (this.#stopPrimaryPropagation.get(listener)) {
                e.stopPropagation();
            }
        });
    }
    onPrimary(listener, stopPropagation) {
        if (typeof listener == "function" && !this.#primaryListeners.includes(listener)) {
            this.#primaryListeners.push(listener);
            this.#stopPrimaryPropagation.set(listener, stopPropagation);
        }
        return this;
    }
    offPrimary(listener) {
        let index = this.#primaryListeners.indexOf(listener);
        if (index > -1) {
            this.#stopPrimaryPropagation.delete(this.#primaryListeners.splice(index, 1)[0]);
        }
        return this;
    }

    #secondaryListeners = [];
    #stopSecondaryPropagation = new Map();
    secondary(e) {
        this.#secondaryListeners.forEach(listener => {
            listener(e);
            if (this.#stopSecondaryPropagation.get(listener)) {
                e.stopPropagation();
            }
        });
    }
    onSecondary(listener, stopPropagation) {
        if (typeof listener == "function" && !this.#secondaryListeners.includes(listener)) {
            this.#secondaryListeners.push(listener);
            this.#stopSecondaryPropagation.set(listener, stopPropagation);
        }
        return this;
    }
    offSecondary(listener) {
        let index = this.#secondaryListeners.indexOf(listener);
        if (index > -1) {
            this.#stopSecondaryPropagation.delete(this.#secondaryListeners.splice(index, 1)[0]);
        }
        return this;
    }
}

// TODO Keyboard navigation.
// TODO Shadow.
class Menu extends Widget {
    static #xOffset(anchor) {
        return anchor == "left" ? screen.safe.left : anchor == "right" ? screen.safe.right : anchor == "full-left" ? screen.full.left : screen.full.right;
    }
    static #yOffset(anchor) {
        return anchor == "top" ? screen.safe.top : anchor == "bottom" ? screen.safe.bottom : anchor == "full-top" ? screen.full.top : screen.full.bottom;
    }

    static {
        Widget.defaultStyle(e(this), e(this, "Content"), `${e(this, "Content")} > *`);
        defineStyle({
            [e(this)]: {
                position: "fixed",
                boxSizing: "border-box",
                display: "block",
                outlineOffset: `-${style.lineWidth}px`,
                overflow: "hidden",
            },
            [e(this, "Content")]: {
                position: "absolute",
                boxSizing: "border-box",
                display: "block",
                padding: `var(--padding-top) 0 var(--padding-bottom) 0`,
                borderRadius: "inherit",
                overflow: "scroll",
            },
        });
    }

    id = genID();

    #inDom = false;
    #visibleHeight = 0;
    content = eNew(this, "Content");
    contentMask;
    #updateVisibility = () => {
        if (this.partiallyVisible && !this.#inDom) {
            popupContainer.add(this.element);
            schedule(this.#updateLayout);
        } else if (!this.partiallyVisible && this.#inDom) {
            this.element.delete();
        }
        if (this.#inDom = this.partiallyVisible) {
            // console.log(`[${time.count} #${this.id}] Updating visibility`);
            this.element.style({
                height: `${this.anim("visible")}px`,
                opacity: (this.anim("visible") / this.#visibleHeight) ** 2 || 0,
                pointerEvents: this.visible ? "all" : "none",
            });
        }
    };
    #updateLayout = animateVisibility => {
        if (this.partiallyVisible) {
            // console.log(`[${time.count} #${this.id}] Updating`);

            let mixNum = (floating, fixed) => this.mixNum("state", "fixed", floating, fixed);
            let mixColor = (floating, fixed) => this.mixColor("state", "fixed", floating, fixed);

            let scroll = {x: this.content.scroll.x, y: this.content.scroll.y};

            this.element.style({
                $paddingLeft: "0",
                $paddingRight: "0",
                $paddingTop: "0",
                $paddingBottom: "0",
            });
            this.content.style({width: "max-content", height: "max-content"});

            let floatingWidth = Math.min(Math.max(this.content.scroll.width, style.floatingWidthMin), style.floatingWidthMax, screen.padded.width - style.padding * 2);
            let floatingLeft = Math.max(Math.min(this.anim("floating", "center") + Menu.#xOffset(this.#floatingCenterAnchor) - floatingWidth / 2 - style.padding, screen.padded.right - style.padding * 2 - floatingWidth), screen.padded.left);
            let fixedLeft = this.anim("fixed", "left") + Menu.#xOffset(this.#fixedLeftAnchor);
            let fixedWidth = Math.min(this.anim("fixed", "right") + Menu.#xOffset(this.#fixedRightAnchor), screen.full.width) - fixedLeft;
            let left = mixNum(floatingLeft, fixedLeft);
            let width = Math.round(mixNum(floatingWidth + style.padding * 2, fixedWidth));

            let cornerRadius = Math.round(mixNum(style.floatingRadius, style.fixedRadius));
            this.element.style({
                left: `${left}px`,
                width: `${width}px`,
                background: mixColor(style.floatingBackground, style.fixedBackground).hex(),
                backdropFilter: `saturate(${mixNum(style.floatingSaturation, style.fixedSaturation)}) blur(${mixNum(style.floatingBlur, style.fixedBlur)}px)`,
                borderRadius: `${cornerRadius}px`,
                outline: `${style.lineWidth}px solid ${mixColor(style.floatingOutline, style.fixedOutline).hex()}`,
                $cornerRadius: `${cornerRadius}px`,
                $padding: `${style.padding}px`,
                $paddingLeft: `${Math.round(mixNum(style.padding, Math.max(style.padding, screen.safe.left - fixedLeft)))}px`,
                $paddingRight: `${Math.round(mixNum(style.padding, Math.max(style.padding, fixedLeft + fixedWidth - screen.safe.right)))}px`,
            });
            this.content.style({
                width: `${width}px`,
                mask: `
                    radial-gradient(circle at var(--corner-radius) var(--corner-radius), rgba(255, 255, 255, calc(var(--corner-radius) / var(--padding))) max(var(--corner-radius) - var(--padding), 0px), #0000 var(--corner-radius)) 0 0 / var(--corner-radius) var(--corner-radius) no-repeat add,
                    radial-gradient(circle at 0 var(--corner-radius), rgba(255, 255, 255, calc(var(--corner-radius) / var(--padding))) max(var(--corner-radius) - var(--padding), 0px), #0000 var(--corner-radius)) 100% 0 / var(--corner-radius) var(--corner-radius) no-repeat add,
                    radial-gradient(circle at var(--corner-radius) 0, rgba(255, 255, 255, calc(var(--corner-radius) / var(--padding))) max(var(--corner-radius) - var(--padding), 0px), #0000 var(--corner-radius)) 0 100% / var(--corner-radius) var(--corner-radius) no-repeat add,
                    radial-gradient(circle at 0 0, rgba(255, 255, 255, calc(var(--corner-radius) / var(--padding))) max(var(--corner-radius) - var(--padding), 0px), #0000 var(--corner-radius)) 100% 100% / var(--corner-radius) var(--corner-radius) no-repeat add,
                    linear-gradient(to right, #FFF var(--corner-radius), #0000 0 calc(100% - var(--corner-radius)), #FFF 0) 0 100% / 100% var(--corner-radius) no-repeat exclude,
                    linear-gradient(to right, #FFF var(--corner-radius), #0000 0 calc(100% - var(--corner-radius)), #FFF 0) 0 100% / 100% var(--corner-radius) no-repeat add,
                    linear-gradient(to right, #FFF var(--corner-radius), #0000 0 calc(100% - var(--corner-radius)), #FFF 0) 0 0 / 100% var(--corner-radius) no-repeat exclude,
                    linear-gradient(to right, #FFF var(--corner-radius), #0000 0 calc(100% - var(--corner-radius)), #FFF 0) 0 0 / 100% var(--corner-radius) no-repeat add,
                    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><linearGradient id='fill' x2='1' y2='0'><stop/><stop offset='1' stop-color='white'/></linearGradient><rect width='1' height='1' fill='url(%23fill)'/><rect width='1' height='1' fill='url(%23fill)' transform='rotate(90, .5, .5)' style='mix-blend-mode: darken;'/></svg>") 0 0 / var(--padding) var(--padding) no-repeat luminance add,
                    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><linearGradient id='fill' x2='1' y2='0'><stop stop-color='white'/><stop offset='1'/></linearGradient><rect width='1' height='1' fill='url(%23fill)'/><rect width='1' height='1' fill='url(%23fill)' transform='rotate(270, .5, .5)' style='mix-blend-mode: darken;'/></svg>") 100% 0 / var(--padding) var(--padding) no-repeat luminance add,
                    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><linearGradient id='fill' x2='1' y2='0'><stop/><stop offset='1' stop-color='white'/></linearGradient><rect width='1' height='1' fill='url(%23fill)'/><rect width='1' height='1' fill='url(%23fill)' transform='rotate(270, .5, .5)' style='mix-blend-mode: darken;'/></svg>") 0 100% / var(--padding) var(--padding) no-repeat luminance add,
                    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'><linearGradient id='fill' x2='1' y2='0'><stop stop-color='white'/><stop offset='1'/></linearGradient><rect width='1' height='1' fill='url(%23fill)'/><rect width='1' height='1' fill='url(%23fill)' transform='rotate(90, .5, .5)' style='mix-blend-mode: darken;'/></svg>") 100% 100% / var(--padding) var(--padding) no-repeat luminance add,
                    linear-gradient(to right, #0000 0, #FFF var(--padding) calc(100% - var(--padding)), #0000 100%) 0 var(--padding) / 100% calc(100% - var(--padding) * 2) no-repeat add,
                    linear-gradient(to bottom, #0000 0, #FFF var(--padding) calc(100% - var(--padding)), #0000 100%) var(--padding) 0 / calc(100% - var(--padding) * 2) 100% no-repeat`,
            });

            new ContainerWidthChangedEvent(width).dispatchOn(this.element.raw);

            let floatingHeight = Math.min(this.content.scroll.height, style.floatingHeightMax, screen.padded.height - style.padding * 2);
            let floatingTop = Math.max(Math.min(this.anim("floating", "top") + Menu.#yOffset(this.#floatingTopAnchor), screen.padded.bottom - style.padding * 2 - floatingHeight), screen.padded.top);
            let fixedTop = this.anim("fixed", "top") + Menu.#yOffset(this.#fixedTopAnchor);
            let fixedHeight = Math.min(this.anim("fixed", "bottom") + Menu.#yOffset(this.#fixedBottomAnchor), screen.full.height) - fixedTop;
            let top = mixNum(floatingTop, fixedTop);
            let height = Math.round(mixNum(floatingHeight + style.padding * 2, fixedHeight));
            if (height != this.#visibleHeight) {
                if (!animateVisibility) {
                    this.offsetAnim("visible", "visible", height - this.#visibleHeight);
                } else if (this.visible) {
                    this.anim("visible", "visible", height);
                }
                this.#visibleHeight = height;
            }

            this.element.style({
                top: `${top}px`,
                height: `${this.anim("visible")}px`,
                $paddingTop: `${Math.round(mixNum(style.padding, Math.max(style.padding, screen.safe.top - fixedTop)))}px`,
                $paddingBottom: `${Math.round(mixNum(style.padding, Math.max(style.padding, fixedTop + fixedHeight - screen.safe.bottom)))}px`,
                opacity: (this.anim("visible") / this.#visibleHeight) ** 2 || 0,
                pointerEvents: this.visible ? "all" : "none",
            });
            this.content.style({
                height: `${height}px`,
            });

            Object.assign(this.content.scroll, scroll);

            this.instantAnim({floating: this.anim("state", "fixed") == 1 || undefined});
            this.instantAnim({fixed: this.anim("state", "fixed") == 0 || undefined});
        }
    };

    constructor() {
        super();
        this.element.add(this.content);
        this.createAnims({
            visible: {
                axes: {visible: 0},
                accel: style.visibilityAccel,
                callback: () => schedule(this.#updateVisibility),
            },
            state: {
                axes: {fixed: 0},
                accel: style.stateAccel,
                callback: () => schedule(this.#updateLayout),
            },
            floating: {
                axes: {center: 0, top: 0},
                accel: style.floatingAccel,
                callback: () => schedule(this.#updateLayout),
            },
            fixed: {
                axes: {left: 0, right: 0, top: 0, bottom: 0},
                accel: style.fixedAccel,
                callback: () => schedule(this.#updateLayout),
            },
        });
        schedule(this.#updateLayout);
        onResize.push(() => schedule(this.#updateLayout));
        this.onPrimary(() => {}, true);
        this.onSecondary(() => {}, true);
        this.element.listen("interaction-started", e => {
            if (this.visible) {
                this.visible = false;
                e.preventDefault();
            }
        });
        this.element.listen("content-height-changed", () => schedule(this.#updateLayout));
        this.content.listen("scroll", console.log);
    }



    #visible = true;
    get visible() {
        return this.#visible;
    }
    set visible(visible) {
        if (!!visible != this.#visible) {
            this.instantAnim({
                state: this.anim("visible", "visible") == 0 || undefined,
                floating: this.anim("visible", "visible") == 0 || undefined,
                fixed: this.anim("visible", "visible") == 0 || undefined,
            });
            this.anim("visible", "visible", (this.#visible = !!visible) * this.#visibleHeight);
            this.#updateLayout(true);
        }
    }
    get partiallyVisible() {
        return this.#visible || this.anim("visible") > 0;
    }





    #state = "floating" || "fixed";
    get state() {
        return this.#state;
    }
    set state(state) {
        if ((state == "floating" || state == "fixed") && state != this.#state) {
            this.instantAnim({
                floating: this.anim("state", "fixed") == 1 || undefined,
                fixed: this.anim("state", "fixed") == 0 || undefined,
            });
            this.anim("state", "fixed", (this.#state = state) == "fixed");
        }
    }



    #floatingCenterAnchor = "left";
    get floatingCenterAnchor() {
        return this.#floatingCenterAnchor;
    }
    set floatingCenterAnchor(floatingCenterAnchor) {
        if (["left", "right", "full-left", "full-right"].includes(floatingCenterAnchor) && floatingCenterAnchor != this.#floatingCenterAnchor) {
            this.offsetAnim("floating", "center", Menu.#xOffset(this.#floatingCenterAnchor) - Menu.#xOffset(this.#floatingCenterAnchor = floatingCenterAnchor));
        }
    }

    get floatingCenter() {
        return this.animTarget("floating", "center");
    }
    set floatingCenter(floatingCenter) {
        this.anim("floating", "center", floatingCenter);
    }
    offsetFloatingCenter(floatingCenter) {
        this.offsetAnim("floating", "center", floatingCenter - this.animTarget("floating", "center"));
    }


    #floatingTopAnchor = "top";
    get floatingTopAnchor() {
        return this.#floatingTopAnchor;
    }
    set floatingTopAnchor(floatingTopAnchor) {
        if (["top", "bottom", "full-top", "full-bottom"].includes(floatingTopAnchor) && floatingTopAnchor != this.#floatingTopAnchor) {
            this.offsetAnim("floating", "top", Menu.#yOffset(this.#floatingTopAnchor) - Menu.#yOffset(this.#floatingTopAnchor = floatingTopAnchor));
        }
    }

    get floatingTop() {
        return this.animTarget("floating", "top");
    }
    set floatingTop(floatingTop) {
        this.anim("floating", "top", floatingTop);
    }
    offsetFloatingTop(floatingTop) {
        this.offsetAnim("floating", "top", floatingTop - this.animTarget("floating", "top"));
    }



    #fixedLeftAnchor = "left";
    get fixedLeftAnchor() {
        return this.#fixedLeftAnchor;
    }
    set fixedLeftAnchor(fixedLeftAnchor) {
        if (["left", "right", "full-left", "full-right"].includes(fixedLeftAnchor) && fixedLeftAnchor != this.#fixedLeftAnchor) {
            this.offsetAnim("fixed", "left", Menu.#xOffset(this.#fixedLeftAnchor) - Menu.#xOffset(this.#fixedLeftAnchor = fixedLeftAnchor));
        }
    }

    get fixedLeft() {
        return this.animTarget("fixed", "left");
    }
    set fixedLeft(fixedLeft) {
        this.anim("fixed", "left", fixedLeft);
    }
    offsetFixedLeft(fixedLeft) {
        this.offsetAnim("fixed", "left", fixedLeft - this.animTarget("fixed", "left"));
    }


    #fixedRightAnchor = "left";
    get fixedRightAnchor() {
        return this.#fixedRightAnchor;
    }
    set fixedRightAnchor(fixedRightAnchor) {
        if (["left", "right", "full-left", "full-right"].includes(fixedRightAnchor) && fixedRightAnchor != this.#fixedRightAnchor) {
            this.offsetAnim("fixed", "right", Menu.#xOffset(this.#fixedRightAnchor) - Menu.#xOffset(this.#fixedRightAnchor = fixedRightAnchor));
        }
    }

    get fixedRight() {
        return this.animTarget("fixed", "right");
    }
    set fixedRight(fixedRight) {
        this.anim("fixed", "right", fixedRight);
    }
    offsetFixedRight(fixedRight) {
        this.offsetAnim("fixed", "right", fixedRight - this.animTarget("fixed", "right"));
    }


    #fixedTopAnchor = "top";
    get fixedTopAnchor() {
        return this.#fixedTopAnchor;
    }
    set fixedTopAnchor(fixedTopAnchor) {
        if (["top", "bottom", "full-top", "full-bottom"].includes(fixedTopAnchor) && fixedTopAnchor != this.#fixedTopAnchor) {
            this.offsetAnim("fixed", "top", Menu.#yOffset(this.#fixedTopAnchor) - Menu.#yOffset(this.#fixedTopAnchor = fixedTopAnchor));
        }
    }

    get fixedTop() {
        return this.animTarget("fixed", "top");
    }
    set fixedTop(fixedTop) {
        this.anim("fixed", "top", fixedTop);
    }
    offsetFixedTop(fixedTop) {
        this.offsetAnim("fixed", "top", fixedTop - this.animTarget("fixed", "top"));
    }


    #fixedBottomAnchor = "top";
    get fixedBottomAnchor() {
        return this.#fixedBottomAnchor;
    }
    set fixedBottomAnchor(fixedBottomAnchor) {
        if (["top", "bottom", "full-top", "full-bottom"].includes(fixedBottomAnchor) && fixedBottomAnchor != this.#fixedBottomAnchor) {
            this.offsetAnim("fixed", "bottom", Menu.#yOffset(this.#fixedBottomAnchor) - Menu.#yOffset(this.#fixedBottomAnchor = fixedBottomAnchor));
        }
    }

    get fixedBottom() {
        return this.animTarget("fixed", "bottom");
    }
    set fixedBottom(fixedBottom) {
        this.anim("fixed", "bottom", fixedBottom);
    }
    offsetFixedBottom(fixedBottom) {
        this.offsetAnim("fixed", "bottom", fixedBottom - this.animTarget("fixed", "bottom"));
    }



    add(...elements) {
        this.content.add(elements.flat(Infinity).map(element => element.element));
        schedule(this.#updateLayout);
        return this;
    }
}

class Pane extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                boxSizing: "border-box",
                display: "block",
                width: "100%",
                overflow: "scroll",
            },
        });
    }

    #update() {}

    constructor() {
        super();
    }

    children = [];
    add(...elements) {
        this.children.push(...elements.flat(Infinity));
        this.element.add(elements.flat(Infinity).map(element => element.element));
        this.#update();
        return this;
    }
}

class PaneHolder extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                position: "relative",
                boxSizing: "border-box",
                display: "block",
                overflow: "none",
            },
            [`${e(this)} > ${e(Pane)}`]: {
                position: "absolute",
                left: "0",
                top: "0",
            },
        });
    }

    #update = () => {
        let height = 0;
        let visibilities = Object.values(this.#panes).map(({anim}) => anim.values.visible);
        let visible = visibilities.reduce((visible, visibility) => visible + visibility, 0);
        if (visible > 1e-9) {
            let mult = 1 / Math.max(1, visible);
            Object.values(this.#panes).forEach(({pane}, i) => height += pane.element.bounds.height * visibilities[i] * mult);
        }
        this.element.style({height: `${height}px`});
        this.element.dispatch(new ContentHeightChanged(height));
    };

    constructor(panes, selected) {
        super();
        this.instantAnim(true);
        this.add(panes);
        this.selected = selected;
    }

    #instantAnims = false;
    instantAnim(instant) {
        if (instant != undefined && instant) {
            this.#instantAnims = true;
            Object.keys(this.#panes).forEach(id => this.#panes[id].anim.axes.visible = this.#panes[id].anim.axes.visible.target);
            requestAnimationFrame(() => this.#instantAnims = false);
        }
    }

    // TODO Merge animations into one that includes height.
    #panes = Object.create(null);
    add(panes = Object.create(null)) {
        Object.entries(panes).forEach(([id, pane]) => {
            if (this.#panes[id]) {
                this.#panes[id].anim.callback = undefined;
                this.#panes[id].pane.element.remove();
            }
            this.#panes[id] = {
                pane,
                anim: new Anim({visible: 0}, 100, time),
            };
            this.#panes[id].anim.callback = () => {
                pane.element.style({opacity: this.#panes[id].anim.values.visible});
                schedule(this.#update);
            };
            this.element.add(pane.element);
        });
        schedule(this.#update);
        return this;
    }
    remove(...panes) {
        panes.flat(Infinity).forEach(id => {
            if (this.#panes[id]) {
                this.#panes[id].anim.callback = undefined;
                this.#panes[id].pane.element.remove();
            }
        });
        schedule(this.#update);
        return this;
    }

    #selected;
    get selected() {
        return this.#selected;
    }
    set selected(selected) {
        if (this.#selected != selected && (selected == undefined || selected in this.#panes)) {
            if (this.#panes[this.#selected]) {
                this.#panes[this.#selected].anim[this.#instantAnims ? "axes" : "values"].visible = 0;
                if (this.#instantAnims) {
                    this.#panes[this.#selected].anim.callback();
                }
            }
            if (this.#panes[this.#selected = selected]) {
                this.#panes[this.#selected].anim[this.#instantAnims ? "axes" : "values"].visible = 1;
                if (this.#instantAnims) {
                    this.#panes[this.#selected].anim.callback();
                }
            }
        }
    }
}

class VerticalSpacer extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                height: `${style.lineWidth}px`,
                margin: `${style.padding * .5}px 0`,
                overflow: "hidden",
                background: style.spacerColor.hex(),
            },
        });
    }
}

class TabBar extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                position: "relative",
                display: "flex",
                overflow: "scroll",
                scrollbarWidth: "none",
                padding: `0 calc(var(--padding-right) + ${style.buttonPadding}px) 0 calc(var(--padding-left) + ${style.buttonPadding}px)`,
                margin: `${style.buttonPadding}px 0`,
            },
            [e(this, "Highlight")]: {
                position: "absolute",
                top: "0",
                height: "100%",
                background: style.tabBarHighlight.hex(),
                borderRadius: "100px",
                pointerEvents: "none",
            },
            [e(this, "Tab")]: {
                padding: `${style.buttonPadding}px ${style.buttonPadding * 3}px`,
                scrollMargin: `0 calc(var(--padding-right) + ${style.buttonPadding}px) 0 calc(var(--padding-left) + ${style.buttonPadding}px)`,
                flex: "1",
                fontSize: `${style.textSize}rem`,
                textAlign: "center",
            },
        });
    }

    constructor(...ids) {
        super();
        this.#highlight = eNew(this, "Highlight");
        this.element.add(this.#highlight);
        this.add(ids);
        this.createAnims({
            position: {
                axes: {left: 0, width: 0},
                accel: 20000,
                callback: this.#update,
            },
            opacity: {
                axes: {opacity: 0},
                accel: 200,
                callback: this.#update,
            },
        });
        this.element.listen("container-width-changed", () => {
            if (this.#selected != undefined) {
                this.instantAnim({position: !this.anim("opacity", "opacity") || undefined});
                this.anim("position", "left", this.#tabData[this.#selected].element.raw.offsetLeft);
                this.anim("position", "width", this.#tabData[this.#selected].element.bounds.width);
            }
        });
    }

    #update = () => this.#highlight.style({
        left: `${this.anim("position", "left") - 7}px`,
        width: `${this.anim("position", "width") + 14}px`,
        opacity: this.anim("opacity", "opacity"),
    });

    #tabData = Object.create(null);
    #tabs = [];
    get tabs() {
        return tabs;
    }
    add(...ids) {
        ids.flat(Infinity).forEach(id => {
            if (!this.#tabData[id]) {
                this.#tabs.push(id);
                let data = this.#tabData[id] = {
                    element: eNew(this, "Tab"),
                };
                data.element.text = id;
                data.element.listen("primary", () => {
                    this.selected = id;
                    this.#onSelect?.(id);
                });
                this.element.add(data.element);
            }
        });
        return this;
    }
    remove(...ids) {
        ids.flat(Infinity).forEach(id => {
            let index = this.#tabs.indexOf(id);
            if (index > -1) {
                this.#tabs.splice(index, 1);
            }
            delete this.#tabData[id];
            if (this.#selected == id) {
                this.#selected = undefined;
            }
        });
        return this;
    }

    #highlight;
    #selected;
    get selected() {
        return this.#selected;
    }
    set selected(selected) {
        if (selected == undefined || this.#tabs.includes(selected)) {
            if ((this.#selected = selected) == undefined) {
                this.anim("opacity", "opacity", 0);
            } else {
                this.#tabData[this.#selected].element.raw.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
                this.instantAnim({position: !this.anim("opacity", "opacity") || undefined});
                this.anim("opacity", "opacity", 1);
                this.anim("position", "left", this.#tabData[this.#selected].element.raw.offsetLeft);
                this.anim("position", "width", this.#tabData[this.#selected].element.bounds.width);
            }
        }
    }

    #onSelect;
    get onSelect() {
        return this.#onSelect;
    }
    set onSelect(onSelect) {
        if (onSelect instanceof Function) {
            this.#onSelect = onSelect;
        }
    }
}

class Title extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                boxSizing: "border-box",
                display: "flex",
                padding: `${style.buttonPadding}px ${style.buttonPadding * 2}px ${style.buttonPadding * .5}px ${style.buttonPadding * 2}px`,
                margin: `0 var(--padding-right) 0 var(--padding-left)`,
                fontSize: `${style.titleSize}rem`,
                lineHeight: "1",
                fontWeight: "700",
                color: style.titleColor.hex(),
                userSelect: "none",
                WebkitUserSelect: "none",
            },
        });
    }

    constructor(title) {
        super();
        this.title = title;
    }

    #title = "";
    get title() {
        return this.#title;
    }
    set title(title) {
        if (typeof title == "string") {
            if (this.#title = title) {
                this.element.text ||= "\u00A0";
                translations.promise.then(translations => {
                    this.element.text = translations.translate(this.#title);
                    this.heightChanged();
                });
            } else {
                this.element.text = "";
            }
            this.heightChanged();
        }
    }
}

class Tile extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                display: "flex",
                padding: `${style.buttonPadding}px`,
                margin: `0 var(--padding-right) 0 var(--padding-left)`,
                fontSize: `${style.textSize}rem`,
            },
            [e(this, "Label")]: {
                display: "flex",
                flexDirection: "column",
                gap: `${style.textSize * .25}rem`,
                flex: "1",
            },
            [e(this, "Description")]: {
                fontSize: `${style.descriptionSize}rem`,
                color: style.descriptionColor.hex(),
            },
            [e(this, "Components")]: {
                display: "flex",
            },
            [`${e(this, "Components")} > *`]: {
                marginLeft: `${style.textSize * .25}rem`,
            },
        });
    }

    constructor(icon, name, description, ...components) {
        super();
        this.#label.add(this.#nameElement, this.#descriptionElement);
        this.element.add(this.#label, this.#componentsElement);
        this.icon = icon;
        this.name = name;
        this.description = description;
        components.flat(Infinity).forEach(component => this.add(component));
        this.onPrimary(e => this.primaryTarget?.primary(e), true);
        this.onSecondary(e => this.secondaryTarget?.primary(e), true);
    }

    #label = eNew(this, "Label");

    #icon; // TODO
    get icon() {
        return this.#icon;
    }
    set icon(icon) {
        this.#icon = icon;
    }
    
    #name = "";
    #nameElement = eNew(this, "Name");
    get name() {
        return this.#name;
    }
    set name(name) {
        if (typeof name == "string") {
            if (this.#name = name) {
                this.#nameElement.text ||= "\u00A0";
                translations.promise.then(translations => {
                    this.#nameElement.text = translations.translate(this.#name);
                    this.heightChanged();
                });
            } else {
                this.#nameElement.text = "";
            }
            this.heightChanged();
        }
    }
    
    #description = "";
    #descriptionElement = eNew(this, "Description");
    get description() {
        return this.#description;
    }
    set description(description) {
        if (typeof description == "string") {
            if (this.#description = description) {
                this.#descriptionElement.text ||= "\u00A0";
                translations.promise.then(translations => {
                    this.#descriptionElement.text = translations.translate(this.#description);
                    this.heightChanged();
                });
            } else {
                this.#descriptionElement.text = "";
            }
            this.heightChanged();
        }
    }

    components = [];
    #componentsElement = eNew(this, "Components");
    primaryTarget;
    secondaryTarget;
    add(component, primaryTarget = false, secondaryTarget = false) {
        return this.insert(component, undefined, primaryTarget, secondaryTarget);
    }
    insert(component, index, primaryTarget = false, secondaryTarget = false) {
        if (!this.components.includes(component)) {
            if (index == undefined) {
                this.components.push(component);
                this.#componentsElement.add(component.element);
            } else {
                this.components.splice(index, 0, component);
                this.#componentsElement.insert(component.element, index);
            }
        }
        if (primaryTarget) {
            this.primaryTarget = component;
        }
        if (secondaryTarget) {
            this.secondaryTarget = component;
        }
        return this;
    }
    remove(component) {
        if (isNaN(component)) {
            component = this.components.indexOf(component);
            if (component < 0) {
                return;
            }
        }
        component = this.components.splice(component, 1)[0];
        if (this.primaryTarget == component) {
            this.primaryTarget = undefined;
        }
        if (this.secondaryTarget == component) {
            this.secondaryTarget = undefined;
        }
        component.element.delete();
        return this;
    }
}

class Toggle extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                display: "block",
                width: "3rem",
                height: "1.75rem",
                borderRadius: ".875rem",
                overflow: "hidden",
            },
        });
    }

    constructor(toggled) {
        super();
        let id = genID();
        this.element.html = `<svg viewBox="0 0 48 28">
            <filter id="${id}">
              <feDropShadow flood-color="#0002" dx="0" dy="0" stdDeviation="2"/>
            </filter>
            <path d="M14 0h20a14 14 0 0 1 0 28h-20a14 14 0 0 1 0 -28" fill="#000"/>
            <circle cx="0" cy="14" r="11" fill="currentColor" filter="url(#${id})"/>
        </svg>`;
        this.createAnims({
            toggled: {
                axes: {toggled: 0},
                accel: style.toggleSwitchAccel,
                callback: this.#update,
            },
        });
        this.toggled = toggled;
        this.onPrimary(this.toggle, true);
    }

    #toggled;
    get toggled() {
        return this.#toggled;
    }
    set toggled(toggled) {
        toggled = !!toggled;
        this.anim("toggled", "toggled", this.#toggled = toggled);
    }
    toggle = () => this.toggled = !this.toggled;
    #update = () => {
        console.log(this.anim("toggled", "toggled"));
        this.element.select("path").set({fill: this.mixColor("toggled", "toggled", style.buttonColorUnchecked, style.buttonColorChecked).hex()});
        this.element.select("circle").set({cx: 14 + 20 * this.anim("toggled", "toggled")});
    };
}

class MultiSelect {
    static #Checkmark = class Checkmark extends Widget {
        static {
            defineStyle({
                [e(this)]: {
                    display: "block",
                    width: "1.5rem",
                    height: "1.5rem",
                    /*borderRadius: ".875rem",
                    overflow: "hidden",*/
                },
            });
        }

        #multiSelect;
        #id;
        constructor(multiSelect, id) {
            super();
            this.#multiSelect = multiSelect;
            this.#id = id;
            this.element.html = `<svg viewBox="0 0 24 24">
                <path d="M1.5 12L7.5 21L22.5 3" fill="#0000" stroke="${style.buttonColorChecked.hex()}" stroke-width="0" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0"/>
            </svg>`;
            this.createAnims({
                selected: {
                    axes: {selected: 0},
                    accel: style.checkmarkAccel,
                    callback: this.#update,
                },
            });
            this.onPrimary(this.select, true);
        }

        get selected() {
            return this.#multiSelect.selected == this.#id;
        }
        select = () => {
            this.#multiSelect.selected = this.#id;
        };
        #update = () => this.element.select("path").set({
            strokeWidth: 3 * this.anim("selected", "selected") ** .25,
            strokeDasharray: `${34.2 * this.anim("selected", "selected")} 100`,
        });
    };

    constructor(...ids) {
        this.add(ids);
    }

    #checkmarks = Object.create(null);
    get checkmarks() {
        return Object.assign(Object.create(null), this.#checkmarks);
    }
    add(...ids) {
        ids.flat(Infinity).forEach(id => {
            if (!this.#checkmarks[id]) {
                this.#checkmarks[id] = new MultiSelect.#Checkmark(this, id);
            }
        });
        return this;
    }
    remove(...ids) {
        ids.flat(Infinity).forEach(id => {
            delete this.#checkmarks[id];
            if (this.#selected == id) {
                this.#selected = undefined;
            }
        });
        return this;
    }

    #selected;
    get selected() {
        return this.#selected;
    }
    set selected(selected) {
        if (this.#selected != selected && (selected == undefined || selected in this.#checkmarks)) {
            this.#checkmarks[this.#selected]?.anim("selected", "selected", 0);
            this.#checkmarks[this.#selected = selected]?.anim("selected", "selected", 1);
        }
    }
}

class SubMenu extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
            },
            [e(this, "Preview")]: {
                color: style.descriptionColor.hex(),
            },
            [e(this, "Arrow")]: {
                display: "flex",
                width: "1rem",
                height: "1rem",
                transformOrigin: "center",
            },
        });
    }

    #previewContainer = eNew(this, "Preview");
    #arrow = eNew(this, "Arrow");

    constructor(menu, preview) {
        super();
        this.element.add(this.#previewContainer, this.#arrow);
        this.#arrow.html = `<svg viewBox="0 0 16 16">
            <path d="M5 2L11 8L5 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        this.menu = menu;
        this.preview = preview;
        this.onPrimary(() => this.visible = true, true);
        this.element.listen("interaction-started", e => {
            if (this.#menu) {
                if (new InteractionStartedEvent().dispatchOn(this.#menu.element.raw).defaultPrevented) {
                    e.preventDefault();
                }
            }
        });
        this.element.listen(["container-width-changed", "container-position-changed"], () => schedule(this.#updatePosition));
    }

    #menu;
    get menu() {
        return this.#menu;
    }
    set menu(menu) {
        if (this.#menu) {
            if (index > -1) {
                this.#menu.onUpdate.splice(index, 1);
            }
        }
        if (this.#menu = menu) {
            menu.instantAnim(true);
            menu.visible = false;
        }
    }

    #preview;
    get preview() {
        return this.#preview;
    }
    set preview(preview) {
        this.#previewContainer.text = this.#preview = preview ? `${preview}` : "";
    }

    get visible() {
        return this.#menu?.visible;
    }
    set visible(visible) {
        if (this.#menu) {
            let tile = this.element.closest(e(Tile));
            this.#menu.visible = visible;
            this.#menu.floatingCenter = (tile.bounds.left + tile.bounds.right) * .5;
            this.#menu.floatingTop = tile.bounds.top /*- style.padding*/;
        }
    }

    #updatePosition = () => {
        if (this.#menu && this.#menu.partiallyVisible) {
            let tile = this.element.closest(e(Tile));
            this.#menu.offsetFloatingCenter((tile.bounds.left + tile.bounds.right) * .5);
            this.#menu.offsetFloatingTop(tile.bounds.top /*- style.padding*/);
        }
    };
}

class NumberInput extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                display: "block",
                width: "8rem",
                height: "1.75rem",
                borderRadius: ".875rem",
                overflow: "hidden",
                outline: "2px solid red",
                contenteditable: "true",
            },
        });
    }

    constructor(value) {
        super();
        this.element.set({
            contenteditable: "plaintext-only",
        }).listen("blur", () => window.getSelection().empty()).text = value;
        this.onPrimary(() => {}, true);
    }
}

let tabBar = (selected, ...ids) => {
    let tabBar = new TabBar(ids);
    tabBar.selected = selected;
    return tabBar;
};
let tabs = (selected, tabs) => {
    let tabBar = new TabBar(Object.keys(tabs));
    tabBar.selected = selected;
    let paneHolder = window.tmp = new PaneHolder(tabs, selected);
    tabBar.onSelect = selected => paneHolder.selected = selected;
    return [tabBar, paneHolder];
};
let simpleButton = name => new Tile(undefined, name);
let toggle = (icon, name, description, toggled) => new Tile(icon, name, description).add(new Toggle(toggled), true);
let numberInput = (name, value) => new Tile(undefined, name, undefined).add(new NumberInput(value));
let multiSelect = (selected, ...ids) => {
    let multiSelect = new MultiSelect(ids);
    multiSelect.selected = selected;
    return ids.map(id => new Tile(undefined, id, undefined).add(multiSelect.checkmarks[id], true));
};
let subMenu = (name, menu, preview) => new Tile(undefined, name, undefined).add(new SubMenu(menu, preview), true);

// TODO Dragging.
