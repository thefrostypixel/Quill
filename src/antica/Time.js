/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Time = class Time {
    static get ms() {
        return Math.round(performance.now());
    }
    static get sec() {
        return Time.ms / 1e3;
    }

    #ms = Time.ms;
    set ms(ms) {
        this.#ms = Math.abs(this.#ms = Math.round(ms) || 0) == Infinity ? 0 : this.#ms;
    }
    get ms() {
        return this.#ms;
    }
    set sec(sec) {
        this.#ms = Math.abs(this.#ms = Math.round(sec * 1e3) || 0) == Infinity ? 0 : this.#ms;
    }
    get sec() {
        return this.#ms / 1e3;
    }

    #scale = 1;
    set scale(scale) {
        this.#scale = Math.abs(this.#scale = Math.round(scale * 1e8) / 1e8 || 0) == Infinity ? 0 : this.#scale;
    }
    get scale() {
        return this.#scale;
    }

    #paused = false;
    #pauseStart = 0;
    set paused(paused) {
        if (!this.#paused && paused) {
            this.#activeRepeater.stop = true;
            this.#pauseStart = Time.ms;
        } else if (this.#paused && !paused) {
            this.#lastTick += Time.ms - this.#pauseStart;
            this.#lastTicks = this.#lastTicks.map(t => t + Time.ms - this.#pauseStart);
            if (this.#activeRepeater.tps) {
                let activeRepeater = this.#activeRepeater = {...this.#activeRepeater, start: this.#activeRepeater.start - this.#pauseStart + Math.ceil((this.#pauseStart - this.#activeRepeater.start) * this.#activeRepeater.tps / 1e3) * 1e3 / this.#activeRepeater.tps + Time.ms, stop: false};
                setTimeout(() => {
                    if (!activeRepeater.stop) {
                        this.repeat(activeRepeater.f, activeRepeater.tps);
                    }
                }, activeRepeater.start - Time.ms);
            } else {
                this.repeat(this.#activeRepeater.f, 0);
            }
            this.#pauseStart = 0;
        }
        this.#paused = !!paused;
    }
    get paused() {
        return this.#paused;
    }

    #count = 0;
    set count(count) {
        this.#count = Math.abs(this.#count = Math.round(count) || 0) == Infinity ? 0 : this.#count;
    }
    get count() {
        return this.#count;
    }

    #delta = 0;
    set delta(delta) {
        this.#delta = Math.abs(this.#delta = Math.round(delta * 1e8) / 1e8 || 0) == Infinity ? 0 : this.#delta;
    }
    get delta() {
        return this.#delta;
    }

    #lastTick = Time.ms;
    #lastTicks = [];
    get perSecond() {
        return this.#lastTicks.length;
    }

    #maxStepMs = Infinity;
    set maxStepMs(maxStepMs) {
        this.#maxStepMs = Math.max(0, maxStepMs) || Infinity;
    }
    get maxStepMs() {
        return this.#maxStepMs;
    }
    set maxStepSec(maxStepSec) {
        this.#maxStepMs = Math.max(0, maxStepSec * 1e3) || Infinity;
    }
    get maxStepSec() {
        return this.#maxStepMs / 1e3;
    }

    /**
     * Manually update.
     * @param f The function to call after updating.
     */
    update(f = time => {}) {
        if (!this.paused) {
            let now = Time.ms;
            this.ms += Math.min(this.maxStepMs, now - this.#lastTick) * this.scale;
            this.count++;
            this.delta = Math.round(Math.min(this.maxStepMs, now - this.#lastTick) * this.scale * 1e5) / 1e8;
            this.#lastTick = now;
            this.#lastTicks = this.#lastTicks.filter(t => t > now - 998).concat(now);
            if (f instanceof Function) {
                try {
                    f(this.snapshot());
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    #activeRepeater = {};
    /**
     * Update at the given rate, or if none is provided, the browsers frame rate.
     * @param f The function to call after updating.
     * @param tps How many times per second to update. Defaults to the browsers frame rate.
     */
    repeat(f = time => {}, tps) {
        this.#activeRepeater.stop = true;
        if (f instanceof Function) {
            tps = Math.min(1e3, Math.max(0, tps)) || 0;
            let activeRepeater = this.#activeRepeater = {f, tps, start: Time.ms};
            if (tps) {
                let lastTicks = [];
                for (let i = 0; i < Math.ceil(tps); i++) {
                    let nextTime = activeRepeater.start + 1e3 / tps * i;
                    let repeater = () => {
                        if (!activeRepeater.stop) {
                            if ((lastTicks = lastTicks.filter(t => t > Time.ms - 98)).length <= Math.ceil(tps / 10)) {
                                lastTicks.push(Time.ms);
                                this.update(f);
                            }
                            setTimeout(repeater, (nextTime += Math.floor((Time.ms - nextTime) / Math.ceil(tps) / 1e3 * tps + 1) * Math.ceil(tps) * 1e3 / tps) - Time.ms);
                        }
                    };
                    setTimeout(repeater, nextTime - Time.ms);
                }
            } else {
                let repeater = () => {
                    if (!activeRepeater.stop) {
                        requestAnimationFrame(repeater);
                        this.update(f);
                    }
                };
                requestAnimationFrame(repeater);
            }
        } else {
            this.#activeRepeater = {};
        }
    }

    /**
     * Stop updating automatically.
     */
    stopRepeating() {
        this.repeat(null);
    }

    /**
     * Get a snapshot of the time.
     */
    snapshot() {
        return new Time.Snapshot(this);
    }

    static Snapshot = class TimeSnapshot {
        #ms;
        get sec() {
            return this.#ms / 1e3;
        }
        get ms() {
            return this.#ms;
        }

        #scale;
        get scale() {
            return this.#scale;
        }

        #paused;
        get paused() {
            return this.#paused;
        }

        #count;
        get count() {
            return this.#count;
        }

        #delta;
        get delta() {
            return this.#delta;
        }

        #perSecond;
        get perSecond() {
            return this.#perSecond;
        }

        constructor(time) {
            this.#ms = time.ms;
            this.#scale = time.scale;
            this.#paused = time.paused;
            this.#count = time.count;
            this.#delta = time.delta;
            this.#perSecond = time.perSecond;
        }
    };
};
