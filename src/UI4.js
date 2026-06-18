let renderer = new Renderer();
document.body.appendChild(renderer.canvas);

let cache = new Cache();

let centerImage = (src, dst) => {
    let ratio = Math.min(src.width / dst.width, src.height / dst.height);
    let width = src.width - dst.width * ratio;
    let height = src.height - dst.height * ratio;
    return new Box2(.5 * width, -.5 * width + src.width, .5 * height, -.5 * height + src.height);
};

let fetchImage = url => renderer.asyncTexture(fetch(url));

let background = undefined;
let backgroundPromise = fetchImage("/src/Wallpaper.jpg").then(image => background = image);

// TODO Font scale: parseFloat(window.getComputedStyle(document.documentElement).fontSize) / 16
let style = {
    menuSpacing: new Padding2(20),
    menuPadding: new Padding2(22),
    menuWidth: 350,
    menuHeightMax: Infinity,
    menuRadius: 40,
    menuBackground: Color.okLab({L: .25}, .5),
    menuBlur: 16,
    menuSaturation: 1.5,
    menuShadowColor: Color.okLab({}, .5),
    menuShadowBlur: 40,
    menuShadowOffset: new Vec2(0, -10),
    menuAccel: 20000,
    menuVisibilityAccel: 500,
    menuVisibilityAnimHeightScale: 100,
    menuHighlightColor: Color.okLab({L: .8}, .25),
    menuHighlightOpacityAccel: 200,
    menuHighlightPosAccel: 20000,

    lineWidth: 2,

    paneAccel: 500,
    paneAnimHeightScale: 50,

    titlePadding: new Padding2(16, 16, 4, 8),

    tilePadding: new Padding2(4),
    tileRadius: 18,
    tileTextPadding: new Padding2(8, 5),
    tileComponentSpacing: 8,

    switchSize: new Vec2(48, 28),
    switchBackground0: /*Color.okLab({L: .95}, .3)*/Color.okLab({L: .55}),
    switchBackground1: Color.okLab({L: .7, a: -.06, b: -.15}),
    switchThumbRadius: 10,
    switchThumbColor: Color.okLab({L: .9}),
    switchThumbShadow: Color.okLab({}, .15),
    switchAccel: 500,

    checkmarkSize: new Vec2(28, 28),
    checkmarkAccel: 200,
    checkmarkLineWidth: 2.75,
    checkmarkColor: Color.okLab({L: .7, a: -.06, b: -.15}),

    tabBarSpacing: new Padding2(2),
    tabBarPadding: new Padding2(32, 7),
    tabBarGap: -8,
    tabBarHighlightRadius: 16,
    tabBarHighlightColor: Color.okLab({L: .8}, .25),
    tabBarHighlightOpacityAccel: 200,
    tabBarHighlightPosAccel: 20000,

    dividerPadding: new Padding2(0, 24),
    dividerColor: Color.okLab({L: .8}, .25),

    titleFont: new Font({
        size: 16,
        weight: 700,
        font: "SF Pro Display",
        color: Color.okLab({L: .9}),
        cache,
    }),
    nameFont: new Font({
        size: 16,
        weight: 400,
        font: "SF Pro Display",
        color: Color.okLab({L: .95}),
        cache,
    }),
    descriptionFont: new Font({
        size: 14,
        weight: 400,
        font: "SF Pro Display",
        color: Color.okLab({L: .8}),
        cache,
    }),
};

let debugProgram;
let drawDebugBox = (target, box, fill = Color.lRgb(0, 1, 0, .2), border = Color.okLab(fill.L, fill.a, fill.b, .5 + .5 * fill.alpha)) => {
    debugProgram ??= renderer.program(`#version 300 es
    precision mediump float;

    in vec2 pos;
    uniform mat3 posTransform;
    out vec2 uv;

    void main() {
        uv = pos;
        gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
    }
    `, `#version 300 es
    precision mediump float;

    in vec2 uv;
    uniform vec2 tolerance;
    uniform vec4 fill;
    uniform vec4 border;
    out vec4 color;

    void main() {
        color = uv.x < tolerance.x || 1. - tolerance.x < uv.x || uv.y < tolerance.y || 1. - tolerance.y < uv.y ? border : fill;
    }
    `);
    renderer.draw({
        target,
        program: debugProgram,
        mesh: renderer.boxMesh2D,
        uniforms: {
            posTransform: box.vertexMat3(target),
            tolerance: new Vec2(1 / box.xSize, 1 / box.ySize),
            fill,
            border,
        },
        blending: Renderer.Blending.overlay,
    }).exec();
};

globalThis.MenuHolder = class MenuHolder {
    constructor(style, renderer, translations, cache) {
        this.#style = style;
        this.#renderer = renderer;
        this.#translations = translations;
        this.#cache = cache;
        if (!this.#cache) {
            this.#ownCache = new Cache();
        }
    }

    #style;
    get style() {
        return this.#style;
    }

    #renderer;
    get renderer() {
        return this.#renderer;
    }

    #translations;
    get translations() {
        return this.#translations;
    }

    #cache;
    #ownCache;
    get cache() {
        return this.#cache || this.#ownCache;
    }

    #storage = new Cache();
    get storage() {
        return this.#storage;
    }

    remove = () => {
        this.#menus.forEach(menu => menu.remove());
        this.#storage.clean();
    };

    #menus = [];
    menu = () => {
        let menu = new Menu(this, () => this.#menus.splice(this.#menus.indexOf(menu), 1));
        this.#menus.push(menu);
        return menu;
    };

    layout = targetSize => this.#menus.map(menu => {
        let layout = new Layout(menu);
        menu.layout(layout, targetSize);
        return layout;
    });

    handle = (e, layout) => {
        for (let menuLayout of layout.toReversed()) {
            if (e.captured) {
                return;
            }
            menuLayout.owner.handle(e, menuLayout);
        }
    };

    render = (target, layout) => {
        layout.forEach(layout => layout.owner.render(target, layout));
        this.#ownCache?.sweep();
    };
};

globalThis.Layout = class Layout {
    constructor(owner, width, height) {
        this.#owner = owner;
        this.width = width;
        this.height = height;
    }

    #owner;
    get owner() {
        return this.#owner;
    }
    set owner(owner) {
        this.#owner = owner;
    }

    #width = 0;
    get width() {
        return this.#width;
    }
    set width(width) {
        if (isFinite(width)) {
            this.#width = +width;
        }
    }

    #height = 0;
    get height() {
        return this.#height;
    }
    set height(height) {
        if (isFinite(height)) {
            this.#height = +height;
        }
    }

    get size() {
        return new Vec2(this.width, this.height);
    }
    set size(size) {
        this.width = size?.x ?? size?.[0];
        this.height = size?.y ?? size?.[1];
    }

    #layouts = [];
    get layouts() {
        return this.#layouts;
    }
    set layouts(layouts) {
        this.#layouts = layouts || [];
    }
};

globalThis.Trigger = class Trigger {
    static contains = (box, radius, e) => {
        if (e instanceof Inputs.Event.Positioned) {
            let x = Math.abs(e.pos.x - box.center.x) - .5 * box.size.x + radius;
            let y = Math.abs(e.pos.y - box.center.y) - .5 * box.size.y + radius;
            return new Vec2(Math.max(x, 0), Math.max(y, 0)).length + Math.min(Math.max(x, y), 0) <= radius;
        }
        return true;
    };

    constructor(handler) {
        this.handler = handler;
    }

    #handler = () => {};
    get handler() {
        return this.#handler;
    }
    set handler(handler) {
        this.#handler = handler || (() => {});
    }

    #box;
    get box() {
        return this.#box;
    }
    set box(box) {
        this.#box = box;
    }

    #layout;
    get layout() {
        return this.#layout;
    }
    set layout(layout) {
        this.#layout = layout;
    }

    #radius = 0;
    get radius() {
        return this.#radius;
    }
    set radius(radius) {
        if (isFinite(radius)) {
            this.#radius = radius;
        }
    }

    set = (pos, layout, radius) => {
        this.box = new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height));
        this.layout = layout;
        this.radius = radius;
        return this;
    };

    contains = e => Trigger.contains(this.box, this.radius, e);
    handle = e => {
        if (this.contains(e)) {
            this.handler(e, this.layout);
        }
    };
};

globalThis.Widget = class Widget {
    constructor(owner, remover) {
        this.#owner = owner;
        this.#remover = remover;
    }

    #owner;
    get owner() {
        return this.#owner;
    }

    #remover;
    remove = () => {
        if (this.#owner) {
            this.#remover();
            this.#owner = undefined;
        }
    };

    #menuHolder;
    get menuHolder() {
        return this.#menuHolder ??= this.#owner instanceof MenuHolder ? this.#owner : this.#owner.menuHolder;
    }

    get style() {
        return this.menuHolder.style;
    }
    get renderer() {
        return this.menuHolder.renderer;
    }
    get translations() {
        return this.menuHolder.translations;
    }
    get cache() {
        return this.menuHolder.cache;
    }
    get storage() {
        return this.menuHolder.storage;
    }
};

globalThis.ElementHolder = class ElementHolder extends Widget {
    #elements = [];
    get elements() {
        return Array.from(this.#elements);
    }
    #addElement = (constructor, ...args) => {
        let element = new constructor(this, () => this.#elements.splice(this.#elements.indexOf(element), 1), ...args);
        this.#elements.push(element);
        return element;
    };

    paneHolder = selected => this.#addElement(PaneHolder, selected);
    pane = () => this.#addElement(Pane);
    title = title => this.#addElement(Title, title);
    tile = (name, description) => this.#addElement(Tile, name, description);
    tabBar = (tabs = [], selected = tabs[0]?.id || "") => this.#addElement(TabBar, tabs, selected);
    divider = () => this.#addElement(Divider);
};

globalThis.Menu = class Menu extends ElementHolder {
    constructor(owner, remover) {
        super(owner, () => {
            remover();
            this.elements.forEach(e => e.remove());
            this.#blurTexture?.delete();
            this.#contentTexture?.delete();
        });
        this.#visibilityAnim = new Anim({opacity: this.#visible, height: 0}, this.style.menuVisibilityAccel);
        this.#highlightOpacity = new Anim(0, this.style.menuHighlightOpacityAccel);
        this.#highlightPos = new Anim({left: 0, right: 0, bottom: 0, top: 0, radius: 0}, this.style.menuHighlightPosAccel);
    }

    #pos = new Vec2();
    get pos() {
        return this.#pos;
    }
    set pos(pos) {
        this.#pos = pos;
    }
    position = (...v) => {
        this.pos = new Vec2(...v);
        return this;
    };

    #visible = false;
    get visible() {
        return this.#visible;
    }
    set visible(visible) {
        if (!(this.#visible = !!visible)) {
            this.endPersistence();
        }
        if (!this.partiallyVisible) {
            this.elements.forEach(e => e.endAnims?.());
        }
        this.#visibilityAnim.to({opacity: this.#visible = !!visible, height: !!visible * this.#height / this.style.menuVisibilityAnimHeightScale}).skip(this.#instantAnim);
    }
    hide = () => {
        this.visible = false;
        return this;
    };
    show = () => {
        this.visible = true;
        return this;
    };

    #visibilityAnim;
    get partiallyVisible() {
        return !!this.#visibilityAnim.values.opacity;
    }

    #persistent = false;
    get persistent() {
        return this.#persistent;
    }
    set persistent(persistent) {
        if (this.#persistent = !!persistent) {
            this.show();
        }
    }
    persist = () => {
        this.persistent = true;
        return this;
    };
    endPersistence = () => {
        this.persistent = false;
        return this;
    };

    #highlighted;
    #highlightOpacity;
    #highlightPos;
    #setHighlighted(highlighted) {
        if (this.#highlighted != highlighted) {
            let last = this.#highlighted?.box;
            this.#highlighted = highlighted;
            this.#highlightPos.offset({left: (last?.left || 0) - (this.#highlighted?.box.left || 0), right: (last?.right || 0) - (this.#highlighted?.box.right || 0), bottom: (last?.bottom || 0) - (this.#highlighted?.box.bottom || 0), top: (last?.top || 0) - (this.#highlighted?.box.top || 0)});
        }
    }

    #instantAnim = true;
    endAnims = () => {
        this.#visibilityAnim.skip();
        this.#highlightOpacity.skip();
        this.#highlightPos.skip();
    };

    #scroll = 0;
    get scroll() {
        return this.#scroll;
    }
    set scroll(scroll) {
        this.#scroll = scroll;
    }

    #height = 0;
    layout = (layout, targetSize) => {
        let spacing = this.style.menuSpacing.copy.includeScreenInsets();
        let width = layout.width = Math.ceil(Math.min(targetSize.x - spacing.xTotal, this.style.menuWidth));
        let layouts = layout.layouts = this.elements.map(e => {
            let layout = new Layout(e, width - this.style.menuPadding.xTotal);
            e.layout?.(layout);
            return layout;
        });
        let contentHeight = layouts.reduce((height, layout) => height + layout.height, this.style.menuPadding.yTotal);
        let height = Math.min(targetSize.y - spacing.yTotal, contentHeight);
        if (this.#height != height) {
            if (this.#visible) {
                this.#visibilityAnim.targets.height = height / this.style.menuVisibilityAnimHeightScale;
            }
            this.#visibilityAnim.values.height = height * this.#visibilityAnim.values.opacity / this.style.menuVisibilityAnimHeightScale;
        }
        this.#height = height;
        layout.height = Math.round(this.#visibilityAnim.values.height * this.style.menuVisibilityAnimHeightScale);
        let corner = new Vec2(Math.min(Math.max(this.pos.x - .5 * width, spacing.left), targetSize.x - spacing.right - width), Math.min(Math.max(this.pos.y + this.style.menuPadding.top - layout.height, spacing.bottom), targetSize.y - layout.height - spacing.top));
        layout.box = new Box2(corner, new Vec2(width, layout.height).add(corner));
        this.scroll = Math.min(Math.max(this.scroll, 0), layout.overflow = contentHeight - layout.height);
    };

    triggers = layout => {
        let triggers = [];
        let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
        let pos = new Vec2(this.style.menuPadding.left + extra, layout.box.height + extra - this.style.menuPadding.top);
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].triggers?.(triggers, pos.copy, layout.layouts[i]);
            pos.y -= layout.layouts[i].height;
        }
        return triggers;
    };

    handle = (e, layout) => {
        if (Trigger.contains(layout.box, this.style.menuRadius, e)) {
            if (e instanceof Inputs.Event.Positioned) {
                let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
                let offset = layout.box.min.sub(extra, extra - this.scroll);
                e.pos.sub(offset);
                e.lastPos?.sub(offset);
                e.startPos?.sub(offset);
                for (let trigger of this.triggers(layout).toReversed()) {
                    if (e.captured) {
                        break;
                    }
                    trigger.handle(e, layout);
                }
                e.pos.add(offset);
                e.lastPos?.add(offset);
                e.startPos?.add(offset);
                if (e instanceof Inputs.Event.Scroll) {
                    if (!e.captured) {
                        this.scroll = Math.min(Math.max(this.scroll - e.locked.y, 0), layout.overflow);
                    }
                } else {
                    this.#setHighlighted();
                }
            } else {
                if (this.#highlighted) {
                    if (this.triggers(layout).includes(this.#highlighted)) {
                        this.#highlighted.handle(e);
                    } else {
                        this.#setHighlighted();
                    }
                }
                if (!e.captured && e instanceof Inputs.Event.Directional) {
                    let triggers = this.triggers(layout);
                    if (this.#highlighted) {
                        let perpAxis = e.axis == "x" ? "y" : "x";
                        let limit = (triggers = triggers.filter(trigger => e.dir[e.axis] * this.#highlighted.box.center[e.axis] < e.dir[e.axis] * trigger.box.center[e.axis] && trigger.box.min[perpAxis] < this.#highlighted.box.max[perpAxis] && this.#highlighted.box.min[perpAxis] < trigger.box.max[perpAxis])).reduce((limit, trigger) => Math.min(limit, e.dir[e.axis] * trigger.box[e.dir.x > 0 || e.dir.y > 0 ? "max" : "min"][e.axis]), Infinity);
                        this.#setHighlighted(triggers.filter(trigger => e.dir[e.axis] * trigger.box[e.dir.x > 0 || e.dir.y > 0 ? "min" : "max"][e.axis] < limit).reduce((closest, trigger) => closest ? (Math.abs(trigger.box.center[perpAxis] - this.#highlighted.box.center[perpAxis]) < Math.abs(closest.box.center[perpAxis] - this.#highlighted.box.center[perpAxis]) ? trigger : closest) : trigger, undefined) || this.#highlighted);
                        e.capture();
                    } else {
                        this.#setHighlighted(triggers[0]);
                    }
                }
            }
            e.capture();
        } else if (!e.captured) {
            if (e instanceof Inputs.Event.Scroll) {
                e.capture();
            } else if (!this.persistent) {
                this.hide();
            }
        }
    };

    #blurTexture;
    #contentTexture;
    #highlightProgram;
    #blurProgram;
    #mainProgram;
    render = (target, layout) => {
        if (this.partiallyVisible) {
            let blurBox = layout.box.copy.expand(this.style.lineWidth).expand(0, this.style.menuBlur).multOrigin(devicePixelRatio);
            (this.#blurTexture ??= this.renderer.texture(blurBox)).clear(blurBox);
            let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
            (this.#contentTexture ??= this.renderer.texture(layout.box.size.add(2 * extra, 2 * extra).scale(devicePixelRatio))).clear(layout.box.size.add(2 * extra, 2 * extra).scale(devicePixelRatio));

            // this.triggers(layout).forEach(trigger => drawDebugBox(this.#contentTexture, trigger.box.copy.move(0, this.scroll)));

            if (this.#highlighted) {
                if (this.triggers(layout).includes(this.#highlighted)) {
                    this.#highlightPos.to({left: 0, right: 0, top: 0, bottom: 0, radius: this.#highlighted.radius}).skip(this.#instantAnim || !this.#highlightOpacity.value);
                } else {
                    this.#setHighlighted();
                }
            }
            this.#highlightOpacity.to(!!this.#highlighted).skip(this.#instantAnim);
            let box = new Box2(this.#highlightPos.values.left + (this.#highlighted?.box.left || 0), this.#highlightPos.values.right + (this.#highlighted?.box.right || 0), this.#highlightPos.values.bottom + (this.#highlighted?.box.bottom || 0), this.#highlightPos.values.top + (this.#highlighted?.box.top || 0)).move(0, this.scroll).multOrigin(devicePixelRatio);
            this.#highlightProgram = this.storage.use("MenuHighlightProgram", () => [
                this.renderer.program(`#version 300 es
                precision mediump float;

                in vec2 pos;
                uniform mat3 posTransform;
                uniform mat3 uvTransform;
                out vec2 uv;

                void main() {
                    uv = (uvTransform * vec3(pos, 1)).xy;
                    gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
                }
                `, `#version 300 es
                precision mediump float;

                in vec2 uv;
                uniform vec2 highlightSize;
                uniform vec2 highlightCenter;
                uniform float highlightRadius;
                uniform vec4 highlightColor;
                out vec4 color;

                float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                    vec2 vec = abs(uv - center) - .5 * size + radius;
                    return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
                }

                void main() {
                    float distance = roundBoxDist(uv, highlightSize - 1., highlightCenter, highlightRadius - .5);
                    color = highlightColor * smoothstep(1., 0., distance);
                }
                `),
                program => program.delete(),
            ]);
            renderer.draw({
                target: this.#contentTexture,
                program: this.#highlightProgram,
                mesh: renderer.boxMesh2D,
                uniforms: {
                    posTransform: box.vertexMat3(this.#contentTexture),
                    uvTransform: box.transformMat3(),
                    highlightSize: box.size,
                    highlightCenter: box.center,
                    highlightRadius: this.#highlightPos.values.radius * devicePixelRatio,
                    highlightColor: this.style.menuHighlightColor.copy.opacity(this.#highlightOpacity.value),
                },
                blending: Renderer.Blending.overlay,
            }).exec();

            let pos = new Vec2(this.style.menuPadding.left + extra, layout.box.height + extra - this.style.menuPadding.top + this.scroll);
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].render(this.#contentTexture, pos.copy, layout.layouts[i]);
                pos.y -= layout.layouts[i].height;
            }

            this.#blurProgram = this.storage.use("MenuBlurProgram", () => [
                this.renderer.program(`#version 300 es
                precision mediump float;

                in vec2 pos;
                uniform mat3 posTransform;
                uniform mat3 uvTransform;
                out vec2 uv;

                void main() {
                    uv = (uvTransform * vec3(pos, 1)).xy;
                    gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
                }
                `, `#version 300 es
                precision mediump float;

                in vec2 uv;
                uniform sampler2D src;
                uniform vec2 targetSize;
                uniform float menuBlur;
                out vec4 color;

                void main() {
                    for (int i = -8; i <= 8; i++) {
                        color += texture(src, (uv + vec2(i, 0) * .125 * menuBlur) / targetSize) * exp(-.03125 * float(i * i));
                    }
                    color *= ${1 / Array.from({length: 17}, (_, i) => i / 8 - 1).reduce((total, t) => total + Math.exp(-2 * t ** 2), 0)};
                }
                `),
                program => program.delete(),
            ]);
            renderer.draw({
                target: this.#blurTexture,
                program: this.#blurProgram,
                mesh: renderer.boxMesh2D,
                uniforms: {
                    posTransform: this.#blurTexture.box.vertexMat3(this.#blurTexture),
                    uvTransform: blurBox.transformMat3(),
                    src: target,
                    targetSize: target.size,
                    menuBlur: this.style.menuBlur,
                },
                blending: Renderer.Blending.overwrite,
            }).exec();
            this.#mainProgram = this.storage.use("MenuMainProgram", () => [
                this.renderer.program(`#version 300 es
                precision mediump float;

                in vec2 pos;
                uniform mat3 posTransform;
                uniform mat3 uvTransform;
                out vec2 uv;

                void main() {
                    uv = (uvTransform * vec3(pos, 1)).xy;
                    gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
                }
                `, `#version 300 es
                precision mediump float;

                in vec2 uv;
                uniform float opacity;
                uniform sampler2D blur;
                uniform vec2 blurMin;
                uniform vec2 blurSize;
                uniform sampler2D content;
                uniform vec2 contentSize;
                uniform vec2 targetSize;
                uniform vec2 menuSize;
                uniform vec2 menuMin;
                uniform vec2 menuCenter;
                uniform float menuRadius;
                uniform vec4 menuBackground;
                uniform float menuBlur;
                uniform vec4 menuShadowColor;
                uniform float menuShadowBlur;
                uniform vec2 menuShadowOffset;
                uniform float lineWidth;
                uniform float padding;
                uniform float extra;
                out vec4 color;

                float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                    vec2 vec = abs(uv - center) - .5 * size + radius;
                    return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
                }

                void main() {
                    float distance = roundBoxDist(uv, menuSize, menuCenter, menuRadius);
                    vec2 normalDir = max(abs(uv - menuCenter) - .5 * menuSize + menuRadius, 0.);
                    vec2 normal = dot(normalDir, normalDir) > 1e-7 ? normalize(normalDir) * sign(uv - menuCenter) : vec2(0);
                    float contentOffset = clamp(distance / padding + 1., 0., 1.);
                    color = texture(content, (round(uv - menuMin + extra - .5) + .5 + normal * padding * (asin(contentOffset) - contentOffset)) / contentSize) * (distance > 0. ? sqrt(1. - contentOffset * contentOffset) : 1.);
                    vec4 background = vec4(0);
                    if (distance <= lineWidth + .5) {
                        vec2 sampleCenter = uv - (4. - 4. * sqrt(sin(${Math.PI / 2} * clamp(-distance / padding, 0., 1.)))) * normal * padding - blurMin;
                        for (int i = -8; i <= 8; i++) {
                            background += texture(blur, (sampleCenter + vec2(0, i) * .125 * menuBlur) / blurSize) * exp(-.03125 * float(i * i));
                        }
                        background *= ${1 / Array.from({length: 17}, (_, i) => i / 8 - 1).reduce((total, t) => total + Math.exp(-2 * t ** 2), 0)};
                        background = mix(background, vec4(menuBackground.rgb, 1), menuBackground.a);
                    }
                    color += (1. - color.a) * (.125 + .5 * (2.75 - background) * background) * smoothstep(-1., 0., distance) * smoothstep(lineWidth + .5, lineWidth - .5, distance);
                    if (distance < 0.) {
                        color += (1. - color.a) * background;
                    } else {
                        float shadowDistance = roundBoxDist(uv, menuSize - menuShadowBlur, menuCenter + menuShadowOffset, menuRadius);
                        color += (1. - color.a) * menuShadowColor * smoothstep(1., 0., (.5 + shadowDistance) / menuShadowBlur);
                    }
                    color *= opacity;
                }
                `),
                program => program.delete(),
            ]);
            renderer.draw({
                target,
                program: this.#mainProgram,
                mesh: renderer.boxMesh2D,
                uniforms: {
                    posTransform: layout.box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(layout.box.copy.expand(this.style.lineWidth)).multOrigin(devicePixelRatio).vertexMat3(target),
                    uvTransform: layout.box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(layout.box.copy.expand(this.style.lineWidth)).multOrigin(devicePixelRatio).transformMat3(),
                    opacity: this.#visibilityAnim.values.opacity,
                    blur: this.#blurTexture,
                    blurMin: blurBox.min,
                    blurSize: blurBox.size,
                    content: this.#contentTexture,
                    contentSize: this.#contentTexture.size,
                    targetSize: target.size,
                    menuSize: layout.box.size.scale(devicePixelRatio),
                    menuMin: layout.box.min.scale(devicePixelRatio),
                    menuCenter: layout.box.center.scale(devicePixelRatio),
                    menuRadius: this.style.menuRadius * devicePixelRatio,
                    menuBackground: this.style.menuBackground,
                    menuBlur: this.style.menuBlur * devicePixelRatio,
                    menuShadowColor: this.style.menuShadowColor,
                    menuShadowBlur: this.style.menuShadowBlur * devicePixelRatio,
                    menuShadowOffset: this.style.menuShadowOffset.copy.scale(devicePixelRatio),
                    lineWidth: this.style.lineWidth * devicePixelRatio,
                    padding: this.style.menuPadding.left * devicePixelRatio,
                    extra: extra * devicePixelRatio,
                },
                blending: Renderer.Blending.overlay,
            }).exec();
        }
        this.#instantAnim = false;
    };
};

globalThis.PaneHolder = class PaneHolder extends Widget {
    constructor(owner, remover, selected) {
        super(owner, () => {
            remover();
            this.#panes.forEach(p => p.remove());
        });
        this.#visibilityAnim = new Anim({height: 0}, this.style.paneAccel);
        this.#selected = selected;
    }

    #instantAnim = true;
    #visibilityAnim;
    partiallyVisible = id => !!this.#visibilityAnim.values[`pane${id}`];
    endAnims = () => this.#visibilityAnim.skip();

    #height = 0;
    layout = layout => {
        let height = 0;
        let animHeight = 0;
        let snapshot = this.#visibilityAnim.snapshot;
        layout.paneLayouts = Object.fromEntries(Object.entries(this.#panes).map(([id, pane]) => {
            let paneLayout = new Layout(pane, layout.width);
            pane.layout?.(paneLayout);
            if (this.#selected == id) {
                height = paneLayout.height;
            }
            animHeight += paneLayout.height * snapshot[`pane${id}`].value;
            return [id, paneLayout];
        }));
        height = Math.max(height, 0);
        if (this.#height != height) {
            this.#visibilityAnim.targets.height = height / this.style.paneAnimHeightScale;
            this.#visibilityAnim.values.height = animHeight / this.style.paneAnimHeightScale;
            this.#height = height;
        }
        layout.height = Math.round(this.#visibilityAnim.values.height * this.style.paneAnimHeightScale);
        Object.values(layout.paneLayouts).forEach(paneLayout => paneLayout.size = new Vec2(paneLayout.width, paneLayout.height = layout.height));
    };

    triggers = (triggers, pos, layout) => {
        this.#panes[this.#selected]?.triggers?.(triggers, pos, layout.paneLayouts[this.#selected]);
    };

    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.wishWidth, pos.y - layout.height)));
        Object.entries(this.#panes).forEach(([id, pane]) => pane.render(target, pos, layout.paneLayouts[id], this.#visibilityAnim.values[`pane${id}`]));
        this.#instantAnim = false;
    };

    #panes = Object.create(null);
    get panes() {
        return Object.assign(Object.create(null), this.#panes);
    }
    pane = id => {
        if (!this.#panes[id]) {
            this.#visibilityAnim.axes[`pane${id}`] = this.#selected == id;
            return this.#panes[id] = new Pane(this, () => {
                delete this.#panes[id];
                this.#visibilityAnim.axes[`pane${id}`] = undefined;
            });
        }
        return this.#panes[id];
    };

    #selected;
    get selected() {
        return this.#selected;
    }
    set selected(selected) {
        Object.entries(this.#panes).forEach(([id, pane]) => {
            if (!this.partiallyVisible(id)) {
                pane.endAnims();
            }
        });
        this.#visibilityAnim.to({[`pane${this.#selected}`]: 0, [`pane${this.#selected = selected || ""}`]: 1}).skip(this.#instantAnim);
    }
};

globalThis.Pane = class Pane extends ElementHolder {
    constructor(owner, remover) {
        super(owner, () => {
            remover();
            this.elements.forEach(e => e.remove());
            this.#contentTexture?.delete();
        });
        if (!(this.owner instanceof PaneHolder)) {
            this.#visibilityAnim = new Anim({opacity: this.#visible, height: 0}, this.style.paneAccel);
        }
    }

    #height = 0;
    layout = layout => {
        layout.elementLayouts = this.elements.map(element => {
            let elementLayout = new Layout(element, layout.width);
            element.layout?.(elementLayout);
            return elementLayout;
        });
        let height = layout.elementLayouts.reduce((height, elementLayout) => height + elementLayout.height, 0);
        if (this.#visibilityAnim && this.#height != height) {
            if (this.#visible) {
                this.#visibilityAnim.targets.height = height / this.style.paneAnimHeightScale;
            }
            this.#visibilityAnim.values.height = height * this.#visibilityAnim.values.opacity / this.style.paneAnimHeightScale;
        }
        this.#height = height;
        layout.height = Math.round(this.#visibilityAnim ? this.#visibilityAnim.values.height * this.style.paneAnimHeightScale : height);
    };

    triggers = (triggers, pos, layout) => {
        if (this.#visible) {
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].triggers?.(triggers, pos.copy, layout.elementLayouts[i]);
                pos.y -= layout.elementLayouts[i].height;
            }
        }
    };

    #contentTexture;
    #program;
    render = (target, pos, layout, opacity = this.#visibilityAnim?.values.opacity ?? 1) => {
        if (opacity && layout.height) {
            (this.#contentTexture ??= this.renderer.texture(new Vec2(target.width, this.#height * devicePixelRatio))).clear(new Vec2(target.width, this.#height * devicePixelRatio));
            // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
            // drawDebugBox(this.#contentTexture, this.#contentTexture.box);
            let elementPos = new Vec2(pos.x, this.#height);
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].render(this.#contentTexture, elementPos.copy, layout.elementLayouts[i]);
                elementPos.y -= layout.elementLayouts[i].height;
            }
            this.#program = this.storage.use("PaneProgram", () => [
                this.renderer.program(`#version 300 es
                
                in vec2 pos;
                uniform mat3 dstTransform;
                out vec2 uv;

                void main() {
                    uv = pos;
                    gl_Position = vec4((dstTransform * vec3(pos, 1)).xy, 0, 1);
                }
                `, `#version 300 es
                precision mediump float;

                in vec2 uv;
                uniform sampler2D textureSampler;
                uniform float opacity;
                out vec4 color;

                void main() {
                    color = texture(textureSampler, uv) * opacity;
                }
                `),
                program => program.delete(),
            ]);
            this.renderer.draw({
                target,
                program: this.#program,
                mesh: this.renderer.boxMesh2D,
                uniforms: {
                    textureSampler: this.#contentTexture,
                    dstTransform: this.#contentTexture.box.move(0, (pos.y - this.#height) * devicePixelRatio).vertexMat3(target),
                    opacity,
                },
                blending: Renderer.Blending.add,
            }).exec();
        }
    };

    #visible = true;
    get visible() {
        if (this.#visibilityAnim) {
            return this.#visible;
        } else {
            return this.owner.selected == Object.entries(this.owner.panes).find(([_, pane]) => pane == this)[0];
        }
    }
    set visible(visible) {
        if (!this.partiallyVisible) {
            this.elements.forEach(e => e.endAnims?.());
        }
        if (this.#visibilityAnim) {
            this.#visibilityAnim.to({opacity: this.#visible = !!visible, height: !!visible * this.#height / this.style.paneAnimHeightScale});
        } else {
            this.owner.selected = Object.entries(this.owner.panes).find(([_, pane]) => pane == this)[0];
        }
    }

    #visibilityAnim;
    get partiallyVisible() {
        if (this.#visibilityAnim) {
            return !!this.#visibilityAnim.values.opacity;
        } else {
            return this.owner.partiallyVisible(Object.entries(this.owner.panes).find(([_, pane]) => pane == this)[0]);
        }
    }
    endAnims = () => {
        this.#visibilityAnim?.skip();
        this.elements.forEach(e => e.endAnims?.());
    };
};

globalThis.Title = class Title extends Widget {
    constructor(owner, remover, title) {
        super(owner, remover);
        this.#title = title;
    }

    layout = layout => layout.height = this.style.titlePadding.yTotal + this.style.titleFont.height * (layout.lines = this.style.titleFont.break(layout.title = this.translations.translate(this.title), layout.width - this.style.titlePadding.xTotal)).length;

    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        pos.x += this.style.titlePadding.left;
        pos.y -= this.style.titlePadding.top;
        layout.lines.forEach(line => {
            pos.y -= this.style.titleFont.ascent;
            this.style.titleFont.draw(target, line, pos, devicePixelRatio).exec();
            pos.y -= this.style.titleFont.descent;
        });
    };

    #title;
    get title() {
        return this.#title;
    }
    set title(title) {
        this.#title = title;
    }
};

globalThis.Tile = class Tile extends Widget {
    constructor(owner, remover, name, description) {
        super(owner, () => {
            remover();
            this.#components.forEach(c => c.remove());
        });
        this.name = name;
        this.description = description;
    }

    layout = layout => {
        layout.componentLayouts = this.#components.map(component => {
            let componentLayout = new Layout(component);
            component?.layout(componentLayout);
            return componentLayout;
        });
        layout.height = this.style.tilePadding.yTotal + Math.max(layout.textHeight = this.style.tileTextPadding.yTotal + this.style.nameFont.height * (layout.nameLines = this.style.nameFont.break(layout.name = this.translations.translate(this.name), layout.width - this.style.tilePadding.xTotal - this.style.tileTextPadding.xTotal - (layout.componentWidth = layout.componentLayouts.reduce((width, layout) => width + this.style.tileComponentSpacing + layout.width, 0)))).length + this.style.descriptionFont.height * (layout.descriptionLines = this.style.descriptionFont.break(layout.description = this.translations.translate(this.description), layout.width - this.style.tilePadding.xTotal - layout.componentWidth)).length, layout.componentHeight = layout.componentLayouts.reduce((height, layout) => Math.max(height, layout.height), 0));
    };

    #trigger = new Trigger((e, layout) => {
        layout.primaryTrigger?.handler?.(e);
        if (!e.captured && e instanceof Inputs.Event.Secondary) {
            layout.secondaryTrigger?.handler?.(e.primary);
        } else if (!e.captured && e instanceof Inputs.Event.Primary) {
            this.primaryHandler?.(e);
        }
    });
    triggers = (triggers, pos, layout) => {
        let addSelf = this.primaryHandler;
        let componentTriggers = [];
        let componentPos = new Vec2(pos.x + layout.width - layout.componentWidth - this.style.tilePadding.right, pos.y - this.style.tilePadding.top - .5 * (layout.height - layout.componentHeight - this.style.tilePadding.yTotal));
        for (let i = 0; i < this.#components.length; i++) {
            let componentsTriggers = [];
            componentPos.x += this.style.tileComponentSpacing;
            this.#components[i].triggers?.(componentsTriggers, componentPos.copy.sub(0, layout.componentHeight - layout.componentLayouts[i].height), layout.componentLayouts[i]);
            componentPos.x += layout.componentLayouts[i].width;
            if (this.#primary == this.#components[i] && componentsTriggers.length) {
                addSelf = true;
                layout.primaryTrigger = componentsTriggers.shift();
            } else if (this.#secondary == this.#components[i] && componentsTriggers.length) {
                addSelf = true;
                layout.secondaryTrigger = componentsTriggers[0];
            }
            componentTriggers.push(...componentsTriggers);
        }
        if (addSelf) {
            triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
        }
        componentTriggers.forEach(trigger => trigger.box.expand(this.style.tilePadding));
        triggers.push(...componentTriggers);
    };

    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        let componentPos = new Vec2(pos.x + layout.width - layout.componentWidth - this.style.tilePadding.right, pos.y - this.style.tilePadding.top - .5 * (layout.height - layout.componentHeight - this.style.tilePadding.yTotal));
        pos.x += this.style.tilePadding.left + this.style.tileTextPadding.left;
        pos.y -= this.style.tilePadding.top+ .5 * (layout.height - layout.textHeight - this.style.tilePadding.yTotal + this.style.tileTextPadding.yTotal);
        layout.nameLines.forEach(line => {
            pos.y -= this.style.nameFont.ascent;
            this.style.nameFont.draw(target, line, pos, devicePixelRatio).exec();
            pos.y -= this.style.nameFont.descent;
        });
        layout.descriptionLines.forEach(line => {
            pos.y -= this.style.descriptionFont.ascent;
            this.style.descriptionFont.draw(target, line, pos, devicePixelRatio).exec();
            pos.y -= this.style.descriptionFont.descent;
        });
        for (let i = 0; i < this.#components.length; i++) {
            componentPos.x += this.style.tileComponentSpacing;
            this.#components[i].render(target, componentPos.copy.sub(0, layout.componentHeight - layout.componentLayouts[i].height), layout.componentLayouts[i]);
            componentPos.x += layout.componentLayouts[i].width;
        }
    };

    #name;
    get name() {
        return this.#name;
    }
    set name(name) {
        this.#name = `${name || ""}`;
    }

    #description;
    get description() {
        return this.#description;
    }
    set description(description) {
        this.#description = `${description || ""}`;
    }

    #components = [];
    #addComponent = (constructor, ...args) => {
        let component = new constructor(this, () => this.#components.splice(this.#components.indexOf(component), 1), ...args);
        this.#components.push(component);
        return component;
    };
    switch = toggled => this.#addComponent(Switch, toggled);
    checkmark = (choose, id) => this.#addComponent(Checkmark, choose, id);

    #primary;
    get primary() {
        return this.#primary;
    }
    set primary(primary) {
        this.#primary = primary;
    }

    #secondary;
    get secondary() {
        return this.#secondary;
    }
    set secondary(secondary) {
        this.#secondary = secondary;
    }

    #primaryHandler;
    get primaryHandler() {
        return this.#primaryHandler;
    }
    set primaryHandler(primaryHandler) {
        this.#primaryHandler = primaryHandler;
    }
    onPrimary = primaryHandler => {
        this.primaryHandler = primaryHandler;
        return this;
    };
};

globalThis.Component = class Component extends Widget {
    isPrimary = () => this.owner.primary == this;
    makePrimary = () => {
        this.owner.primary = this;
        return this;
    };

    isSecondary = () => this.owner.secondary == this;
    makeSecondary = () => {
        this.owner.secondary = this;
        return this;
    };
};

globalThis.Switch = class Switch extends Component {
    constructor(owner, remover, toggled) {
        super(owner, remover);
        this.#toggleState = new Anim(0, this.style.switchAccel);
        this.toggled = toggled;
    }

    #instantAnim = true;
    #toggleState;

    layout = layout => {
        layout.width = this.style.switchSize.x;
        layout.height = this.style.switchSize.y;
    };

    #trigger = new Trigger(e => {
        if (e instanceof Inputs.Event.Primary || e instanceof Inputs.Event.Confirm) {
            this.toggle();
            this.onToggle?.(this.toggled, this);
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
    };

    #program;
    render = (target, pos, layout) => {
        let box = new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)).multOrigin(devicePixelRatio);
        // drawDebugBox(target, box);
        this.#program = this.storage.use("SwitchProgram", () => [
            this.renderer.program(`#version 300 es
            precision mediump float;

            in vec2 pos;
            uniform mat3 posTransform;
            uniform mat3 uvTransform;
            out vec2 uv;

            void main() {
                uv = (uvTransform * vec3(pos, 1)).xy;
                gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            in vec2 uv;
            uniform vec2 switchSize;
            uniform vec2 switchCenter;
            uniform float switchRadius;
            uniform vec4 switchBackground;
            uniform vec2 switchThumbCenter;
            uniform float switchThumbRadius;
            uniform vec4 switchThumbColor;
            uniform vec4 switchThumbShadow;
            out vec4 color;

            float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                vec2 vec = abs(uv - center) - .5 * size + radius;
                return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
            }

            void main() {
                float baseDist = roundBoxDist(uv, switchSize - 1., switchCenter, switchRadius - .5);
                float thumbDist = length(uv - switchThumbCenter) - switchThumbRadius - .5;
                color = switchThumbColor * smoothstep(1., 0., thumbDist);
                color += (1. - color.a) * switchThumbShadow * smoothstep(.5 * switchSize.y - switchThumbRadius, 0., thumbDist);
                color += (1. - color.a) * switchBackground * smoothstep(1., 0., baseDist);
            }
            `),
            program => program.delete(),
        ]);
        this.renderer.draw({
            target,
            program: this.#program,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: box.vertexMat3(target),
                uvTransform: box.transformMat3(),
                switchSize: box.size,
                switchCenter: box.center,
                switchRadius: .5 * box.height,
                switchBackground: this.style.switchBackground0.copy.mix(this.style.switchBackground1, this.#toggleState.value),
                switchThumbCenter: new Vec2(box.xMin + .5 * box.ySize + (box.xSize - box.ySize) * this.#toggleState.value, box.yCenter),
                switchThumbRadius: this.style.switchThumbRadius * devicePixelRatio,
                switchThumbColor: this.style.switchThumbColor,
                switchThumbShadow: this.style.switchThumbShadow,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
        this.#instantAnim = false;
    };

    #toggled;
    get toggled() {
        return this.#toggled;
    }
    set toggled(toggled) {
        this.#toggleState.to(this.#toggled = !!toggled).skip(this.#instantAnim);
    }
    toggle = () => this.toggled = !this.toggled;

    #onToggle;
    get onToggle() {
        return this.#onToggle;
    }
    set onToggle(onToggle) {
        this.#onToggle = onToggle;
    }
};

globalThis.Checkmark = class Checkmark extends Component {
    constructor(owner, remover, choose, id) {
        super(owner, remover);
        (this.#choose = choose).checkmarks[this.#id = id] = this;
        this.#toggleState = new Anim(this.chosen, this.style.checkmarkAccel);
    }

    #instantAnim = true;
    #toggleState;

    layout = layout => {
        layout.width = this.style.checkmarkSize.x;
        layout.height = this.style.checkmarkSize.y;
    };

    #trigger = new Trigger(e => {
        if (e instanceof Inputs.Event.Primary || e instanceof Inputs.Event.Confirm) {
            if (!this.chosen) {
                this.chosen = true;
                this.choose.onChoose?.(this.choose.chosen, this.choose);
            }
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
    };

    #program;
    render = (target, pos, layout) => {
        let box = new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)).multOrigin(devicePixelRatio);
        // drawDebugBox(target, box);
        this.#program = this.storage.use("CheckmarkProgram", () => [
            this.renderer.program(`#version 300 es
            precision mediump float;

            in vec2 pos;
            uniform mat3 posTransform;
            uniform mat3 uvTransform;
            out vec2 uv;

            void main() {
                uv = (uvTransform * vec3(pos, 1)).xy;
                gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            in vec2 uv;
            uniform vec2 p;
            uniform vec2 v1;
            uniform vec2 v2;
            uniform float checkmarkLineWidth;
            uniform vec4 checkmarkColor;
            out vec4 color;

            float lineDist(vec2 uv, vec2 p, vec2 v) {
                return length(uv - p - v * clamp(dot(uv - p, v) / dot(v, v), 0., 1.));
            }

            void main() {
                float d1 = lineDist(uv, p, v1);
                float d2 = lineDist(uv, p + v1, v2);
                float d = min(d1, d2);
                color = checkmarkColor * smoothstep(checkmarkLineWidth - .5, checkmarkLineWidth - 1.5, d);
            }
            `),
            program => program.delete(),
        ]);
        let v1 = new Vec2(7 / 28 * box.width, -9 / 28 * box.height);
        let v2 = new Vec2(15 / 28 * box.width, 18 / 28 * box.height);
        this.renderer.draw({
            target,
            program: this.#program,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: box.vertexMat3(target),
                uvTransform: box.transformMat3(),
                p : box.min.add(2.5 / 28 * box.width, 14 / 28 * box.height),
                v1: v1.scale(Math.min(1, this.#toggleState.value ** 2 * (1 + v2.length / v1.length))),
                v2: v2.scale(Math.max(0, (this.#toggleState.value ** 2 * (v1.length + v2.length) - v1.length) / v2.length)),
                checkmarkLineWidth: this.style.checkmarkLineWidth * this.#toggleState.value * devicePixelRatio,
                checkmarkColor: this.style.checkmarkColor,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
        this.#instantAnim = false;
    };

    #id;
    get id() {
        return this.#id;
    }

    #choose;
    get choose() {
        return this.#choose;
    }

    get chosen() {
        return this.choose.chosen == this.id;
    }
    set chosen(chosen) {
        if (this.chosen == !chosen) {
            this.choose.chosen = chosen ? this.id : "";
        }
    }

    update = () => this.#toggleState.to(this.chosen).skip(this.#instantAnim);
};

globalThis.Choose = class Choose {
    constructor(chosen = "") {
        this.#chosen = chosen;
    }

    #chosen;
    get chosen() {
        return this.#chosen;
    }
    set chosen(chosen) {
        let previous = this.checkmarks[this.#chosen];
        let current = this.checkmarks[this.#chosen = `${chosen ?? ""}`];
        if (previous != current) {
            previous?.update();
            current?.update();
        }
    }

    #onChoose;
    get onChoose() {
        return this.#onChoose;
    }
    set onChoose(onChoose) {
        this.#onChoose = onChoose;
    }

    checkmarks = Object.create(null);
};

globalThis.TabBar = class TabBar extends Widget {
    constructor(owner, remover, tabs, selected) {
        super(owner, remover);
        this.#highlightOpacity = new Anim(0, this.style.tabBarHighlightOpacityAccel);
        this.#highlightPos = new Anim({left: 0, right: 0}, this.style.tabBarHighlightPosAccel);
        this.tabs = tabs;
        this.selected = selected;
    }

    #scroll = 0;
    get scroll() {
        return this.#scroll;
    }
    set scroll(scroll) {
        this.#scroll = scroll;
    }

    #instantAnim = true;
    #highlightOpacity;
    #highlightPos;
    endAnims = () => {
        this.#highlightOpacity.skip();
        this.#highlightPos.skip();
    };

    layout = layout => {
        layout.gaps = !!this.#tabs.length * (this.#tabs.length - 1) * this.style.tabBarGap;
        layout.widths = this.#tabs.map(tab => this.style.tabBarPadding.xTotal + this.style.nameFont.fine(this.translations.translate(tab.name)).right);
        layout.height = this.style.tabBarSpacing.yTotal + this.style.tabBarPadding.yTotal + this.style.nameFont.height;
        this.scroll = Math.min(this.scroll, Math.max(layout.overflow = (layout.wishWidth = layout.widths.reduce((total, width) => total + width, this.style.tabBarSpacing.xTotal + layout.gaps)) - layout.width, 0));
        layout.paddings = layout.widths.map(() => 0);
        let remainder = -layout.overflow;
        while (remainder > 1e-7) {
            let smallest;
            let smallestWidth = Infinity;
            let nextSmallestWidth = Infinity;
            layout.widths.forEach((width, i) => {
                if (width + 1e-7 < smallestWidth) {
                    nextSmallestWidth = smallestWidth;
                    smallestWidth = width;
                    smallest = [i];
                } else if (width < smallestWidth + 1e-7) {
                    smallest.push(i);
                } else if (width < nextSmallestWidth) {
                    nextSmallestWidth = width;
                }
            });
            smallest.forEach(i => {
                let gain = Math.min(remainder / smallest.length, nextSmallestWidth - smallestWidth);
                layout.widths[i] += gain;
                layout.paddings[i] += .5 * gain;
            });
            remainder -= Math.min(remainder, (nextSmallestWidth - smallestWidth) * smallest.length);
        }
    };

    #trigger = new Trigger((e, layout) => {
        if (e instanceof Inputs.Event.Positioned && (!(e instanceof Inputs.Event.Scroll) || e.axis == "x")) {
            if (e instanceof Inputs.Event.Primary) {
                let x = this.#trigger.box.left;
                x += this.style.tabBarSpacing.left;
                let selected;
                this.#tabs.forEach((tab, i) => {
                    if (x - .5 * this.style.tabBarGap <= e.pos.x && e.pos.x <= x + layout.widths[i] + .5 * this.style.tabBarGap) {
                        selected = tab.id;
                    }
                    x += layout.widths[i] + this.style.tabBarGap;
                });
                if (selected && selected != this.selected) {
                    this.selected = selected;
                    this.onSelect?.(selected, this);
                }
            } else if (e instanceof Inputs.Event.Scroll) {
                this.scroll = Math.max(Math.min(this.scroll + e.locked .x, layout.overflow), 0);
            }
            e.capture();
        } else if (e instanceof Inputs.Event.Directional && e.axis == "x") {
            let selected = this.#tabs[Math.min(Math.max(this.#tabs.findIndex(tab => this.selected == tab.id) + e.dir.x, 0), this.#tabs.length - 1)].id;
            if (selected != this.selected) {
                this.selected = selected;
                this.onSelect?.(selected, this);
            }
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        this.#trigger.set(new Vec2(pos.x - this.scroll, pos.y), layout, this.style.tileRadius).box.width = Math.max(layout.width, layout.wishWidth);
        triggers.push(this.#trigger);
    };

    #lastSelected = "";
    #program;
    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        if (this.#tabs.length) {
            pos.x += this.style.tabBarSpacing.left - this.scroll;
            pos.y -= this.style.tabBarSpacing.top;
            let left = 0;
            let positions = Object.create(null);
            this.#tabs.forEach((tab, i) => {
                // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.widths[i], pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height)));
                // drawDebugBox(target, new Box2(pos.x - .5 * this.style.tabBarGap, pos.x + layout.widths[i] + .5 * this.style.tabBarGap, pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height, pos.y));
                this.style.nameFont.draw(target, this.translations.translate(tab.name), pos.copy.add(left + layout.paddings[i] + this.style.tabBarPadding.left, -this.style.tabBarPadding.top - this.style.nameFont.ascent), devicePixelRatio).exec();
                positions[tab.id] = {left, right: left += layout.widths[i]};
                left += this.style.tabBarGap;
            });
            this.#highlightPos.offset({left: (positions[this.#lastSelected]?.left || 0) - (positions[this.selected]?.left || 0), right: (positions[this.#lastSelected]?.right || 0) - (positions[this.selected]?.right || 0)});
            this.#lastSelected = this.selected;
            let selectedExists = this.#tabs.some(tab => this.selected == tab.id);
            if (selectedExists) {
                this.#highlightPos.to({left: 0, right: 0}).skip(this.#instantAnim || !this.#highlightOpacity.value);
            }
            this.#highlightOpacity.to(selectedExists).skip(this.#instantAnim);
            let box = new Box2(pos.x + (positions[this.selected]?.left || 0) + this.#highlightPos.values.left, pos.x + (positions[this.selected]?.right || 0) + this.#highlightPos.values.right, pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height, pos.y).multOrigin(devicePixelRatio);
            this.#program = this.storage.use("TabBarProgram", () => [
                this.renderer.program(`#version 300 es
                precision mediump float;
    
                in vec2 pos;
                uniform mat3 posTransform;
                uniform mat3 uvTransform;
                out vec2 uv;
    
                void main() {
                    uv = (uvTransform * vec3(pos, 1)).xy;
                    gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
                }
                `, `#version 300 es
                precision mediump float;
    
                in vec2 uv;
                uniform vec2 highlightSize;
                uniform vec2 highlightCenter;
                uniform float highlightRadius;
                uniform vec4 highlightColor;
                out vec4 color;
    
                float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                    vec2 vec = abs(uv - center) - .5 * size + radius;
                    return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
                }
    
                void main() {
                    float distance = roundBoxDist(uv, highlightSize - 1., highlightCenter, highlightRadius - .5);
                    color = highlightColor * smoothstep(1., 0., distance);
                }
            `),
                program => program.delete(),
            ]);
            renderer.draw({
                target,
                program: this.#program,
                mesh: renderer.boxMesh2D,
                uniforms: {
                    posTransform: box.vertexMat3(target),
                    uvTransform: box.transformMat3(),
                    highlightSize: box.size,
                    highlightCenter: box.center,
                    highlightRadius: this.style.tabBarHighlightRadius * devicePixelRatio,
                    highlightColor: this.style.tabBarHighlightColor.copy.opacity(this.#highlightOpacity.value),
                },
                blending: Renderer.Blending.overlay,
            }).exec();
        }
        this.#instantAnim = false;
    };

    #tabs;
    get tabs() {
        return Array.from(this.#tabs);
    }
    set tabs(tabs) {
        this.#tabs = tabs;
    }

    #selected;
    get selected() {
        return this.#selected;
    }
    set selected(selected) {
        this.#selected = `${selected || ""}`;
    }

    #onSelect;
    get onSelect() {
        return this.#onSelect;
    }
    set onSelect(onSelect) {
        this.#onSelect = onSelect;
    }
};

globalThis.Divider = class Divider extends Widget {
    constructor(owner, remover) {
        super(owner, remover);
    }

    layout = layout => layout.height = this.style.dividerPadding.yTotal + this.style.lineWidth;

    #program;
    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        this.#program = this.storage.use("DividerProgram", () => [
            this.renderer.program(`#version 300 es
            precision mediump float;

            in vec2 pos;
            uniform mat3 posTransform;

            void main() {
                gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            uniform vec4 dividerColor;
            out vec4 color;

            void main() {
                color = dividerColor;
            }
            `),
            program => program.delete(),
        ]);
        renderer.draw({
            target,
            program: this.#program,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: new Box2(0, target.width, pos.y -= this.style.dividerPadding.top, pos.y - this.style.lineWidth).vertexMat3(target),
                dividerColor: this.style.dividerColor,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
    };
};



let translations = new Translations("/src/lang/index.json");

let time = new Time();

let inputs = new Inputs(document, true);

let menuHolder = new MenuHolder(style, renderer, translations, cache);


let inspector = menuHolder.menu().position(1500, 1500).persist();
// let inspectorTitle = inspector.title("inspector");
// inspector.title("There’s not really anything to title here; though it’s important to test line breaks for very long titles............................................................................");
// let inspectorDivider = inspector.divider();
let inspectorTabBar = inspector.tabBar([{id: "text", name: "inspector.text"}, {id: "table", name: "inspector.table"}, {id: "layout", name: "inspector.layout"}, {id: "document", name: "inspector.document"}], "text");
let inspectorPaneHolder = inspector.paneHolder("text");
inspectorTabBar.onSelect = selected => inspectorPaneHolder.selected = selected;

let textPane = inspectorPaneHolder.pane("text");
let textTitle = textPane.title("inspector.text");
let textFamily = textPane.tile("text.family", "The font family.").onPrimary(console.log);
let textRandom = textPane.tile("And of course it’s also important to test line breaks in the names of tiles.", "There’s not really anything to describe here; though it’s also important to test line breaks for very long descriptions.");
let textRandomSwitch = textRandom.switch(false).makePrimary();
let textItalic = textPane.tile("text.italic");
let textItalicSwitch = textItalic.switch(false).makePrimary();
let textItalicSwitch2 = textItalic.switch(false).makeSecondary();
let textUnderline = textPane.tile("text.underline");
let textUnderlineSwitch = textUnderline.switch(true).makePrimary();
let textUnderlinePane = textPane.pane();
textUnderlineSwitch.onToggle = toggled => textUnderlinePane.visible = toggled;
let textUnderlineStyle = textUnderlinePane.tile("line.style");
let textUnderlineWidth = textUnderlinePane.tile("line.width");
let textStrikethrough = textPane.tile("text.strikethrough");
let textStrikethroughSwitch = textStrikethrough.switch(true).makePrimary();
let textStrikethroughPane = textPane.pane();
textStrikethroughSwitch.onToggle = toggled => textStrikethroughPane.visible = toggled;
let textStrikethroughWidth = textStrikethroughPane.tile("line.width");
let textBaselineTitle = textPane.title("text.baseline");
let textBaselineChoose = new Choose("base");
let textBaselineBase = textPane.tile("text.baseline.base");
let textBaselineBaseCheckmark = textBaselineBase.checkmark(textBaselineChoose, "base").makePrimary();
let textBaselineSup = textPane.tile("text.baseline.sup");
let textBaselineSupCheckmark = textBaselineSup.checkmark(textBaselineChoose, "sup").makePrimary();
let textBaselineSub = textPane.tile("text.baseline.sub");
let textBaselineSubCheckmark = textBaselineSub.checkmark(textBaselineChoose, "sub").makePrimary();

let tablePane = inspectorPaneHolder.pane("table");
let tableTitle = tablePane.title("inspector.table");

inputs.onEvent = e => menuHolder.handle(e, menuHolder.layout(new Vec2(innerWidth, innerHeight)));

time.repeat(() => {
    renderer.width = innerWidth * devicePixelRatio;
    renderer.height = innerHeight * devicePixelRatio;
    renderer.canvas.style = `position: fixed; left: 0; top: 0; width: ${innerWidth}px; height: ${innerHeight}px;`;

    let target2D = renderer.texture({width: renderer.width, height: renderer.height});
    if (background) {
        renderer.drawCopy(background, target2D, centerImage(background, target2D)).exec();
    }

    menuHolder.render(target2D, menuHolder.layout(new Vec2(innerWidth, innerHeight)));

    renderer.show(target2D).delete();
    cache.sweep();
});
