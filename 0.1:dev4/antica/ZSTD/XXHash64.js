let XXH64 = (source, seed) => {
    if (typeof source == "string") {
        source = [...source].map(c => c.charCodeAt(0));
    }
    if (!(source instanceof Uint8Array)) {
        source = new Uint8Array(source);
    }

    let v1 = seed + 0x24234428 & 0xFFFFFFFF;
    let v2 = seed + 0x85EBCA77 & 0xFFFFFFFF;
    let v3 = seed;
    let v4 = seed - 0x9E3779B1 & 0xFFFFFFFF;
    let memSize = 0;
    let memory;

    let bEnd = source.length;
    if (source.length) {
        memory = new Uint8Array(16);
        if (memSize + source.length < 16) { // fill in tmp buffer
            memory.set(source.subarray(0, source.length), memSize);
            memSize += source.length;
        } else {
            let update = (source, low, high) => {
                let b = (source & 0xFFFF) + (low * 0xCA77 & 0xFFFF);
                let c = (b >>> 16) + (source >>> 16 & 0xFFFF) + ((low * 0xCA77 >>> 16) + low * 0x85EB + high * 0xCA77 & 0xFFFF) << 16 | b & 0xFFFF;
                c = c << 13 | c >>> 19;
                let d = (c & 0xFFFF) * 0x79B1;
                return d & 0xFFFF | ((d >>> 16) + (c >>> 16) * 0x79B1 + (c & 0xFFFF) * 0x9E37 & 0xFFFF) << 16
            };

            if (memSize > 0) { // some data left from previous update
                memory.set(source.subarray(0, 16 - memSize), memSize);
                let p32 = 0;
                v1 = update(v1, memory[p32] | memory[p32 + 1] << 8, memory[p32 + 2] | memory[p32 + 3] << 8);
                p32 += 4;
                v2 = update(v2, memory[p32] | memory[p32 + 1] << 8, memory[p32 + 2] | memory[p32 + 3] << 8);
                p32 += 4;
                v3 = update(v3, memory[p32] | memory[p32 + 1] << 8, memory[p32 + 2] | memory[p32 + 3] << 8);
                p32 += 4;
                v4 = update(v4, memory[p32] | memory[p32 + 1] << 8, memory[p32 + 2] | memory[p32 + 3] << 8);
                p += 16 - memSize;
                memSize = 0;
            }

            let p = 0;
            while (p <= bEnd - 16) {
                v1 = update(v1, source[p] | source[p + 1] << 8, source[p + 2] | source[p + 3] << 8);
                p += 4;
                v2 = update(v2, source[p] | source[p + 1] << 8, source[p + 2] | source[p + 3] << 8);
                p += 4;
                v3 = update(v3, source[p] | source[p + 1] << 8, source[p + 2] | source[p + 3] << 8);
                p += 4;
                v4 = update(v4, source[p] | source[p + 1] << 8, source[p + 2] | source[p + 3] << 8);
                p += 4;
            }

            if (p < bEnd) {
                memory.set(source.subarray(p, bEnd), memSize);
                memSize = bEnd - p;
            }
        }
    }

    let rotl = (v, n) => v << n | v >>> 32 - n;
    let h = seed + 0x165667B1;
    if (source.length >= 16) {
        h = rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18);
    }
    h += source.length;
    let p = 0;
    while (p <= memSize - 4) {
        h = Math.imul(rotl(h + Math.imul(memory[p] | memory[p + 1] << 8 | memory[p + 2] << 16 | memory[p + 3] << 24, 0xC2B2AE3D), 17), 0x27D4EB2F);
        p += 4;
    }
    while (p < memSize) {
        h = Math.imul(rotl(h + memory[p++] * 0x165667B1 & 0xFFFFFFFF, 11), 0x9E3779B1);
    }
    h = Math.imul(h ^ h >>> 15, 0x85EBCA77);
    h = Math.imul(h ^ h >>> 13, 0xC2B2AE3D);
    return h ^ h >>> 16;
};
