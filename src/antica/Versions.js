/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

/*
This version system keeps the general style of versions like 1.0, 1.1 and 1.2.3, but it also adds pre-versions and descriptive names.
A version can contain any arbitrary text, which will be ignored. If the text is in between two numbers, it will be treated as a dot, but using this is not recommended.
For example, the following versions would all be considered equal:
- 1
- v1.0
- 1.0.0
- 1stVersion (not recommended as it's necessary long)
- version1.patch0
- release1fix0 (not recommended as there is no dot before "fix")
In addition, a colon can be used to signal that this version comes before one specified declared to the left of the colon, with the part to the right of the colon counting normally.
Fox example, this is a list of versions in order:
- 1.0:1
- 1.0:1.2
- 1.0:2
- 1.0
- 1.1:pre1:dev1
- 1.1:pre1:dev2
- 1.1:pre1
- 1.1
In constraints, a plus (+) can be used in ranges to refer to a theoretical infinitieth version, so for example 1.5+ would mean 1.5.∞.
Versions may not contain dashes (-), diamond brackets (< and >), question marks (?) and exclamation marks (!) as they are used for constraints.
*/
/*
Constraints:
All versions (should only be used when there are no constraints): *
Versions A, B and C, but not ones in between: A,B,C
Versions A to B: A-B
Versions A (excluded) to B: A>-B
Versions A to B (excluded): A-<B
Versions A (excluded) to B (excluded): A>-<B
All versions up to A (excluded): -<A
Potentially versions after A: A?
Versions A to B and potentially later: A-B?
Exclude version A even if another part of the constraint includes it: !A
Exclude versions A to B even if another part of the constraint includes them: !A-B
*/

window.antica = window.antica || {};

globalThis.Versions = {
    parse: (version = "") => (version
        .replace(/[+∞].*/gus, ".∞") // Replace plus or infinity with dot infinity.
        .replace(/(?:^|[^\d:∞])+/gu, ".") // Add leading dot and remove everything besides numbers, dots, colons and infinity.
        .replace(/(?<=:)\.|\.(?=:|$)/gu, "") // Remove unwanted dots before and after colons and at the end.
        .replace(/(?<=^|\D)0+(?=\d)/gu, "") // Remove unnecessary trailing zeros from numbers.
        .replace(/(?<=\d)(?:.0+)+(?=:|$)/gu, "") // Remove unnecessary trailing dot zeros.
        || ".0").split(/(?<!^)(?=[.:])/gu).map(part => ({type: part[0] == "." ? "post" : "pre", num: +part.slice(1).replace("∞", "Infinity")})),
    compare: (a, b) => {
        [a, b] = [a, b].map(v => v instanceof Object ? v : Versions.parse(v));
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            if ((!a[i] || a[i].type == "pre") && (!b[i] || b[i].type == "post")) {
                return -1;
            } else if ((!a[i] || a[i].type == "post") && (!b[i] || b[i].type == "pre")) {
                return 1;
            } else if (a[i].num - b[i].num) {
                return Math.sign(a[i].num - b[i].num);
            }
        }
        return 0;
    },
    match: (versions = [], constraints = [], preferSafe = true) => {
        versions = [versions].flat(Infinity).sort(versions.compare).reverse();
        constraints = [constraints].flat(Infinity).map(constraint => constraint
            // TODO Handle asterisk
            .replace(/[\s,]+|(?<=^)/gu, ",") // Add leading command, replace spaces with commas and remove duplicate commas.
            .replace(/-+/gu, "-") // Remove unwanted dashes in include-include ranges.
            .replace(/(?=-*>)[>-]+/gu, ">-") // Remove unwanted dashes and closing diamond brackets in exclude-include ranges.
            .replace(/(?=-*<)[<-]+/gu, "-<") // Remove unwanted dashes and opening diamond brackets in include-exclude ranges.
            .replace(/(?=[>-]*<)(?=[<-]*>)[<>-]+/gu, ">-<") // Remove unwanted dashes and diamond brackets in exclude-exclude ranges.
            .replace(/(?=,*!)[,!]+/gu, "!") // Remove unwanted commas and exclamation marks.
            .replace(/(?=,*\?)[,?]+/gu, "?") // Remove unwanted commas and question marks.
            .replace(/,*$/gu, "") // Remove trailing commas.
            // TODO Fix exclamation marks and exclamation marks that make no sense.
            .replace(/[,!]+$/gu, "") // Fix trailing commas and exclamation marks.
            .replace(/(?<=([,!])(?:[^,!<>-]+[<>-]+)+)([^,!<>-]+)(?=[<>-]+)/gu, "$2$1$2") // Separate repeated ranges (A-B-C to A-B,C-D).
        );
        let prohibited = [];
        let requirements = [];
        constraints.forEach(constraint => {
            let requirement = [];
            constraint.split(/(?<!^)(?=[,!])/gu).map(part => {
                if (part.indexOf("*") > -1) {
                    (part[0] == "!" ? prohibited : requirement).push({
                        start: [{type: "pre", num: -1}],
                        end: [{type: "post", num: Infinity}],
                    });
                } else {
                    let parts = part.match(/.([^!?<>-]*)(?:[<>-]+([^\n!?<>-]*))?/u);
                    let start = parts[1] ? versions.parse(parts[1]) : [{type: "pre", num: -1}];
                    (part[0] == "!" ? prohibited : requirement).push({
                        start,
                        end: part.indexOf("-") < 0 ? start : parts[2] ? versions.parse(parts[2]) : [{type: "post", num: Infinity}],
                        startIncluded: part.indexOf(">") < 0,
                        endIncluded: part.indexOf("<") < 0,
                        furtherUnsafelyIncluded: part.indexOf("?") > -1,
                    });
                }
            });
            if (requirement.length) {
                requirements.push(requirement);
            }
        });
        let unsafe;
        for (let version of versions) {
            if (prohibited.some(option => versions.compare(option.start, version) < option.startIncluded && versions.compare(version, option.end) < option.endIncluded)) {
                continue;
            }
            let quality = Math.min(2, ...requirements.map(requirement => Math.max(0, ...requirement.map(option => versions.compare(option.start, version) < option.startIncluded ? (versions.compare(version, option.end) < option.endIncluded ? 2 : option.furtherUnsafelyIncluded) : 0))));
            if (quality > preferSafe) {
                return version;
            } else if (quality) {
                unsafe ??= version;
            }
        }
        return unsafe;
    },
};

/*console.log(Versions.match(["1.1", "1.5", "1.7", "1.9", "1.8"], [`
,1.0
,1.1-1.2
,1.3>-<1.4
!1.5
,1.6-1.7?
!1.8>-
,1.9-<1.10
`, "1.7>-"]));*/
