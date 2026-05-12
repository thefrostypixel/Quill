class Matrix3 {
    constructor(a = 1, b = 0, c = 0, d = 0, e = 1, f = 0, g = 0, h = 0, i = 1) {
        this.m = [
            [a, b, c],
            [d, e, f],
            [g, h, i],
        ];
    }

    static translate(x = 0, y = 0) {
        return new Matrix3(1, 0, x, 0, 1, y, 0, 0, 1);
    }

    static rotate(rad = 0) {
        let sin = Math.sin(rad);
        let cos = Math.cos(rad);
        return new Matrix3(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
    }

    static scale(x = 1, y = 1) {
        return new Matrix3(x, 0, 0, 0, y, 0, 0, 0, 1);
    }

    static mirror(rad = 0) {
        let cos = Math.cos(2 * rad);
        let sin = Math.sin(2 * rad);
        return new Matrix3(cos, sin, 0, sin, -cos, 0, 0, 0, 1);
    }

    static shear(x = 0, y = 0) {
        return new Matrix3(1, x, 0, y, 1, 0, 0, 0, 1);
    }

    // TODO 3D

    static multiply(a, b) {
        let m = new Matrix3();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                m.m[i][j] = a.m[i][0] * b.m[0][j] + a.m[i][1] * b.m[1][j] + a.m[i][2] * b.m[2][j];
            }
        }
        return m;
    }

    applyTo(p) {
        return {
            [p.x == undefined ? "left" : "x"]: this.m[0][0] * (p.x ?? p.left) + this.m[0][1] * (p.y ?? p.top) + this.m[0][2],
            [p.y == undefined ? "top" : "y"]: this.m[1][0] * (p.x ?? p.left) + this.m[1][1] * (p.y ?? p.top) + this.m[1][2]
        };
    }

    invert() {
        let m = this.m;
        let det = 1 / (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]));
        if (det == Infinity) {
            throw new Error("Matrix is singular and can't be inverted.");
        }
        return new Matrix3(
            (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * det,
            (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * det,
            (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * det,
            (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * det,
            (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * det,
            (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * det,
            (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * det,
            (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * det,
            (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * det
        );
    }
}
