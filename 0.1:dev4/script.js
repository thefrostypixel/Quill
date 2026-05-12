window.controls = new antica.Controls();

let translations = new antica.Translations([antica.cookies.lang, navigator.languages, "en-US"]);
translations.getActiveLangs().then(langs => antica.cookies.lang = langs[0]);
translations.attachToElement();

let styleToCss = style => `--font-family:${style.fontFamily};--font-size:${style.textSize};--font-weight:${style.fontWeight};--italic:${style.italic ? "italic" : "normal"};`;
let cssToStyle = css => {
    css = css.style && css.style.cssText || css;
    return {
        fontFamily: (css.split("--font-family:")[1] || "").split(";")[0].trim(),
        textSize: Number((css.split("--font-size:")[1] || "0").split(";")[0]),
        fontWeight: Number((css.split("--font-weight:")[1] || "0").split(";")[0]),
        italic: (css.split("--italic:")[1] || "").split(";")[0].trim() == "italic",
    };
};
let fixedToHtml = fixed => {
    let html = "";
    fixed.forEach(page => {
        html += `<page section="${page.section}" style="--page-w:${page.w};--page-h:${page.h};">`;
        page.objs.forEach(obj => {
            if (obj.type == "text") {
                html += `<span${obj.fixed == undefined ? "" : ` fixed="${obj.fixed}"`}${obj.line == undefined ? "" : ` line="${obj.line}"`} style="--x:${obj.x};--base-line:${obj.y + obj.ascent};--w:${obj.w};--ascent:${obj.ascent};--descent:${obj.descent};${styleToCss(obj.style)}">${obj.text}</span>`;
            } else if (obj.type == "box") {
                html += `<box${obj.fixed == undefined ? "" : ` fixed="${obj.fixed}"`} style="--x:${obj.x};--y:${obj.y};--w:${obj.w};--h:${obj.h};--corner-radius:${obj.cornerRadius};--background:#${obj.background};"></box>`;
            }
        });
        html += "<selection></selection></page>";
    });
    return html;
};

let atScreenPos = (x, y) => {
    let target = document.elementFromPoint(x, y);
    let doc = document.querySelector("doc");
    if (doc.contains(target) && doc != target) {
        let displayScale = Number(getComputedStyle(target).getPropertyValue("--display-scale").split("px")[0] || "1");

        let page = Array.from(doc.childNodes).findIndex(page => page.contains(target));
        let fixed = doc.childNodes[page] == target ? undefined : Array.from(doc.childNodes[page].childNodes).find(fixed => fixed.contains(target)).getAttribute("fixed");
        if (fixed != undefined) {
            fixed = Number(fixed);
        }

        let targetName = target.tagName.toLowerCase();
        if (targetName == "span") {
            let style = cssToStyle(target);
            style.fontSize *= displayScale;
            let closest = {i: 0, text: "", dist: Infinity};
            for (let i = 0; i < target.text.length; i++) {
                let dist = Math.abs(x - target.getBoundingClientRect().x - layout.getTextSize(style, target.text.slice(0, i)).w);
                if (dist < closest.dist) {
                    closest = {i, text: target.text.slice(0, i), dist};
                } else {
                    break;
                }
            }
            let index = 0;
            let children = Array.from(target.parentElement.children);
            for (let i = 0; i < children.length; i++) {
                if (children[i] == target) {
                    index += closest.i;
                    break;
                } else if (children[i].tagName.toLowerCase() == "span") {
                    index += children[i].text.length;
                }
            }
            return {
                text: true, // TODO If the target is text (main or in a text-block).
                fixed, // TODO If the target was a fixed object (or something inside a text-block), that object would somehow be referenced here.
                index, // TODO If the target is something flowing with text (or regular text), it's index will be here.
            };
        }
        return {
            text: false,
            fixed,
        };
    }
};
let findTextLocation = (sectionIndex, index, pageElements, preferNextStart = false) => {
    let countedChars = 0;
    for (let i = 0; i < pageElements[sectionIndex].length; i++) {
        // let elementFlowingIndex = 0;
        let elements = pageElements[sectionIndex][i].page.components;
        for (let j = 0; j < elements.length; j++) {
            if (!elements[j].hasAttribute("fixed")) {
                if (elements[j].tagName.toLowerCase() == "span") {
                    countedChars += elements[j].text.length;
                } else {
                    countedChars++;
                }
                if (countedChars > index || countedChars == index && !preferNextStart && !elements[j].text.endsWith("\n") && (j +1 == elements.length || elements[j].getAttribute("line") == elements[j + 1].getAttribute("line"))) {
                    return {
                        sectionIndex,
                        pageIndex: i,
                        element: elements[j],
                        elementIndex: j,
                        // elementFlowingIndex,
                        subIndex: elements[j].tagName.toLowerCase() == "span" ? elements[j].text.length + index - countedChars : undefined,
                    };
                }
                // elementFlowingIndex++;
            }
        }
    }
    return {};
};

let selection = {
    multi: true,
    text: true,
    textBlock: undefined,
    active: undefined,
    selection: undefined,
    selections: [],
};
let mergedSelections = () => {
    if (selection.text) {
        let selections = selection.selections.toReversed();
        for (let i = 0; i < selections.length; i++) {
            for (let j = i + 1; j < selections.length; j++) {
                let si = selections[i];
                let sj = selections[j];
                if (Math.min(si.start, si.end) <= Math.max(sj.start, sj.end) && Math.min(sj.start, sj.end) <= Math.max(si.start, si.end)) {
                    if (si.start == si.end) {
                        si.start = sj.start;
                        si.end = sj.end;
                    } else if (si.start > si.end) {
                        si.start = Math.max(si.start, sj.start, sj.end);
                        si.end = Math.min(si.end, sj.start, sj.end);
                    } else {
                        si.start = Math.min(si.start, sj.start, sj.end);
                        si.end = Math.max(si.end, sj.start, sj.end);
                    }
                    selections.splice(j--, 1);
                }
            }
        }
        return selections.reverse();
    }
    return selection.selections;
};
let updateShownSelection = () => {
    let displayScale = Number(getComputedStyle(document.querySelector("doc")).getPropertyValue("--display-scale").split("px")[0] || 1);
    let pageElements = [];
    Array.from(document.querySelector("doc").querySelectorAll("page")).forEach(page => (pageElements[page.getAttribute("section")] = pageElements[page.getAttribute("section")] || []).push({
        page,
        selectionContainer: page.querySelector("selection"),
        selectionHtml: "",
    }));
    pageElements.forEach(sectionElements => sectionElements.forEach(sectionElement => sectionElement.selectionContainer.innerHTML = ""));
    let selections = mergedSelections();
    if (selection.text) {
        for (let s of selections) {
            if (s.start != s.end) {
                let result1 = findTextLocation(0, Math.min(s.start, s.end), pageElements, true);
                let result2 = findTextLocation(0, Math.max(s.start, s.end), pageElements);
                for (let si = result1.sectionIndex; si <= result2.sectionIndex; si++) {
                    for (let pi = si > result1.sectionIndex ? 0 : result1.pageIndex; pi <= (si < result2.sectionIndex ? pageElements[si].length : result2.pageIndex); pi++) {
                        for (let ei = si > result1.sectionIndex || pi > result1.pageIndex ? 0 : result1.elementIndex; ei <= (si < result2.sectionIndex || pi < result2.pageIndex ? pageElements[si][pi].page.components.length : result2.elementIndex); ei++) {
                            let element = pageElements[si][pi].page.components[ei];
                            if (!element.hasAttribute("fixed")) {
                                let computedStyle = getComputedStyle(element);
                                let elementX = Number(computedStyle.getPropertyValue("--x"));
                                let elementY = Number(computedStyle.getPropertyValue("--y") || Number(computedStyle.getPropertyValue("--base-line")) - Number(computedStyle.getPropertyValue("--ascent")));
                                let start = si == result1.sectionIndex && pi == result1.pageIndex && ei == result1.elementIndex;
                                let end = si == result2.sectionIndex && pi == result2.pageIndex && ei == result2.elementIndex;
                                if (element.tagName.toLowerCase() == "span") {
                                    let style = (start || end) && cssToStyle(element);
                                    let textSize1 = start ? layout.getTextSize(style, element.text.slice(0, result1.subIndex)).w : 0;
                                    let textSize2 = end ? layout.getTextSize(style, element.text.slice(0, result2.subIndex)).w : Number(computedStyle.getPropertyValue("--w"));
                                    pageElements[si][pi].selectionHtml += `<box style="--x:${elementX + textSize1};--y:${elementY};--w:${textSize2 - textSize1};--h:${Number(computedStyle.getPropertyValue("--ascent")) + Number(computedStyle.getPropertyValue("--descent"))}"></box>`;
                                } else { // TODO Element
                                    pageElements[si][pi].selectionHtml += `<box style="--x:${elementX};--y:${elementY};--w:${element.getBoundingClientRect().width / displayScale};--h:${element.getBoundingClientRect().height / displayScale};"></box>`;
                                }
                            }
                        }
                    }
                }
            }

            // Cursor
            let result = findTextLocation(0, s.end, pageElements, s.end < s.start);
            if (result.subIndex == undefined) {
                // TODO Cursor after(?) element
            } else {
                let style = cssToStyle(result.element);
                let text = result.element.text.slice(0, result.subIndex);
                let textSize = layout.getTextSize(style, text);
                pageElements[0][result.pageIndex].selectionHtml += `<cursor style="--x:${(result.element.getBoundingClientRect().x - pageElements[0][0].page.getBoundingClientRect().x) / displayScale + textSize.w};--y:${(result.element.getBoundingClientRect().y - pageElements[0][0].page.getBoundingClientRect().y) / displayScale};--h:${textSize.h}"></cursor>`;
            }
        }
    } else {
    }
    pageElements.forEach(section => section.forEach(page => page.selectionContainer.innerHTML = page.selectionHtml));
};

function onPagePartiallyLoaded() {
    let start = performance.now();
    let fixed = layout.document(quillFileContents);
    console.log("Took", Math.round(performance.now() - start), "ms to calculate layout.");
    genInspector();
    document.querySelector("doc").innerHTML = fixedToHtml(fixed);
}
function onPageFullyLoaded() {
    document.querySelector("doc").addEventListener("mousedown", e => {
        let target = atScreenPos(e.clientX, e.clientY);
        if (target) {
            if (target.text) {
                if (!selection.text || selection.textBlock != target.fixed) {
                    selection.text = true;
                    selection.textBlock = target.fixed;
                    selection.selections = [];
                }
                if (controls.heldKey("Shift") && selection.selection) {
                    selection.active = selection.selection;
                    selection.active.end = target.index;
                    selection.selections = [selection.active];
                } else {
                    selection.active = selection.selection = {
                        text: true,
                        start: target.index,
                        end: target.index,
                    };
                    if (controls.heldShortcutKey() && selection.multi) {
                        selection.selections.push(selection.active);
                    } else {
                        selection.selections = [selection.active];
                    }
                }
                let onMove = e => {
                    let dragTarget = atScreenPos(e.clientX, e.clientY);
                    if (dragTarget && dragTarget.text && target.fixed == dragTarget.fixed) {
                        if (selection.active.end != dragTarget.index) {
                            selection.active.end = dragTarget.index;
                            updateShownSelection();
                        }
                    }
                };
                let onUp = e => {
                    selection.active = undefined;
                    selection.selection = (selection.selections = mergedSelections())[selection.selections.length - 1];
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onUp);
                    window.removeEventListener("blur", onUp);
                };
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
                window.addEventListener("blur", onUp);
                updateShownSelection();
            } else {
                if (selection.text) {
                    selection.text = false;
                    selection.textBlock = undefined;
                    selection.selections = [];
                }
                if (controls.heldShortcutKey() && selection.multi) {
                    let present = selection.selections.findIndex(present => present.fixed == target.fixed);
                    if (present < 0) {
                        selection.selections.push(selection.selection = target);
                    } else {
                        selection.selections.splice(present, 1);
                        selection.selection = selection.selections[selection.selections.length - 1];
                    }
                } else {
                    selection.selections = [selection.selection = target];
                }
                updateShownSelection();
            }
        }
    });
    let textInput = document.createElement("input");
    document.body.appendChild(textInput);
    textInput.style = "position: fixed; z-index: 100; left: calc(50vw - 100px); top: calc(50vh - 25px); width: 200px; height: 50px; border: 10px solid var(--button-disabled-background); border-radius: 20px; font-size: 20px;";

    let active = {
        text: "",
        start: 0,
        end: 0,
    };
    function changeSelection(start = 0, end = 0) {
        active.start = start;
        active.end = end;
        // console.log(`Selection changed to: ${active.start} - ${active.end}.${active.start == active.end ? "" : ` Selected: "${active.text.slice(active.start, active.end)}".`}`);
    }
    function addText(text = "", pos = 0) {
        active.text = active.text.slice(0, pos) + text + active.text.slice(pos);
        // console.log(`Text changed to: "${active.text}". Added: "${text}" at ${pos}.`);
        console.log(`Text changed to: "${active.text}".`);
    }
    function removeText(start = 0, end = 0) {
        active.text = active.text.slice(0, start) + active.text.slice(end);
        // console.log(`Text changed to: "${active.text}". Removed: ${start} - ${end}.`);
        console.log(`Text changed to: "${active.text}".`);
    }

    let current = {
        text: "",
        start: 0,
        end: 0,
    };
    textInput.onselectionchange = e => {
        if (current.start != textInput.selectionStart || current.end != textInput.selectionEnd) {
            current.start = textInput.selectionStart;
            current.end = textInput.selectionEnd;
            changeSelection(current.start, current.end);
        }
    };
    textInput.onbeforeinput = e => { // TODO historyUndo, historyRedo
        if (current.start != textInput.selectionStart || current.end != textInput.selectionEnd) {
            current.start = textInput.selectionStart;
            current.end = textInput.selectionEnd;
            changeSelection(current.start, current.end);
        }
        if (e.inputType.indexOf("insert") > -1) {
            if (current.start != current.end) {
                current.text = current.text.slice(0, current.start) + current.text.slice(current.end);
                removeText(current.start, current.end);
                current.end = current.start;
                changeSelection(current.start, current.end);
            }
            current.text = current.text.slice(0, current.start) + e.data + current.text.slice(current.end);
            addText(e.data, current.start);
            current.end = current.start += e.data.length;
            changeSelection(current.start, current.end);
        } else if (e.inputType.indexOf("delete") > -1) {
            if (current.start == current.end) {
                if (e.inputType == "deleteContentBackward" && current.start > 0) {
                    current.text = current.text.slice(0, current.start - 1) + current.text.slice(current.end);
                    removeText(current.start - 1, current.end);
                    current.end = current.start -= 1;
                    changeSelection(current.start, current.end);
                } else if (e.inputType == "deleteContentForward") {
                    current.text = current.text.slice(0, current.start) + current.text.slice(current.end + 1);
                    removeText(current.start, current.end + 1);
                }
            } else {
                current.text = current.text.slice(0, current.start) + current.text.slice(current.end);
                removeText(current.start, current.end);
                current.end = current.start;
                changeSelection(current.start, current.end);
            }
        }
    };
}

if (document.readyState != "loading") {
    onPagePartiallyLoaded();
}
if (document.readyState == "complete") {
    onPageFullyLoaded();
} else {
    document.addEventListener("readystatechange", () => {
        if (document.readyState == "interactive") {
            onPagePartiallyLoaded();
        } else if (document.readyState == "complete") {
            onPageFullyLoaded();
        }
    });
}

function selectOptionsTab(tab) {
    selectTab(document.querySelector("options"), tab);
}
function selectTab(element, tabName) {
    if (element.getAttribute("tab") == tabName) {
        element.toggleAttribute("hidden");
    } else {
        let tabs = Array.from(element.components);
        let oldTab = tabs.find(tab => tab.getAttribute("name") == element.getAttribute("tab"));
        let newTab = tabs.find(tab => tab.getAttribute("name") == tabName);
        oldTab.removeAttribute("style");
        newTab.removeAttribute("style");
        element.offsetHeight;
        if (!element.hasAttribute("hidden")) {
            let oldIndex = tabs.indexOf(oldTab);
            let newIndex = tabs.indexOf(newTab);
            newTab.setAttribute("style", `transform: translateX(calc(${oldIndex > newIndex ? -.25 : .25} * var(--options-width)));`);
            element.offsetHeight;
            oldTab.setAttribute("style", `transition: .15s opacity, .15s transform; opacity: 0; transform: translateX(calc(${oldIndex > newIndex ? .25 : -.25} * var(--options-width)));`);
            newTab.setAttribute("style", `transition: .15s opacity, .15s transform;`);
        }
        oldTab.setAttribute("hidden", "");
        newTab.removeAttribute("hidden");
        element.removeAttribute("hidden");
        element.setAttribute("tab", tabName);
    }
}
