/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Cookies = new Proxy({}, {
    get(_, name = "") {
        let c = document.cookie.split("; ").filter(c => c).find(c => name == decodeURIComponent(c.split("=")[0]));
        if (c) {
            let str = decodeURIComponent(c.split("=")[1]);
            try {
                return JSON.parse(str);
            } catch (e) {}
            return str;
        }
    },
    set(_, name = "", value) {
        if (value == undefined) {
            this.deleteProperty(_, name);
        } else {
            let json = false;
            try {
                JSON.parse(typeof value == "string" ? value : "0");
                json = true;
            } catch (e) {}
            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(json ? JSON.stringify(value ?? null) : value)}; path=/; expires=${new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toUTCString()}`;
        }
        return true;
    },
    deleteProperty(_, name = "") {
        document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        return true;
    },
    ownKeys() {
        return document.cookie.split("; ").filter(c => c).map(c => decodeURIComponent(c.split("=")[0]));
    },
    has(_, name = "") {
        return !!document.cookie.split("; ").filter(c => c).find(c => name == decodeURIComponent(c.split("=")[0]));
    },
    getOwnPropertyDescriptor() {
        return {enumerable: true, configurable: true};
    },
});
