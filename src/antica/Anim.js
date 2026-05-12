/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Anim = class Anim {
    constructor(axes = {x: 0}, accel = 10000, time) {
        this.axes = axes;
        this.accel = accel;
        this.time = time;
    }

    #createAxis(name) {
        let axis = {
            min: -Infinity,
            max: Infinity,
            target: 0,
            functions: [],
        };
        axis.proxy = new Proxy({}, {
            get: (_, property) => {
                if (["min", "max", "target"].includes(property)) {
                    return axis[property];
                } else {
                    let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
                    let f = axis.functions.find(f => time <= f.end);
                    if (property == "value") {
                        return f ? f.n0 + f.n1 * time + f.n2 * time ** 2 : axis.target;
                    } else if (property == "vel") {
                        return f ? f.n1 + f.n2 * time * 2 : 0;
                    }
                }
            },
            set: (_, property, value) => {
                if (["min", "max", "target", "value", "vel"].includes(property) && !isNaN(value)) {
                    let axes = this.#eval();
                    axes[name][property] = +value;
                    this.#updateFunctions(axes);
                    this.#startAnimationLoop();
                }
                return true;
            },
            has: (_, property) => ["min", "max", "target", "value", "vel"].includes(property),
            ownKeys: () => ["min", "max", "target", "value", "vel"],
            getOwnPropertyDescriptor: (_, property) => ["min", "max", "target", "value", "vel"].includes(property) ? {value: axis.proxy[property], writable: true, enumerable: true, configurable: true} : undefined,
        });
        return axis;
    }
    #axes = Object.create(null);
    #axesProxy = new Proxy({}, {
        get: (_, property) => this.#axes[property]?.proxy,
        set: (_, property, value) => {
            if (value == undefined) {
                delete this.#axes[property];
                this.#updateFunctions(this.#eval());
            } else if (!this.#axes[property]) {
                this.#axes[`${property}`] = this.#createAxis(`${property}`);
            }
            if (value instanceof Object) {
                let axes = this.#eval();
                ["min", "max", "target", "value", "vel"].forEach(field => {
                    if (field in value && !isNaN(value[field])) {
                        axes[`${property}`][field] = +value[field];
                    }
                });
                this.#updateFunctions(axes);
            } else if (!isNaN(value)) {
                let axes = this.#eval();
                axes[`${property}`].value = axes[`${property}`].target = +value;
                axes[`${property}`].vel = 0;
                this.#updateFunctions(axes);
            }
            return true;
        },
        deleteProperty: (_, property) => this.#axesProxy[property] = undefined,
        has: (_, property) => property in this.#axes,
        ownKeys: () => Object.keys(this.#axes),
        getOwnPropertyDescriptor: (_, property) => property in this.#axes ? {value: this.#axes[property].proxy, writable: true, enumerable: true, configurable: true} : undefined,
    });
    get axes() {
        return this.#axesProxy;
    }
    set axes(axes) {
        if (axes instanceof Object) {
            this.#axes = Object.create(null);
            Object.assign(this.#axesProxy, axes);
            this.#startAnimationLoop();
        }
    }

    #values = new Proxy({}, {
        get: (_, property) => this.#axes[property]?.proxy?.value,
        set: (_, property, value) => {
            if (property in this.#axes) {
                this.#axes[property].proxy.target = value;
            }
            return true;
        },
        has: (_, property) => property in this.#axes,
        ownKeys: () => Object.keys(this.#axes),
        getOwnPropertyDescriptor: (_, property) => property in this.#axes ? {value: this.#axes[property].proxy.values, writable: false, enumerable: true, configurable: false} : undefined,
    });
    get values() {
        return this.#values;
    }
    set values(values) {
        Object.assign(this.#values, values);
    }

    #accel = 10000;
    get accel() {
        return this.#accel;
    }
    set accel(accel) {
        if (!isNaN(accel) && +accel > 0) {
            let axes = this.#eval();
            this.#accel = +accel;
            this.#updateFunctions(axes);
        }
    }

    #time = undefined;
    get time() {
        return this.#time;
    }
    set time(time) {
        let axes = this.#eval();
        this.#time = !isNaN(time) ? +time : time instanceof Object ? time : undefined;
        this.#updateFunctions(axes);
    }

    get timeLeft() {
        return Math.max(0, Object.values(this.#axes).reduce((end, axis) => Math.max(end, axis.functions?.at(-1)?.end ?? 0), 0) - (typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3));
    }

    #callback = undefined;
    get callback() {
        return this.#callback;
    }
    set callback(callback) {
        if (callback instanceof Function || callback == undefined) {
            cancelAnimationFrame(this.#animationFrame);
            this.#animationFrame = undefined;
            this.#callback = callback;
            this.#startAnimationLoop();
        }
    }

    #animationFrame = undefined;
    #startAnimationLoop() {
        if (this.#callback && !this.#animationFrame) {
            let frame = () => {
                try {
                    this.#animationFrame = this.timeLeft ? requestAnimationFrame(frame) : undefined;
                    if (this.#callback) {
                        let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
                        this.#callback(Object.fromEntries(Object.keys(this.#axes).map(axis => {
                            let f = this.#axes[axis].functions.find(f => time <= f.end);
                            return [axis, f ? f.n0 + f.n1 * time + f.n2 * time ** 2 : this.#axes[axis].target];
                        })));
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            frame();
        }
    }

    #eval() {
        let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
        return Object.fromEntries(Object.keys(this.#axes).map(axis => {
            let f = this.#axes[axis].functions.find(f => time <= f.end);
            return [axis, {min: this.#axes[axis].min, max: this.#axes[axis].max, target: this.#axes[axis].target, values: f ? f.n0 + f.n1 * time + f.n2 * time ** 2 : this.#axes[axis].target, vel: f ? f.n1 + f.n2 * time * 2 : 0}];
        }));
    }

    #updateFunctions(axes = {x: {min: -Infinity, max: Infinity, target: 0, value: 0, vel: 0}}) {
        let targets = [{}];
        Object.keys(axes).forEach(axis => {
            this.#axes[axis].min = axes[axis].min;
            this.#axes[axis].max = axes[axis].max;
            this.#axes[axis].functions = [];
            if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                let min = Math.min(axes[axis].min, axes[axis].max);
                let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                let mod = n => (n % diff + diff) % diff;
                let end = axes[axis].values + axes[axis].vel * Math.abs(axes[axis].vel) / this.#accel / 2;
                let end2 = end - min;
                targets = (Math.abs(mod(axes[axis].target - min) - mod(end - min)) < 1e-9 ? [Math.floor(end2 / diff) * diff + mod(axes[axis].target - min) + min] : [
                    Math.floor(end2 / diff) * diff + mod(axes[axis].target - min) + min,
                    (Math.floor(end2 / diff) + (mod(axes[axis].target - min) < mod(end - min) ? 1 : -1)) * diff + mod(axes[axis].target - min) + min,
                ]).map(axisTarget => targets.map(target => ({...target, [axis]: axisTarget}))).flat();
            } else {
                targets.forEach(target => target[axis] = axes[axis].target);
            }
        });
        let best = {duration: Infinity};
        targets.forEach(target => {
            let totalDist = Object.keys(axes).reduce((totalDist, axis) => totalDist + (target[axis] - axes[axis].values) ** 2, 0) ** .5;
            let totalVel = Object.values(axes).reduce((totalVel, axis) => totalVel + axis.vel ** 2, 0) ** .5;
            let normalApproach;
            let approachVel;
            let driftVel = 0;
            let normalDrift;
            if (totalDist > 1e-9) {
                normalApproach = Object.fromEntries(Object.keys(axes).map(axis => [axis, (target[axis] - axes[axis].values) / totalDist]));
                approachVel = Object.keys(axes).reduce((dot, axis) => dot + normalApproach[axis] * axes[axis].vel, 0);
                if (totalVel > 1e-9) {
                    let normalVel = Object.fromEntries(Object.keys(axes).map(axis => [axis, axes[axis].vel / totalVel]));
                    let dot = Object.keys(axes).reduce((dot, axis) => dot + normalApproach[axis] * normalVel[axis]);
                    if (Math.abs(dot) < 1 - 1e-9) {
                        let drift = Object.fromEntries(Object.keys(axes).map(axis => [axis, normalVel[axis] - dot * normalApproach[axis]]));
                        driftVel = Object.values(axes).reduce((driftMag, axis) => driftMag + drift[axis] ** 2, 0) ** .5;
                        normalDrift = Object.fromEntries(Object.keys(axes).map(axis => [axis, drift[axis] / driftVel]));
                    }
                }
            } else if (totalVel > 1e-9) {
                normalApproach = Object.fromEntries(Object.keys(axes).map(axis => [axis, axes[axis].vel / totalVel]));
                approachVel = totalVel;
            } else {
                return;
            }
            let duration = Math.max(Math.abs(approachVel) < 1e-9 ? Math.abs(totalDist / this.#accel) ** .5 * 2 : (Math.abs(Math.abs(approachVel) * approachVel / 2 / this.#accel - totalDist) < 1e-9 ? Math.abs(approachVel) : approachVel ** 2 < Math.abs(totalDist) * this.#accel * 2 ? Math.max(0, (approachVel ** 2 / 2 + totalDist * this.#accel) ** .5 * 2) - approachVel : Math.abs(approachVel) + Math.abs(Math.abs(approachVel) * approachVel * 2 - totalDist * this.#accel * 4) ** .5) / this.#accel, Math.abs(driftVel / this.#accel) * (1 + Math.SQRT2));
            if (duration < best.duration) {
                best = {totalDist, normalApproach, approachVel, driftVel, normalDrift, duration, target};
            }
        });
        if (best.duration == Infinity) {
            Object.keys(axes).forEach(axis => {
                if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                    let min = Math.min(axes[axis].min, axes[axis].max);
                    let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                    this.#axes[axis].target = ((axes[axis].target - min) % diff + diff) % diff + min;
                } else {
                    this.#axes[axis].target = axes[axis].target;
                }
            });
            return;
        }
        let {totalDist, normalApproach, approachVel, driftVel, normalDrift, duration, target} = best;
        let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
        let findFunctions = (dist, vel) => {
            let disc = ((vel * duration - dist * 2) ** 2 + (vel * duration) ** 2) ** .5;
            let x = (dist * 2 - vel * duration + disc) / duration ** 2;
            x = vel / x - duration < 1e-9 && vel / x + duration > -1e-9 ? x : (dist * 2 - vel * duration - disc) / duration ** 2;
            let rel = Math.min(Math.max(duration - vel / x, 0) / 2, duration);
            let function1 = {start: time, end: time + rel, n0: x * time ** 2 / 2 - vel * time, n1: vel - x * time, n2: x / 2};
            let function2 = {start: time + rel, end: time + duration, n0: -x * rel ** 2 - (vel + x * (rel * 2 + time / 2)) * time, n1: vel + x * rel * 2 + x * time, n2: -x / 2};
            return rel < 1e-9 ? [function2] : rel > duration - 1e-9 ? [function1] : [function1, function2];
        };
        let approachFunctions = findFunctions(totalDist, approachVel);
        let driftFunctions = normalDrift ? findFunctions(0, driftVel) : [];
        Object.keys(axes).forEach(axis => {
            if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                let min = Math.min(axes[axis].min, axes[axis].max);
                let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                this.#axes[axis].target = ((target[axis] - min) % diff + diff) % diff + min;
            } else {
                this.#axes[axis].target = target[axis];
            }
        });
        [...new Set([...approachFunctions.map(f => f.end), ...driftFunctions.map(f => f.end)])].sort((a, b) => a - b).forEach(end => {
            let approachFunction = approachFunctions.find(f => end <= f.end);
            let driftFunction = driftFunctions.find(f => end <= f.end);
            Object.keys(axes).forEach(axis => {
                let n0 = normalApproach[axis] * (approachFunction?.n0 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n0 : 0) + axes[axis].values;
                let n1 = normalApproach[axis] * (approachFunction?.n1 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n1 : 0);
                let n2 = normalApproach[axis] * (approachFunction?.n2 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n2 : 0);
                if (Math.abs(n1) + Math.abs(n2) > 1e-9) {
                    if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                        let min = Math.min(axes[axis].min, axes[axis].max);
                        let max = Math.max(axes[axis].min, axes[axis].max);
                        let yMin = Math.min(n0 + n1 * time + n2 * time ** 2, n0 + n1 * end + n2 * end ** 2);
                        let yMax = Math.max(n0 + n1 * time + n2 * time ** 2, n0 + n1 * end + n2 * end ** 2);
                        if (n2) {
                            let vertex = -n1 / (2 * n2);
                            if (vertex > time && vertex < end) {
                                yMin = Math.min(yMin, n0 + n1 * vertex + n2 * vertex ** 2);
                                yMax = Math.max(yMax, n0 + n1 * vertex + n2 * vertex ** 2);
                            }
                        }
                        let loops = new Set([time, end]);
                        for (let k = Math.floor((yMin - min) / (max - min)); k <= Math.ceil((yMax - min) / (max - min)); k++) {
                            if (n2) {
                                let d = n1 ** 2 - 4 * n2 * (n0 - min - k * (max - min));
                                if (d >= 0) {
                                    let x1 = (-n1 + d ** .5) / (2 * n2);
                                    let x2 = (-n1 - d ** .5) / (2 * n2);
                                    if (x1 > time && x1 < end) {
                                        loops.add(x1);
                                    }
                                    if (x2 > time && x2 < end) {
                                        loops.add(x2);
                                    }
                                }
                            } else if (n1) {
                                let x = -(n0 - min - k * (max - min)) / n1;
                                if (x > time && x < end) {
                                    loops.add(x);
                                }
                            }
                        }
                        loops = [...loops].sort((a, b) => a - b);
                        for (let i = 0; i < loops.length - 1; i++) {
                            this.#axes[axis].functions.push({start: loops[i], end: loops[i + 1], n0: n0 - Math.floor((n0 + n1 * (loops[i] + loops[i + 1]) / 2 + n2 * (loops[i] + loops[i + 1]) ** 2 / 4 - min) / (max - min)) * (max - min), n1, n2});
                        }
                    } else {
                        this.#axes[axis].functions.push({start: time, end, n0, n1, n2});
                    }
                }
            });
            time = end;
        });
    }
};
