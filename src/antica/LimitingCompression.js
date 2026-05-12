/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

window.antica = window.antica || {};

// Simplified LZ4 with limitations added to prevent malicious files that decompress to insane sizes. Currently just from ChatGPT and not tested or optimized
antica.limitingCompress = (s = [] ?? new Uint8Array(), maxRatio = Infinity) => {
    // if maxRatio is finite, we must ensure finalCompressed >= ceil(original / maxRatio)
    let requiredMin = isFinite(maxRatio) ? Math.ceil(s.length / maxRatio) : -Infinity;

    let d = [];
    let map = {};
    let i = 0;
    let j = 0;
    let c = 259;

    while (i + 4 < s.length) {
        // quick check: if we can no longer fall below requiredMin by flushing rest as literals,
        // then keep compressing. Otherwise, if compressed so far + remaining literals < requiredMin,
        // we must stop compressing and flush literals to reach requiredMin.
        if (requiredMin > -Infinity) {
            let remainingIfAllLiterals = s.length - j; // worst-case literal bytes we can still emit
            if (d.length + remainingIfAllLiterals < requiredMin) {
                // force flush remainder as literals and finish
                d.push(Math.min(s.length - j, 15) << 4);
                if (s.length - j >= 15) {
                    for (let a = 0; a < Math.floor((s.length - j - 15) / 255); a++) {
                        d.push(255);
                    }
                    d.push((s.length - j - 15) % 255);
                }
                d.push(...s.slice(j));
                return d;
            }
        }

        let ns = s[i] | s[i + 1] << 8 | s[i + 2] << 16 | s[i + 3] << 24;
        let k = map[ns] ?? -1;
        map[ns] = i;
        if (k < 0 || k + 65536 <= i || (s[k] | s[k + 1] << 8 | s[k + 2] << 16 | s[k + 3] << 24) != ns) {
            i += c++ >> 8;
        } else {
            c = 259;
            k += 4;
            let o = i += 4;
            while (i < s.length && s[i] == s[k]) {
                i++;
                k++;
            }
            let l = i - o - 15;

            // Before emitting this match, check whether we still can meet requiredMin.
            // Conservative check: if compressedSoFar + (remaining bytes as literals) < requiredMin,
            // we must give up compressing and emit the rest as literals to reach requiredMin.
            if (requiredMin > -Infinity) {
                let compressedSoFar = d.length;
                let remainingIfAllLiterals = s.length - j; // include chunk we haven't emitted yet
                if (compressedSoFar + remainingIfAllLiterals < requiredMin) {
                    // flush remainder as literals and finish
                    d.push(Math.min(s.length - j, 15) << 4);
                    if (s.length - j >= 15) {
                        for (let a = 0; a < Math.floor((s.length - j - 15) / 255); a++) {
                            d.push(255);
                        }
                        d.push((s.length - j - 15) % 255);
                    }
                    d.push(...s.slice(j));
                    return d;
                }
            }

            if (o - j < 19) {
                d.push(15 + (o - j - 4 << 4) + Math.min(l, 0));
            } else {
                d.push(255 + Math.min(l, 0));
                for (let a = 0; a < Math.floor((o - j - 19) / 255); a++) {
                    d.push(255);
                }
                d.push((o - j - 19) % 255);
            }
            d.push(...s.slice(j, o - 4));
            d.push(i - k & 255, i - k >> 8);
            if (l >= 0) {
                for (let a = 0; a < Math.floor(l / 255); a++) {
                    d.push(255);
                }
                d.push(l % 255);
            }
            j = i;
        }
    }

    // tail: emit remaining as literals
    if (s.length > j) {
        d.push(Math.min(s.length - j, 15) << 4);
        if (s.length - j >= 15) {
            for (let a = 0; a < Math.floor((s.length - j - 15) / 255); a++) {
                d.push(255);
            }
            d.push((s.length - j - 15) % 255);
        }
        d.push(...s.slice(j));
    }

    // final safety: if we somehow ended below requiredMin, pad with raw bytes from original tail.
    // This is a last-resort; should rarely happen because we conservatively switched to literals above.
    if (requiredMin > -Infinity && d.length < requiredMin) {
        let need = requiredMin - d.length;
        // append a little literal block (not perfect LZ4 framing, but increases compressed size).
        // Emit up to need bytes of zeros as explicit padding literals.
        // Better option would be to re-run compression with different strategy; this is a simple patch.
        for (let a = 0; a < need; a++) d.push(0);
    }

    return d;
};
antica.limitingDecompress = (s = [] ?? new Uint8Array(), maxRatio = Infinity) => {
    let d = [];
    let i = 0;

    // precompute absolute cap if provided
    let absoluteCap = isFinite(maxRatio) ? Math.floor(s.length * maxRatio) : Infinity;

    while (i < s.length) {
        let t = s[i++];
        let n = t >> 4;
        if (n) {
            if (n == 15) {
                do {
                    n += s[i];
                } while (s[i++] == 255);
            }
            // CHECK: don't allow literals to push us over the cap
            if (d.length + n > absoluteCap) throw new Error("decompressed size would exceed allowed maxRatio");
            d.push(...s.slice(i, i += n));
        }
        if (i < s.length) {
            let l = (t & 15) + 4;
            let o = s[i++] | s[i++] << 8;
            if (l == 19) {
                do {
                    l += s[i];
                } while (s[i++] == 255);
            }

            // offset validation
            if (o < 1 || o > d.length) throw new Error("invalid match offset");

            // CHECK: don't allow match to push us over the cap
            if (d.length + l > absoluteCap) throw new Error("decompressed size would exceed allowed maxRatio");

            if (o == 1) {
                let e = d.at(-1);
                for (let a = 0; a < l; a++) {
                    d.push(e);
                }
            } else if (o > l && l > 31) {
                d.push(...d.slice(-o, l - o));
            } else {
                let o2 = d.length - o;
                for (let j = 0; j < l; j++) {
                    d.push(d[j + o2]);
                }
            }
        } else {
            break;
        }
    }
    return d;
};
