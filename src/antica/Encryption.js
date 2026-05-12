/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Encryption = {
    encrypt: (data = [], password = "") => {
        data = [...Encryption.checksum(data), ...data];
        if (password) {
            let nonce = crypto.getRandomValues(new Uint8Array(8));
            nonce[0] |= 1;
            return [...nonce, ...Encryption.applyEncryptionXor(data, nonce, password)];
        }
        return [0, ...data];
    },
    decrypt: (data = [], password = "") => {
        let decrypted = data[0] ? Encryption.applyEncryptionXor(data.slice(8), data.slice(0, 8), password) : data.slice(1);
        let checksum = Encryption.checksum(data = decrypted.slice(4));
        if (decrypted[0] == checksum[0] && decrypted[1] == checksum[1] && decrypted[2] == checksum[2] && decrypted[3] == checksum[3]) {
            return data;
        }
    },
    checksum: (data = []) => {
        let checksum = data.reduce((checksum, byte) => {
            let a = Math.imul(byte, 0x3A1D5CAA);
            let b = Math.imul(a << 15 | a >>> 17, 0x1967023D) ^ checksum;
            return Math.imul(b << 13 | b >>> 19, 5);
        }, 0xBFEBD3F1) >>> 0;
        return [checksum & 0xFF, checksum >> 8 & 0xFF, checksum >> 16 & 0xFF, checksum >> 24 & 0xFF];
    },
    applyEncryptionXor: (data = [], nonce = [], password = "") => {
        // console.log(Array.from({length:8},()=>`0x${crypto.getRandomValues(new Uint8Array(4)).toHex().toUpperCase()}`).join(", "));
        let seed = [0x943D38E6, 0x73B88AD8, 0x712186E3, 0xCA68591B, 0x20B090B6, 0xE3B07077, 0xA5A464DE, 0x60CDAF06];
        [...nonce, ...[...password].map(c => c.charAt(0))].forEach((n, i) => {
            seed[i & 7] ^= n;
            for (let j = 0; j < 8; j++) {
                let h = j ^ seed[j] ^ seed[j >> 3 & 7];
                h = Math.imul(h ^ h >>> 16, 0x1D6011B3);
                h = Math.imul(h ^ h >>> 13, 0x662FAD5F);
                seed[j] = h ^ h >>> 16;
            }
        });
        return data.map((byte, i) => {
            let h = i ^ seed[i & 7] ^ seed[i >> 3 & 7];
            h = Math.imul(h ^ h >>> 16, 0x332A6413);
            h = Math.imul(h ^ h >>> 13, 0x072B3B77);
            return byte ^ (h ^ h >>> 16) >>> 24 & 0xFF;
        });
    },
};
