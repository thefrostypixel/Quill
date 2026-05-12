let style = {
    floatingBackground: "#272727B3",
    floatingSaturation: 1.5,
    floatingBlur: 10,
    floatingRadius: 40,
    floatingOutline: "#666666B3",
    floatingAccel: 20000,

    fixedBackground: "#272727",
    fixedSaturation: 1.5,
    fixedBlur: 20,
    fixedRadius: 0,
    fixedOutline: "#66666600",
    fixedAccel: 20000,
    
    floatingWidth: 400,
    stateAccel: 20,

    gap: 20,
    padding: 25,
    lineWidth: 2,
    spacerColor: "#EEEEEE11",

    textSize: 1, // 1 rem = 16 px by default.
    textColor: "#EEEEEE",
    descriptionSize: .875, // .875 rem = 14 px by default.
    descriptionColor: "#BBBBBB",
    titleSize: .75, // .75 rem = 12 px by default.
    titleColor: "#DDDDDD",

    buttonPadding: 7,
    buttonRadius: 10,
    toggleAccel: 500,
    buttonColorUnchecked: "#EEEEEE4D",
    // buttonColorChecked: "#008FFF",
    buttonColorChecked: "#6AA3DE",
};

let tapDistance = 10;
let secondaryTouchDuration = .5;

let time;
let now = () => time?.sec ?? performance.now() / 1e3;

let popupContainer = $("#popups");

let definedStyle = "";
let defineStyle = style => {
    Object.entries(style).forEach(([selector, properties]) => definedStyle += `${selector}{${Object.entries(properties).map(([key, value]) => `${key.replace(/[A-Z]/g, "-$&").replace(/^\$/, "--").toLowerCase()}:${value};`).join("")}}`);
    $("#defined-style").text = definedStyle;
};

let genID = () => Math.floor(Math.random() * 0x100000000).toString(16).toUpperCase();

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
        color: style.textColor,
        userSelect: "none",
        WebkitUserSelect: "none",
    },
});
$.listen([
    "contextmenu", // Disable the right click menu on desktop.
], e => e.preventDefault());
$.listen([
    "gesturestart", // Disable pinch zooming on iOS, iPadOS and potentially Android.
    "touchend" // Disable double tap zooming on iOS, iPadOS and potentially Android.
], e => window.visualViewport.scale == 1 && e.preventDefault()); // Check the current zoom to allow un-zooming when the zoom somehow changed.

class PrimaryEvent extends Event {
    constructor(x, y) {
        super("primary", {composed: true, bubbles: true});
        this.x = x;
        this.y = y;
    }
};
class SecondaryEvent extends Event {
    constructor(x, y) {
        super("secondary", {composed: true, bubbles: true});
        this.x = x;
        this.y = y;
    }
};
$.listen("pointerdown", e => {
    if (e.pointerType == "mouse") {
        if (e.button == 0) { // Left click
            $(e.target).dispatch(new PrimaryEvent(e.clientX, e.clientY));
        } else if (e.button == 2) { // Right click
            $(e.target).dispatch(new SecondaryEvent(e.clientX, e.clientY));
        }
    } else { // Touch
        let holdStart = {x: e.clientX, y: e.clientY, time: now(), target: e.target};
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
});

let screen = {};
let onResize = [];
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

// TODO Keyboard navigation.
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

    #anims = Object.create(null);
    createAnims(anims) {
        Object.keys(anims).forEach(anim => (this.#anims[anim] = new antica.Anim(anims[anim].axes, anims[anim].accel, time)).callback = anims[anim].callback);
        this.instantAnim(true);
    }
    anim(anim, axis, target) {
        if (this.#anims[anim] && this.#anims[anim].axes[axis]) {
            if (target != undefined) {
                if (this.#instantAnims[anim]) {
                    this.#anims[anim].axes[axis] = target;
                    this.#anims[anim].callback?.();
                } else {
                    this.#anims[anim].values[axis] = target;
                }
            } else {
                return this.#anims[anim].values[axis];
            }
        }
    }
    animTarget(anim, axis, target) {
        if (this.#anims[anim] && this.#anims[anim].axes[axis]) {
            if (target != undefined) {
                if (this.#instantAnims[anim]) {
                    this.#anims[anim].axes[axis] = target;
                    this.#anims[anim].callback?.();
                } else {
                    this.#anims[anim].values[axis] = target;
                }
            } else {
                return this.#anims[anim].axes[axis].target;
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
        requestAnimationFrame(() => this.#instantAnims = Object.create(null));
    }

    mixNum(anim, axis, n0, n1) {
        return n0 + (n1 - n0) * this.anim(anim, axis);
    }
    mixColor(anim, axis, c0, c1) {
        return `color-mix(in oklab, ${c0}, ${c1} ${this.anim(anim, axis) * 100}%)`;
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
    }
    offPrimary(listener) {
        let index = this.#primaryListeners.indexOf(listener);
        if (index > -1) {
            this.#stopPrimaryPropagation.delete(this.#primaryListeners.splice(index, 1)[0]);
        }
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
    }
    offSecondary(listener) {
        let index = this.#secondaryListeners.indexOf(listener);
        if (index > -1) {
            this.#stopSecondaryPropagation.delete(this.#secondaryListeners.splice(index, 1)[0]);
        }
    }
}

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
                width: "inherit",
                padding: `var(--padding-top) 0 var(--padding-bottom) 0`,
                overflow: "scroll",
            },
            [`${e(this, "Content")} > *`]: {
                marginLeft: `var(--padding-left)`,
                marginRight: `var(--padding-right)`,
            },
        });
    }

    content = eNew(this, "Content");
    contentMask;
    #update = () => {
        let mixNum = (floating, fixed) => this.mixNum("state", "fixed", floating, fixed);
        let mixColor = (floating, fixed) => this.mixColor("state", "fixed", floating, fixed);

        this.content.style({height: "auto"});

        let floatingLeft = Math.max(Math.min(this.anim("floating", "left") + Menu.#xOffset(this.#floatingLeftAnchor), screen.padded.right - style.floatingWidth), screen.padded.left);
        let floatingTop = Math.max(Math.min(this.anim("floating", "top") + Menu.#yOffset(this.#floatingTopAnchor), screen.padded.bottom - this.content.scroll.height), screen.padded.top);
        let floatingWidth = Math.min(style.floatingWidth, screen.padded.width);
        let floatingHeight = Math.min(this.content.scroll.height, screen.padded.height);

        let fixedLeft = this.anim("fixed", "left") + Menu.#xOffset(this.#fixedLeftAnchor);
        let fixedTop = this.anim("fixed", "top") + Menu.#yOffset(this.#fixedTopAnchor);
        let fixedWidth = this.anim("fixed", "right") + Menu.#xOffset(this.#fixedRightAnchor) - fixedLeft;
        let fixedHeight = this.anim("fixed", "bottom") + Menu.#yOffset(this.#fixedBottomAnchor) - fixedTop;

        let left = mixNum(floatingLeft, fixedLeft);
        let top = mixNum(floatingTop, fixedTop);
        let width = Math.round(mixNum(floatingWidth, fixedWidth));
        let height = Math.round(mixNum(floatingHeight, fixedHeight));
        let cornerRadius = Math.round(mixNum(style.floatingRadius, style.fixedRadius));

        this.element.style({
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            background: mixColor(style.floatingBackground, style.fixedBackground),
            backdropFilter: `saturate(${mixNum(style.floatingSaturation, style.fixedSaturation)}) blur(${mixNum(style.floatingBlur, style.fixedBlur)}px)`,
            borderRadius: `${cornerRadius}px`,
            outline: `${style.lineWidth}px solid ${mixColor(style.floatingOutline, style.fixedOutline)}`,
            $paddingLeft: `${Math.max(style.padding, screen.safe.left - left)}px`,
            $paddingRight: `${Math.max(style.padding, left + width - screen.safe.right)}px`,
            $paddingTop: `${Math.max(style.padding, screen.safe.top - top)}px`,
            $paddingBottom: `${Math.max(style.padding, top + height - screen.safe.bottom)}px`,
        });

        this.content.style({
            height: `inherit`,
            $cornerRadius: `${cornerRadius}px`,
            $padding: `${style.padding}px`,
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
    };

    contentHeightChanged() {
        this.#update();
    }

    constructor() {
        super();
        this.element.add(this.content);
        popupContainer.add(this.element);
        this.createAnims({
            state: {
                axes: {fixed: 0},
                accel: style.stateChangeAccel,
                callback: this.#update,
            },
            floating: {
                axes: {left: 0, top: 0},
                accel: style.floatingAccel,
                callback: this.#update,
            },
            fixed: {
                axes: {left: 0, right: 0, top: 0, bottom: 0},
                accel: style.fixedAccel,
                callback: this.#update,
            },
        });
        this.contentHeightChanged();
        onResize.push(this.#update);
    }



    #state = "floating" || "fixed";
    get state() {
        return this.#state;
    }
    set state(state) {
        if ((state == "floating" || state == "fixed") && state != this.#state) {
            this.#state = state;
            this.anim("state", "fixed", state == "fixed");
        }
    }



    #floatingLeftAnchor = "left";
    get floatingLeftAnchor() {
        return this.#floatingLeftAnchor;
    }
    set floatingLeftAnchor(floatingLeftAnchor) {
        if (["left", "right", "full-left", "full-right"].includes(floatingLeftAnchor) && floatingLeftAnchor != this.#floatingLeftAnchor) {
            this.offsetAnim("floating", "left", Menu.#xOffset(this.#floatingLeftAnchor) - Menu.#xOffset(this.#floatingLeftAnchor = floatingLeftAnchor));
        }
    }

    get floatingLeft() {
        return this.animTarget("floating", "left");
    }
    set floatingLeft(floatingLeft) {
        this.instantAnim({floating: this.anim("state", "fixed") > 1 - 1e-3 || undefined});
        this.anim("floating", "left", floatingLeft);
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
        this.instantAnim({floating: this.anim("state", "fixed") > 1 - 1e-3 || undefined});
        this.anim("floating", "top", floatingTop);
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
        this.instantAnim({fixed: this.anim("state", "fixed") < 1e-3 || undefined});
        this.anim("fixed", "left", fixedLeft);
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
        this.instantAnim({fixed: this.anim("state", "fixed") < 1e-3 || undefined});
        this.anim("fixed", "right", fixedRight);
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
        this.instantAnim({fixed: this.anim("state", "fixed") < 1e-3 || undefined});
        this.anim("fixed", "top", fixedTop);
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
        this.instantAnim({fixed: this.anim("state", "fixed") < 1e-3 || undefined});
        this.anim("fixed", "bottom", fixedBottom);
    }



    add(element) {
        this.content.add(element.element);
        this.contentHeightChanged();
        return this;
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
                background: style.spacerColor,
            },
        });
    }
}

// TODO Add a show/hide option.
class HorizontalGroup extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                overflow: "scroll",
                padding: `0 var(--padding-right) 0 var(--padding-left)`,
                margin: "0",
            },
            [`${e(this)} > *`]: {
                justifyContent: "center",
                flex: "1",
                minWidth: "fit-content",
            },
        });
    }

    add(element) {
        this.element.add(element.element);
        return this;
    }
}

class Title extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                boxSizing: "border-box",
                display: "flex",
                padding: `${style.buttonPadding}px ${style.buttonPadding * 2}px ${style.buttonPadding * .5}px ${style.buttonPadding * 2}px`,
                fontSize: `${style.textSize}rem`,
                lineHeight: "1",
                fontWeight: "700",
                color: style.smallTextColor,
                userSelect: "none",
                WebkitUserSelect: "none",
            },
        });
    }

    constructor(title) {
        super();
        this.element.text = title;
    }
}

// TODO Add some way to let MultiSelect and Toggle color it.
class Tile extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                display: "flex",
                padding: `${style.buttonPadding}px`,
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
                color: style.descriptionColor,
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
        this.icon = icon;
        this.name = name;
        this.description = description;
        this.components = components.flat(Infinity);
        this.#update();
        this.onPrimary(e => this.primaryTarget?.primary(e), true);
        this.onSecondary(e => this.secondaryTarget?.primary(e), true);
    }

    // TODO Try not to rebuild everything every time something changes.
    #update() {
        let label = eNew(this, "Label");
        if (this.#name) {
            let name = eNew(this, "Name");
            name.text = this.#name;
            label.add(name);
        }
        if (this.#description) {
            let description = eNew(this, "Description");
            description.text = this.#description;
            label.add(description);
        }
        let components = eNew(this, "Components");
        this.components.forEach(component => components.add(component.element));
        this.element.empty().add(label, components);
    }
    
    #icon; // TODO
    get icon() {
        return this.#icon;
    }
    set icon(icon) {
        this.#icon = icon;
    }
    
    #name = "";
    get name() {
        return this.#name;
    }
    set name(name) {
        if (typeof name == "string") {
            this.#name = name;
            this.#update();
        }
    }
    
    #description = "";
    get description() {
        return this.#description;
    }
    set description(description) {
        if (typeof description == "string") {
            this.#description = description;
            this.#update();
        }
    }

    components = [];
    primaryTarget;
    secondaryTarget;
    add(component, primaryTarget = false, secondaryTarget = false) {
        return this.insert(component, undefined, primaryTarget, secondaryTarget);
    }
    insert(component, index, primaryTarget = false, secondaryTarget = false) {
        if (!this.components.includes(component)) {
            if (index == undefined) {
                this.components.push(component);
            } else {
                this.components.splice(index, 0, component);
            }
            this.#update();
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
        this.#update();
        return this;
    }
}

/*
class Spacer extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                flex: "1",
            },
        });
    }

    constructor() {
        super();
    }
}

class Label extends Widget {
    static alignment = {
        none: "None",
        left: "Left",
        right: "Right",
        middle: "Middle",
    };

    constructor(text = "") {
        super();
        this.text = text;
    }

    #text;
    get text() {
        return this.#text;
    }
    set text(text) {
        this.element.text = this.#text = text;
    }
}

// TODO Icon.
*/

class ToggleSwitch extends Widget {
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
        this.element.html = `<svg viewBox="0 0 48 28">
            <path d="M14 0h20a14 14 0 0 1 0 28h-20a14 14 0 0 1 0 -28" fill="#000"/>
            <circle cx="0" cy="14" r="11" fill="currentColor"/>
        </svg>`;
        this.createAnims({
            toggled: {
                axes: {toggled: 0},
                accel: style.toggleAccel,
                callback: this.#update.bind(this),
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
        this.element.select("path").set({fill: this.mixColor("toggled", "toggled", style.buttonColorUnchecked, style.buttonColorChecked)});
        this.element.select("circle").set({cx: 14 + 20 * this.anim("toggled", "toggled")});
    };
}

// TODO Make this the MultiSelect.
/*class Toggle extends Widget {
    static {
        defineStyle({
            [e(this)]: {
                /!*width: "1rem",
                height: "1rem",*!/
                width: "3rem",
                height: "1.75rem",
                marginRight: ".5rem",
            },
        });
    }

    #toggled;
    // TODO Have a ToggleButton class that has a toggle switch on the right.
    // TODO Have a MultiSelect class that's just a blank wrapper with functionality for having multiple selectable children and logic for which maybe selected together, as well as a MultiSelect.Tile class that's the actual button with an ID used in the MultiSelect and a leading checkmark.
    // TODO Have the option to parent a Menu to an element and have it follow it around.

    constructor(label, toggled) {
        super();

        this.createAnims({
            toggled: {
                axes: {toggled: 0},
                accel: style.toggleAccel,
                callback: this.#update.bind(this),
            },
        });
        this.label = label;
        this.toggled = toggled;
        this.onPrimary(this.toggle);
    }

    get label() {
        return this.#label;
    }
    set label(label) {
        this.#labelContainer.text = this.#label = label;
        this.element.empty().add(this.#toggled == undefined ? undefined : this.#toggleContainer, this.#labelContainer);
    }

    get toggled() {
        return this.#toggled;
    }
    set toggled(toggled) {
        toggled = toggled ? true : toggled == false ? false : undefined;
        if (toggled == undefined) {
            this.#toggleContainer = this.#toggled = undefined;
        } else {
            if (this.#toggled == undefined) {
                this.#toggleContainer = eNew(this, "CheckBox");
                this.anim("toggled", "toggled", this.#toggled = toggled);
            } else {
                this.anim("toggled", "toggled", this.#toggled = toggled);
            }
            this.#update();
        }
        // this.element.empty().add(this.#toggled == undefined ? undefined : this.#toggleContainer, this.#labelContainer);
        this.element.empty().add(this.#labelContainer, this.#toggled == undefined ? undefined : this.#toggleContainer);
        this.element.style({
            justifyContent: "space-between",
        });
    }
    toggle() {
        if (this.toggled != undefined) {
            this.toggled = !this.toggled;
        }
    }
    #update() {
        if (this.#toggleContainer) {
            // Leading circled checkmark (maybe for selecting elements).
            /!*let maskID = genID();
            this.#toggleContainer.html = `
                <svg viewBox="0 0 16 16">
                    <mask id="${maskID}" maskUnits="userSpaceOnUse">
                        <rect width="16" height="16" fill="#000"/>
                        <circle cx="8" cy="8" r="${8 * this.#toggledAnim.values.toggled}" fill="#FFF"/>
                    </mask>
                    <circle cx="8" cy="8" r="7" fill="#0000" stroke="${style.buttonColorUnchecked}" stroke-width="2"/>
                    <g mask="url(#${maskID})">
                        <circle cx="8" cy="8" r="8" fill="${style.buttonColorChecked}"/>
                        <path d="M3.5 8.5L6.5 12L11.5 5" fill="#0000" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                </svg>
            `;*!/
            // Leading checkmark for selecting one of multiple (maybe make it trailing).
            /!*this.#toggleContainer.html = `
                <svg viewBox="0 0 16 16">
                    <path d="M1.5 8L5 14L14.5 2" fill="#0000" stroke="${style.buttonColorChecked}" stroke-width="${2 * this.#toggledAnim.values.toggled ** .25}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${23 * this.#toggledAnim.values.toggled} 100"/>
                </svg>
            `;*!/
            // TODO Trailing toggle switch.
            this.#toggleContainer.html = `
                <svg viewBox="0 0 48 28">
                    <path d="M14 0h20a14 14 0 0 1 0 28h-20a14 14 0 0 1 0 -28" fill="${/!*Widget.mixColor(style.buttonColorUnchecked, style.buttonColorChecked, this.#toggledAnim.values.toggled)*!/style.buttonColorUnchecked}"/>
                    <circle cx="${14 + 20 * this.anim("toggled", "toggled")}" cy="14" r="11" fill="currentColor"/>
                </svg>
            `;
        }
    }
}*/

let simpleButton = name => new Tile(undefined, name);
let toggleSwitch = (icon, name, description, toggled) => new Tile(icon, name, description).add(new ToggleSwitch(toggled), true);
