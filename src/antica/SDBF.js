/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.SDBF = { // Structured Data Binary Format
    toBinary: (object, format = {}, password = "") => {
        let binary = [];
        // console.log(toHex(binary));
        let writeUVInt = (num, bytes = binary) => {
            do {
                bytes.push(num & 0xFF | ((num >>= 7) > 0 ? 0x80 : 0));
            } while (num-- > 0);
        };
        let writeSVInt = (num, bytes = binary) => writeUVInt(num > 0 ? 2 * num - 1 : -2 * num, bytes);
        let writeUInt = (num, size, bytes = binary) => {
            num = Math.min(256 ** size - 1, Math.max(0, Math.abs(num)));
            for (let i = 0; i < size; i++) {
                bytes.push(num & 0xFF);
                num >>= 8;
            }
        };
        let writeSInt = (num, size, bytes = binary) => writeUInt(num > 0 ? 2 * num - 1 : -2 * num, size, bytes);
        let writeFloat = (num, precision, bytes = binary) => {
            let expBits = Math.max(Math.round(4 * Math.log2(8 * precision) - 13), 2);
            let fracBits = 8 * precision - 1 - expBits;
            let bits;
            if (num != 0) {
                let exp = 0;
                let frac = 1;
                if (Number.isFinite(num)) {
                    frac = Math.abs(num);
                    while (frac >= 2) {
                        exp++;
                        frac /= 2;
                    }
                    while (frac < 1) {
                        exp--;
                        frac *= 2;
                    }
                    bits = ((num < 0 ? 1 : 0) << expBits | exp + (1 << expBits - 1) - 1) << fracBits | Math.floor((frac - 1) * 2 ** fracBits);
                } else {
                    bits = ((num < 0) << expBits | (1 << expBits) - 1) << fracBits | Number.isNaN(num);
                }
            } else {
                bits = (1 / num == -Infinity) << expBits + fracBits;
            }
            for (let i = 0; i < precision; i++) {
                bytes.push(bits & 0xFF);
                bits >>= 8;
            }
        };
        let writeStr = (str, bytes = binary) => {
            let encoder = new TextEncoder();
            encoder.encode(str).forEach(byte => {
                if (byte == 0 || byte == 27) {
                    bytes.push(27);
                }
                bytes.push(byte);
            });
            bytes.push(0);
        };
        let writeIDs = (ids, bytes = binary) => {
            let nums = [];
            for (let i = 0; i < ids.length;) {
                if ((i ? ids[i - 1] + 1 : 0) == ids[i]) {
                    let start = ++i;
                    while (ids[i - 1] + 1 == ids[i]) {
                        i++;
                    }
                    nums.push(i - start);
                } else {
                    nums.push((i ? ids[i - 1] + 1 : 0) - ids[i++]);
                }
            }
            writeUVInt(nums.length, bytes);
            nums.forEach(n => writeSVInt(n, bytes));
        };
        let namedTableIDs = format.tables ? Object.fromEntries(format.tables.map((table, tableID) => [table.name, tableID])) : {};
        let usedFields = {};
        let findUsesInField = (object, field) => {
            if (field.type == "list") {
                object.forEach(obj => findUsesInField(obj, field.content));
            } else if (field.type == "map") {
                Object.keys(object).forEach(obj => findUsesInField(obj, field.key));
                Object.values(object).forEach(obj => findUsesInField(obj, field.value));
            } else if (field.type == "table" && (!format.tableGroups?.[field.table] || format.tableGroups[field.table].tables.find(entry => entry.name == object[format.tableGroups[field.table].field ?? "table"]).table != undefined)) {
                findUsesInTable(object, namedTableIDs[format.tableGroups?.[field.table] ? format.tableGroups[field.table].tables.find(entry => entry.name == object[format.tableGroups[field.table].field ?? "table"]).table : field.table]);
            }
        };
        let findUsesInTable = (object, tableID = 0) => {
            usedFields[tableID] ??= new Set();
            format.tables[tableID].fields.forEach((field, fieldID) => {
                if (object[field.name] != undefined) {
                    usedFields[tableID].add(fieldID);
                    findUsesInField(object[field.name], field);
                }
            });
        };
        findUsesInField(object, format.main ?? {type: "dynamic"});
        let usedTables = Object.keys(usedFields).map(tableID => +tableID).sort((a, b) => a - b);
        writeIDs(usedTables);
        usedTables.forEach(tableID => {
            writeIDs(usedFields[tableID] = [...usedFields[tableID]].sort((a, b) => a - b));
            usedFields[tableID] = usedFields[tableID].map(fieldID =>  format.tables[tableID].fields[fieldID]);
        });
        // console.log(toHex(binary));
        // console.log(usedTables, usedFields, namedTableIDs);
        let writeDynamic = (object, binary) => {
            if ([undefined, null, false, true, -1, 0, 1].includes(object)) {
                binary.push([undefined, null, false, true, -1, 0, 1].indexOf(object));
            } else if (typeof object == "number") {
                if (Number.isInteger(object) && -0x80000001 < object && object < 0x80000000) {
                    let bytes = [(object < 0 ? 128 : 0) + (object & 0x7F)];
                    object = Math.abs(object) << 1;
                    while (object >>= 8) {
                        bytes.push(object & 0xFF);
                    }
                    binary = binary.concat(6 + bytes.length, bytes);
                } else {
                    let array = new ArrayBuffer(8);
                    new DataView(array).setFloat64(0, object);
                    binary = binary.concat(11, Array.from(new Uint8Array(array)));
                }
            } else if (object instanceof Uint8Array) {
                let length = object.length;
                let bytes = [];
                do {
                    bytes.push(length & 0xFF);
                } while (length >>= 8);
                binary.push(11 + bytes.length, ...bytes, ...object);
            } else {
                let code, data, length;
                if (typeof object == "string") {
                    code = 16;
                    data = new TextEncoder().encode(object);
                    length = data.length;
                } else if (object instanceof Array) {
                    code = 85;
                    data = object.map(obj => writeDynamic(obj, [])).flat();
                    length = object.length;
                } else {
                    code = 154;
                    data = Object.entries(object).map(obj => obj.map(obj => writeDynamic(obj, []))).flat(2);
                    length = Object.keys(object).length;
                }
                if (length < 65) {
                    binary = binary.concat(code + length, data);
                } else {
                    let bytes = [];
                    do {
                        bytes.push(length & 0xFF);
                    } while (length >>= 8);
                    binary = binary.concat(code + 64 + bytes.length, bytes, data);
                }
            }
            return binary;
        };
        let writeField = (object, field, binary) => {
            // console.log("Field", object, field);
            if (field.type == "int") {
                if (field.size) {
                    if (field.unsigned) {
                        writeUInt(object, field.size, binary);
                    } else {
                        writeSInt(object, field.size, binary);
                    }
                } else if (field.unsigned) {
                    writeUVInt(object, binary);
                } else {
                    writeSVInt(object, binary);
                }
            } else if (field.type == "float") {
                writeFloat(object, field.precision || 4, binary);
            } else if (field.type == "range") {
                writeUInt((256 ** (field.precision || 4) - 1) * (object - (field.min ?? 0)) / ((field.max ?? 1) - (field.min ?? 0)), field.precision || 4, binary);
            } else if (field.type == "enum") {
                writeUVInt(format.enums[field.enum].values.indexOf(object), binary);
            } else if (field.type == "string") {
                writeStr(object, binary);
            } else if (field.type == "binary") {
                if (!field.length) {
                    writeUVInt(object.length, binary);
                }
                let obj = object;
                if (field.length) {
                    if (field.length < object.length) {
                        obj = object.slice(0, field.length);
                    } else if (field.length > object.length) {
                        (obj = new Uint8Array(field.length)).set(object);
                    }
                }
                binary.push(...obj);
            } else if (field.type == "list") {
                if (!field.length) {
                    writeUVInt(object.length, binary);
                }
                if (field.content.type == "bool") {
                    let list = field.length ? Array.from({length: field.length}, (_, i) => object[i]) : [...object];
                    while (list.length) {
                        binary.push(Array(8).fill(0).reduce((byte, _, i) => byte | list.shift() << i, 0));
                    }
                } else {
                    (field.length ? Array.from({length: field.length}, (_, i) => object[i]) : object).forEach(obj => binary = writeField(obj, field.content, binary));
                }
            } else if (field.type == "map") {
                let keys = Object.keys(object);
                if (field.size) {
                    keys = Array.from({length: field.size}, (_, i) => keys[i]);
                } else {
                    writeUVInt(keys.length, binary);
                }
                let values = keys.map(key => object[key]);
                if (field.key.type == "bool") {
                    while (keys.length) {
                        binary.push(Array(8).fill(0).reduce((byte, _, i) => byte | !["false", "0", ""].includes(keys.shift()) << i, 0));
                    }
                } else {
                    keys.forEach(key => binary = writeField(key, field.key, binary));
                }
                if (field.value.type == "bool") {
                    while (values.length) {
                        binary.push(Array(8).fill(0).reduce((byte, _, i) => byte | values.shift() << i, 0));
                    }
                } else {
                    values.forEach(value => binary = writeField(value, field.value, binary));
                }
            } else if (field.type == "table") {
                if (format.tableGroups?.[field.table]) {
                    let index = format.tableGroups[field.table].tables.findIndex(entry => entry.name == object[format.tableGroups[field.table].field ?? "table"]);
                    let entry = format.tableGroups[field.table].tables[index];
                    writeUVInt(format.tableGroups[field.table].tables.reduce((specific, e, i) => specific + (!e.table == !entry.table && i < index), 0) << 1 | !!entry.table, binary);
                    if (entry.table) {
                        binary = writeTable(object, namedTableIDs[entry.table], binary);
                    }
                } else {
                    binary = writeTable(object, namedTableIDs[field.table], binary);
                }
            } else if (field.type == "dynamic") {
                binary = writeDynamic(object, binary);
            } else {
                throw new Error(`Unsupported type: ${field.type}.`);
            }
            return binary;
        };
        let writeTable = (object, tableID, binary) => {
            // console.log("Table", object, tableID, format.tables[tableID]);
            let binaryTable = [];
            let fields = [...usedFields[tableID]];
            let optionalFields = fields.filter(field => field.optional);
            while (fields.length) {
                let field = fields[0];
                if (field == optionalFields[0] || field.type == "bool" && (!field.optional || object[field.name] != undefined)) {
                    let byte = 0;
                    for (let i = 0; i < 8; i++) {
                        let field = fields.find(field => field == optionalFields[0] || field.type == "bool" && (!field.optional || object[field.name] != undefined));
                        if (field) {
                            byte |= (field == optionalFields[0] ? object[optionalFields.shift().name] != undefined : object[fields.splice(fields.indexOf(field), 1)[0].name]) << i;
                        } else {
                            break;
                        }
                    }
                    binaryTable.push(byte);
                } else if (!field.optional || object[field.name] != undefined) {
                    binaryTable = writeField(object[field.name], fields.shift(), binaryTable);
                } else {
                    fields.shift();
                }
            }
            writeUVInt(binaryTable.length, binary);
            return binary.concat(binaryTable);
        };
        binary = writeField(object, format.main ?? {type: "dynamic"}, binary);
        // console.log(toHex(binary));
        if (format.compression ?? true) {
            binary = Compression.compress(binary);
        }
        if (format.encryption ?? true) {
            binary = Encryption.encrypt(binary, password);
        }
        if (format.id) {
            let id = [];
            if (typeof format.id == "string") {
                id = new TextEncoder().encode(format.id);
            } else if (typeof format.id == "number") {
                let formatID = Math.abs(format.id);
                while (id.length < 6) {
                    id.push(formatID & 0xFF);
                    formatID >>= 8;
                }
            } else if (format.id instanceof Array || format.id instanceof Uint8Array) {
                id = format.id;
            }
            binary.unshift(...Array.from({length: 6}, (_, i) => id[i] || 0), (format.version || 0) & 0xFF, (format.version || 0) >> 8 & 0xFF);
        }
        return binary;
    },
    fromBinary: (binary = [] || new Uint8Array(0), format = {}, password = "") => {
        if (format.id && !SDBF.probe(binary, format).matchesFormat) {
            throw new Error("Non-matching format");
        }
        if (format.encryption ?? true) {
            let decrypted = Encryption.decrypt(format.id ? binary.slice(8) : binary, password);
            if (!decrypted) {
                throw new Error(binary[!!format.id * 8] ? "Incorrect password" : "File corrupted");
            }
            binary = decrypted;
        }
        if (format.compression ?? true) {
            binary = Compression.decompress(binary);
        }
        let i = 0;
        let readUVInt = () => {
            let num = 0;
            let shift = 0;
            do {
                num += binary[i] << 7 * shift++;
            } while (binary[i++] > 0x7F);
            return num;
        };
        let readSVInt = () => {
            let num = readUVInt();
            return num == 0 ? 0 : (num & 1) == 1 ? (num + 1) / 2 : -num / 2;
        };
        let readUInt = size => {
            let num = 0;
            for (let j = i + size - 1; j >= i; j--) {
                num = num * 256 + binary[j];
            }
            i += size;
            return num;
        };
        let readSInt = size => {
            let num = readUInt(size);
            return num == 0 ? 0 : num & 1 ? (num + 1) / 2 : -num / 2;
        };
        let readFloat = precision => {
            let expBits = Math.max(Math.round(4 * Math.log2(8 * precision) - 13), 2);
            let fracBits = 8 * precision - 1 - expBits;
            let bits = 0;
            for (let j = precision - 1; j >= 0; j--) {
                bits = bits << 8 | binary[i + j];
            }
            i += precision;
            let frac = bits & (1 << fracBits) - 1;
            let exp = (bits >>= fracBits) & (1 << expBits) - 1;
            if (!exp && !frac) {
                return bits >> expBits & 1 ? -0 : 0;
            } else if (exp == (1 << expBits) - 1 && !frac) {
                return bits >> expBits & 1 ? -Infinity : Infinity;
            }
            let float = (!!exp + frac / 2 ** fracBits) / 2 ** ((1 << expBits - 1) - (exp ? 1 : 2) - exp);
            let n = float;
            let simple = [1, 0, 0, 1];
            while (Math.floor(n) * simple[2] + simple[3] <= Math.max(1, 2 ** (fracBits - exp + (1 << expBits - 1) - 1)) && (Math.floor(n) * simple[2] + simple[3] <= Math.max(1, Math.floor(Math.sqrt(2 ** (fracBits - exp + (1 << expBits - 1) - 1)))) || !simple[0])) {
                simple = [Math.floor(n) * simple[0] + simple[1], simple[0], Math.floor(n) * simple[2] + simple[3], simple[2]];
                if (n == Math.floor(n)) {
                    break;
                }
                n = 1 / (n - Math.floor(n));
            }
            return (bits >> expBits & 1 ? -1 : 1) * (simple[0] / simple[2] || float);
        };
        let readStr = () => {
            let bytes = [];
            while (binary[i]) {
                i += binary[i] == 27;
                bytes.push(binary[i++]);
            }
            i++;
            return new TextDecoder().decode(new Uint8Array(bytes));
        };
        let readIDs = () => {
            let ids = [];
            for (let j = readUVInt(); j; j--) {
                let num = readSVInt();
                if (num < 0) {
                    ids.push((ids.at(-1) + 1 || 0) - num);
                } else {
                    for (let k = 0; k <= num; k++) {
                        ids.push(ids.at(-1) + 1 || 0);
                    }
                }
            }
            return ids;
        };
        let tableSpecs = {};
        let namedTableIDs = {};
        for (let tableID of readIDs()) {
            if (format.tables[tableID]) {
                namedTableIDs[format.tables[tableID].name] = tableID;
            }
            tableSpecs[tableID] = readIDs().map(fieldID => format.tables[tableID]?.fields?.[fieldID]).filter(field => field);
        }
        let readDynamic = () => {
            if (binary[i] < 7) {
                return [undefined, null, false, true, -1, 0, 1][binary[i++]];
            } else if (binary[i] < 11) {
                let end = binary[i++] - 6 + i;
                let n = binary[i];
                if (n > 127) {
                    n -= 256;
                }
                let shift = -1;
                while (++i < end) {
                    n += Math.sign(n) * (binary[i] << (shift += 8));
                }
                i = end;
                return n;
            } else if (binary[i] == 11) {
                i += 9;
                return new DataView(new Uint8Array(binary).buffer).getFloat64(i - 8);
            } else if (binary[i] < 16) {
                let length = 0;
                let byteCount = binary[i++] - 11;
                let shift = -8;
                while (byteCount--) {
                    length += binary[i++] << (shift += 8);
                }
                return new Uint8Array(binary.slice(i, i += length));
            } else if (binary[i] < 223) {
                let code = binary[i] < 85 ? 16 : binary[i] < 154 ? 85 : 154;
                let length = 0;
                if (binary[i] < code + 65) {
                    length = binary[i++] - code;
                } else {
                    let byteCount = binary[i++] - code - 64;
                    let shift = -8;
                    while (byteCount--) {
                        length += binary[i++] << (shift += 8);
                    }
                }
                if (code == 16) {
                    return new TextDecoder().decode(new Uint8Array(binary.slice(i, i += length)));
                } else if (code == 85) {
                    let list = [];
                    while (length--) {
                        let entry = readDynamic();
                        list.push(entry);
                    }
                    return list;
                } else {
                    let object = {};
                    while (length--) {
                        let key = readDynamic();
                        let value = readDynamic();
                        object[key] = value;
                    }
                    return object;
                }
            } else {
                throw new Error(`Invalid input: ${binary[i]} at ${i}`);
            }
        };
        let readField = (field, end) => {
            if (field.type == "int") {
                if (field.size) {
                    if (field.unsigned) {
                        return readUInt(Math.min(field.size, end - i));
                    } else {
                        return readSInt(Math.min(field.size, end - i));
                    }
                } else if (field.unsigned) {
                    return readUVInt();
                } else {
                    return readSVInt();
                }
            } else if (field.type == "float") {
                return readFloat(Math.min(field.precision || 4, end - i));
            } else if (field.type == "range") {
                return readUInt(field.precision || 4) * (field.max ?? 1) / (256 ** (field.precision || 4) - 1) + (field.min ?? 0);
            } else if (field.type == "enum") {
                let index = readUVInt();
                return format.enums[field.enum].values[index] ?? format.enums[field.enum].fallback;
            } else if (field.type == "string") {
                return readStr();
            } else if (field.type == "binary") {
                let length = Math.min(field.length || readUVInt(), end - i);
                let bin = binary.slice(i, i += length);
                return binary instanceof Uint8Array ? bin : new Uint8Array(bin);
            } else if (field.type == "list") {
                if (field.content.type == "bool") {
                    let list = Array.from({length: Math.min(field.length || readUVInt(), (end - i) * 8)}, (_, j) => !!(binary[i + Math.floor(j / 8)] >> j % 8 & 1));
                    i += Math.ceil(list.length / 8);
                    return list;
                } else {
                    let length = field.length || readUVInt();
                    let list = [];
                    while (length-- && i < end) {
                        list.push(readField(field.content, end));
                    }
                    return list;
                }
            } else if (field.type == "map") {
                let size = field.size || readUVInt();
                let keys = [];
                if (field.key.type == "bool") {
                    keys = Array.from({length: Math.min(size, (end - i) * 8)}, (_, j) => !!(binary[i + Math.floor(j / 8)] >> j % 8 & 1));
                    i += Math.ceil(size / 8);
                } else {
                    let remaining = size;
                    while (remaining-- && i < end) {
                        keys.push(readField(field.key, end));
                    }
                }
                let values = [];
                if (field.value.type == "bool") {
                    values = Array.from({length: Math.min(size, (end - i) * 8)}, (_, j) => !!(binary[i + Math.floor(j / 8)] >> j % 8 & 1));
                    i += Math.ceil(size / 8);
                } else {
                    let remaining = size;
                    while (remaining-- && i < end) {
                        values.push(readField(field.value, end));
                    }
                }
                return Object.fromEntries(keys.map((_, i) => [keys[i], values[i]]));
            } else if (field.type == "table") {
                if (format.tableGroups?.[field.table]) {
                    let index = readUVInt();
                    let specific = index >> 1;
                    let entry = format.tableGroups[field.table].tables.find(e => (specific -= !e.table != (index & 1)) < 0);
                    if (index & 1) {
                        if (entry) {
                            return readTable({[format.tableGroups[field.table].field ?? "table"]: entry.name}, namedTableIDs[entry.table], end);
                        }
                        i = readUVInt() + i;
                    }
                    return {[format.tableGroups[field.table].field ?? "table"]: entry?.name ?? format.tableGroups[field.table].fallback};
                }
                return readTable({}, namedTableIDs[field.table], end);
            } else if (field.type == "dynamic") {
                return readDynamic();
            } else {
                throw new Error(`Unsupported type: ${field.type}.`);
            }
        };
        let readTable = (object, tableID, parentEnd) => {
            let end = Math.min(readUVInt() + i, parentEnd || binary.length);
            let fields = [...tableSpecs[tableID]];
            let optionalFields = fields.filter(field => field.optional);
            while (fields.length && i < end) {
                let field = fields[0];
                if (field == optionalFields[0] || field.type == "bool") {
                    let byte = binary[i++];
                    for (let j = 0; j < 8; j++) {
                        let field = fields.find(field => field == optionalFields[0] || field.type == "bool");
                        if (field) {
                            if (field == optionalFields[0]) {
                                optionalFields.shift();
                                if (!(byte >> j & 1)) {
                                    fields.splice(fields.indexOf(field), 1);
                                }
                            } else {
                                object[fields.splice(fields.indexOf(field), 1)[0].name] = !!(byte >> j & 1);
                            }
                        } else {
                            break;
                        }
                    }
                } else {
                    object[field.name] = readField(fields.shift(), end);
                }
            }
            i = end;
            return object;
        };
        return readField(format.main ?? {type: "dynamic"}, binary.length);
    },
    probe: (binary = [] || new Uint8Array(0), format = {}) => {
        if (!format.id) {
            return {
                passwordRequired: !!binary[0],
            };
        }
        let id = [];
        if (typeof format.id == "string") {
            id = new TextEncoder().encode(format.id);
        } else if (typeof format.id == "number") {
            let formatID = Math.abs(format.id);
            while (id.length < 6) {
                id.push(formatID & 0xFF);
                formatID >>= 8;
            }
        } else if (format.id instanceof Array || format.id instanceof Uint8Array) {
            id = format.id;
        }
        if (Array.from({length: 6}, (_, i) => id[i] || 0).every((byte, i) => byte == binary[i])) {
            return {
                matchesFormat: true,
                version: binary[6] | binary[7] << 8,
                older: (binary[6] | binary[7] << 8) < format.version,
                current: (binary[6] | binary[7] << 8) == format.version,
                newer: (binary[6] | binary[7] << 8) > format.version,
                passwordRequired: !!binary[8],
            };
        }
        return {
            matchesFormat: false,
        };
    },
};

// TODO Floats with precision greater than 4 are completely broken.

let testFormat = {compression: false};
let exampleWriteFormat = {
    id: 0x123456,
    version: 1,
    compression: true, // File compression, true by default. Requires antica/Compression.js.
    encryption: true, // Adds a checksum and enables encryption if a password is provided, true by default. Requires antica/Encryption.js.
    tableGroups: {
        "Multiple Possible Types": {
            field: "type", // "table" by default
            fallback: "none",
            tables: [
                {
                    name: "none",
                },
                {
                    name: "typeA",
                    table: "Multiple - Type A",
                },
                {
                    name: "typeB",
                    table: "Multiple - Type B",
                },
                {
                    name: "typeC",
                    table: "Multiple - Type C",
                },
            ],
        },
    },
    enums: {
        "Log Level": {
            fallback: "Info",
            values: [
                "Info",
                "Warn",
                "Error",
                "Debug",
            ],
        },
    },
    tables: [
        {
            name: "Main Table",
            fields: [
                {
                    name: "anInteger",
                    type: "int",
                    size: 0, // 0: Dynamic size, 1+: Fixed byte count
                    unsigned: false, // Signed by default
                },
                {
                    name: "multipleIntegers",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "int",
                        size: 0, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                        unsigned: false, // Signed by default
                    },
                },
                {
                    name: "aFloat",
                    type: "float",
                    precision: 4, // Fixed byte count, 4 by default
                    unsigned: false, // Signed by default // TODO Add unsigned
                },
                {
                    name: "random",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "range",
                        min: 0, // Smallest possible value, 1 by default
                        max: 1, // Largest possible value, 1 by default
                        precision: 4, // Fixed byte count, 4 by default
                    },
                },
                {
                    name: "someBools",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "bool",
                    },
                },
                {
                    name: "firstBool",
                    type: "bool",
                },
                {
                    name: "unused",
                    type: "int",
                    size: 2, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                    unsigned: false, // Signed by default
                },
                {
                    name: "otherTable",
                    type: "table",
                    table: "Some Other Table",
                },
                {
                    name: "secondBool",
                    type: "bool",
                },
                {
                    name: "someText",
                    type: "string",
                },
                {
                    name: "something",
                    type: "binary",
                    length: 0, // 0: Dynamic length, 1+: Fixed byte count, Dynamic by default
                },
                {
                    name: "noType",
                    type: "table",
                    table: "Multiple Possible Types",
                },
                {
                    name: "someType",
                    type: "table",
                    table: "Multiple Possible Types",
                },
                {
                    name: "thirdBool",
                    type: "bool",
                },
                {
                    name: "optionalIntA",
                    type: "int",
                    optional: true, // false by default
                },
                {
                    name: "optionalIntB",
                    type: "int",
                    optional: true, // false by default
                },
                {
                    name: "aMap",
                    type: "map",
                    key: {
                        type: "int",
                        size: 0, // 0: Dynamic size, 1+: Fixed byte count
                        unsigned: false, // Signed by default
                    },
                    value: {
                        type: "string",
                    },
                    size: 0, // 0: Dynamic size, 1+: Fixed pair count
                },
                {
                    name: "logLevel",
                    type: "enum",
                    enum: "Log Level",
                },
            ],
        },
        {
            name: "Some Other Table",
            fields: [
                {
                    name: "test",
                    type: "int",
                    unsigned: true,
                },
                {
                    name: "doubledIntegers",
                    type: "list",
                    length: 9, // undefined: No list, 0: Dynamic length, 1+: Fixed entry count, None by default
                    content: {
                        type: "int",
                        size: 1, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                        unsigned: true, // Signed by default
                    },
                },
            ],
        },
        {
            name: "Multiple - Type A",
            fields: [
                {
                    name: "fieldA",
                    type: "int",
                },
            ],
        },
        {
            name: "Multiple - Type B",
            fields: [
                {
                    name: "fieldB",
                    type: "float",
                },
            ],
        },
        {
            name: "Multiple - Type C",
            fields: [
                {
                    name: "fieldC",
                    type: "binary",
                },
            ],
        },
        {
            name: "Optional Integers",
            fields: [
                {
                    name: "fieldA",
                    type: "int",
                    optional: true,
                },
                {
                    name: "fieldB",
                    type: "int",
                    optional: true,
                },
                {
                    name: "fieldC",
                    type: "int",
                    optional: true,
                },
            ],
        },
        {
            name: "Optional Booleans",
            fields: [
                {
                    name: "fieldA",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "fieldB",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "fieldC",
                    type: "bool",
                    optional: true,
                },
            ],
        },
    ],
    main: {
        type: "table",
        table: "Main Table",
    },
};
let exampleReadFormat = {
    id: 0x123456,
    version: 1,
    compression: true, // File compression, true by default. Requires antica/Compression.js.
    encryption: true, // Adds a checksum and enables encryption if a password is provided, true by default. Requires antica/Encryption.js.
    tableGroups: {
        "Multiple Possible Types": {
            field: "type", // "table" by default
            fallback: "none",
            tables: [
                {
                    name: "none",
                },
                {
                    name: "typeA",
                    table: "Multiple - Type A",
                },
                {
                    name: "typeB",
                    table: "Multiple - Type B",
                },
                {
                    name: "typeC",
                    table: "Multiple - Type C",
                },
            ],
        },
    },
    enums: {
        "Log Level": {
            fallback: "Info",
            values: [
                "Info",
                "Warn",
                "Error",
                "Debug",
            ],
        },
    },
    tables: [
        {
            name: "Main Table",
            fields: [
                {
                    name: "anInteger",
                    type: "int",
                    size: 0, // 0: Dynamic size, 1+: Fixed byte count
                    unsigned: false, // Signed by default
                },
                {
                    name: "multipleIntegers",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "int",
                        size: 0, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                        unsigned: false, // Signed by default
                    },
                },
                {
                    name: "aFloat",
                    type: "float",
                    precision: 4, // Fixed byte count, 4 by default
                    unsigned: false, // Signed by default // TODO Add unsigned
                },
                {
                    name: "random",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "range",
                        min: 0, // Smallest possible value, 1 by default
                        max: 1, // Largest possible value, 1 by default
                        precision: 4, // Fixed byte count, 4 by default
                    },
                },
                {
                    name: "someBools",
                    type: "list",
                    length: 0, // 0: Dynamic length, 1+: Fixed length
                    content: {
                        type: "bool",
                    },
                },
                {
                    name: "firstBool",
                    type: "bool",
                },
                {
                    name: "unused",
                    type: "int",
                    size: 2, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                    unsigned: false, // Signed by default
                },
                {
                    name: "otherTable",
                    type: "table",
                    table: "Some Other Table",
                },
                {
                    name: "secondBool",
                    type: "bool",
                },
                {
                    name: "someText",
                    type: "string",
                },
                {
                    name: "something",
                    type: "binary",
                    length: 0, // 0: Dynamic length, 1+: Fixed byte count, Dynamic by default
                },
                {
                    name: "noType",
                    type: "table",
                    table: "Multiple Possible Types",
                },
                {
                    name: "someType",
                    type: "table",
                    table: "Multiple Possible Types",
                },
                {
                    name: "thirdBool",
                    type: "bool",
                },
                {
                    name: "optionalIntA",
                    type: "int",
                    optional: true, // false by default
                },
                {
                    name: "optionalIntB",
                    type: "int",
                    optional: true, // false by default
                },
                {
                    name: "aMap",
                    type: "map",
                    key: {
                        type: "int",
                        size: 0, // 0: Dynamic size, 1+: Fixed byte count
                        unsigned: false, // Signed by default
                    },
                    value: {
                        type: "string",
                    },
                    size: 0, // 0: Dynamic size, 1+: Fixed pair count
                },
                {
                    name: "logLevel",
                    type: "enum",
                    enum: "Log Level",
                },
            ],
        },
        {
            name: "Some Other Table",
            fields: [
                {
                    name: "test",
                    type: "int",
                    unsigned: true,
                },
                {
                    name: "doubledIntegers",
                    type: "list",
                    length: 9, // undefined: No list, 0: Dynamic length, 1+: Fixed entry count, None by default
                    content: {
                        type: "int",
                        size: 1, // 0: Dynamic size, 1+: Fixed byte count, Dynamic by default
                        unsigned: true, // Signed by default
                    },
                },
            ],
        },
        {
            name: "Multiple - Type A",
            fields: [
                {
                    name: "fieldA",
                    type: "int",
                },
            ],
        },
        {
            name: "Multiple - Type B",
            fields: [
                {
                    name: "fieldB",
                    type: "float",
                },
            ],
        },
        {
            name: "Multiple - Type C",
            fields: [
                {
                    name: "fieldC",
                    type: "binary",
                },
            ],
        },
        {
            name: "Optional Integers",
            fields: [
                {
                    name: "fieldA",
                    type: "int",
                    optional: true,
                },
                {
                    name: "fieldB",
                    type: "int",
                    optional: true,
                },
                {
                    name: "fieldC",
                    type: "int",
                    optional: true,
                },
            ],
        },
        {
            name: "Optional Booleans",
            fields: [
                {
                    name: "fieldA",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "fieldB",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "fieldC",
                    type: "bool",
                    optional: true,
                },
            ],
        },
    ],
    main: {
        type: "table",
        table: "Main Table",
    },
};
let exampleObject = {
    anInteger: 5,
    multipleIntegers: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
    aFloat: /*Math.PI*/3,
    random: Array.from({length: 8}, /*Math.random*/() => 0),
    someBools: [1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0].map(Boolean),
    firstBool: true,
    otherTable: {
        test: 16,
        doubledIntegers: [11, 22, 33, 44, 55, 66, 77, 88, 99],
    },
    secondBool: false,
    someText: "Lorem Ipsum",
    something: new Uint8Array([12, 15]),
    noType: {
        type: "none",
    },
    someType: {
        type: "typeB",
        fieldB: 123.456,
    },
    thirdBool: true,
    optionalIntA: 64,
    aMap: {
        1: "Lorem",
        16: "Ipsum",
        128: "Dolor",
        512: "Amet",
        16384: "Sit",
    },
    logLevel: "Error",
};
let expectedObject = {
    anInteger: 5,
    multipleIntegers: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
    aFloat: /*Math.PI*/3,
    random: Array.from({length: 8}, /*Math.random*/() => 0),
    someBools: [1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0].map(Boolean),
    firstBool: true,
    otherTable: {
        test: 16,
        doubledIntegers: [11, 22, 33, 44, 55, 66, 77, 88, 99],
    },
    secondBool: false,
    someText: "Lorem Ipsum",
    something: new Uint8Array([12, 15]),
    noType: {
        type: "none",
    },
    someType: {
        type: "typeB",
        fieldB: 123.456,
    },
    thirdBool: true,
    optionalIntA: 64,
    aMap: {
        1: "Lorem",
        16: "Ipsum",
        128: "Dolor",
        512: "Amet",
        16384: "Sit",
    },
    logLevel: "Error",
};

/*(() => {
    let toHex = array => [...array].map(n => (+n).toString(16).toUpperCase().padStart(2, "0")).join("");
    let compareObjects = (a, b) => {
        if (a === b) {
            return true;
        } else if (!a || !b || typeof a != "object" || typeof b != "object" || a.prototype != b.prototype) {
            console.log("Not equal:", a, b);
            return false;
        } else {
            let keysA = Object.keys(a);
            let keysB = Object.keys(b);
            if (keysA.length != keysB.length) {
                console.log("Different key counts:", a, b);
                return false;
            }
            for (let key of keysA) {
                if (!keysB.includes(key) || !compareObjects(a[key], b[key])) {
                    console.log(`Different values for ["${key}"]:`, a, b);
                    return false;
                }
            }
        }
        return true;
    };

    let binary = antica.SDBF.toBinary(exampleObject, exampleWriteFormat);
    let result = antica.SDBF.fromBinary(binary, exampleReadFormat);
    if (compareObjects(result, expectedObject)) {
        console.log("Working");
    } else {
        console.log("Broken");
        console.log(result);
    }
})();*/

/*(() => {
    let toHex = array => [...array].map(n => (+n).toString(16).toUpperCase().padStart(2, "0")).join("");
    if (JSON.stringify(exampleObject) == JSON.stringify(antica.SDBF.fromBinary(antica.SDBF.toBinary(exampleObject, testFormat), testFormat))) {
        console.log(`JSON Length: ${JSON.stringify(exampleObject)?.length}`);
        console.log(`SDBF Length: ${antica.SDBF.toBinary(exampleObject, testFormat).length}`);
    } else {
        console.error("Not working!");
    }
    // console.log(toHex([...antica.SDBF.toBinary(exampleObject, testFormat)].slice(6)));
})();*/
/*(() => {
    if (JSON.stringify(exampleObject) == JSON.stringify(antica.Fobon.fromBinary(antica.Fobon.toBinary(exampleObject, defaultFormat), defaultFormat))) {
        console.log(`JSON Length: ${JSON.stringify(exampleObject).length}`);
        console.log(`Fobon Length: ${antica.Fobon.toBinary(exampleObject, defaultFormat).length}`);
    } else {
        console.error("Not working!");
        console.log(antica.Fobon.fromBinary(antica.Fobon.toBinary(exampleObject, defaultFormat), defaultFormat));
    }
})();*/
/*(() => {
    let exampleFobon = antica.Fobon.toBinary(exampleObject, exampleWriteFormat);
    let exampleOutputObject = antica.Fobon.fromBinary(exampleFobon, exampleWriteFormat);
    console.log(`Small Example:\nFobon: ${exampleFobon.length}\nFoton: ${foton.stringify(exampleObject).length}\nJson: ${JSON.stringify(exampleObject).length}`);
    console.log(exampleOutputObject);
})();*/
