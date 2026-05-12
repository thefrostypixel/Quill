let layout = {};

layout.getTextSize = (style, text) => {
    if (!layout.testingContext2D) {
        let canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.setAttribute("style", "font-optical-sizing: none;");
        layout.testingContext2D = canvas.getContext("2d");
    }
    if (!style.fontWeight || style.fontWeight % 100 == 0 || CSS.supports("font-variation-settings", "normal")) {
        layout.testingContext2D.font = `${style.italic ? "italic" : "normal"} ${style.fontWeight || 400} 12px "${style.fontFamily || "Inter"}"`;
        let measurements = layout.testingContext2D.measureText(text);
        return {
            w: measurements.width * style.textSize / 12,
            h: (measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent) * style.textSize / 12,
            ascent: measurements.fontBoundingBoxAscent * style.textSize / 12,
            descent: measurements.fontBoundingBoxDescent * style.textSize / 12,
        };
    } else {
        let lower = layout.getTextSize(Object.assign({}, style, {fontWeight: Math.floor(style.fontWeight / 100) * 100}), text);
        let upper = layout.getTextSize(Object.assign({}, style, {fontWeight: Math.ceil(style.fontWeight / 100) * 100}), text);
        return Object.fromEntries(Object.keys(lower).map(key => [key, lower[key] + (upper[key] - lower[key]) * (style.fontWeight / 100 - Math.floor(style.fontWeight / 100))]));
    }
};

layout.boxToObstacles = box => {
    let x = box.x - box.space;
    let y = box.y - box.space;
    let w = box.data.w + box.space * 2;
    let h = box.data.h + box.space * 2;
    let r = box.tightFlow ? Math.min(box.cornerRadius + box.space, w / 2, h / 2) : 0;
    if (r) {
        return {
            type: "compound",
            shapes: [
                {type: "polygon", points: [{x: x + r, y}, {x: x + w - r, y}, {x: x + w, y: y + r}, {x: x + w, y: y + h - r}, {x: x + w - r, y: y + h}, {x: x + r, y: y + h}, {x, y: y + h - r}, {x, y: y + r}]},
                {type: "circle", x: x + r, y: y + r, r},
                {type: "circle", x: x + w - r, y: y + r, r},
                {type: "circle", x: x + w - r, y: y + h - r, r},
                {type: "circle", x: x + r, y: y + h - r, r},
            ],
            x, y, w, h,
        };
    } else {
        return {type: "polygon", points: [{x, y}, {x: x + w, y}, {x: x + w, y: y + h}, {x, y: y + h}]};
    }
};
layout.objToObstacles = obj => {
    if (obj.data.type == "box" || obj.data.type == "textBox") {
        return [layout.boxToObstacles(obj)];
    }
    return [];
};

layout.inPolygon = (p, poly) => {
    let inside = false;
    for (let i = 0; i + 1 < poly.length; i++) {
        inside = poly[i].y > p.y != poly[i + 1].y > p.y && p.x < (poly[i + 1].x - poly[i].x) * (p.y - poly[i].y) / (poly[i + 1].y - poly[i].y) + poly[i].x ? !inside : inside;
    }
    return inside;
};
layout.lineIntersection = (l1, l2) => {
    let d = (l2.p2.y - l2.p1.y) * (l1.p2.x - l1.p1.x) - (l2.p2.x - l2.p1.x) * (l1.p2.y - l1.p1.y);
    if (!d) {
        return;
    }
    let a = ((l2.p2.x - l2.p1.x) * (l1.p1.y - l2.p1.y) - (l2.p2.y - l2.p1.y) * (l1.p1.x - l2.p1.x)) / d;
    let b = ((l1.p2.x - l1.p1.x) * (l1.p1.y - l2.p1.y) - (l1.p2.y - l1.p1.y) * (l1.p1.x - l2.p1.x)) / d;
    if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
        return {x: l1.p1.x + a * (l1.p2.x - l1.p1.x), y: l1.p1.y + a * (l1.p2.y - l1.p1.y)};
    }
};
layout.polygonIntersections = (p1, p2) => {
    let intersections = {};
    p1.forEach(l1 => p2.forEach(l2 => {
        let collinear = l1.p1.x == l1.p2.x && l2.p1.x == l2.p2.x && l1.p1.x == l2.p1.x ? "vertical" : l1.p1.y == l1.p2.y && l2.p1.y == l2.p2.y && l1.p1.y == l2.p1.y ? "horizontal" : undefined;
        if (collinear == "vertical") {
            let a = Math.max(Math.min(l1.p1.y, l1.p2.y), Math.min(l2.p1.y, l2.p2.y));
            let b = Math.min(Math.max(l1.p1.y, l1.p2.y), Math.max(l2.p1.y, l2.p2.y));
            if (a <= b) {
                intersections[`${l1.p1.x} ${a}`] = {x: l1.p1.x, y: a};
                intersections[`${l1.p1.x} ${b}`] = {x: l1.p1.x, y: b};
            }
        } else if (collinear == "horizontal") {
            let a = Math.max(Math.min(l1.p1.x, l1.p2.x), Math.min(l2.p1.x, l2.p2.x));
            let b = Math.min(Math.max(l1.p1.x, l1.p2.x), Math.max(l2.p1.x, l2.p2.x));
            if (a <= b) {
                intersections[`${a} ${l1.p1.y}`] = {x: a, y: l1.p1.y};
                intersections[`${b} ${l1.p1.y}`] = {x: b, y: l1.p1.y};
            }
        } else {
            let p = layout.lineIntersection(l1, l2);
            if (p) {
                intersections[`${p.x} ${p.y}`] = p;
            }
        }
    }));
    return Object.values(intersections);
};
layout.boxIntersectsPolygon = (box, p) => {
    let boxPoly = [
        {x: box.x, y: box.y},
        {x: box.x2, y: box.y},
        {x: box.x2, y: box.y2},
        {x: box.x, y: box.y2}
    ];
    let result = {blocked: false, x: box.x, x2: box.x2, y: box.y, y2: box.y2};
    let complexLogic = (p1, p2, r) => {
        let lineDir = p1.y < p2.y == p1.x < p2.x;
        r.x = Math.max(r.x, p1.y == p2.y || (p1.x > p2.x ? p1 : p2).y > box.y && (p1.x > p2.x ? p1 : p2).y < box.y2 ? (p1.x > p2.x ? p1 : p2).x : p1.x + (p2.x - p1.x) / (p2.y - p1.y) * ((lineDir ? box.y2 : box.y) - p1.y));
        r.x2 = Math.min(r.x2, p1.y == p2.y || (p1.x < p2.x ? p1 : p2).y > box.y && (p1.x < p2.x ? p1 : p2).y < box.y2 ? (p1.x < p2.x ? p1 : p2).x : p1.x + (p2.x - p1.x) / (p2.y - p1.y) * ((lineDir ? box.y : box.y2) - p1.y));
        r.y = Math.max(r.y, p1.x == p2.x || (p1.y > p2.y ? p1 : p2).x > box.x && (p1.y > p2.y ? p1 : p2).x < box.x2 ? (p1.y > p2.y ? p1 : p2).y : p1.y + (p2.y - p1.y) / (p2.x - p1.x) * ((lineDir ? box.x2 : box.x) - p1.x));
        r.y2 = Math.min(r.y2, p1.x == p2.x || (p1.y < p2.y ? p1 : p2).x > box.x && (p1.y < p2.y ? p1 : p2).x < box.x2 ? (p1.y < p2.y ? p1 : p2).y : p1.y + (p2.y - p1.y) / (p2.x - p1.x) * ((lineDir ? box.x : box.x2) - p1.x));
        return r;
    };
    for (let i = 0; i < p.length; i++) {
        let p1 = p[i];
        let p2 = p[(i + 1) % p.length];
        for (let j = 0; j < boxPoly.length; j++) {
            if (layout.lineIntersection({p1, p2}, {p1: boxPoly[j], p2: boxPoly[(j + 1) % boxPoly.length]})) {
                complexLogic(p1, p2, result);
                result.blocked = true;
                break;
            }
        }
    }
    if (!result.blocked && layout.inPolygon(boxPoly[0], p)) {
        result = {blocked: true, x: Infinity, x2: -Infinity, y: Infinity, y2: -Infinity};
        for (let i = 0; i < p.length; i++) {
            let closest = complexLogic(p[i], p[(i + 1) % p.length], {x: -Infinity, x2: Infinity, y: -Infinity, y2: Infinity});
            result.x = (closest.x > box.x2 && closest.x < result.x ? closest : result).x;
            result.x2 = (closest.x2 < box.x && closest.x2 > result.x2 ? closest : result).x2;
            result.y = (closest.y > box.y2 && closest.y < result.y ? closest : result).y;
            result.y2 = (closest.y2 < box.y && closest.y2 > result.y2 ? closest : result).y2;
        }
    }
    if (result.blocked) {
        return result;
    }
};
layout.objectIntersectsObstacles = (obj, obstacles) => {
    for (let obstacle of obstacles) {
        let objLeft = obj.x;
        let objRight = obj.x2 ?? objLeft + obj.w;
        let objTop = obj.y;
        let objBottom = obj.y2 ?? objTop + (obj.h ?? obj.ascent + obj.descent);
        let obstacleLeft = obstacle.x;
        let obstacleRight = obstacle.x2 ?? obstacleLeft + obstacle.w;
        let obstacleTop = obstacle.y;
        let obstacleBottom = obstacle.y2 ?? obstacleTop + (obstacle.h ?? obstacle.ascent + obstacle.descent);
        if (objRight > obstacle.x && objLeft < (obstacle.x2 ?? obstacle.x + obstacle.w) && objBottom > obstacle.y && objTop < (obstacle.y2 ?? obstacle.y + obstacle.h)) {
            if (obstacle.type == "polygon") {
                let result = layout.boxIntersectsPolygon({x: objLeft, x2: objRight, y: objTop, y2: objBottom}, obstacle.points);
                if (result) {
                    result.blocked = obstacle;
                    return result;
                }
            } else {
                return {
                    blocked: obstacle,
                    x: obstacleRight,
                    x2: obstacleLeft,
                    y: obstacleBottom,
                    y2: obstacleTop,
                };
            }
        }
    }
};
layout.offsetObstaclesIntersection = (obstacles, w) => {
    let intersections = [];
    for (let obstacle of obstacles) {
        if (obstacle.type == "polygon") {
            let lines = [];
            for (let i = 0; i < obstacle.points.length; i++) {
                lines.push({p1: obstacle.points[i], p2: obstacle.points[(i + 1) % obstacle.points.length]});
            }
            intersections.push(...layout.polygonIntersections(lines, lines.slice().map(line => ({p1: {x: line.p1.x - w, y: line.p1.y}, p2: {x: line.p2.x - w, y: line.p2.y}}))));
        }
    }
    return intersections;
};
layout.findUnobstructedTop = (obj, y, x, x2, obstacles) => {
    if (!obstacles.length) {
        return {x, y};
    }
    let intersections = layout.offsetObstaclesIntersection(obstacles, obj.w);
    obstacles.forEach(obstacle => intersections.push({x, y: obstacle.points.reduce((y2, point) => Math.max(point.y, y2), -Infinity)}));
    for (let intersection of intersections.filter(intersection => intersection.y > y).sort((a, b) => a.y - b.y)) {
        if (!layout.objectIntersectsObstacles(obj, obstacles)) {
            return intersection.y;
        }
    }
};

layout.paragraph = (flowingDoc, pages, page, left, right, top, pageTop, bottom, pageWrap, newLineAtEnd, paragraph) => {
    let paragraphStyle = Object.assign({}, flowingDoc.paragraphStyles[paragraph.styleName], paragraph.style);
    let w = right - left;

    // TODO 1. Convert paragraph to list of fragments
    let fragments = [];
    let textFragmentParts;
    let textFragmentState; // 0: alphanumeric, 1: symbols, 2: space-likes, 3: done
    let finalizeText = () => {
        if (textFragmentParts) {
            let fragment = {
                shape: {}, // TODO Calculate shape, advance width and stuff for contents.
                advance: 0,
                content: textFragmentParts,
            }
            fragments.push(fragment);
            textFragmentParts = undefined;
            textFragmentState = undefined;
        }
    };
    paragraph.contents.forEach(content => {
        if (content.type == "text") {
            let style = Object.assign({}, paragraphStyle, flowingDoc.sectionStyles[content.styleName], content.style);
            let regexes = [/^[\p{L}\p{M}]*/u, /^[^\p{L}\p{M}\s]*/u, /^\s*/u];
            let remaining = content.text;
            while (remaining) {
                textFragmentParts ??= [];
                textFragmentState ??= 0;
                let text = "";
                while (textFragmentState < 3 && remaining) {
                    let added = remaining.match(regexes[textFragmentState])[0];
                    text += added;
                    remaining = remaining.slice(added.length);
                    if (remaining) {
                        textFragmentState++;
                    }
                }
                if (text) {
                    textFragmentParts.push({type: "text", style, text});
                }
                if (textFragmentState == 3) {
                    finalizeText();
                }
            }
        } else {
            finalizeText();
            // TODO Calculate layout for object.
            let shape = layout.boxToObstacles(object);
            fragments.push({
                shape,
                advance: shape.w,
                contents: [content],
            });
        }
    });
    finalizeText();

    // console.log(fragments);

    // 1. Convert paragraph to list of words
    let words = [];
    let newWord = () => ({
        w: 0,
        ascent: 0,
        descent: 0,
        contents: [],
    });
    let word = newWord();
    paragraph.contents.forEach(content => {
        if (content == `${content}` || content.type == "text") {
            let style = content instanceof Object ? Object.assign({}, paragraphStyle, flowingDoc.sectionStyles[content.styleName], content.style) : paragraphStyle;
            let texts = (content instanceof Object ? content.text : content).split(/(?=\s)|(?<=\s)/);
            texts.forEach(text => {
                if (text) {
                    if ((text == " " || text == "\n") && word.contents.length) {
                        words.push(word);
                        word = newWord();
                    }
                    let textSize = layout.getTextSize(style, text);
                    word.contents.push({
                        type: "text",
                        style,
                        text,
                        w: textSize.w,
                        ascent: textSize.ascent,
                        descent: textSize.descent,
                    });
                    word.w += textSize.w;
                    word.ascent = Math.max(word.ascent, textSize.ascent);
                    word.descent = Math.max(word.descent, textSize.descent);
                    if (text == " " || text == "\n") {
                        word[text == " " ? "space" : "newLine"] = true;
                        words.push(word);
                        word = newWord();
                    }
                }
            });
        }
    });
    if (word.contents.length || !words.length) {
        words.push(word);
    }
    if (newLineAtEnd) {
        let textSize = layout.getTextSize(paragraphStyle, "\n");
        words.push({
            w: textSize.w,
            ascent: textSize.ascent,
            descent: textSize.descent,
            contents: [{
                type: "text",
                style: paragraphStyle,
                text: "\n",
                w: textSize.w,
                ascent: textSize.ascent,
                descent: textSize.descent,
            }],
            newLine: true,
        });
    }

    // 2. Split words that are too long into letters
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word.w > w) {
            words.splice(i--, 1);
            for (let j = 0; j < word.contents.length; j++) {
                if (word.contents[j].type == "text") { // TODO Try splitting after dashes and similar characters first
                    for (let k = 0; k < word.contents[j].text.length; k++) {
                        let textSize = layout.getTextSize(word.contents[j].style, word.contents[j].text[k]);
                        words.splice(++i, 0, {
                            w: textSize.w,
                            ascent: textSize.ascent,
                            descent: textSize.descent,
                            contents: [{
                                type: "text",
                                style: word.contents[j].style,
                                text: word.contents[j].text[k],
                                w: textSize.w,
                                ascent: textSize.ascent,
                                descent: textSize.descent,
                                space: word.contents[j].text[k] == " ",
                                newLine: word.contents[j].text[k] == "\n",
                            }],
                        });
                    }
                } else {
                    words.splice(++i, 0, {
                        w: word.contents[j].w,
                        ascent: word.contents[j].ascent,
                        descent: word.contents[j].descent,
                        contents: [word.contents[j]],
                    });
                }
            }
        }
    }

    // 3. Add the words into lines
    let lines = [];
    let newLine = y => ({
        x: left,
        x2: left,
        y,
        w: 0,
        ascent: 0,
        descent: 0,
        contents: [],
    });
    // let copyLine = line => ({...line, contents: line.contents.slice().map(word => ({...word, contents: word.contents.slice().map(content => ({...content}))}))});
    let line = newLine(top + paragraphStyle.aboveParagraphSpace * (top > pageTop));
    let flowLines = (words, startNewLines = true) => {
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let result = !word.space && !word.newLine;
            while (result) {
                result = layout.objectIntersectsObstacles(Object.assign({}, word, {x: line.x2, y: line.y + Math.max(line.ascent - word.ascent, 0)}), pages[page].obstacles);
                if (result) {
                    // TODO Check every part of the word individually.
                    line.x2 = result.x + 1e-8;
                    if (line.x2 - line.x + word.w > w) {
                        break;
                    }
                }
            }
            if (word.ascent > line.ascent) { // TODO Check if the word even fits horizontally first
                let wouldBlock; // TODO Do a check for the whole line first as there's no need to check every (sub-)word if the whole line doesn't intersect.
                for (let j = 0; j < line.contents.length; j++) { // TODO Maybe skip spaces
                    let result = layout.objectIntersectsObstacles(Object.assign({y: line.y + word.ascent - line.contents[j].ascent}, line.contents[j]), pages[line.contents[j].page].obstacles);
                    if (result) {
                        (wouldBlock = result).index = j;
                        break;
                    }
                }
                if (wouldBlock) {
                    let wordsToReflow = [...line.contents, word];
                    let oldLine = line;
                    line = newLine(line.y);
                    line.ascent = word.ascent;
                    flowLines(wordsToReflow, false);
                    if (line.contents.length == wordsToReflow.length) {
                        continue;
                    } else {
                        if (!startNewLines) {
                            return oldLine;
                        }
                        lines.push(oldLine);
                        line = newLine(oldLine.y + (oldLine.ascent + oldLine.descent) * paragraphStyle.lineSpace);
                    }
                }
            }
            if ((line.x2 - line.x + word.w <= w || line.x == line.x2 || word.space) && !word.newLine) {
                let word2 = Object.assign({}, word, {page, x: line.x2});
                line.contents.push(word2);
                line.x2 = word2.x + word2.w;
                line.ascent = Math.max(line.ascent, word.ascent);
                line.descent = Math.max(line.descent, word.descent);
            } else if (!line.contents.length) {
                line.y = layout.findUnobstructedTop(word, line.y, left, right, pages[page].obstacles) + 1e-8;
                line.x2 = line.x;
                i--;
            } else {
                if (word.newLine) {
                    let word2 = Object.assign({}, word, {page, x: line.x2});
                    line.contents.push(word2);
                    line.x2 = word2.x + word2.w;
                    line.ascent = Math.max(line.ascent, word.ascent);
                    line.descent = Math.max(line.descent, word.descent);
                }
                if (!startNewLines) {
                    return line;
                }
                lines.push(line);
                line = newLine(line.y + (line.ascent + line.descent) * paragraphStyle.lineSpace);
                if (!word.newLine) {
                    i--;
                }
            }
        }
        if (line.contents.length) {
            lines.push(line);
        }
    };
    flowLines(words);
    // console.log(paragraph.contents.map(a => a.text || a).join("").slice(0, 120), lines);

    // 4. Convert contents of lines to fixedObjs (and move/stretch the lines to fit text alignment)
    let fixedObjs = [];
    lines.forEach((line, lineIndex) => {
        line.contents.forEach(word => {
            let x = word.x;
            word.contents.forEach(obj => {
                if (obj.type == "text") {
                    let fixedObj = {
                        type: "text",
                        page,
                        line: lineIndex,
                        x: x,
                        y: line.y + line.ascent - obj.ascent,
                        w: obj.w,
                        style: obj.style,
                        text: obj.text,
                        ascent: obj.ascent,
                        descent: obj.descent,
                    };
                    // if (layout.obstacleCheck(fixedObj, pages).blocked) {
                    //     fixedObj.style = Object.assign({}, fixedObj.style, {italic: true});
                    // }
                    fixedObjs.push(fixedObj);
                    /*fixedObjs.push({
                        type: "text",
                        style: obj.style,
                        text: obj.text,
                        x: x,
                        y: line.y + line.ascent - obj.ascent,
                        w: obj.w,
                        ascent: obj.ascent,
                        descent: obj.descent,
                    });*/
                    x += obj.w;
                }
            });
        });
    });

    // 5. Rejoin texts
    for (let i = 0; i < fixedObjs.length; i++) {
        if (fixedObjs[i + 1] && fixedObjs[i].type == "text" && fixedObjs[i + 1].type == "text" && !fixedObjs[i].newLine && !fixedObjs[i + 1].newLine) {
            if (fixedObjs[i].style == fixedObjs[i + 1].style && fixedObjs[i].y == fixedObjs[i + 1].y && Math.abs(fixedObjs[i].x + fixedObjs[i].w - fixedObjs[i + 1].x) < 1e-8) {
                fixedObjs[i].text += fixedObjs[i + 1].text;
                fixedObjs[i].w += fixedObjs[i + 1].w;
                fixedObjs.splice(i-- + 1, 1);
            }
        }
    }

    return {
        objs: {
            [page]: fixedObjs/*TODO Multiple pages*/
        },
        page,
        bottom: lines[lines.length - 1].y + (lines[lines.length - 1].ascent + lines[lines.length - 1].descent) * paragraphStyle.lineSpace + paragraphStyle.belowParagraphSpace,
    };
};

layout.document = flowing => {
    let fixed = [];
    flowing.sections.forEach((section, sectionIndex) => {
        let pages = [];
        let minPageCount = count => {
            while (pages.length <= count) {
                pages.push({
                    w: section.pageW,
                    h: section.pageH,
                    section: sectionIndex,
                    objs: [],
                    obstacles: [],
                });
            }
        };
        minPageCount(1);

        section.fixed.forEach((flowingObj, i) => {
            minPageCount(flowingObj.page);
            // TODO Calculate layout of stuff text boxes.
            pages[flowingObj.page].objs.push(Object.assign({fixed: i}, flowingObj)); // TODO What's "fixed" used for?
            if (flowingObj.pushFlowing) {
                pages[flowingObj.page].obstacles.push(...layout.objToObstacles(flowingObj));
            }
        });

        let page = 0;
        let top = section.marginTop;
        section.paragraphs.forEach((paragraph, paragraphIndex) => {
            let fixedParagraph = layout.paragraph(flowing, pages, page, section.marginLeft, section.pageW - section.marginRight, top, section.marginTop, section.pageH - section.marginBottom, true, paragraphIndex + 1 < section.paragraphs.length, paragraph);
            minPageCount(fixedParagraph.page);
            for (let pageIndex in fixedParagraph.objs) {
                pages[pageIndex].objs.push(...fixedParagraph.objs[pageIndex]);
            }
            page = fixedParagraph.page;
            top = fixedParagraph.bottom;
        });

        // pages.forEach(page => delete page.obstacles);
        fixed.push(...pages);
    });
    // console.log(fixed);
    return fixed;
};
