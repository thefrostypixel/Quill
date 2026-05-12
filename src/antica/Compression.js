/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

// Simplified LZ4.
globalThis.Compression = {
    compress: (s = [] ?? new Uint8Array()) => {
        let d = [];
        let map = {};
        let i = 0;
        let j = 0;
        let c = 259;
        while (i + 4 < s.length) {
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
        return d;
    },
    decompress: (s = [] ?? new Uint8Array()) => {
        let d = [];
        let i = 0;
        while (i < s.length) {
            let t = s[i++];
            let n = t >> 4;
            if (n) {
                if (n == 15) {
                    do {
                        n += s[i];
                    } while (s[i++] == 255);
                }
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
    },
    compressString: s => Compression.compress(new TextEncoder().encode(s)),
    decompressString: s => new TextDecoder().decode(new Uint8Array(Compression.decompress(s))),
};
