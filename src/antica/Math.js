globalThis.Vec2 = class Vec2 {
    constructor(...v) {
        this.set(...v);
    }

    #x = 0;
    get x() {
        return this.#x;
    }
    set x(x) {
        if (isFinite(x)) {
            this.#x = +x;
        }
    }

    #y = 0;
    get y() {
        return this.#y;
    }
    set y(y) {
        if (isFinite(y)) {
            this.#y = +y;
        }
    }

    get copy() {
        return new Vec2(this);
    }
    get obj() {
        return {x: this.x, y: this.y};
    }
    get list() {
        return [this.x, this.y];
    }
    get posMat2() {
        return new Mat2({xw: this.x, yw: this.y});
    }
    get posMat3() {
        return this.posMat2.mat3;
    }
    get posMat4() {
        return this.posMat2.mat4;
    }
    get scaleMat2() {
        if (this.length) {
            let v = this.copy.normalize();
            let s = length - 1;
            return new Mat2(
                1 + s * v.x * v.x, s * v.y * v.x,
                s * v.x * v.y, 1 + s * v.y * v.y,
            );
        }
        return new Mat2();
    }
    get scaleMat3() {
        return this.scaleMat2.mat3;
    }
    get scaleMat4() {
        return this.scaleMat2.mat4;
    }

    set(...v) {
        v = v.flat(Infinity);
        this.x = v[0]?.x ?? v[0] ?? 0;
        this.y = v[0]?.y ?? v[1] ?? 0;
        return this;
    }
    add(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.x += v.x ?? 0;
        this.y += v.y ?? 0;
        return this;
    }
    sub(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.x -= v.x ?? 0;
        this.y -= v.y ?? 0;
        return this;
    }
    scale(n) {
        this.x *= n ?? 0;
        this.y *= n ?? 0;
        return this;
    }
    div(n) {
        this.x /= n ?? Infinity;
        this.y /= n ?? Infinity;
        return this;
    }

    get length() {
        return (this.x ** 2 + this.y ** 2) ** .5;
    }
    normalize() {
        let length = this.length;
        if (length) {
            this.x /= length;
            this.y /= length;
        } else {
            this.x = 0;
            this.y = 0;
        }
        return this;
    }
    negate() {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    dist(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        return ((this.x - (v.x ?? 0)) ** 2 + (this.y - (v.y ?? 0)) ** 2) ** .5;
    }
    dot(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        return this.x * (v.x ?? 0) + this.y * (v.y ?? 0);
    }
};

globalThis.Vec3 = class Vec3 {
    constructor(...v) {
        this.set(...v);
    }

    #x = 0;
    get x() {
        return this.#x;
    }
    set x(x) {
        if (isFinite(x)) {
            this.#x = +x;
        }
    }

    #y = 0;
    get y() {
        return this.#y;
    }
    set y(y) {
        if (isFinite(y)) {
            this.#y = +y;
        }
    }

    #z = 0;
    get z() {
        return this.#z;
    }
    set z(z) {
        if (isFinite(z)) {
            this.#z = +z;
        }
    }

    get copy() {
        return new Vec3(this);
    }
    get obj() {
        return {x: this.x, y: this.y, z: this.z};
    }
    get list() {
        return [this.x, this.y, this.z];
    }
    get posMat3() {
        return new Mat3({xw: this.x, yw: this.y, zw: this.z});
    }
    get posMat4() {
        return this.posMat3.mat4;
    }
    get scaleMat3() {
        if (this.length) {
            let v = this.copy.normalize();
            let s = length - 1;
            return new Mat3(
                1 + s * v.x * v.x, s * v.y * v.x, s * v.z * v.x,
                s * v.x * v.y, 1 + s * v.y * v.y, s * v.z * v.y,
                s * v.x * v.z, s * v.y * v.z, 1 + s * v.z * v.z,
            );
        }
        return new Mat3();
    }
    get scaleMat4() {
        return this.scaleMat3.mat4;
    }

    set(...v) {
        v = v.flat(Infinity);
        this.x = v[0]?.x ?? v[0] ?? 0;
        this.y = v[0]?.y ?? v[1] ?? 0;
        this.z = v[0]?.z ?? v[2] ?? 0;
        return this;
    }
    add(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.x += v.x ?? 0;
        this.y += v.y ?? 0;
        this.z += v.z ?? 0;
        return this;
    }
    sub(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.x -= v.x ?? 0;
        this.y -= v.y ?? 0;
        this.z -= v.z ?? 0;
        return this;
    }
    scale(n) {
        this.x *= n ?? 0;
        this.y *= n ?? 0;
        this.z *= n ?? 0;
        return this;
    }
    div(n) {
        this.x /= n ?? Infinity;
        this.y /= n ?? Infinity;
        this.z /= n ?? Infinity;
        return this;
    }

    get length() {
        return (this.x ** 2 + this.y ** 2 + this.z ** 2) ** .5;
    }
    normalize() {
        let length = this.length;
        if (length) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        return this;
    }
    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    dist(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        return ((this.x - (v.x ?? 0)) ** 2 + (this.y - (v.y ?? 0)) ** 2 + (this.z - (v.z ?? 0)) ** 2) ** .5;
    }
    dot(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        return this.x * (v.x ?? 0) + this.y * (v.y ?? 0) + this.z * (v.z ?? 0);
    }
    cross(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        return new Vec3(
            this.y * (v.z ?? 0) - this.z * (v.y ?? 0),
            this.z * (v.x ?? 0) - this.x * (v.z ?? 0),
            this.x * (v.y ?? 0) - this.y * (v.x ?? 0),
        );
    }
};

globalThis.Vec4 = class Vec4 {
    constructor(...v) {
        this.set(...v);
    }

    #x = 0;
    get x() {
        return this.#x;
    }
    set x(x) {
        if (isFinite(x)) {
            this.#x = +x;
        }
    }

    #y = 0;
    get y() {
        return this.#y;
    }
    set y(y) {
        if (isFinite(y)) {
            this.#y = +y;
        }
    }

    #z = 0;
    get z() {
        return this.#z;
    }
    set z(z) {
        if (isFinite(z)) {
            this.#z = +z;
        }
    }

    #w = 0;
    get w() {
        return this.#w;
    }
    set w(w) {
        if (isFinite(w)) {
            this.#w = +w;
        }
    }

    get copy() {
        return new Vec4(this);
    }
    get obj() {
        return {x: this.x, y: this.y, z: this.z, w: this.w};
    }
    get list() {
        return [this.x, this.y, this.z, this.w];
    }
    get posMat4() {
        return new Mat4({xw: this.x, yw: this.y, zw: this.z, ww: this.w});
    }
    get scaleMat4() {
        if (this.length) {
            let v = this.copy.normalize();
            let s = length - 1;
            return new Mat4(
                1 + s * v.x * v.x, s * v.y * v.x, s * v.z * v.x, s * v.w * v.x,
                s * v.x * v.y, 1 + s * v.y * v.y, s * v.z * v.y, s * v.w * v.y,
                s * v.x * v.z, s * v.y * v.z, 1 + s * v.z * v.z, s * v.w * v.z,
                s * v.x * v.w, s * v.y * v.w, s * v.z * v.w, 1 + s * v.w * v.w,
            );
        }
        return new Mat4();
    }

    set(...v) {
        v = v.flat(Infinity);
        this.x = v[0]?.x ?? v[0] ?? 0;
        this.y = v[0]?.y ?? v[1] ?? 0;
        this.z = v[0]?.z ?? v[2] ?? 0;
        this.w = v[0]?.w ?? v[3] ?? 0;
        return this;
    }
    add(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec4(...v);
        this.x += v.x ?? 0;
        this.y += v.y ?? 0;
        this.z += v.z ?? 0;
        this.w += v.w ?? 0;
        return this;
    }
    sub(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec4(...v);
        this.x -= v.x ?? 0;
        this.y -= v.y ?? 0;
        this.z -= v.z ?? 0;
        this.w -= v.w ?? 0;
        return this;
    }
    scale(n) {
        this.x *= n ?? 0;
        this.y *= n ?? 0;
        this.z *= n ?? 0;
        this.w *= n ?? 0;
        return this;
    }
    div(n) {
        this.x /= n ?? Infinity;
        this.y /= n ?? Infinity;
        this.z /= n ?? Infinity;
        this.w /= n ?? Infinity;
        return this;
    }

    get length() {
        return (this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2) ** .5;
    }
    normalize() {
        let length = this.length;
        if (length) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
            this.w /= length;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        }
        return this;
    }
    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        this.w *= -1;
        return this;
    }

    dist(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec4(...v);
        return ((this.x - (v.x ?? 0)) ** 2 + (this.y - (v.y ?? 0)) ** 2 + (this.z - (v.z ?? 0)) ** 2 + (this.w - (v.w ?? 0)) ** 2) ** .5;
    }
    dot(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec4(...v);
        return this.x * (v.x ?? 0) + this.y * (v.y ?? 0) + this.z * (v.z ?? 0) + this.w * (v.w ?? 0);
    }
};

[2, 3, 4].forEach(c => [2, 3, 4].forEach(length => {
    let permutations = [];
    let recurse = current => {
        if (current.length < length) {
            for (let char of "xyzw".slice(0, c)) {
                recurse(current + char);
            }
        } else {
            permutations.push(current);
        }
    }
    recurse("");
    permutations.forEach(p => Object.defineProperty(globalThis[`Vec${c}`].prototype, p, {
        get: () => new globalThis[`Vec${length}`](p.split("").map(char => this[char])),
        set: value => {
            if (new Set(p.split("")).size == length) {
                p.split("").forEach((char, i) => this[char] = value[["x", "y", "z", "w"][i]] ?? value[i]);
            }
        },
        configurable: true,
    }));
}));

globalThis.Rot2 = class Rot2 {
    static #wrap(n) {
        return ((+n + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    }

    constructor(...r) {
        this.set(...r);
    }

    #r = 0;
    get r() {
        return this.#r;
    }
    set r(r) {
        if (isFinite(r)) {
            this.#r = Rot2.#wrap(r);
        }
    }

    get copy() {
        return new Rot2(this);
    }
    get obj() {
        return {r: this.r};
    }
    get list() {
        return [this.r];
    }
    get mat2() {
        return new Mat2(Math.cos(this.r), -Math.sin(this.r), Math.sin(this.r), Math.cos(this.r));
    }
    get mat3() {
        return this.mat2.mat3;
    }
    get mat4() {
        return this.mat2.mat4;
    }

    get up() {
        return this.mat2.mult(new Vec2(0, 1));
    }
    get right() {
        return this.mat2.mult(new Vec2(1, 0));
    }

    set(...r) {
        r = r.flat(Infinity);
        this.r = r[0]?.x ?? r[0] ?? 0;
        return this;
    }
    add(...r) {
        r = r[0] instanceof Object ? r[0] : new Rot2(...r);
        this.r += r.r;
        return this;
    }
    sub(...r) {
        r = r[0] instanceof Object ? r[0] : new Rot2(...r);
        this.r -= r.r;
        return this;
    }
    comp(...r) {
        return this.add(...r);
    }
    diff(...r) {
        r = r[0] instanceof Object ? r[0] : new Rot2(...r);
        return new Rot2((r.r - this.r + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    }
    lerp(r, t = .5) {
        this.r += ((r.r - this.r + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * t;
        return this;
    }
};

globalThis.Rot3 = class Rot3 {
    static #wrap(n) {
        return ((+n + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    }

    constructor(...r) {
        this.set(...r);
    }

    #x = 0;
    get x() {
        return this.#x;
    }
    set x(x) {
        if (isFinite(x)) {
            this.#x = +x;
            this.#roll = 0;
        }
    }

    #y = 0;
    get y() {
        return this.#y;
    }
    set y(y) {
        if (isFinite(y)) {
            this.#y = +y;
            this.#roll = 0;
        }
    }

    #z = 0;
    get z() {
        return this.#z;
    }
    set z(z) {
        if (isFinite(z)) {
            this.#z = +z;
            this.#roll = 0;
        }
    }

    #w = 1;
    get w() {
        return this.#w;
    }
    set w(w) {
        if (isFinite(w)) {
            this.#w = +w;
            this.#roll = 0;
        }
    }

    get #calcYaw() {
        if (Math.abs(2 * (this.w * this.x - this.y * this.z)) < 1 - 1e-4) {
            return -Math.atan2(2 * (this.w * this.y + this.z * this.x), 1 - 2 * (this.x * this.x + this.y * this.y));
        }
        return Rot3.#wrap(-Math.atan2(-2 * (this.x * this.y - this.w * this.z), 1 - 2 * (this.y * this.y + this.z * this.z)) - this.#roll);
    }
    get yaw() {
        return this.#calcYaw;
    }
    set yaw(yaw) {
        if (isFinite(yaw)) {
            this.#xyzw(+yaw, this.#calcPitch, this.#calcRoll);
        }
    }

    get #calcPitch() {
        if (Math.abs(2 * (this.w * this.x - this.y * this.z)) < 1 - 1e-4) {
            return Math.asin(2 * (this.w * this.x - this.y * this.z));
        }
        return (this.w * this.x - this.y * this.z > 0 ? .5 : -.5) * Math.PI;
    }
    get pitch() {
        return this.#calcPitch;
    }
    set pitch(pitch) {
        if (isFinite(pitch)) {
            this.#xyzw(this.#calcYaw, +pitch, this.#calcRoll);
        }
    }

    #roll = 0;
    get #calcRoll() {
        if (Math.abs(2 * (this.w * this.x - this.y * this.z)) < 1 - 1e-4) {
            return -Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.z * this.z + this.x * this.x));
        }
        return this.#roll;
    }
    get roll() {
        return this.#roll;
    }
    set roll(roll) {
        if (isFinite(roll)) {
            this.#xyzw(this.#calcYaw, this.#calcPitch, this.#roll = Rot3.#wrap(+roll));
        }
    }

    #xyzw(yaw, pitch, roll) {
        let sy = Math.sin(.5 * yaw);
        let cy = Math.cos(.5 * yaw);
        let sp = Math.sin(.5 * pitch);
        let cp = Math.cos(.5 * pitch);
        let sr = Math.sin(.5 * roll);
        let cr = Math.cos(.5 * roll);
        this.#x = sp * cy * cr + cp * sy * sr;
        this.#y = sp * cy * sr - cp * sy * cr;
        this.#z = sp * sy * cr - cp * cy * sr;
        this.#w = cp * cy * cr + sp * sy * sr;
    }

    get copy() {
        return new Rot3(this);
    }
    get obj() {
        return {x: this.x, y: this.y, z: this.z, w: this.w};
    }
    get list() {
        return [this.x, this.y, this.z, this.w];
    }
    get mat3() {
        return new Mat3(
            1 - 2 * (this.y * this.y + this.z * this.z), 2 * (this.x * this.y + this.w * this.z), 2 * (this.x * this.z - this.w * this.y),
            2 * (this.x * this.y - this.w * this.z), 1 - 2 * (this.x * this.x + this.z * this.z), 2 * (this.y * this.z + this.w * this.x),
            2 * (this.x * this.z + this.w * this.y), 2 * (this.y * this.z - this.w * this.x), 1 - 2 * (this.x * this.x + this.y * this.y),
        );
    }
    get mat4() {
        return this.mat3.mat4;
    }

    get forward() {
        return this.mat3.mult(new Vec3(0, 0, 1));
    }
    get up() {
        return this.mat3.mult(new Vec3(0, 1, 0));
    }
    get right() {
        return this.mat3.mult(new Vec3(1, 0, 0));
    }

    set(...r) {
        r = r.flat(Infinity);
        if (typeof r[0] == "object" && ("x" in r[0] || "y" in r[0] || "z" in r[0] || "w" in r[0]) || r.length == 4) {
            let roll = this.#roll;
            this.x = r[0]?.x ?? r[0];
            this.y = r[0]?.y ?? r[1];
            this.z = r[0]?.z ?? r[2];
            this.w = r[0]?.w ?? r[3];
            if (Math.abs(2 * (this.w * this.x - this.y * this.z)) > 1 - 1e-4) {
                this.#roll = isFinite(r[0]?.roll ?? r[4] ?? roll) ? Rot3.#wrap(r[0]?.roll ?? r[4] ?? roll) : 0;
            }
        } else if (typeof r[0] == "object" && ("yaw" in r[0] || "pitch" in r[0] || "roll" in r[0]) || r.length < 4) {
            this.#xyzw(isFinite(r[0]?.yaw ?? r[0]) ? r[0]?.yaw ?? r[0] : 0, isFinite(r[0]?.pitch ?? r[1]) ? r[0]?.pitch ?? r[1] : 0, this.#roll = isFinite(r[0]?.roll ?? r[2]) ? Rot3.#wrap(r[0]?.roll ?? r[2]) : 0);
        }
        return this;
    }
    mult(...r) {
        r = r[0] instanceof Object ? r[0] : new Rot3(...r);
        return this.set(
            this.x * r.w + this.w * r.x + this.y * r.z - this.z * r.y,
            this.y * r.w + this.w * r.y + this.z * r.x - this.x * r.z,
            this.z * r.w + this.w * r.z + this.x * r.y - this.y * r.x,
            this.w * r.w - this.x * r.x - this.y * r.y - this.z * r.z,
        ).#normalize();
    }
    comp(...r) {
        return this.mult(...r);
    }
    diff(...r) {
        r = r[0] instanceof Object ? r[0] : new Rot3(...r);
        return this.copy.conjugate().mult(r);
    }
    lerp(r, t = .5) {
        let cos = this.w * r.w + this.x * r.x + this.y * r.y + this.z * r.z;
        if (cos < 0) {
            r = new Rot3(-r.x, -r.y, -r.z, -r.w);
            cos = -cos;
        }
        if (cos < 1) {
            let a = .5;
            let b = .5;
            if (1 - cos ** 2 > 1e-4) {
                a = Math.sin((1 - t) * Math.acos(cos)) / (1 - cos ** 2) ** .5;
                b = Math.sin(t * Math.acos(cos)) / (1 - cos ** 2) ** .5;
            }
            this.set(
                this.x * a + r.x * b,
                this.y * a + r.y * b,
                this.z * a + r.z * b,
                this.w * a + r.w * b,
                this.roll + Rot3.#wrap(r.roll - this.roll) * t,
            );
        }
        return this;
    }

    rotate(axis, rot) {
        let s = Math.sin(.5 * rot);
        let c = Math.cos(.5 * rot);
        let a = axis.copy.normalize();
        if (a.length) {
            this.set(
                this.w * a.x * s + this.x * c + this.y * a.z * s - this.z * a.y * s,
                this.w * a.y * s - this.x * a.z * s + this.y * c + this.z * a.x * s,
                this.w * a.z * s + this.x * a.y * s - this.y * a.x * s + this.z * c,
                this.w * c - this.x * a.x * s - this.y * a.y * s - this.z * a.z * s,
            );
        }
        return this.#normalize();
    }

    conjugate() {
        this.#roll = -this.#roll;
        return this.set(-this.x, -this.y, -this.z, this.w);
    }

    #normalize() {
        let l = (this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2) ** .5;
        if (l) {
            let roll = this.#roll;
            this.x /= l;
            this.y /= l;
            this.z /= l;
            this.w /= l;
            if (Math.abs(2 * (this.w * this.x - this.y * this.z)) > 1 - 1e-4) {
                this.#roll = roll;
            }
        } else {
            this.set(0, 0, 0, 1);
        }
        return this;
    }
};

globalThis.Mat2 = class Mat2 {
    constructor(...m) {
        this.set(...m);
    }

    #xx = 1;
    get xx() {
        return this.#xx;
    }
    set xx(xx) {
        if (isFinite(xx)) {
            this.#xx = +xx;
        }
    }

    #yx = 0;
    get yx() {
        return this.#yx;
    }
    set yx(yx) {
        if (isFinite(yx)) {
            this.#yx = +yx;
        }
    }

    #xy = 0;
    get xy() {
        return this.#xy;
    }
    set xy(xy) {
        if (isFinite(xy)) {
            this.#xy = +xy;
        }
    }

    #yy = 1;
    get yy() {
        return this.#yy;
    }
    set yy(yy) {
        if (isFinite(yy)) {
            this.#yy = +yy;
        }
    }

    get copy() {
        return new Mat2(this);
    }
    get obj() {
        return {xx: this.xx, yx: this.yx, xy: this.xy, yy: this.yy};
    }
    get list() {
        return [this.xx, this.yx, this.xy, this.yy];
    }
    get mat2() {
        return new Mat2(this);
    }
    get mat3() {
        return new Mat3(this);
    }
    get mat4() {
        return new Mat4(this);
    }

    set(...m) {
        m = m.flat(Infinity);
        this.xx = m[0]?.xx ?? m[0];
        this.yx = m[0]?.yx ?? m[1];
        this.xy = m[0]?.xy ?? m[2];
        this.yy = m[0]?.yy ?? m[3];
        return this;
    }

    mult(o) {
        if (o instanceof Mat2) {
            let result = new Mat2();
            for (let a of ["x", "y"]) {
                for (let b of ["x", "y"]) {
                    result[a + b] = this[`${a}x`] * o?.[`x${b}`] + this[`${a}y`] * o?.[`y${b}`];
                }
            }
            return result;
        } else if (o instanceof Vec2) {
            return new Vec2(
                this.xx * o.x + this.xy * o.y,
                this.yx * o.x + this.yy * o.y,
            );
        }
    }

    transpose() {
        return this.set(
            this.xx, this.xy,
            this.yx, this.yy,
        );
    }

    invert() {
        let x = this.yy;
        let y = -this.xy;
        let d = 1 / (this.xx * x + this.yx * y);
        if (isFinite(d)) {
            this.set(
                x * d,
                y * d,
                -this.yx * d,
                this.xx * d,
            );
            return this;
        }
        return this.set(0, 0, 0, 0);
    }
};

globalThis.Mat3 = class Mat3 {
    constructor(...m) {
        this.set(...m);
    }

    #xx = 1;
    get xx() {
        return this.#xx;
    }
    set xx(xx) {
        if (isFinite(xx)) {
            this.#xx = +xx;
        }
    }

    #yx = 0;
    get yx() {
        return this.#yx;
    }
    set yx(yx) {
        if (isFinite(yx)) {
            this.#yx = +yx;
        }
    }

    #zx = 0;
    get zx() {
        return this.#zx;
    }
    set zx(zx) {
        if (isFinite(zx)) {
            this.#zx = +zx;
        }
    }

    #xy = 0;
    get xy() {
        return this.#xy;
    }
    set xy(xy) {
        if (isFinite(xy)) {
            this.#xy = +xy;
        }
    }

    #yy = 1;
    get yy() {
        return this.#yy;
    }
    set yy(yy) {
        if (isFinite(yy)) {
            this.#yy = +yy;
        }
    }

    #zy = 0;
    get zy() {
        return this.#zy;
    }
    set zy(zy) {
        if (isFinite(zy)) {
            this.#zy = +zy;
        }
    }

    #xz = 0;
    get xz() {
        return this.#xz;
    }
    set xz(xz) {
        if (isFinite(xz)) {
            this.#xz = +xz;
        }
    }

    #yz = 0;
    get yz() {
        return this.#yz;
    }
    set yz(yz) {
        if (isFinite(yz)) {
            this.#yz = +yz;
        }
    }

    #zz = 1;
    get zz() {
        return this.#zz;
    }
    set zz(zz) {
        if (isFinite(zz)) {
            this.#zz = +zz;
        }
    }

    get copy() {
        return new Mat3(this);
    }
    get obj() {
        return {xx: this.xx, yx: this.yx, zx: this.zx, xy: this.xy, yy: this.yy, zy: this.zy, xz: this.xz, yz: this.yz, zz: this.zz};
    }
    get list() {
        return [this.xx, this.yx, this.zx, this.xy, this.yy, this.zy, this.xz, this.yz, this.zz];
    }
    get mat2() {
        return new Mat2(this);
    }
    get mat3() {
        return new Mat3(this);
    }
    get mat4() {
        return new Mat4(this);
    }

    set(...m) {
        m = m.flat(Infinity);
        this.xx = m[0]?.xx ?? m[0];
        this.yx = m[0]?.yx ?? m[1];
        this.zx = m[0]?.zx ?? m[2];
        this.xy = m[0]?.xy ?? m[3];
        this.yy = m[0]?.yy ?? m[4];
        this.zy = m[0]?.zy ?? m[5];
        this.xz = m[0]?.xz ?? m[6];
        this.yz = m[0]?.yz ?? m[7];
        this.zz = m[0]?.zz ?? m[8];
        return this;
    }

    mult(o) {
        if (Mat3) {
            let result = new Mat3();
            for (let a of ["x", "y", "z"]) {
                for (let b of ["x", "y", "z"]) {
                    result[a + b] = this[`${a}x`] * o?.[`x${b}`] + this[`${a}y`] * o?.[`y${b}`] + this[`${a}z`] * o?.[`z${b}`];
                }
            }
            return result;
        } else if (Vec3) {
            return new Vec3(
                this.xx * o.x + this.xy * o.y + this.xz * o.z,
                this.yx * o.x + this.yy * o.y + this.yz * o.z,
                this.zx * o.x + this.zy * o.y + this.zz * o.z,
            );
        }
    }

    transpose() {
        return this.set(
            this.xx, this.xy, this.xz,
            this.yx, this.yy, this.yz,
            this.zx, this.zy, this.zz,
        );
    }

    invert() {
        let x = this.yy * this.zz - this.yz * this.zy;
        let y = this.zy * this.xz - this.zz * this.xy;
        let z = this.xy * this.yz - this.xz * this.yy;
        let d = 1 / (this.xx * x + this.yx * y + this.zx * z);
        if (isFinite(d)) {
            return this.set(
                x * d,
                (this.yz * this.zx - this.yx * this.zz) * d,
                (this.yx * this.zy - this.yy * this.zx) * d,
                y * d,
                (this.xx * this.zz - this.xz * this.zx) * d,
                (this.zx * this.xy - this.xx * this.zy) * d,
                z * d,
                (this.xz * this.yx - this.xx * this.yz) * d,
                (this.xx * this.yy - this.xy * this.yx) * d,
            );
        }
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
};

globalThis.Mat4 = class Mat4 {
    static transform(pos = new Vec3(), rot = new Rot3(), scale = 1) {
        let mat = rot.mat4;
        mat.xx *= scale;
        mat.yx *= scale;
        mat.zx *= scale;
        mat.xy *= scale;
        mat.yy *= scale;
        mat.zy *= scale;
        mat.xz *= scale;
        mat.yz *= scale;
        mat.zz *= scale;
        mat.xw = pos.x;
        mat.yw = pos.y;
        mat.zw = pos.z;
        return mat;
    }

    // Z- forward, Y+ up, X+ right, yaw+ right, pitch+ up, roll+ clockwise.
    static perspective(pos = new Vec3(), rot = new Rot3(), cam = {fov: .5 * Math.PI, aspect: 16 / 9, near: 1e-3}, aspect) {
        let projection = new Mat4(
            (aspect > (cam.aspect || 16 / 9) ? 1 : (cam.aspect || 16 / 9) / aspect) / Math.tan(.5 * (cam.fov || .5 * Math.PI)), 0, 0, 0,
            0, (aspect > (cam.aspect || 16 / 9) ? aspect : cam.aspect || 16 / 9) / Math.tan(.5 * (cam.fov || .5 * Math.PI)), 0, 0,
            0, 0, 1, -1,
            0, 0, 2 * (cam.near || 1e-3), 0,
        );
        let view = rot.mat4.transpose();
        return projection.mult(view.set({
            xw: -view.xx * pos.x - view.xy * pos.y - view.xz * pos.z,
            yw: -view.yx * pos.x - view.yy * pos.y - view.yz * pos.z,
            zw: -view.zx * pos.x - view.zy * pos.y - view.zz * pos.z,
        }));
    }

    constructor(...m) {
        this.set(...m);
    }

    #xx = 1;
    get xx() {
        return this.#xx;
    }
    set xx(xx) {
        if (isFinite(xx)) {
            this.#xx = +xx;
        }
    }

    #yx = 0;
    get yx() {
        return this.#yx;
    }
    set yx(yx) {
        if (isFinite(yx)) {
            this.#yx = +yx;
        }
    }

    #zx = 0;
    get zx() {
        return this.#zx;
    }
    set zx(zx) {
        if (isFinite(zx)) {
            this.#zx = +zx;
        }
    }

    #wx = 0;
    get wx() {
        return this.#wx;
    }
    set wx(wx) {
        if (isFinite(wx)) {
            this.#wx = +wx;
        }
    }

    #xy = 0;
    get xy() {
        return this.#xy;
    }
    set xy(xy) {
        if (isFinite(xy)) {
            this.#xy = +xy;
        }
    }

    #yy = 1;
    get yy() {
        return this.#yy;
    }
    set yy(yy) {
        if (isFinite(yy)) {
            this.#yy = +yy;
        }
    }

    #zy = 0;
    get zy() {
        return this.#zy;
    }
    set zy(zy) {
        if (isFinite(zy)) {
            this.#zy = +zy;
        }
    }

    #wy = 0;
    get wy() {
        return this.#wy;
    }
    set wy(wy) {
        if (isFinite(wy)) {
            this.#wy = +wy;
        }
    }

    #xz = 0;
    get xz() {
        return this.#xz;
    }
    set xz(xz) {
        if (isFinite(xz)) {
            this.#xz = +xz;
        }
    }

    #yz = 0;
    get yz() {
        return this.#yz;
    }
    set yz(yz) {
        if (isFinite(yz)) {
            this.#yz = +yz;
        }
    }

    #zz = 1;
    get zz() {
        return this.#zz;
    }
    set zz(zz) {
        if (isFinite(zz)) {
            this.#zz = +zz;
        }
    }

    #wz = 0;
    get wz() {
        return this.#wz;
    }
    set wz(wz) {
        if (isFinite(wz)) {
            this.#wz = +wz;
        }
    }

    #xw = 0;
    get xw() {
        return this.#xw;
    }
    set xw(xw) {
        if (isFinite(xw)) {
            this.#xw = +xw;
        }
    }

    #yw = 0;
    get yw() {
        return this.#yw;
    }
    set yw(yw) {
        if (isFinite(yw)) {
            this.#yw = +yw;
        }
    }

    #zw = 0;
    get zw() {
        return this.#zw;
    }
    set zw(zw) {
        if (isFinite(zw)) {
            this.#zw = +zw;
        }
    }

    #ww = 1;
    get ww() {
        return this.#ww;
    }
    set ww(ww) {
        if (isFinite(ww)) {
            this.#ww = +ww;
        }
    }

    get copy() {
        return new Mat4(this);
    }
    get obj() {
        return {xx: this.xx, yx: this.yx, zx: this.zx, wx: this.wx, xy: this.xy, yy: this.yy, zy: this.zy, wy: this.wy, xz: this.xz, yz: this.yz, zz: this.zz, wz: this.wz, xw: this.xw, yw: this.yw, zw: this.zw, ww: this.ww};
    }
    get list() {
        return [this.xx, this.yx, this.zx, this.wx, this.xy, this.yy, this.zy, this.wy, this.xz, this.yz, this.zz, this.wz, this.xw, this.yw, this.zw, this.ww];
    }
    get mat2() {
        return new Mat2(this);
    }
    get mat3() {
        return new Mat3(this);
    }
    get mat4() {
        return new Mat4(this);
    }

    set(...m) {
        m = m.flat(Infinity);
        this.xx = m[0]?.xx ?? m[0];
        this.yx = m[0]?.yx ?? m[1];
        this.zx = m[0]?.zx ?? m[2];
        this.wx = m[0]?.wx ?? m[3];
        this.xy = m[0]?.xy ?? m[4];
        this.yy = m[0]?.yy ?? m[5];
        this.zy = m[0]?.zy ?? m[6];
        this.wy = m[0]?.wy ?? m[7];
        this.xz = m[0]?.xz ?? m[8];
        this.yz = m[0]?.yz ?? m[9];
        this.zz = m[0]?.zz ?? m[10];
        this.wz = m[0]?.wz ?? m[11];
        this.xw = m[0]?.xw ?? m[12];
        this.yw = m[0]?.yw ?? m[13];
        this.zw = m[0]?.zw ?? m[14];
        this.ww = m[0]?.ww ?? m[15];
        return this;
    }

    mult(o) {
        if (o instanceof Mat4) {
            let result = new Mat4();
            for (let a of ["x", "y", "z", "w"]) {
                for (let b of ["x", "y", "z", "w"]) {
                    result[a + b] = this[`${a}x`] * o?.[`x${b}`] + this[`${a}y`] * o?.[`y${b}`] + this[`${a}z`] * o?.[`z${b}`] + this[`${a}w`] * o?.[`w${b}`];
                }
            }
            return result;
        } else if (o instanceof Vec3) {
            let w = this.wx * o.x + this.wy * o.y + this.wz * o.z + this.ww;
            return new Vec3(
                (this.xx * o.x + this.xy * o.y + this.xz * o.z + this.xw) / w,
                (this.yx * o.x + this.yy * o.y + this.yz * o.z + this.yw) / w,
                (this.zx * o.x + this.zy * o.y + this.zz * o.z + this.zw) / w,
            );
        } else if (o instanceof Vec4) {
            return new Vec4(
                this.xx * o.x + this.xy * o.y + this.xz * o.z + this.xw * o.w,
                this.yx * o.x + this.yy * o.y + this.yz * o.z + this.yw * o.w,
                this.zx * o.x + this.zy * o.y + this.zz * o.z + this.zw * o.w,
                this.wx * o.x + this.wy * o.y + this.wz * o.z + this.ww * o.w,
            );
        }
    }

    transpose() {
        return this.set(
            this.xx, this.xy, this.xz, this.xw,
            this.yx, this.yy, this.yz, this.yw,
            this.zx, this.zy, this.zz, this.zw,
            this.wx, this.wy, this.wz, this.ww,
        );
    }

    invert() {
        let x = this.yz * this.zw * this.wy - this.yw * this.zz * this.wy + this.yw * this.zy * this.wz - this.yy * this.zw * this.wz - this.yz * this.zy * this.ww + this.yy * this.zz * this.ww;
        let y = this.xw * this.zz * this.wy - this.xz * this.zw * this.wy - this.xw * this.zy * this.wz + this.xy * this.zw * this.wz + this.xz * this.zy * this.ww - this.xy * this.zz * this.ww;
        let z = this.xz * this.yw * this.wy - this.xw * this.yz * this.wy + this.xw * this.yy * this.wz - this.xy * this.yw * this.wz - this.xz * this.yy * this.ww + this.xy * this.yz * this.ww;
        let w = this.xw * this.yz * this.zy - this.xz * this.yw * this.zy - this.xw * this.yy * this.zz + this.xy * this.yw * this.zz + this.xz * this.yy * this.zw - this.xy * this.yz * this.zw;
        let d = 1 / (this.xx * x + this.yx * y + this.zx * z + this.wx * w);
        if (isFinite(d)) {
            return this.set(
                x * d,
                (this.yw * this.zz * this.wx - this.yz * this.zw * this.wx - this.yw * this.zx * this.wz + this.yx * this.zw * this.wz + this.yz * this.zx * this.ww - this.yx * this.zz * this.ww) * d,
                (this.yy * this.zw * this.wx - this.yw * this.zy * this.wx + this.yw * this.zx * this.wy - this.yx * this.zw * this.wy - this.yy * this.zx * this.ww + this.yx * this.zy * this.ww) * d,
                (this.yz * this.zy * this.wx - this.yy * this.zz * this.wx - this.yz * this.zx * this.wy + this.yx * this.zz * this.wy + this.yy * this.zx * this.wz - this.yx * this.zy * this.wz) * d,
                y * d,
                (this.xz * this.zw * this.wx - this.xw * this.zz * this.wx + this.xw * this.zx * this.wz - this.xx * this.zw * this.wz - this.xz * this.zx * this.ww + this.xx * this.zz * this.ww) * d,
                (this.xw * this.zy * this.wx - this.xy * this.zw * this.wx - this.xw * this.zx * this.wy + this.xx * this.zw * this.wy + this.xy * this.zx * this.ww - this.xx * this.zy * this.ww) * d,
                (this.xy * this.zz * this.wx - this.xz * this.zy * this.wx + this.xz * this.zx * this.wy - this.xx * this.zz * this.wy - this.xy * this.zx * this.wz + this.xx * this.zy * this.wz) * d,
                z * d,
                (this.xw * this.yz * this.wx - this.xz * this.yw * this.wx - this.xw * this.yx * this.wz + this.xx * this.yw * this.wz + this.xz * this.yx * this.ww - this.xx * this.yz * this.ww) * d,
                (this.xy * this.yw * this.wx - this.xw * this.yy * this.wx + this.xw * this.yx * this.wy - this.xx * this.yw * this.wy - this.xy * this.yx * this.ww + this.xx * this.yy * this.ww) * d,
                (this.xz * this.yy * this.wx - this.xy * this.yz * this.wx - this.xz * this.yx * this.wy + this.xx * this.yz * this.wy + this.xy * this.yx * this.wz - this.xx * this.yy * this.wz) * d,
                w * d,
                (this.xz * this.yw * this.zx - this.xw * this.yz * this.zx + this.xw * this.yx * this.zz - this.xx * this.yw * this.zz - this.xz * this.yx * this.zw + this.xx * this.yz * this.zw) * d,
                (this.xw * this.yy * this.zx - this.xy * this.yw * this.zx - this.xw * this.yx * this.zy + this.xx * this.yw * this.zy + this.xy * this.yx * this.zw - this.xx * this.yy * this.zw) * d,
                (this.xy * this.yz * this.zx - this.xz * this.yy * this.zx + this.xz * this.yx * this.zy - this.xx * this.yz * this.zy - this.xy * this.yx * this.zz + this.xx * this.yy * this.zz) * d,
            );
        }
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
};
