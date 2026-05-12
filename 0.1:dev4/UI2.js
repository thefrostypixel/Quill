class CanvasWebGL extends HTMLCanvasElement {
    static {
        customElements.define("canvas-web-gl", CanvasWebGL, {extends: "canvas"});
    }

    static create() {
        return document.createElement("canvas", {is: "canvas-web-gl" });
    }

    static colorFormats = {
        R: {internal: 33321, external: 6403},
        RG: {internal: 33319, external: 33319},
        RGB: {internal: 6407, external: 6407},
        RGBA: {internal: 6408, external: 6408},
    };

    static Texture = class TextureWebGL {}
    static Program = class ProgramWebGL {}
    static Error = class ErrorWebGL extends Error {};

    constructor() {
        super();
        this.gl = this.getContext("webgl2");
        this.#framebuffer = this.gl.createFramebuffer();
        this.#freeTextureSlots = Array.from({length: this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS)}, (_, i) => i);
    }

    gl;

    get width() {
        return super.width;
    }
    set width(width) {
        if (!isNaN(width) && +width > 0) {
            super.width = +width;
            if (this.#target == this) {
                this.gl.viewport(0, 0, this.width, this.height);
            }
        }
    }

    get height() {
        return super.height;
    }
    set height(height) {
        if (!isNaN(height) && +height > 0) {
            super.height = +height;
            if (this.#target == this) {
                this.gl.viewport(0, 0, this.width, this.height);
            }
        }
    }

    #activeTextureSlot;
    #freeTextureSlots;
    #boundTextures = [];
    texture(data, colorFormat = "RGBA", straight = !(data instanceof CanvasWebGL.Texture)) {
        let texture = new CanvasWebGL.Texture();
        texture.glTexture = this.gl.createTexture();
        texture.width = data.naturalWidth ?? data.videoWidth ?? data.codedWidth ?? data.width;
        texture.height = data.naturalHeight ?? data.videoHeight ?? data.codedHeight ?? data.height;
        texture.colorFormat = colorFormat;
        texture.slot = undefined;
        let lastSlot;
        let bindings = 0;
        texture.bind = (activate = false) => {
            if (lastSlot == undefined || this.#boundTextures[lastSlot] != texture) {
                if (this.#freeTextureSlots.length) {
                    gl.activeTexture(gl.TEXTURE0 + (this.#activeTextureSlot = texture.slot = lastSlot = this.#freeTextureSlots.shift()));
                    gl.bindTexture(gl.TEXTURE_2D, (this.#boundTextures[texture.slot] = texture).glTexture);
                } else {
                    throw new CanvasWebGL.Error("Out of texture slots.");
                }
            } else if (activate && lastSlot != this.#activeTextureSlot) {
                if (!bindings) {
                    this.#freeTextureSlots.splice(this.#freeTextureSlots.indexOf(texture.slot = lastSlot), 1);
                }
                gl.activeTexture(gl.TEXTURE0 + (this.#activeTextureSlot = texture.slot));
            } else if (!bindings) {
                this.#freeTextureSlots.splice(this.#freeTextureSlots.indexOf(texture.slot = lastSlot), 1);
            }
            bindings++;
            return texture.slot;
        };
        texture.unbind = () => {
            if (--bindings < 1 && texture.slot != undefined) {
                this.#freeTextureSlots.push(texture.slot);
                texture.slot = undefined;
                bindings = 0;
            }
        };
        texture.filter = (min, mag) => {
            texture.bind(true);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, min == "linear" ? this.gl.LINEAR : this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, (mag ?? min) == "linear" ? this.gl.LINEAR : this.gl.NEAREST);
            texture.unbind();
            return texture;
        };
        texture.overflow = (x, y) => {
            texture.bind(true);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, x == "clamp" ? this.gl.CLAMP_TO_EDGE : x == "mirror" ? this.gl.MIRRORED_REPEAT : this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, (y ?? x) == "clamp" ? this.gl.CLAMP_TO_EDGE : (y ?? x) == "mirror" ? this.gl.MIRRORED_REPEAT : this.gl.REPEAT);
            texture.unbind();
            return texture;
        };
        texture.delete = () => {
            this.gl.deleteTexture(texture.glTexture);
            if (texture.slot != undefined) {
                this.#freeTextureSlots.push(texture.slot);
                texture.slot = undefined;
            }
        };
        texture.bind(true);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, straight);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, CanvasWebGL.colorFormats[texture.colorFormat].internal, texture.width, texture.height, 0, CanvasWebGL.colorFormats[texture.colorFormat].external, this.gl.UNSIGNED_BYTE, data instanceof CanvasWebGL.Texture ? data.glTexture : data instanceof ImageBitmap || data instanceof ImageData || data instanceof HTMLImageElement || data instanceof HTMLCanvasElement || data instanceof HTMLVideoElement || data instanceof OffscreenCanvas || data instanceof VideoFrame ? data : null);
        texture.unbind();
        return texture;
    }

    #boxVertexArray;
    #activeProgram;
    program(vertexShader, fragmentShader) {
        let compileShader = (type, source) => {
            let shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw new CanvasWebGL.Error(this.gl.getShaderInfoLog(shader));
            }
            return shader;
        };
        let program = new CanvasWebGL.Program();
        program.glProgram = this.gl.createProgram();
        program.use = () => {
            if (this.#activeProgram != program) {
                this.#activeProgram = program;
                this.gl.useProgram(program.glProgram);
            }
            return program;
        };
        let locations = Object.create(null);
        program.set = (location, format, ...values) => {
            program.use();
            if (!(location in locations)) {
                locations[location] = this.gl.getUniformLocation(program.glProgram, location);
            }
            this.gl[`uniform${format}`](locations[location], ...values);
            return program;
        };
        program.drawBox = () => {
            program.use();
            if (!this.#boxVertexArray) {
                this.#boxVertexArray = this.gl.createVertexArray();
                this.gl.bindVertexArray(this.#boxVertexArray);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), this.gl.STATIC_DRAW);
                this.gl.enableVertexAttribArray(0);
                this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 8, 0);
            }
            this.gl.bindVertexArray(this.#boxVertexArray);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            return program;
        };
        this.gl.attachShader(program.glProgram, compileShader(this.gl.VERTEX_SHADER, vertexShader));
        this.gl.attachShader(program.glProgram, compileShader(this.gl.FRAGMENT_SHADER, fragmentShader));
        this.gl.linkProgram(program.glProgram);
        if (!this.gl.getProgramParameter(program.glProgram, this.gl.LINK_STATUS)) {
            throw new CanvasWebGL.Error(this.gl.getProgramInfoLog(program.glProgram));
        }
        return program;
    }

    #framebuffer;
    #target = this;
    get target() {
        return this.#target;
    }
    set target(target) {
        if ((target = target instanceof CanvasWebGL.Texture ? target : this) != this.#target) {
            if (target instanceof CanvasWebGL.Texture) {
                if (this.#target == this) {
                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.#framebuffer);
                }
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, target.glTexture, 0);
                if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) != this.gl.FRAMEBUFFER_COMPLETE) {
                    throw new CanvasWebGL.Error("Failed to set up frame buffer.");
                }
            } else {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
        }
        this.gl.viewport(0, 0, (this.#target = target).width, this.#target.height);
    }

    #blendMode = "overwrite";
    get blendMode() {
        return this.#blendMode;
    }
    set blendMode(blendMode) {
        if (blendMode == "overwrite") {
            this.gl.disable(this.gl.BLEND);
        } else if (blendMode == "add") {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        } else if (blendMode == "overlay") {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        } else {
            return;
        }
        this.#blendMode = blendMode;
    }

    clear() {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    #copyProgram;
    showTexture(texture, flipY = false) {
        if (!this.#copyProgram) {
            this.#copyProgram = this.program(`#version 300 es

                layout(location = 0) in vec2 corner;
                uniform vec2 scale;
                out vec2 uv;

                void main() {
                    uv = corner;
                    gl_Position = vec4((corner * 2. - 1.) * scale, 0, 1);
                }
            `, `#version 300 es
                precision mediump float;
    
                in vec2 uv;
                uniform sampler2D textureSampler;
                out vec4 fragColor;

                void main() {
                    fragColor = texture(textureSampler, uv);
                }
            `);
        }
        this.target = this;
        this.blendMode = "overwrite";
        this.#copyProgram.set("scale", "2f", 1, flipY ? -1 : 1);
        this.#copyProgram.set("textureSampler", "1i", texture.bind());
        this.#copyProgram.drawBox();
        texture.unbind();
    }
}

let canvas = CanvasWebGL.create();
document.body.appendChild(canvas);
canvas.style = "position: fixed; left: 0; top: 0;";
let gl = canvas.gl;

let canvas2D = new OffscreenCanvas(0, 0);
let context2D = canvas2D.getContext("2d");

class Cache {
    #cache = Object.create(null);
    #used = new Set();

    use(cacheID = "", getter = () => {}) {
        this.#used.add(cacheID);
        return cacheID in this.#cache ? this.#cache[cacheID] : this.#cache[cacheID] = getter();
    }

    clean(handler = () => {}) {
        for (let cacheID in this.#cache) {
            if (!this.#used.has(cacheID)) {
                handler(this.#cache[cacheID]);
                delete this.#cache[cacheID];
            }
        }
        this.#used.clear();
    }
}

let cache = new Cache();

let boxDrawer = (fragmentShader = "", setup = () => {}, cleanup = () => {}) => {
    let program = canvas.program(`#version 300 es

        layout(location = 0) in vec2 corner;
        uniform vec2 boxPosition;
        uniform vec2 boxSize;
        uniform vec2 cutoutPosition;
        uniform vec2 cutoutSize;
        out vec2 uv;

        void main() {
            uv = cutoutPosition + cutoutSize * corner;
            gl_Position = vec4(boxPosition.x + boxSize.x * corner.x, boxPosition.y + boxSize.y * corner.y, 0, 1);
        }
    `, fragmentShader);
    return (...arguments) => {
        let options = setup(program, ...arguments);
        canvas.blendMode = options.blendMode ?? "overlay";
        program
        .set("boxPosition", "2f", options.x / canvas.target.width * 2 - 1, options.y / canvas.target.height * 2 - 1)
        .set("boxSize", "2f", options.width / canvas.target.width * 2, options.height / canvas.target.height * 2)
        .set("cutoutPosition", "2f", options.cutoutX ?? 0, options.cutoutY ?? 0)
        .set("cutoutSize", "2f", options.cutoutWidth ?? 0, options.cutoutHeight ?? 0)
        .drawBox();
        cleanup(program, ...arguments);
    };
};
let textureDrawer = (fragmentShader = "", setup = () => {}) => boxDrawer(fragmentShader, (program, texture, ...arguments) => {
    let options = setup(program, texture, ...arguments);
    program.set("textureSampler", "1i", texture.bind());
    return {
        x: options.screenX ?? 0,
        y: options.screenY ?? 0,
        width: options.screenWidth ?? texture.width,
        height: options.screenHeight ?? texture.height,
        cutoutX: (options.cutoutX ?? 0) / texture.width,
        cutoutY: (options.cutoutY ?? 0) / texture.height,
        cutoutWidth: (options.cutoutWidth ?? texture.width) / texture.width,
        cutoutHeight: (options.cutoutHeight ?? texture.height) / texture.height,
    };
}, (_, texture) => texture.unbind());

let drawFlippedFullscreenTexture = textureDrawer(`#version 300 es
    precision mediump float;

    in vec2 uv;
    uniform sampler2D textureSampler;
    out vec4 fragColor;

    void main() {
        fragColor = texture(textureSampler, uv);
    }
`, (_, texture) => ({cutoutY: texture.height, cutoutHeight: -texture.height}));
let drawTexture = textureDrawer(`#version 300 es
    precision mediump float;

    in vec2 uv;
    uniform sampler2D textureSampler;
    out vec4 fragColor;

    void main() {
        fragColor = texture(textureSampler, uv);
    }
`, (program, _, options = {}) => options);
let drawColoredTexture = textureDrawer(`#version 300 es
    precision mediump float;

    in vec2 uv;
    uniform sampler2D textureSampler;
    uniform vec4 color;
    out vec4 fragColor;

    void main() {
        fragColor = color * texture(textureSampler, uv).r;
    }
`, (program, _, options = {}) => {
    program.set("color", "4f", options.color?.r ?? 1, options.color?.g ?? 1, options.color?.b ?? 1, options.color?.a ?? 1);
    return options;
});

let measureText = (text = "", size = 12, weight = 400, font = "Helvetica") => cache.use(`TextMetrics${JSON.stringify({text, size, weight, font})}`, () => {
    context2D.font = `${weight} ${size}px ${font}`;
    let measurements = context2D.measureText(text);
    let metrics = {};
    metrics.ascent = measurements.fontBoundingBoxAscent;
    metrics.descent = measurements.fontBoundingBoxDescent;
    metrics.left = -measurements.actualBoundingBoxLeft;
    metrics.right = measurements.actualBoundingBoxRight;
    metrics.top = measurements.actualBoundingBoxAscent;
    metrics.bottom = measurements.actualBoundingBoxDescent;
    metrics.boxLeft = Math.ceil(metrics.left);
    metrics.boxRight = Math.ceil(metrics.right);
    metrics.boxTop = Math.ceil(metrics.top);
    metrics.boxBottom = Math.ceil(metrics.bottom);
    metrics.width = measurements.left + metrics.right;
    metrics.boxWidth = metrics.boxLeft + metrics.boxRight;
    metrics.boxHeight = metrics.boxTop + metrics.boxBottom;
    return metrics;
});
let drawText = (text = "", x = 0, y = 0, size = 12, weight = 400, color = {r: 1, g: 1, b: 1, a: 1}, font = "Helvetica") => {
    let metrics = measureText(text, size, weight, font);
    let texture = cache.use(`TextTexture${JSON.stringify({text, size, weight, font})}`, () => {
        context2D.clearRect(0, 0, canvas2D.width = metrics.boxWidth, canvas2D.height = metrics.boxHeight);
        context2D.font = `${weight} ${size}px ${font}`;
        context2D.fillStyle = "#FFF";
        context2D.fillText(text, metrics.boxLeft, metrics.boxTop);
        return canvas.texture(canvas2D, "R");
    });
    drawColoredTexture(texture, {screenX: x - metrics.boxLeft, screenY: y - metrics.boxTop, color});
};

let centerImage = (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
    let width = sourceWidth * Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    let height = sourceHeight * Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    return [(targetWidth - width) / 2, (targetHeight - height) / 2, width, height];
};

let fetchImage = async url => await createImageBitmap(await (await fetch(url)).blob());
// let fetchImage = url => fetch(url).then(response => response.blob().then(blob => createImageBitmap(blob)));

let background = undefined;
fetchImage("Wallpaper.jpg").then(image => background = canvas.texture(image));

let gaussianWeights = radius => {
    let weights = [];
    let sum = 0;
    for (let i = 0; i <= radius; i++) {
        let w = (2 / Math.PI) ** .5 / radius * Math.exp(-2 * (i / radius) ** 2);
        weights.push(w);
        sum += w * (1 + !!i);
    }
    return weights.map(w => w / sum);
};
let blurVertexShader = `#version 300 es

    layout(location = 0) in vec2 corner;
    out vec2 uv;

    void main() {
        uv = corner;
        gl_Position = vec4(corner * 2. - 1., 0, 1);
    }
`;
let blurFragmentShader = `#version 300 es
    precision mediump float;

    in vec2 uv;
    uniform int radius;
    uniform float weights[64];
    uniform vec2 offset;
    uniform sampler2D textureSampler;
    out vec4 fragColor;

    void main() {
        vec4 color = texture(textureSampler, uv) * weights[0];
        for (int i = 1; i <= radius; i++) {
            color += (texture(textureSampler, uv + offset * float(i)) + texture(textureSampler, uv - offset * float(i))) * weights[i];
        }
        fragColor = color;
    }
`;
let blurProgram = canvas.program(blurVertexShader, blurFragmentShader);
let blurTexture = (texture, radius, copy = false) => {
    if (radius <= 0) {
        return copy ? canvas.texture(texture) : texture;
    }
    let scale = Math.max(Math.floor(Math.log2(radius)) - 1, Math.ceil(radius / 63));
    let smallRadius = Math.round(radius / scale);
    let smallWidth = Math.round(texture.width / scale);
    let smallHeight = Math.round(texture.height / scale);
    // Horizontal
    canvas.blendMode = "overwrite";
    let tmp1 = canvas.target = canvas.texture({width: smallWidth, height: smallHeight});
    blurProgram
    .set("radius", "1i", smallRadius)
    .set("weights", "1fv", new Float32Array(gaussianWeights(smallRadius)))
    .set("offset", "2f", 1 / smallWidth, 0)
    .set("textureSampler", "1i", texture.overflow("clamp").bind())
    .drawBox();
    texture.unbind();
    // Vertical
    let tmp2 = canvas.target = canvas.texture({width: smallWidth, height: smallHeight});
    blurProgram
    .set("offset", "2f", 0, 1 / smallHeight)
    .set("textureSampler", "1i", tmp1.overflow("clamp").bind())
    .drawBox();
    tmp1.delete();
    // Upscale
    canvas.target = copy ? canvas.texture({width: texture.width, height: texture.height}) : texture;
    blurProgram
    .set("radius", "1i", 0)
    .set("weights", "1fv", new Float32Array([1]))
    .set("textureSampler", "1i", tmp2.filter("linear").bind())
    .drawBox();
    tmp2.delete();
    return canvas.target;
};

let blurBoxVertexShader = `#version 300 es

    layout(location = 0) in vec2 corner;
    uniform vec2 pos;
    uniform vec2 size;
    out vec2 uv;

    void main() {
        uv = pos + size * corner;
        gl_Position = vec4(corner * 2. - 1., 0, 1);
    }
`;
let blurBoxFragmentShader = `#version 300 es
    precision highp float;

    in vec2 uv;
    uniform vec2 pos;
    uniform vec2 size;
    uniform int cornerRadius;
    uniform int radius;
    uniform float weights[64];
    uniform vec2 pixelSize;
    uniform vec2 offset;
    uniform sampler2D textureSampler;
    out vec4 fragColor;

    void main() {
        // https://www.desmos.com/calculator/wyvroqpzs1
        // https://www.desmos.com/calculator/epscwjmnkg
        vec2 texSize = vec2(textureSize(textureSampler, 0));
        float dist = length(pos * texSize + size * texSize * .5 - uv * texSize) - float(cornerRadius);
        if (dist < 0.) {
            vec4 color = texture(textureSampler, uv) * weights[0];
            for (int i = 1; i <= radius; i++) {
                color += (texture(textureSampler, max(uv - offset * float(i), pos)) + texture(textureSampler, min(uv + offset * float(i), pos + size))) * weights[i];
            }
            if (dist < -1.) {
                fragColor = color;
            } else {
                fragColor = (1. + dist) * texture(textureSampler, uv) - dist * color;
            }
        } else {
            fragColor = texture(textureSampler, uv);
        }
    }
`;
let blurBoxProgram = canvas.program(blurBoxVertexShader, blurBoxFragmentShader);
let blurBoxTexture = (texture, options = {}, copy = false) => {
    options = {x: options.x ?? 0, y: options.y ?? 0, width: options.width ?? 0, height: options.height ?? 0, cornerRadius: options.cornerRadius ?? 64, radius: options.radius ?? 64};
    if (options.radius <= 0) {
        return copy ? canvas.texture(texture) : texture;
    }
    // Horizontal
    canvas.blendMode = "overwrite";
    let tmp1 = canvas.target = canvas.texture({width: options.width, height: options.height});
    blurBoxProgram
    .set("pos", "2f", options.x / texture.width, options.y / texture.height)
    .set("size", "2f", options.width / texture.width, options.height / texture.height)
    .set("cornerRadius", "1i", options.cornerRadius)
    .set("radius", "1i", options.radius)
    .set("weights", "1fv", new Float32Array(gaussianWeights(options.radius)))
    .set("pixelSize", "2f", options.width, options.height)
    .set("offset", "2f", 1 / texture.width, 0)
    .set("textureSampler", "1i", texture.overflow("clamp").bind())
    .drawBox();
    texture.unbind();
    // Vertical
    let tmp2 = canvas.target = canvas.texture({width: options.width, height: options.height});
    blurBoxProgram
    .set("pos", "2f", 0, 0)
    .set("size", "2f", 1, 1)
    // .set("uvMatrix", "Matrix2fv", 0, [options.x / texture.width, ])
    .set("offset", "2f", 0, 1 / options.height)
    .set("textureSampler", "1i", tmp1.overflow("clamp").bind())
    .drawBox();
    tmp1.delete();
    // Copy
    if (copy) {
        canvas.target = canvas.texture({width: texture.width, height: texture.height});
        drawTexture(texture);
    } else {
        canvas.target = texture;
    }
    drawTexture(tmp2, {screenX: options.x, screenY: options.y});
    tmp2.delete();
    return canvas.target;
};

let time = new antica.Time();
time.repeat(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let target1 = canvas.target = canvas.texture({width: canvas.width, height: canvas.height});
    if (background) {
        drawTexture(background, {screenWidth: canvas.target.width, screenHeight: canvas.target.height, cutoutWidth: canvas.target.width, cutoutHeight: canvas.target.height});
    }

    // blurTexture(target1, 1 + 99 * Math.min(time.sec % 2, 2 - time.sec % 2) ** 2);
    blurBoxTexture(target1, {x: window.innerWidth / 2 - 500 + 8, y: window.innerHeight / 2 - 500, width: 1000, height: 1000});

    // Dark Apple Liquid Glass Popup Background: #272727B7
    // Approximated Apple Liquid Glass Popup Corner Formula: |x|³ + |y|³ = 1
    // Apple Liquid Glass Popup Corner "Radius": 147 Pixels
    // Apple Liquid Glass Popup Blur Radius: 52 Pixels

    // drawText("Hello World!", 250 , 80, 50, 700, {r: Math.min(time.sec % 2, 2 - time.sec % 2), g: .8, b: .6}, "SF Pro Display");

    canvas.showTexture(target1, true);
    target1.delete();

    cache.clean(obj => obj instanceof CanvasWebGL.Texture && obj.delete());
});
