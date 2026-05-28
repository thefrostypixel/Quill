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
    menuSpacing: new Padding2(20),
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
    tileComponentSpacing: 8,

    tabBarSpacing: new Padding2(0, 8),
    tabBarPadding: new Padding2(32, 8),
    tabBarGap: -8,
    tabBarHighlightRadius: 16,
    tabBarHighlightColor: Color.okLab({L: .8}, .25),

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
        let menu = new Menus.Menu(this, () => this.#menus.splice(this.#menus.indexOf(menu), 1));
        this.#menus.push(menu);
        return menu;
    };

    render = target => {
        this.#menus.forEach(menu => menu.render(target));
        this.#ownCache?.sweep();
    };
};

Menus.Widget = class Widget {
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

    #menus;
    get menus() {
        return this.#menus ??= this.#owner instanceof Menus ? this.#owner : this.#owner.menus;
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

Menus.ElementHolder = class ElementHolder extends Menus.Widget {
    #elements = [];
    get elements() {
        return Array.from(this.#elements);
    }
    #addElement = (constructor, ...args) => {
        let element = new constructor(this, () => this.#elements.splice(this.#elements.indexOf(element), 1), ...args);
        this.#elements.push(element);
        return element;
    };

    title = title => this.#addElement(Menus.Title, title);
    tile = (name, description) => this.#addElement(Menus.Tile, name, description);
    tabBar = (tabs = [], selected = tabs[0]?.id || "") => this.#addElement(Menus.TabBar, tabs, selected);
    spacer = () => this.#addElement(Menus.Spacer);
};

Menus.Menu = class Menu extends Menus.ElementHolder {
    constructor(owner, remover) {
        super(owner, () => {
            remover();
            this.elements.forEach(e => e.remove());
            this.#contentTexture?.delete();
        });
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
    #visibleAnim = new Anim(this.#visible, 200);
    get visibleAnim() {
        return this.#visibleAnim.value;
    }
    get partiallyVisible() {
        return !!this.#visibleAnim.value;
    }

    #scroll = 0;
    get scroll() {
        return this.#scroll;
    }
    set scroll(scroll) {
        this.#scroll = scroll;
    }

    layout = () => {
        let layouts = Array.from(this.elements, () => ({wishWidth: 0}));
        this.elements.forEach((e, i) => e?.wish?.(layouts[i]));
        let width = Math.ceil(Math.min(this.renderer.width - this.style.menuSpacing.xTotal, this.style.menuWidthMax, Math.max(this.style.menuWidthMin, Math.max(...layouts.map(layout => layout.wishWidth)) + this.style.menuPadding.xTotal)));
        this.elements.forEach((e, i) => {
            layouts[i].width = width - this.style.menuPadding.xTotal;
            layouts[i].height = 0;
            e?.layout?.(layouts[i]);
            layouts[i].height = Math.ceil(layouts[i].height);
            layouts[i].size = new Vec2(layouts[i].width, layouts[i].height);
        });
        let contentHeight = layouts.reduce((height, layout) => height + layout.height, this.style.menuPadding.yTotal);
        let height = Math.min(this.renderer.height - this.style.menuSpacing.yTotal, contentHeight);
        this.scroll = Math.min(this.scroll, contentHeight - height);
        let box = new Box2({width, height});
        box.center = this.renderer.size.scale(.5).floor().add(.5 * width % 1, .5 * height % 1);
        return {box, layouts};
    };

    #contentTexture;
    #backgroundProgram;
    #contentProgram;
    render = target => {
        let {box, layouts} = this.layout();
        let extra = Math.ceil(this.style.menuPadding.max * (.5 * Math.PI - 1));
        (this.#contentTexture ??= this.renderer.texture(box.size.add(2 * extra, 2 * extra))).clear(box.size.add(2 * extra, 2 * extra));
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

            float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                vec2 vec = abs(uv - center) - .5 * size + radius;
                return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
            }

            void main() {
                float lineDistance = roundBoxDist(uv, menuSize, menuCenter, menuRadius);
                float shadowDistance = roundBoxDist(uv, menuSize - menuShadowBlur, menuCenter + menuShadowOffset, menuRadius);

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

            float roundBoxDist(vec2 uv, vec2 size, vec2 center, float radius) {
                vec2 vec = abs(uv - center) - .5 * size + radius;
                return length(max(vec, 0.)) + min(max(vec.x, vec.y), 0.) - radius;
            }

            void main() {
                float distance = roundBoxDist(uv, menuSize - 2. * padding, menuCenter, menuRadius - padding);
                vec2 normalDir = max(abs(uv - menuCenter) - .5 * menuSize + menuRadius, 0.);
                float pos = clamp(distance / padding, 0., 1.);
                color = texture(content, (uv - menuMin + extra + (dot(normalDir, normalDir) > 1e-7 ? sign(uv - menuCenter) * normalize(normalDir) * padding * (asin(pos) - pos) : vec2(0))) / contentSize) * (distance > 0. ? sqrt(1. - pos * pos) : 1.);
                // color = vec4(mod(uv - menuMin + extra + (dot(normalDir, normalDir) > 1e-7 ? sign(uv - menuCenter) * normalize(normalDir) * padding * (asin(pos) - pos) : vec2(0)), 1.), 0., 1.);
            }
            `),
            program => program.delete(),
        ]);
        let pos = new Vec2(this.style.menuPadding.left + extra, box.height + extra - this.style.menuPadding.top + this.scroll);
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].render(this.#contentTexture, pos.copy, layouts[i]);
            pos.y -= layouts[i].height;
        }
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
};

Menus.Title = class Title extends Menus.Widget {
    constructor(owner, remover, title) {
        super(owner, remover);
        this.#title = title;
    }

    wish = layout => layout.wishWidth = this.style.titlePadding.left + this.style.titleFont.fine(layout.title = this.translations.translate(this.title)).right;
    layout = layout => layout.height = this.style.titlePadding.yTotal + this.style.titleFont.height * (layout.lines = this.style.titleFont.break(layout.title, layout.width - this.style.titlePadding.xTotal)).length;
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

Menus.Tile = class Tile extends Menus.Widget {
    constructor(owner, remover, name, description) {
        super(owner, () => {
            remover();
            this.#components.forEach(c => c.remove());
        });
        this.name = name;
        this.description = description;
    }

    wish = layout => {
        layout.componentLayouts = this.#components.map(component => {
            let componentLayout = {};
            component.layout(componentLayout);
            componentLayout.size = new Vec2(componentLayout.width, componentLayout.height);
            return componentLayout;
        });
        layout.wishWidth = this.style.tilePadding.xTotal + Math.max(this.style.nameFont.fine(layout.name = this.translations.translate(this.name)).right, this.style.descriptionFont.fine(layout.description = this.translations.translate(this.description)).right) + (layout.componentWidth = layout.componentLayouts.reduce((width, layout) => width + this.style.tileComponentSpacing + layout.width, 0));
    };
    layout = layout => layout.height = this.style.tilePadding.yTotal + Math.max(layout.textHeight = this.style.nameFont.height * (layout.nameLines = this.style.nameFont.break(layout.name, layout.width - this.style.tilePadding.xTotal - layout.componentWidth)).length + this.style.descriptionFont.height * (layout.descriptionLines = this.style.descriptionFont.break(layout.description, layout.width - this.style.tilePadding.xTotal - layout.componentWidth)).length, layout.componentHeight = layout.componentLayouts.reduce((height, layout) => Math.max(height, layout.height), 0));
    render = (target, pos, layout) => {
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        let componentPos = new Vec2(pos.x + layout.width - layout.componentWidth - this.style.tilePadding.right, pos.y - this.style.tilePadding.top - .5 * (layout.height - layout.componentHeight - this.style.tilePadding.yTotal));
        pos.x += this.style.tilePadding.left;
        pos.y -= this.style.tilePadding.top + .5 * (layout.height - layout.textHeight - this.style.tilePadding.yTotal);
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
};

Menus.TabBar = class TabBar extends Menus.Widget {
    constructor(owner, remover, tabs, selected) {
        super(owner, remover);
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
    #highlightOpacity = new Anim(0, 200);
    #highlightPos = new Anim({left: 0, right: 0}, 20000);

    #program;
    wish = layout => {
        layout.gaps = !!this.#tabs.length * (this.#tabs.length - 1) * this.style.tabBarGap;
        layout.widths = this.#tabs.map(tab => this.style.tabBarPadding.xTotal + this.style.nameFont.fine(this.translations.translate(tab.name)).right);
        layout.wishWidth = layout.widths.reduce((total, width) => total + width, this.style.tabBarSpacing.xTotal + layout.gaps);
    };
    layout = layout => {
        this.scroll = Math.min(this.scroll, Math.max(0, layout.wishWidth - layout.width));
        layout.height = this.style.tabBarSpacing.yTotal + this.style.tabBarPadding.yTotal + this.style.nameFont.height;
    };
    render = (target, pos, layout) => {
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
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
        if (this.#tabs.length) {
            pos.x += this.style.tabBarSpacing.left - this.scroll;
            pos.y -= this.style.tabBarSpacing.top;
            let widths = Array.from(layout.widths);
            let remainder = layout.width - layout.wishWidth;
            while (remainder > 1e-7) {
                let smallest;
                let smallestWidth = Infinity;
                let nextSmallestWidth = Infinity;
                widths.forEach((width, i) => {
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
                smallest.forEach(i => widths[i] += Math.min(remainder / smallest.length, nextSmallestWidth - smallestWidth));
                remainder -= Math.min(remainder, (nextSmallestWidth - smallestWidth) * smallest.length);
            }
            let selectedExists = false;
            this.#tabs.forEach((tab, i) => {
                // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + widths[i], pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height)));
                if (this.selected == tab.id) {
                    this.#highlightPos.to({left: pos.x + this.scroll, right: pos.x + widths[i] + this.scroll}).skip(this.#instantAnim || !this.#highlightOpacity.value);
                    selectedExists = true;
                }
                this.style.nameFont.draw(target, this.translations.translate(tab.name), pos.copy.add(.5 * (widths[i] - layout.widths[i]) + this.style.tabBarPadding.left, -this.style.tabBarPadding.top - this.style.nameFont.ascent)).exec();
                pos.x += widths[i] + this.style.tabBarGap;
            });
            this.#highlightOpacity.to(selectedExists).skip(this.#instantAnim);
            let box = new Box2(this.#highlightPos.values.left - this.scroll, this.#highlightPos.values.right - this.scroll, pos.y - this.style.tabBarPadding.yTotal - this.style.nameFont.height, pos.y);
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
                    highlightColor: Color.okLab(this.style.tabBarHighlightColor.L, this.style.tabBarHighlightColor.a, this.style.tabBarHighlightColor.b, this.style.tabBarHighlightColor.alpha * this.#highlightOpacity.value),
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

Menus.Spacer = class Spacer extends Menus.Widget {
    constructor(owner, remover) {
        super(owner, remover);
    }

    #program;
    layout = layout => layout.height = this.style.spacerPadding.yTotal + this.style.lineWidth;
    render = (target, pos, layout) => {
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
        // drawDebugBox(target, new Box2(pos, new Vec2(pos.x + layout.width, pos.y - layout.height)));
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
menu.title("There’s not really anything to title here; however it’s important to test line breaks for very long titles............................................................................");
let e2 = menu.tabBar([{id: "text", name: "inspector.text"}, {id: "table", name: "inspector.table"}, {id: "layout", name: "inspector.layout"}], "text");
let e3 = menu.spacer();
let e4 = menu.title("inspector.text");
let e5 = menu.tile("text.family", "The font family.");
let e6 = menu.tile("text.underline", "There’s not really anything to describe here; however it’s also important to test line breaks for very long descriptions.");
let e7 = menu.tile("And of course it’s also important to test line breaks in the names of tiles.");
// let e8 = menu.spacer();

// let controls = new Controls(time, settings.controls, document, false);
time.repeat(() => {
    renderer.width = window.innerWidth;
    renderer.height = window.innerHeight;

    let target2D = renderer.texture({width: renderer.width, height: renderer.height});
    if (background) {
        renderer.drawCopy(background, target2D, centerImage(background, target2D)).exec();
    }

    menu.render(target2D);

    renderer.show(target2D).delete();
    cache.sweep();
});
