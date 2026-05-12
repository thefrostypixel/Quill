/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

window.antica = window.antica || {};

antica.Json = {
    parse: json => {
        let stack = [];
        let stackIndex = -1;
        let keys = [];
        let foundKeys = [];
        let keysIndex = -1;
        for (let i = 0; i < json.length; i++) {
            let object;
            let foundObject = false;
            if (i + 8 < json.length && json[i] == "u" && json[i + 1] == "n" && json[i + 2] == "d" && json[i + 3] == "e" && json[i + 4] == "f" && json[i + 5] == "i" && json[i + 6] == "n" && json[i + 7] == "e" && json[i + 8] == "d") { // Undefined
                foundObject = true;
                i += 8;
            }
            else if (i + 3 < json.length && json[i] == "n" && json[i + 1] == "u" && json[i + 2] == "l" && json[i + 3] == "l") { // Null
                object = null;
                foundObject = true;
                i += 3;
            }
            else if (i + 3 < json.length && json[i] == "t" && json[i + 1] == "r" && json[i + 2] == "u" && json[i + 3] == "e") { // True
                object = true;
                foundObject = true;
                i += 3;
            }
            else if (i + 4 < json.length && json[i] == "f" && json[i + 1] == "a" && json[i + 2] == "l" && json[i + 3] == "s" && json[i + 4] == "e") { // False
                object = false;
                foundObject = true;
                i += 4;
            }
            else if (json[i] == "\"" || json[i] == "\'") { // String
                let strChar = json[i];
                let start = ++i;
                let length = 0;
                while (i < json.length && json[i] != strChar) {
                    length++;
                    if (json[i++] == "\\") {
                        i++;
                    }
                }
                object = "";
                for (let j = start; j < i; j++) {
                    object += json[j] == '\\' && j + 1 < i ? (json[++j] == "b" ? "\b" : json[j] == "f" ? "\f" : json[j] == "n" ? "\n" : json[j] == "r" ? "\r" : json[j] == "s" ? "\s" : json[j] == "t" ? "\t" : json[j]) : json[j];
                }
                foundObject = true;
            }
            else if (json[i] == "." || json[i] == "+" || json[i] == "-" || json.charCodeAt(i) > 47 && json.charCodeAt(i) < 58) { // Number
                let start = i;
                i += json[i] == "+" || json[i] == "-" ? 1 : 0;
                i += i + 1 < json.length && json[i] == "0" && (json[i + 1] == "b" || json[i + 1] == "B" || json[i + 1] == "o" || json[i + 1] == "O" || json[i + 1] == "x" || json[i + 1] == "X") ? 2 : 0;
                while (i < json.length && (json[i] == "." || json.charCodeAt(i) > 47 && json.charCodeAt(i) < 58 || json.charCodeAt(i) > 64 && json.charCodeAt(i) < 71 || json.charCodeAt(i) > 96 && json.charCodeAt(i) < 103)) {
                    i++;
                }
                object = +json.substring(start, i) || 0;
                foundObject = true;
                i--;
            }
            else if (json[i] == "[" || json[i] == "{") {
                object = json[i] == "[" ? [] : {};
                foundObject = true;
            }
            else if (json[i] == "]" || json[i] == "}") {
                while (stackIndex >= 0 && object == null) {
                    object = stack[stackIndex] instanceof Array == (json[i] == "]") ? true : null;
                    if (stack[stackIndex--] && Object.prototype.toString.call(stack[stackIndex + 1]) == "[object Object]") {
                        keysIndex--;
                    }
                    if (stackIndex < 0) {
                        return stack[0];
                    }
                }
            }
            else if (i + 1 < json.length && json[i] == "/" && (json[i + 1] == "/" || json[i + 1] == "*")) { // Comment
                if (json[++i] == "/") { // Line Comment
                    while (++i < json.length && json[i] != "\n") {}
                } else { // Block Comment
                    while (++i < json.length && (json[i] != "*" || json[i + 1] != "/")) {}
                    i++;
                }
            }
            if (foundObject) {
                if (stackIndex < 0) {
                    if (!(object instanceof Array) && !(object && Object.prototype.toString.call(object) == "[object Object]")) {
                        return object;
                    }
                } else if (stack[stackIndex] instanceof Array) {
                    stack[stackIndex].push(object);
                } else if (stack[stackIndex] && Object.prototype.toString.call(stack[stackIndex]) == "[object Object]") {
                    if (foundKeys[keysIndex]) {
                        stack[stackIndex][keys[keysIndex]] = object;
                        foundKeys[keysIndex] = false;
                    } else {
                        keys[keysIndex] = object;
                        foundKeys[keysIndex] = true;
                    }
                }
                if (object instanceof Array) {
                    stack[++stackIndex] = object;
                } else if (object && Object.prototype.toString.call(object) == "[object Object]") {
                    stack[++stackIndex] = object;
                    foundKeys[++keysIndex] = false;
                }
            }
        }
        return stack[0];
    },
    parseFile: file => fetch(file).then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
    }).then(json => antica.Json.parse(json)),
};
