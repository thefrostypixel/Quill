/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

// TODO Handle the scrollbar element being removed by other code.
// TODO Handle the <html> itself scrolling (requires listening for a scroll on the document or window).

(() => {
    let addCustomScrollbars = () => {
        if (document.readyState == "loading") {
            document.addEventListener("readystatechange", addCustomScrollbars);
            return;
        }
        let style = document.createElement("style");
        style.id = "scrollbars-style";
        style.textContent = `
        ::-webkit-scrollbar {
            display: none;
        }
        * {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        html {
            --scrollbar-spacing: 1px;
            --scrollbar-track-width: 8px;
            --scrollbar-track-color: #0000;
            --scrollbar-track-blur: 0px;
            --scrollbar-track-border-width: 0px;
            --scrollbar-track-border-color: #0000;
            --scrollbar-slider-color: #AAAA;
            --scrollbar-slider-blur: 0px;
            --scrollbar-slider-border-width: 1px;
            --scrollbar-slider-border-color: #888A;
            
            /*--scrollbar-spacing: 2px;
            --scrollbar-track-width: 10px;
            --scrollbar-track-color: #4444;
            --scrollbar-track-blur: 4px;
            --scrollbar-track-border-width: 1px;
            --scrollbar-track-border-color: #AAAA;
            --scrollbar-slider-color: #AAAA;
            --scrollbar-slider-blur: 0px;
            --scrollbar-slider-border-width: 0px;
            --scrollbar-slider-border-color: #0000;*/
        }
        scrollbar-x, scrollbar-y {
            position: fixed;
        }
        scrollbar-track-x, scrollbar-track-y {
            position: absolute;
            background: var(--scrollbar-track-color);
            backdrop-filter: blur(var(--scrollbar-track-blur));
            cursor: pointer;
        }
        scrollbar-slider-x, scrollbar-slider-y {
            position: absolute;
            background: var(--scrollbar-slider-color);
            backdrop-filter: blur(var(--scrollbar-slider-blur));
            border: var(--scrollbar-slider-border-width) solid var(--scrollbar-slider-border-color);
            border-radius: calc(.5 * var(--height) - var(--scrollbar-spacing));
            cursor: pointer;
        }
        scrollbar-track-x {
            left: 0;
            top: calc(var(--height) - var(--scrollbar-track-width) - var(--scrollbar-track-border-width));
            width: var(--width);
            height: var(--scrollbar-track-width);
            border-top: var(--scrollbar-track-border-width) solid var(--scrollbar-track-border-color);
        }
        scrollbar-slider-x {
            left: calc(var(--scrollbar-spacing) + (var(--width) - 2 * var(--scrollbar-spacing)) * var(--pos));
            top: var(--scrollbar-spacing);
            width: calc((var(--width) - 2 * var(--scrollbar-spacing)) * var(--length) - 2 * var(--scrollbar-slider-border-width));
            height: calc(var(--scrollbar-track-width) - 2 * var(--scrollbar-spacing) - 2 * var(--scrollbar-slider-border-width));
        }
        scrollbar-track-y {
            left: calc(var(--width) - var(--scrollbar-track-width) - var(--scrollbar-track-border-width));
            top: 0;
            width: var(--scrollbar-track-width);
            height: var(--height);
            border-left: var(--scrollbar-track-border-width) solid var(--scrollbar-track-border-color);
        }
        scrollbar-slider-y {
            left: var(--scrollbar-spacing);
            top: calc(var(--scrollbar-spacing) + (var(--height) - 2 * var(--scrollbar-spacing)) * var(--pos));
            width: calc(var(--scrollbar-track-width) - 2 * var(--scrollbar-spacing) - 2 * var(--scrollbar-slider-border-width));
            height: calc((var(--height) - 2 * var(--scrollbar-spacing)) * var(--length) - 2 * var(--scrollbar-slider-border-width));
        }
        `;
        document.head.appendChild(style);
        let addScrollListener = elements => elements.forEach(element => {
            let entries = {};
            let pos = {x: element.scroll.x, y: element.scroll.y};
            element.nonBlockingListen("scroll", () => [{dir: "x", size: "width"}, {dir: "y", size: "height"}].forEach(({dir, size}) => {
                if (pos[dir] != element.scroll[dir] && !entries[dir]) {
                    let entry = {
                        container: $new(`scrollbar-${dir}`),
                        track: $new(`scrollbar-track-${dir}`),
                        slider: $new(`scrollbar-slider-${dir}`),
                        dragging: false,
                    };
                    element.add(entry.container.add(entry.track.add(entry.slider)));
                    let createDeleteTimeout = () => {
                        entry.track.style({opacity: [1, 1, 1, 1, 0]}, 1000);
                        entry.timeout = setTimeout(() => {
                            entry.container.delete();
                            delete entries[dir];
                        }, 1000);
                    };
                    entry.track.nonBlockingListen("wheel", e => !entry.dragging && (element.scroll[dir] += dir == "x" ? e.deltaX : e.deltaY));
                    let preventScroll = e => (dir == "x" ? e.deltaX : e.deltaY) && e.preventDefault();
                    let pressListener = (e, offset) => {
                        clearTimeout(entry.timeout);
                        entry.track.style({opacity: 1});
                        entry.dragging = true;
                        element.listen(["wheel", "touchmove"], preventScroll);
                        let moveListener = e => {
                            e.preventDefault();
                            e.stopPropagation();
                            element.scroll[dir] = Math.min(1, Math.max(0, ((dir == "x" ? e.clientX : e.clientY) + offset - element.bounds[dir] - element.bounds[size] * Math.min(element.bounds[size] / element.scroll[size], 1) / 2) / (element.bounds[size] * (1 - Math.min(element.bounds[size] / element.scroll[size], 1))))) * (element.scroll[size] - element.bounds[size]);
                        };
                        moveListener(e);
                        let releaseListener = () => {
                            e.preventDefault();
                            e.stopPropagation();
                            createDeleteTimeout();
                            entry.dragging = false;
                            element.quitListen(["wheel", "touchmove"], preventScroll);
                            $.quitListen("mousemove", moveListener);
                            $.quitListen("mouseup", releaseListener);
                            $.quitListen("blur", releaseListener);
                        };
                        $.listen("mousemove", moveListener);
                        $.listen("mouseup", releaseListener);
                        $.listen("blur", releaseListener);
                    };
                    entry.slider.listen("mousedown", e => pressListener(e, entry.slider.bounds[dir] + entry.slider.bounds[size] / 2 - (dir == "x" ? e.clientX : e.clientY)));
                    entry.track.listen("mousedown", e => pressListener(e, 0));
                    entries[dir] = entry;
                    createDeleteTimeout();
                    let frame = () => {
                        if (entries[dir] == entry) {
                            requestAnimationFrame(frame);
                            if (pos[dir] != element.scroll[dir] && !entry.track.dragging) {
                                clearTimeout(entry.timeout);
                                createDeleteTimeout();
                            }
                            pos[dir] = element.scroll[dir];
                            if (entry.container.bounds.x != element.bounds.x || entry.container.bounds.y != element.bounds.y) {
                                entry.container.style({left: 0, top: 0}).style({left: `${element.bounds.x - entry.container.bounds.x}px`, top: `${element.bounds.y - entry.container.bounds.y}px`});
                            }
                            entry.track.style({"--width": `${element.bounds.width}px`, "--height": `${element.bounds.height}px`, "--pos": element.scroll[dir] / element.scroll[size], "--length": Math.min(element.bounds[size] / element.scroll[size], 1)});
                        }
                    };
                    frame();
                }
            }));
        });
        addScrollListener($("*"));
        new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => node.nodeType == 1 && !$(node).ancestors.matching("#scrollbars").exists && addScrollListener($(node, $(node).select("*")))))).observe(document.body, {childList: true, subtree: true});
    };
    addCustomScrollbars();
})();
