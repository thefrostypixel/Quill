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

    gap: new Padding2(20),
    lineWidth: 2,

    titlePadding: new Padding2(16, 16, 4, 8),

    tilePadding: new Padding2(8),
    tileRadius: 16,

    spacerPadding: new Padding2(0, 24),
    spacerColor: Color.okLab({L: .8}, .1),

    titleFont: new Font({
        size: 16,
        weight: 700,
        font: "SF Pro Display",
        color: Color.okLab({L: .9}),
        cache,
    }),
    textFont: new Font({
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
    constructor(style, renderer, cache) {
        this.#style = style;
        this.#renderer = renderer;
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

    // #box = new Box2(1200, 1700, 500, 1500);
    #box = new Box2(200, 700, 200, 900);
    get box() {
        return this.#box;
    }

    #scroll = 0;
    get scroll() {
        return this.#scroll;
    }
    set scroll(scroll) {
        this.#scroll = scroll;
    }

    #contentTexture;
    #backgroundProgram;
    #contentProgram;
    render = target => {
        let box = this.#box;
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

        let left = this.style.menuPadding.xMinus + extra;
        let right = this.#contentTexture.width - left;
        let top = this.#contentTexture.height - this.style.menuPadding.yMinus - extra + this.scroll;
        for (let content of this.#content) {
            top = content.render(this.#contentTexture, left, right, top);
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
    tile = text => {
        let element = new Tile(this, () => this.#content.splice(this.#content.indexOf(element), 1), text);
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

    render = (target, left, right, top) => {
        let start = top;
        top -= this.style.titlePadding.top + this.style.titleFont.ascent;
        this.style.titleFont.draw(target, this.title, new Vec2(left + this.style.titlePadding.left, top)).exec();
        top -= this.style.titlePadding.bottom + this.style.titleFont.descent;
        drawDebugBox(target, new Box2(left, right, top, start));
        return top;
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
    constructor(owner, remover, text) {
        super();
        this.#owner = owner;
        this.#remover = remover;
        this.#text = text;
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

    render = (target, left, right, top) => {
        let start = top;
        top -= this.style.tilePadding.top + this.style.textFont.ascent;
        this.style.textFont.draw(target, this.text, new Vec2(left + this.style.tilePadding.left, top)).exec();
        top -= this.style.tilePadding.bottom + this.style.textFont.descent;
        drawDebugBox(target, new Box2(left, right, top, start));
        return top;
    };

    #text;
    get text() {
        return this.#text;
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
    render = (target, left, right, top) => {
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
        top -= this.style.spacerPadding.top;
        renderer.draw({
            target,
            program: this.#program,
            mesh: renderer.boxMesh2D,
            uniforms: {
                posTransform: new Box2(0, target.width, top, top -= this.style.lineWidth).vertexMat3(target),
                spacerColor: this.style.spacerColor,
            },
            blending: Renderer.Blending.overlay,
        }).exec();
        return top - this.style.spacerPadding.bottom;
    };
};



let translations = new Translations();

let time = new Time();

let menus = new Menus(style, renderer, cache);
let menu = menus.menu();
let e1 = menu.title("States");
let e2 = menu.tile("Float");
let e3 = menu.tile("Fix");
let e4 = menu.title("Menus");
let e5 = menu.tile("A menu");
let e6 = menu.spacer();
let e7 = menu.tile("Another menu");

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
