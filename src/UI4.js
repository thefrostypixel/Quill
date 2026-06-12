let renderer = new Renderer();
document.body.appendChild(renderer.canvas);
renderer.canvas.style = "position: fixed; left: 0; top: 0;";

let cache = new Cache();

let boxVertexShader = `#version 300 es

    in vec2 pos;
    uniform vec2 boxPosition;
    uniform vec2 boxSize;
    uniform vec2 cutoutPosition;
    uniform vec2 cutoutSize;
    out vec2 uv;

    void main() {
        uv = cutoutPosition + cutoutSize * pos;
        gl_Position = vec4(boxPosition.x + boxSize.x * pos.x, boxPosition.y + boxSize.y * pos.y, 0, 1);
    }
`;

let centerImage = (src, dst) => {
    let ratio = Math.min(src.width / dst.width, src.height / dst.height);
    let width = src.width - dst.width * ratio;
    let height = src.height - dst.height * ratio;
    return new Box2(.5 * width, -.5 * width + src.width, .5 * height, -.5 * height + src.height);
};

let fetchImage = url => renderer.asyncTexture(fetch(url));

let background = undefined;
let backgroundPromise = fetchImage("/src/Wallpaper.jpg").then(image => background = image);

// TODO Resolution scale: devicePixelRatio
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
    checkmarkLineWidth: 3,
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
        let menu = new MenuHolder.Menu(this, () => this.#menus.splice(this.#menus.indexOf(menu), 1));
        this.#menus.push(menu);
        return menu;
    };

    layout = targetSize => this.#menus.map(menu => {
        let layout = new MenuHolder.Layout(menu);
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

MenuHolder.Layout = class Layout {
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

MenuHolder.Trigger = class Trigger {
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

MenuHolder.Widget = class Widget {
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

MenuHolder.ElementHolder = class ElementHolder extends MenuHolder.Widget {
    #elements = [];
    get elements() {
        return Array.from(this.#elements);
    }
    #addElement = (constructor, ...args) => {
        let element = new constructor(this, () => this.#elements.splice(this.#elements.indexOf(element), 1), ...args);
        this.#elements.push(element);
        return element;
    };

    paneHolder = selected => this.#addElement(MenuHolder.PaneHolder, selected);
    pane = () => this.#addElement(MenuHolder.Pane);
    title = title => this.#addElement(MenuHolder.Title, title);
    tile = (name, description) => this.#addElement(MenuHolder.Tile, name, description);
    tabBar = (tabs = [], selected = tabs[0]?.id || "") => this.#addElement(MenuHolder.TabBar, tabs, selected);
    divider = () => this.#addElement(MenuHolder.Divider);
};

MenuHolder.Menu = class Menu extends MenuHolder.ElementHolder {
    constructor(owner, remover) {
        super(owner, () => {
            remover();
            this.elements.forEach(e => e.remove());
            this.#blurTexture?.delete();
            this.#contentTexture?.delete();
        });
        this.#visibleAnim = new Anim(this.#visible, this.style.menuVisibilityAccel);
        this.#highlightOpacity = new Anim(0, this.style.menuHighlightOpacityAccel);
        this.#highlightPos = new Anim({left: 0, right: 0, top: 0, bottom: 0, radius: 0}, this.style.menuHighlightPosAccel);
    }

    #visible = false;
    get visible() {
        return this.#visible;
    }
    set visible(visible) {
        this.#visible = visible;
        if (!this.partiallyVisible) {
            this.elements.forEach(e => e.endAnims?.());
        }
    }
    #visibleAnim;
    get visibleAnim() {
        return this.#visibleAnim.value;
    }
    get partiallyVisible() {
        return !!this.#visibleAnim.value;
    }

    #highlighted;
    #highlightOpacity;
    #highlightPos;

    #instantAnim = true;
    endAnims = () => {
        this.#visibleAnim.skip();
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

    layout = (layout, targetSize) => {
        let width = Math.ceil(Math.min(targetSize.x - this.style.menuSpacing.xTotal, this.style.menuWidth));
        let layouts = this.elements.map(e => {
            let layout = new MenuHolder.Layout(e, width - this.style.menuPadding.xTotal);
            e.layout?.(layout);
            return layout;
        });
        let contentHeight = layouts.reduce((height, layout) => height + layout.height, this.style.menuPadding.yTotal);
        let height = Math.min(targetSize.y - this.style.menuSpacing.yTotal, contentHeight);
        let box = new Box2({width, height});
        box.center = targetSize.copy.scale(.5).floor().add(.5 * width % 1, .5 * height % 1);
        layout.width = box.width;
        layout.height = box.height;
        layout.box = box;
        layout.layouts = layouts;
        this.scroll = Math.min(Math.max(this.scroll, 0), layout.overflow = contentHeight - height);
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
        if (MenuHolder.Trigger.contains(layout.box, this.style.menuRadius, e)) {
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
                    this.#highlighted = undefined;
                }
            } else {
                if (this.#highlighted) {
                    if (this.triggers(layout).includes(this.#highlighted)) {
                        this.#highlighted.handle(e);
                    } else {
                        this.#highlighted = undefined;
                    }
                }
                if (!e.captured && e instanceof Inputs.Event.Directional) {
                    let triggers = this.triggers(layout);
                    if (this.#highlighted) {
                        /*let stuff = e.dir.y < 0 ? ["top", "bottom"] : e.dir.y > 0 ? ["bottom", "top"] : e.dir.x > 0 ? ["right", "left"] : ["left", "right"];
                        stuff.push(-e.dir[e.axis], `${e.axis}Center`);
                        triggers = triggers.filter(trigger => trigger != this.#highlighted && stuff[2] * trigger.box[stuff[0]] < stuff[2] * this.#highlighted.box[stuff[1]]);
                        console.log(triggers);
                        let limit = triggers.reduce((limit, trigger) => Math.max(limit, stuff[2] * trigger.box[stuff[1]]), -Infinity);
                        console.log(limit);
                        let closest = (triggers = triggers.filter(trigger => limit < stuff[2] * trigger.box[stuff[0]]))[0];
                        console.log(triggers);
                        for (let trigger of triggers) {
                            if (Math.abs(trigger.box[stuff[3]] - this.#highlighted.box[stuff[3]]) < Math.abs(closest.box[stuff[3]] - this.#highlighted.box[stuff[3]])) {
                                closest = trigger;
                            }
                        }*/
                        let closest = (triggers = triggers.filter(trigger => trigger != this.#highlighted && e.dir[e.axis] * this.#highlighted.box[`${e.axis}Center`] < e.dir[e.axis] * trigger.box[`${e.axis}Center`]))[0];
                        for (let trigger of triggers) {
                            if (trigger.box.center.dist(this.#highlighted.box.center) < closest.box.center.dist(this.#highlighted.box.center)) {
                                closest = trigger;
                            }
                        }
                        this.#highlighted = closest || this.#highlighted;
                        e.capture();
                    } else {
                        this.#highlighted = triggers[0];
                    }
                }
            }
            e.capture();
        } else if (!e.captured) {
            if (e instanceof Inputs.Event.Scroll) {
                e.capture();
            } else {
                console.log("Outside menu.");
            }
        }
    };

    #blurTexture;
    #contentTexture;
    #highlightProgram;
    #blurProgram;
    #mainProgram;
    render = (target, layout) => {
        let blurBox = layout.box.copy.expand(this.style.lineWidth).expand(0, this.style.menuBlur);
        (this.#blurTexture ??= this.renderer.texture(blurBox)).clear(blurBox);
        let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
        (this.#contentTexture ??= this.renderer.texture(layout.box.size.add(2 * extra, 2 * extra))).clear(layout.box.size.add(2 * extra, 2 * extra));

        // this.triggers(layout).forEach(trigger => drawDebugBox(this.#contentTexture, trigger.box.copy.move(0, this.scroll)));

        if (this.#highlighted) {
            if (this.triggers(layout).includes(this.#highlighted)) {
                this.#highlightPos.to({left: this.#highlighted.box.left, right: this.#highlighted.box.right, top: this.#highlighted.box.top, bottom: this.#highlighted.box.bottom, radius: this.#highlighted.radius}).skip(this.#instantAnim || !this.#highlightOpacity.value);
            } else {
                this.#highlighted = undefined;
            }
        }
        this.#highlightOpacity.to(!!this.#highlighted).skip(this.#instantAnim);
        let box = new Box2(this.#highlightPos.values).move(0, this.scroll);
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
                highlightRadius: this.#highlightPos.values.radius,
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
                color = texture(content, (uv - menuMin + extra + normal * padding * (asin(contentOffset) - contentOffset)) / contentSize) * (distance > 0. ? sqrt(1. - contentOffset * contentOffset) : 1.);
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
            }
            `),
            program => program.delete(),
        ]);
        renderer.draw({
            target,
            program: this.#mainProgram,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: layout.box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(layout.box.copy.expand(this.style.lineWidth)).vertexMat3(target),
                uvTransform: layout.box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(layout.box.copy.expand(this.style.lineWidth)).transformMat3(),
                blur: this.#blurTexture,
                blurMin: blurBox.min,
                blurSize: blurBox.size,
                content: this.#contentTexture,
                contentSize: this.#contentTexture.size,
                targetSize: target.size,
                menuSize: layout.box.size,
                menuMin: layout.box.min,
                menuCenter: layout.box.center,
                menuRadius: this.style.menuRadius,
                menuBackground: this.style.menuBackground,
                menuBlur: this.style.menuBlur,
                menuShadowColor: this.style.menuShadowColor,
                menuShadowBlur: this.style.menuShadowBlur,
                menuShadowOffset: this.style.menuShadowOffset,
                lineWidth: this.style.lineWidth,
                padding: this.style.menuPadding.avg,
                extra,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
        this.#instantAnim = false;
    };
};

MenuHolder.PaneHolder = class PaneHolder extends MenuHolder.Widget {
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
            let paneLayout = new MenuHolder.Layout(pane, layout.width);
            pane.layout?.(paneLayout);
            if (this.#selected == id) {
                height = paneLayout.height;
            }
            animHeight += paneLayout.height * snapshot[`pane${id}`].value;
            return [id, paneLayout];
        }));
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
            return this.#panes[id] = new MenuHolder.Pane(this, () => {
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

MenuHolder.Pane = class Pane extends MenuHolder.ElementHolder {
    constructor(owner, remover) {
        super(owner, () => {
            remover();
            this.elements.forEach(e => e.remove());
            this.#contentTexture?.delete();
        });
        if (!(this.owner instanceof MenuHolder.PaneHolder)) {
            this.#visibilityAnim = new Anim({opacity: this.#visible, height: 0}, this.style.paneAccel);
        }
    }

    #height = 0;
    layout = layout => {
        layout.elementLayouts = this.elements.map(element => {
            let elementLayout = new MenuHolder.Layout(element, layout.width);
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
            (this.#contentTexture ??= this.renderer.texture(new Vec2(target.width, this.#height))).clear(new Vec2(target.width, this.#height));
            // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
            // drawDebugBox(this.#contentTexture, this.#contentTexture.box);
            let elementPos = new Vec2(pos.x, this.#height);
            for (let i = 0; i < this.elements.length; i++) {
                this.elements[i].render(this.#contentTexture, elementPos.copy, layout.elementLayouts[i]);
                elementPos.y -= layout.elementLayouts[i].height;
            }
            if (!this.#program) {
                this.#program = this.renderer.program(`#version 300 es

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
                `);
            }
            this.renderer.draw({
                target,
                program: this.#program,
                mesh: this.renderer.boxMesh2D,
                uniforms: {
                    textureSampler: this.#contentTexture,
                    dstTransform: this.#contentTexture.box.move(0, pos.y - this.#height).vertexMat3(target),
                    opacity,
                },
                blending: Renderer.Blending.add,
            }).exec();
        }
        this.#instantAnim = false;
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

    #instantAnim = true;
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

MenuHolder.Title = class Title extends MenuHolder.Widget {
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
            this.style.titleFont.draw(target, line, pos).exec();
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

MenuHolder.Tile = class Tile extends MenuHolder.Widget {
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
            let componentLayout = new MenuHolder.Layout(component);
            component?.layout(componentLayout);
            return componentLayout;
        });
        layout.height = this.style.tilePadding.yTotal + Math.max(layout.textHeight = this.style.tileTextPadding.yTotal + this.style.nameFont.height * (layout.nameLines = this.style.nameFont.break(layout.name = this.translations.translate(this.name), layout.width - this.style.tilePadding.xTotal - this.style.tileTextPadding.xTotal - (layout.componentWidth = layout.componentLayouts.reduce((width, layout) => width + this.style.tileComponentSpacing + layout.width, 0)))).length + this.style.descriptionFont.height * (layout.descriptionLines = this.style.descriptionFont.break(layout.description = this.translations.translate(this.description), layout.width - this.style.tilePadding.xTotal - layout.componentWidth)).length, layout.componentHeight = layout.componentLayouts.reduce((height, layout) => Math.max(height, layout.height), 0));
    };

    // TODO Primary and secondary targets.
    #trigger = new MenuHolder.Trigger((e, layout) => {});
    triggers = (triggers, pos, layout) => {
        triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
        let componentTriggers = [];
        let componentPos = new Vec2(pos.x + layout.width - layout.componentWidth - this.style.tilePadding.right, pos.y - this.style.tilePadding.top - .5 * (layout.height - layout.componentHeight - this.style.tilePadding.yTotal));
        for (let i = 0; i < this.#components.length; i++) {
            componentPos.x += this.style.tileComponentSpacing;
            this.#components[i].triggers?.(componentTriggers, componentPos.copy.sub(0, layout.componentHeight - layout.componentLayouts[i].height), layout.componentLayouts[i]);
            componentPos.x += layout.componentLayouts[i].width;
        }
        componentTriggers.forEach(trigger => trigger.box.expand(this.style.tilePadding));
        triggers.push(...componentTriggers)
    };

    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        let componentPos = new Vec2(pos.x + layout.width - layout.componentWidth - this.style.tilePadding.right, pos.y - this.style.tilePadding.top - .5 * (layout.height - layout.componentHeight - this.style.tilePadding.yTotal));
        pos.x += this.style.tilePadding.left + this.style.tileTextPadding.left;
        pos.y -= this.style.tilePadding.top+ .5 * (layout.height - layout.textHeight - this.style.tilePadding.yTotal + this.style.tileTextPadding.yTotal);
        layout.nameLines.forEach(line => {
            pos.y -= this.style.nameFont.ascent;
            this.style.nameFont.draw(target, line, pos).exec();
            pos.y -= this.style.nameFont.descent;
        });
        layout.descriptionLines.forEach(line => {
            pos.y -= this.style.descriptionFont.ascent;
            this.style.descriptionFont.draw(target, line, pos).exec();
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
    switch = toggled => {
        let component = new MenuHolder.Tile.Switch(this, () => this.#components.splice(this.#components.indexOf(component), 1), toggled);
        this.#components.push(component);
        return component;
    };
    checkmark = (choose, id) => {
        let component = new MenuHolder.Tile.Checkmark(this, () => this.#components.splice(this.#components.indexOf(component), 1), choose, id);
        this.#components.push(component);
        return component;
    };
};

MenuHolder.Tile.Switch = class Switch extends MenuHolder.Widget {
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

    #trigger = new MenuHolder.Trigger(e => {
        if (e instanceof Inputs.Event.Primary || e instanceof Inputs.Event.Confirm) {
            this.toggle();
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
    };

    #program;
    render = (target, pos, layout) => {
        let box = new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height));
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
                switchThumbRadius: this.style.switchThumbRadius,
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
};

MenuHolder.Tile.Checkmark = class Checkmark extends MenuHolder.Widget {
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

    #trigger = new MenuHolder.Trigger(e => {
        if (e instanceof Inputs.Event.Primary || e instanceof Inputs.Event.Confirm) {
            this.chosen = true;
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        triggers.push(this.#trigger.set(pos, layout, this.style.tileRadius));
    };

    #program;
    render = (target, pos, layout) => {
        let box = new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height));
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
                color = checkmarkColor * smoothstep(checkmarkLineWidth, 0., d);
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
                v1: v1.scale(Math.min(1, this.#toggleState.value * (1 + v2.length / v1.length))),
                v2: v2.scale(Math.max(0, (this.#toggleState.value * (v1.length + v2.length) - v1.length) / v2.length)),
                checkmarkLineWidth: this.style.checkmarkLineWidth * this.#toggleState.value,
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

MenuHolder.Choose = class Choose {
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

    checkmarks = Object.create(null);
};

MenuHolder.TabBar = class TabBar extends MenuHolder.Widget {
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

    #trigger = new MenuHolder.Trigger((e, layout) => {
        if (e instanceof Inputs.Event.Positioned && (!(e instanceof Inputs.Event.Scroll) || e.axis == "x")) {
            if (e instanceof Inputs.Event.Primary) {
                let x = this.#trigger.box.left;
                x += this.style.tabBarSpacing.left;
                this.#tabs.forEach((tab, i) => {
                    if (x - .5 * this.style.tabBarGap <= e.pos.x && e.pos.x <= x + layout.widths[i] + .5 * this.style.tabBarGap) {
                        this.selected = tab.id;
                    }
                    x += layout.widths[i] + this.style.tabBarGap;
                });
            } else if (e instanceof Inputs.Event.Scroll) {
                this.scroll = Math.max(Math.min(this.scroll + e.locked .x, layout.overflow), 0);
            }
            e.capture();
        } else if (e instanceof Inputs.Event.Directional && e.axis == "x") {
            this.selected = this.#tabs[Math.min(Math.max(this.#tabs.findIndex(tab => this.selected == tab.id) + e.dir.x, 0), this.#tabs.length - 1)].id;
            e.capture();
        }
    });
    triggers = (triggers, pos, layout) => {
        this.#trigger.set(new Vec2(pos.x - this.scroll, pos.y), layout, this.style.tileRadius).box.width = Math.max(layout.width, layout.wishWidth);
        triggers.push(this.#trigger);
    };

    #program;
    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        if (this.#tabs.length) {
            pos.x += this.style.tabBarSpacing.left - this.scroll;
            pos.y -= this.style.tabBarSpacing.top;
            let selectedExists = false;
            this.#tabs.forEach((tab, i) => {
                // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.widths[i], pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height)));
                // drawDebugBox(target, new Box2(pos.x - .5 * this.style.tabBarGap, pos.x + layout.widths[i] + .5 * this.style.tabBarGap, pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height, pos.y));
                if (this.selected == tab.id) {
                    this.#highlightPos.to({left: pos.x + this.scroll, right: pos.x + layout.widths[i] + this.scroll}).skip(this.#instantAnim || !this.#highlightOpacity.value);
                    selectedExists = true;
                }
                this.style.nameFont.draw(target, this.translations.translate(tab.name), pos.copy.add(layout.paddings[i] + this.style.tabBarPadding.left, -this.style.tabBarPadding.top - this.style.nameFont.ascent)).exec();
                pos.x += layout.widths[i] + this.style.tabBarGap;
            });
            this.#highlightOpacity.to(selectedExists).skip(this.#instantAnim);
            let box = new Box2(this.#highlightPos.values.left - this.scroll, this.#highlightPos.values.right - this.scroll, pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height, pos.y);
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
                    highlightRadius: this.style.tabBarHighlightRadius,
                    highlightColor: this.style.tabBarHighlightColor.opacity(this.#highlightOpacity.value),
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
};

MenuHolder.Divider = class Divider extends MenuHolder.Widget {
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


let inspector = menuHolder.menu();
// let inspectorTitle = inspector.title("inspector");
// inspector.title("There’s not really anything to title here; however it’s important to test line breaks for very long titles............................................................................");
// let inspectorDivider = inspector.divider();
let inspectorTabBar = inspector.tabBar([{id: "text", name: "inspector.text"}, {id: "table", name: "inspector.table"}, {id: "layout", name: "inspector.layout"}], "text");
let inspectorPaneHolder = inspector.paneHolder("text");

let textPane = inspectorPaneHolder.pane("text");
let textTitle = textPane.title("inspector.text");
let textFamily = textPane.tile("text.family", "The font family.");
let textRandom = textPane.tile("And of course it’s also important to test line breaks in the names of tiles.", "There’s not really anything to describe here; however it’s also important to test line breaks for very long descriptions.");
let textItalic = textPane.tile("text.italic");
let textItalicSwitch = textItalic.switch(false);
let textUnderline = textPane.tile("text.underline");
let textUnderlineSwitch = textUnderline.switch(true);
let textUnderlinePane = textPane.pane();
let textUnderlineStyle = textUnderlinePane.tile("line.style");
let textUnderlineWidth = textUnderlinePane.tile("line.width");
let textStrikethrough = textPane.tile("text.strikethrough");
let textStrikethroughSwitch = textStrikethrough.switch(true);
let textStrikethroughPane = textPane.pane();
let textStrikethroughWidth = textStrikethroughPane.tile("line.width");
let textBaselineTitle = textPane.title("text.baseline");
let textBaselineChoose = new MenuHolder.Choose("base");
let textBaselineBase = textPane.tile("text.baseline.base");
let textBaselineBaseCheckmark = textBaselineBase.checkmark(textBaselineChoose, "base");
let textBaselineSup = textPane.tile("text.baseline.sup");
let textBaselineSupCheckmark = textBaselineSup.checkmark(textBaselineChoose, "sup");
let textBaselineSub = textPane.tile("text.baseline.sub");
let textBaselineSubCheckmark = textBaselineSub.checkmark(textBaselineChoose, "sub");

let tablePane = inspectorPaneHolder.pane("table");
let tableTitle = tablePane.title("inspector.table");

time.repeat(() => {
    renderer.width = window.innerWidth;
    renderer.height = window.innerHeight;

    let target2D = renderer.texture({width: renderer.width, height: renderer.height});
    if (background) {
        renderer.drawCopy(background, target2D, centerImage(background, target2D)).exec();
    }

    let layout = menuHolder.layout(new Vec2(innerWidth, innerHeight));
    while (inputs.eventAvailable) {
        let e = inputs.nextEvent();
        menuHolder.handle(e, layout);
    }
    menuHolder.render(target2D, layout);

    renderer.show(target2D).delete();
    cache.sweep();
});

let switchTabs = () => inspectorTabBar.selected = inspectorPaneHolder.selected = inspectorTabBar.selected == "text" ? "table" : "text";
let toggleUnderline = () => textUnderlineToggle.toggled = textUnderlinePane.visible = !textUnderlineToggle.toggled;
let toggleStrikethrough = () => textStrikethroughToggle.toggled = textStrikethroughPane.visible = !textStrikethroughToggle.toggled;
let advanceBaseline = () => textBaselineChoose.chosen = textBaselineChoose.chosen == "base" ? "sup" : textBaselineChoose.chosen == "sup" ? "sub" : "base";
