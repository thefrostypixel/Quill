let renderer = Renderer.create();
document.body.appendChild(renderer);
renderer.style = "position: fixed; left: 0; top: 0;";

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

// menuRadius = buttonRadius + padding
// buttonRadius + buttonPadding + .5 * textFont.size
let style = {
    menuSpace: new Padding2(20),
    menuPadding: new Padding2(24),
    menuRadius: 40,
    menuBackground: Color.okLab({L: .25}, .5),
    menuBlur: 10,
    menuSaturation: 1.5,
    menuOutlineColor: Color.okLab({L: .8}, .1),
    menuShadowColor: Color.okLab({}, .5),
    menuShadowBlur: 40,
    menuShadowOffset: new Vec2(0, -10),
    menuAccel: 20000,

    menuWidthMin: 300,
    menuWidthMax: 400,
    menuHeightMax: Infinity,
    visibilityAccel: 20000,
    stateAccel: 20,

    lineWidth: 2,

    titlePadding: new Padding2(16, 16, 4, 8),

    tilePadding: new Padding2(8),
    tileRadius: 16,

    spacerPadding: new Padding2(0, 8),
    spacerColor: Color.okLab({L: .8}, .1),

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


    toggleSwitchAccel: 500,
    checkmarkAccel: 200,
    buttonColorUnchecked: Color.okLab({L: .95}, .3),
    buttonColorChecked: Color.okLab({L: .7, a: -.06, b: -.15}),
    tabBarHighlight: Color.okLab({L: .95}, .25),
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

globalThis.Menus = class Menus {
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

    render = target => {
        this.#menus.forEach(menu => menu.render(target));
        this.#ownCache?.sweep();
    };
};

globalThis.Widget = class Widget {
    #menus;
    get menus() {
        return this.#menus ??= this.owner instanceof Menus ? this.owner : this.owner.menus;
    }

    get style() {
        return this.menus.style;
    }
    get renderer() {
        return this.menus.renderer;
    }
    get translations() {
        return this.menus.translations;
    }
    get cache() {
        return this.menus.cache;
    }
    get storage() {
        return this.menus.storage;
    }
};

globalThis.Menu = class Menu extends Widget {
    constructor(owner, remover) {
        super();
        this.#owner = owner;
        this.#remover = remover;
    }

    #owner;
    get owner() {
        return this.#owner;
    }

    #remover;
    remove = () => {
        if (this.owner) {
            this.#owner = undefined;
            this.#remover();
            this.#contentTexture?.delete();
        }
    };

    #scroll = 0;
    get scroll() {
        return this.#scroll;
    }
    set scroll(scroll) {
        this.#scroll = scroll;
    }

    calcLayout = () => {
        let width = Math.min(this.renderer.width - this.style.menuSpace.xTotal, this.style.menuWidthMax, Math.max(this.style.menuWidthMin, Math.max(...this.#content.map(e => e.width())) + this.style.menuPadding.xTotal));
        let sizes = this.#content.map(e => e.size(width - this.style.menuPadding.xTotal));
        let height = Math.min(this.renderer.height - this.style.menuSpace.yTotal, sizes.reduce((height, size) => height + size.height, this.style.menuPadding.yTotal));
        let box = new Box2({width, height});
        box.center = this.renderer.size.scale(.5);
        return {box, sizes};
    };

    #contentTexture;
    #backgroundProgram;
    #contentProgram;
    render = target => {
        let {box, sizes} = this.calcLayout();
        let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
        if (this.#contentTexture) {
            this.#contentTexture.clear(box.size.add(2 * extra, 2 * extra));
        } else {
            this.#contentTexture = this.renderer.texture(box.size.add(2 * extra, 2 * extra));
        }
        this.#backgroundProgram = this.storage.use("MenuBackgroundProgram", () => [
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
            uniform vec2 menuSize;
            uniform vec2 menuCenter;
            uniform float menuRadius;
            uniform vec4 menuBackground;
            uniform vec4 menuOutlineColor;
            uniform vec4 menuShadowColor;
            uniform float menuShadowBlur;
            uniform vec2 menuShadowOffset;
            uniform float lineWidth;
            out vec4 color;

            float roundBoxDist(vec2 uv, vec2 center, vec2 size, float radius) {
                vec2 vec = abs(uv - center) - .5 * size + radius;
                return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
            }

            void main() {
                float lineDistance = roundBoxDist(uv, menuCenter, menuSize, menuRadius);
                float shadowDistance = roundBoxDist(uv, menuCenter + menuShadowOffset, menuSize - menuShadowBlur, menuRadius);

                color = mix(mix(menuBackground, menuOutlineColor, smoothstep(-.5, .5, lineDistance)), vec4(0), smoothstep(lineWidth - .5, lineWidth + .5, lineDistance));
                color += (1. - color.a) * menuShadowColor * smoothstep(1., 0., (.5 + shadowDistance) / menuShadowBlur);
            }
            `),
            program => program.delete(),
        ]);
        this.#contentProgram = this.storage.use("MenuContentProgram", () => [
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
            uniform sampler2D content;
            uniform vec2 contentSize;
            uniform vec2 menuMin;
            uniform vec2 menuSize;
            uniform vec2 menuCenter;
            uniform float menuRadius;
            uniform float padding;
            uniform float extra;
            out vec4 color;

            float roundBoxDist(vec2 uv, vec2 center, vec2 size, float radius) {
                vec2 vec = abs(uv - center) - .5 * size + radius;
                return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
            }

            void main() {
                float distance = roundBoxDist(uv, menuCenter, menuSize - 2. * padding, menuRadius - padding);
                vec2 normalDir = max(abs(uv - menuCenter) - .5 * menuSize + menuRadius, 0.);
                float pos = clamp(distance / padding, 0., 1.);
                color = texture(content, (uv - menuMin + extra + (dot(normalDir, normalDir) > 1e-7 ? sign(uv - menuCenter) * normalize(normalDir) * padding * (asin(pos) - pos) : vec2(0))) / contentSize) * (distance > 0. ? sqrt(1. - pos * pos) : 1.);
            }
            `),
            program => program.delete(),
        ]);
        renderer.draw({
            target,
            program: this.#backgroundProgram,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(box.copy.expand(this.style.lineWidth)).vertexMat3(target),
                uvTransform: box.copy.expand(.5 * this.style.menuShadowBlur).move(this.style.menuShadowOffset).include(box.copy.expand(this.style.lineWidth)).transformMat3(),
                menuSize: box.size,
                menuCenter: box.center,
                menuRadius: this.style.menuRadius,
                menuBackground: this.style.menuBackground,
                menuOutlineColor: this.style.menuOutlineColor,
                menuShadowColor: this.style.menuShadowColor,
                menuShadowBlur: this.style.menuShadowBlur,
                menuShadowOffset: this.style.menuShadowOffset,
                lineWidth: this.style.lineWidth,
            },
            blending: Renderer.Blending.overlay,
        }).exec();

        let pos = new Vec2(this.style.menuPadding.left + extra, box.height + extra - this.style.menuPadding.top + this.scroll/*this.#contentTexture.height - this.style.menuPadding.yMinus - extra + this.scroll*/);
        for (let i = 0; i < this.#content.length; i++) {
            this.#content[i].render(this.#contentTexture, pos.copy, sizes[i]);
            pos.y -= sizes[i].height;
        }

        renderer.draw({
            target,
            program: this.#contentProgram,
            mesh: renderer.boxMesh2D,
            uniforms: {
                content: this.#contentTexture,
                contentSize: this.#contentTexture.size,
                posTransform: box.vertexMat3(target),
                uvTransform: box.transformMat3(),
                menuMin: box.min,
                menuSize: box.size,
                menuCenter: box.center,
                menuRadius: this.style.menuRadius,
                padding: this.style.menuPadding.avg,
                extra,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
    };

    #content = [];
    title = title => {
        let element = new Title(this, () => this.#content.splice(this.#content.indexOf(element), 1), title);
        this.#content.push(element);
        return element;
    };
    tile = (name, description) => {
        let element = new Tile(this, () => this.#content.splice(this.#content.indexOf(element), 1), name, description);
        this.#content.push(element);
        return element;
    };
    spacer = () => {
        let element = new Spacer(this, () => this.#content.splice(this.#content.indexOf(element), 1));
        this.#content.push(element);
        return element;
    };
};

globalThis.Title = class Title extends Widget {
    constructor(owner, remover, title) {
        super();
        this.#owner = owner;
        this.#remover = remover;
        this.#title = title;
    }

    #owner;
    get owner() {
        return this.#owner;
    }

    #remover;
    remove = () => {
        if (this.owner) {
            this.#owner = undefined;
            this.#remover();
        }
    };

    width = () => this.style.titlePadding.left + this.style.titleFont.fine(this.translations.translate(this.title)).right;
    size = width => {
        return {width, height: this.style.titlePadding.yTotal + this.style.titleFont.height};
    };
    render = (target, pos, size) => {
        // drawDebugBox(target, new Box2(pos.copy, new Vec2(pos.x + size.width, pos.y - size.height)));
        pos.x += this.style.titlePadding.left;
        pos.y -= this.style.titlePadding.top + this.style.titleFont.ascent;
        this.style.titleFont.draw(target, this.translations.translate(this.title), pos).exec();
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
        super();
        this.#owner = owner;
        this.#remover = remover;
        this.name = name;
        this.description = description;
    }

    #owner;
    get owner() {
        return this.#owner;
    }

    #remover;
    remove = () => {
        if (this.owner) {
            this.#owner = undefined;
            this.#remover();
        }
    };

    width = () => this.style.tilePadding.left + Math.max(this.style.nameFont.fine(this.translations.translate(this.name)).right, this.style.descriptionFont.fine(this.translations.translate(this.description)).right);
    size = width => {
        return {width, height: this.style.tilePadding.yTotal + (this.name ? this.style.nameFont.height : 0) + (this.description ? this.style.descriptionFont.height : 0)};
    };
    render = (target, pos, size) => {
        // drawDebugBox(target, new Box2(pos.copy, new Vec2(pos.x + size.width, pos.y - size.height)));
        pos.x += this.style.tilePadding.left;
        pos.y -= this.style.tilePadding.top;
        if (this.name) {
            pos.y -= this.style.nameFont.ascent;
            this.style.nameFont.draw(target, this.translations.translate(this.name), pos).exec();
            pos.y -= this.style.nameFont.descent;
        }
        if (this.description) {
            pos.y -= this.style.descriptionFont.ascent;
            this.style.descriptionFont.draw(target, this.translations.translate(this.description), pos).exec();
            pos.y -= this.style.descriptionFont.descent;
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
};

globalThis.Spacer = class Spacer extends Widget {
    constructor(owner, remover) {
        super();
        this.#owner = owner;
        this.#remover = remover;
    }

    #owner;
    get owner() {
        return this.#owner;
    }

    #remover;
    remove = () => {
        if (this.owner) {
            this.#owner = undefined;
            this.#remover();
        }
    };

    #program;
    width = () => 0;
    size = width => ({width, height: this.style.spacerPadding.yTotal + this.style.lineWidth});
    render = (target, pos, size) => {
        this.#program = this.storage.use("SpacerProgram", () => [
            this.renderer.program(`#version 300 es
            precision mediump float;

            in vec2 pos;
            uniform mat3 posTransform;

            void main() {
                gl_Position = vec4((posTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            uniform vec4 spacerColor;
            out vec4 color;

            void main() {
                color = spacerColor;
            }
            `),
            program => program.delete(),
        ]);
        // drawDebugBox(target, new Box2(pos.copy, new Vec2(pos.x + size.width, pos.y - size.height)));
        renderer.draw({
            target,
            program: this.#program,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: new Box2(0, target.width, pos.y -= this.style.spacerPadding.top, pos.y - this.style.lineWidth).vertexMat3(target),
                spacerColor: this.style.spacerColor,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
    };
};



let translations = new Translations("/src/lang/index.json");

let time = new Time();

let menus = new Menus(style, renderer, translations, cache);
let menu = menus.menu();
let e1 = menu.title("inspector");
let e2 = menu.tile("inspector.text");
let e3 = menu.tile("inspector.table");
let e4 = menu.spacer();
let e5 = menu.title("inspector.text");
let e6 = menu.tile("text.family", "The font family.");
let e7 = menu.tile("text.underline", "There's not really anything to describe here; however it's also important to test line breaks for very long descriptions.");
let e8 = menu.tile("And of course it's also important to test line breaks in the names of tiles.");
// let e9 = menu.spacer();

// let controls = new Controls(time, settings.controls, document, false);
time.repeat(() => {
    renderer.width = window.innerWidth;
    renderer.height = window.innerHeight;

    let target2D = renderer.texture({width: renderer.width, height: renderer.height});
    if (background) {
        renderer.drawCopy(background, target2D, centerImage(background, target2D)).exec();
    }

    // new Font({
    //     size: 128,
    //     weight: 400,
    //     font: "SF Pro Display",
    //     color: Color.hex("00E7CB").mix(Color.hex("FFE7CB"), Math.min(time.sec % 2, 2 - time.sec % 2) ** (2 / 3)),
    //     cache,
    // }).draw(target2D, "Hello World!", new Vec2(160, target2D.height - 256)).exec();

    // drawMenu(target2D, new Box2(target2D.width * .4, target2D.width * .6, target2D.height * .25, target2D.height * .75));
    menu.render(target2D);

    renderer.show(target2D).delete();
    cache.sweep();
});
