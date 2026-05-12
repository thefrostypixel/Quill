let removeInspectorTab = name => {
    $("inspector-tab-selection", `.${name}`).delete();
    $("inspector-tabs", `.${name}`).delete();
};
let addInspectorTab = (name, icon, ...content) => {
    removeInspectorTab(name);
    $(".inspector-tab-selection").add($new("toggle-button", {class: name, tName: `inspector.${name}`, toggleElement: `.${name}`, group: "Inspector Tab", toggled: !$(".inspector-tab-selection").children.exists}, $text(icon))); // TODO Animate appearing.
    $(".inspector-tabs").add($new("tab-content", {class: name, hidden: $(".inspector-tabs").children.exists}).add(content));
}; // TODO Add position.

let addTextInspectorTab = () => addInspectorTab("text", "􀉆", $new("span", {class: "name", t: "inspector.text.paragraph-style"}),
    $new("span", $new("list-select", {editable: "true", tName: "inspector.text.paragraph-style", options: JSON.stringify([{options: ["Title", "Text"], add: true, edit: true, remove: true}]), selected: "Text"})), // TODO Add option to update, maybe with 􀈄, 􀄴, 􀚐, 􀄽 or 􀅈 icon.
    $new("span", {class: "name", t: "inspector.text.section-overwrite"}),
    $new("span", $new("list-select", {class: "list-select", editable: "true", tName: "inspector.text.paragraph-style", options: JSON.stringify([{options: [{id: "none", tName: "inspector.section-overwrite.none", rename: false, remove: false}, "Link"], add: true, rename: true, remove: true}]), selected: "none"})),
    $new("span", {class: "separator"}),
    $new("span", {class: "name", t: "inspector.text.text"}),
    $new("span",
        $new("span", {grow: 2}, $new("list-select", {tName: "text.family", options: JSON.stringify([{id: "default", tName: "text.family.default", options: ["Helvetica", "Arial", "Verdana", "Tahoma", "Times New Roman", "Georgia", "Courier New"]}, {id: "document", tName: "text.family.document", options: ["SF Pro Display", "Comic Sans", "Papyrus", "Roboto", "Noto Sans", "Calibri", "Futura", "Impact"], add: true, rename: true, remove: true}]), selected: "Helvetica"})),
        $new("span", $new("number-input", {tName: "text.size", type: "length", min: 0, value: 24})),
    ),
    $new("span",
        $new("button-group", {grow: 2},
            $new("toggle-button", {tName: "text.bold"}).style({width: "calc(260px / 6)"}).add($new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <path fill="white" d="M4.6 2.75A.75 .75 0 0 0 3.85 3.5V12.5A.75 .75 0 0 0 4.6 13.25H8.5C13.3 13.25 12.7 8.5 10.5 7.7C12.3 7 12.6 2.75 8.5 2.75M6.15 4.65H7.7Q9.4 4.65 9.4 5.75Q9.4 6.85 7.7 6.85H6.15M6.15 8.75H8Q9.8 8.65 9.8 10.1Q9.8 11.35 8 11.35H6.15"/>
                        </svg>`)),
            $new("list-select", {tName: "text.weight", options: JSON.stringify([{options: [{id: 100, tName: "text.weight.100"}, {id: 200, tName: "text.weight.200"}, {id: 300, tName: "text.weight.300"}, {id: 400, tName: "text.weight.400"}, {id: 500, tName: "text.weight.500"}, {id: 600, tName: "text.weight.600"}, {id: 700, tName: "text.weight.700"}, {id: 800, tName: "text.weight.800"}, {id: 900, tName: "text.weight.900"}]}]), selected: 300}).style({width: "calc(100% - 260px / 6)"}),
        ),
        $new("span", $new("color-input", {tName: "text.color", types: "*", value: JSON.stringify({type: "linear", angle: 45, colors: [{r: .9, g: .33, b: .33, a: 1, pos: 0}, {r: .267, g: .55, b: .835, a: 1, pos: .5}, {r: .165, g: .74, b: .165, a: 1, pos: 1}]})})),
    ),
    $new("span",
        $new("button-group",
            /*$new("toggle-button").set({tName: "text.bold"}).add($new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill="white" d="M4.6 2.75A.75 .75 0 0 0 3.85 3.5V12.5A.75 .75 0 0 0 4.6 13.25H8.5C13.3 13.25 12.7 8.5 10.5 7.7C12.3 7 12.6 2.75 8.5 2.75M6.15 4.65H7.7Q9.4 4.65 9.4 5.75Q9.4 6.85 7.7 6.85H6.15M6.15 8.75H8Q9.8 8.65 9.8 10.1Q9.8 11.35 8 11.35H6.15"/>
            </svg>`)),*/
            $new("toggle-button", {tName: "text.italic"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" d="M6.4 3.5H11.4M8.9 3.5L7.1 12.5M4.6 12.5H9.7"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.underline", toggleElement: ".underline"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" d="M4.6 3.5V9.1A3.4 3.4 0 0 0 8 12.5A3.4 3.4 0 0 0 11.4 9.1V3.5"/>
                <path fill="none" stroke="white" stroke-linecap="round" d="M4.1 15.25H11.9"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.strikethrough", toggleElement: ".strikethrough"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" d="M10.9 5.2C10.4 4 9.4 3.5 7.9 3.5C6.8 3.5 5.1 4 5.1 5.65C5.1 6.9 6.1 7.6 8.1 7.95C10.1 8.3 11.1 9 11.1 10.3C11.1 11.5 10.1 12.5 8 12.5C6.6 12.5 5.5 11.9 4.9 10.7"/>
                <path fill="none" stroke="white" stroke-linecap="round" d="M3 7.9H13"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.outline", toggleElement: ".outline"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <mask id="A" maskUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="16" height="16" fill="white"/>
                    <path fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5L8 3.5L11.5 12.5M6 9.6H10"/>
                </mask>
                <path mask="url(#A)" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5L8 3.5L11.5 12.5M6 9.6H10"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.shadow", toggleElement: ".shadow"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <mask id="H">
                    <rect x="0" y="0" width="16" height="16" fill="white"/>
                    <path stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M2.5 2.5L3.5 3.5V12.5L2.5 11.5M3.5 7.75H10.5M9.5 2.5L10.5 3.5V12.5L9.5 11.5"/>
                </mask>
                <path mask="url(#H)" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M3.5 3.5L5.5 5.5V14.5L3.5 12.5M3.5 7.75L5.5 9.75H12.5L10.5 7.75M10.5 3.5L12.5 5.5V14.5L10.5 12.5"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.shadow", toggleElement: ".shadow"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <mask id="H2">
                    <rect x="0" y="0" width="16" height="16" fill="white"/>
                    <path stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M2.5 3.5V12.5M2.5 7.75H9.5M9.5 3.5V12.5"/>
                </mask>
                <path mask="url(#H2)" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M2.5 3.5L4.5 5.5V14.5L2.5 12.5M2.5 7.75L4.5 9.75H11.5L9.5 7.75M9.5 3.5L11.5 5.5V14.5L9.5 12.5"/>
                <path stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M2.5 3.5V12.5M2.5 7.75H9.5M9.5 3.5V12.5"/>
            </svg>`)),
            $new("toggle-button", {tName: "text.more", toggleElement: ".more"}, $new(`<svg height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="8" r="1.25" fill="white"/>
                <circle cx="8" cy="8" r="1.25" fill="white"/>
                <circle cx="12.5" cy="8" r="1.25" fill="white"/>
            </svg>`)),
        ),
    ),
    $new("toggleable-section", {class: "more", hidden: true},
        $new("span", $new("a", {t: "colon[t:text.baseline]"})),
        $new("span", $new("list-select", {tName: "text.baseline", options: JSON.stringify([{options: [{id: "base", tName: "text.baseline.base"}, {id: "sup", tName: "text.baseline.sup"}, {id: "sub", tName: "text.baseline.sub"}]}]), selected: "base"})),
        $new("span", $new("a", {t: "colon[t:text.capitalization]"})),
        $new("span", $new("list-select", {tName: "text.capitalization", options: JSON.stringify([{options: [{id: "default", tName: "text.capitalization.default"}, {id: "all-caps", tName: "text.capitalization.all-caps"}, {id: "no-caps", tName: "text.capitalization.no-caps"}, {id: "start-caps", tName: "text.capitalization.start-caps"}, {id: "small-caps", tName: "text.capitalization.small-caps"}, {id: "small-start-caps", tName: "text.capitalization.small-start-caps"}]}]), selected: "default"})),
        $new("span",
            $new("a", {grow: 2, t: "colon[t:text.background]"}),
            $new("color-input", {tName: "text.background", types: "*", value: "D4D4D4"}),
        ),
        // TODO Paragraph borders.
    ),
    $new("toggleable-section", {class: "underline", hidden: true},
        $new("span", {class: "separator"}),
        $new("span", {class: "name", t: "text.underline"}),
        $new("line-input", {class: "underline-input"}),
    ),
    $new("toggleable-section", {class: "strikethrough", hidden: true},
        $new("span", {class: "separator"}),
        $new("span", {class: "name", t: "text.strikethrough"}),
        $new("line-input", {class: "strikethrough-input"}),
    ),
    $new("toggleable-section", {class: "outline", hidden: true},
        $new("span", {class: "separator"}),
        $new("span", {class: "name", t: "text.outline"}),
        $new("line-input", {class: "outline-input"}),
    ),
    $new("toggleable-section", {class: "shadow", hidden: true},
        $new("span", {class: "separator"}),
        $new("span", {class: "name", t: "text.shadow"}),
    ),
    $new("span", {class: "separator"}),
    $new("span",
        $new("a", {grow: 3, t: "colon[t:text.line-spacing]"}),
        $new("span", {grow: 2}, $new("number-input", {grow: 2, tName: "text.line-spacing", type: "number", value: 1.2, interval: .1})),
    ),
    $new("span",
        $new("a", {grow: 3, t: "colon[t:text.paragraph-spacing.above]"}),
        $new("span", {grow: 2}, $new("number-input", {grow: 2, tName: "text.paragraph-spacing.above", type: "length", value: 10})),
    ),
    $new("span",
        $new("a", {grow: 3, t: "colon[t:text.paragraph-spacing.below]"}),
        $new("span", {grow: 2}, $new("number-input", {grow: 2, tName: "text.paragraph-spacing.below", type: "length", value: 20})),
    ),
    $new("span", {class: "separator"}),
    $new("span", $new("button-group",
        $new("toggle-button", {tName: "align.horizontal.left", group: "Horizontal alignment", toggled: true}, $text("􀌀")),
        $new("toggle-button", {tName: "align.horizontal.center", group: "Horizontal alignment"}, $text("􀌁")),
        $new("toggle-button", {tName: "align.horizontal.right", group: "Horizontal alignment"}, $text("􀌂")),
        $new("toggle-button", {tName: "align.horizontal.stretch"}, $text("􀌃")),
    )),
    $new("span", $new("button-group",
        $new("toggle-button", {tName: "align.horizontal.top", group: "Vertical alignment", toggled: true}, $text("􀅃")),
        $new("toggle-button", {tName: "align.horizontal.middle", group: "Vertical alignment"}, $text("􀚍")),
        $new("toggle-button", {tName: "align.horizontal.bottom", group: "Vertical alignment"}, $text("􀅄")),
    )),
    $new("span", {class: "separator"}),
    $new("span", {class: "name"}, $new("check-box", {toggleElement: ".list", t: "text.list"})),
    $new("toggleable-section", {class: "list", hidden: true},
        $new("span",
            $new("a", {grow: 3, t: "colon[t:text.list.indentation]"}),
            $new("span", {grow: 2}, $new("number-input", {tName: "text.list.indentation", type: "number", min: 0, max: 0, value: 0})), // TODO Always have the max be 1 greater than the previous list indentation, or 0 if the previous line isn't a list.
        ),
        $new("span",
            $new("a", {t: "colon[t:text.list.label]"}),
            $new("list-select", {tName: "text.list.label", // ⟡◇⟐
                options: JSON.stringify([{id: "bullet", tName: "text.list.bullet", options: [{id: "–", tName: "–"}, {id: "✓", tName: "✓"}, {id: "✗", tName: "✗"}, {id:"→", tName: "→"}, {id: "▷", tName: "▷"}, {id: "custom", tName: "text.list.bullet.custom"}]}, {id: "counting", tName: "text.list.counting", options: [{id: "number", tName: "1 2 3 4"}, {id: "roman-uppercase", tName: "Ⅰ ⅠⅠ ⅠⅠⅠ ⅠⅤ"}, {id: "roman-lowercase", tName: "ⅰ ⅰⅰ ⅰⅰⅰ ⅰⅴ"}, {id: "letter-uppercase", tName: "A B C D"}, {id: "letter-lowercase", tName: "a b c d"}]}]),
                selected: `[{"group":"bullet","option":"–"}]`,
                onselect: `document.querySelector('.list-bullet-custom').hidden = event.group.id != 'bullet' || event.option.id != 'custom'; document.querySelector('.list-counting-options').hidden = event.group.id != 'counting'; if (event.group.id == 'bullet' && event.option.id != 'custom') {document.querySelector('.list-bullet-custom input').value = event.option.id;}`,
            }),
        ),
        $new("toggleable-section", {class: "list-bullet-custom", hidden: true}, $new("span", $new("text-input", $new("input", {tName: "text.list.bullet", value: "–"})))), // TODO Maybe let users edit the list?
        $new("toggleable-section", {class: "list-counting-options", hidden: true},
            $new("span",
                $new("a", {t: "colon[t:text.list.decoration]"}),
                $new("list-select", {tName: "text.list.decoration", options: JSON.stringify([{"options":[{"id":"none","tName":"1 2 3 4"},{"id":"dot","tName":"1. 2. 3. 4."},{"id":"parenthesis","tName":"1) 2) 3) 4)"},{"id":"parentheses","tName":"(1) (2) (3) (4)"},{"id":"custom","tName":"text.list.decoration.custom"}]}]), selected: "dot", onselect: `document.querySelector('.list-decoration-custom').hidden = event.option.id != 'custom';`}),
            ),
            $new("toggleable-section", {class: "list-decoration-custom", hidden: true}, $new("span",
                $new("span", $new("text-input", $new("input", {tName: "text.list.decoration.custom.prefix", value: "("}))),
                $new("span", $new("text-input", $new("input", {tName: "text.list.decoration.custom.separator", value: "."}))),
                $new("span", $new("text-input", $new("input", {tName: "text.list.decoration.custom.suffix", value: ")"}))),
            )),
            $new("toggleable-section", {class: "list-counting-repeat-hierarchy"}, $new("span", $new("check-box", {t: "text.list.counting.repeat-hierarchy", toggled: true}))), // TODO Hide if indentation is 0.
            $new("span", $new("check-box", {toggleElement: ".list-counting-set", t: "text.list.counting.reset"})),
            $new("toggleable-section", {class: "list-counting-set", hidden: true}, $new("span",
                $new("a", {grow: 3, t: "colon[t:text.list.counting.set]"}),
                $new("number-input", {grow: 2, tName: "text.list.counting.set", type: "number", min: 1, value: 1}),
            )),
        ),
        // TODO Indentation for beginning or end of label.
        $new("span",
            $new("a", {grow: 3, t: "colon[t:text.list.text-indentation]"}),
            $new("span", {grow: 2}, $new("number-input", {tName: "text.list.text-indentation", type: "length", min: 0, value: 50})),
        ),
    ),
    $new("span", {class: "separator"}),
    $new("span", {class: "name"}, $new("check-box", {class: "text-indentation-enabled", toggleElement: ".indentation", t: "text.indentation", ontoggle: `document.querySelector('.text-indentation').value = this.toggled * (document.querySelector('.text-indentation-step-size').value || 1);`})),
    $new("toggleable-section", {class: "indentation", hidden: true},
        $new("span",
            $new("a", {grow: 3, t: "colon[t:text.indentation]"}),
            $new("span", {grow: 2}, $new("number-input", {class: "text-indentation", tName: "text.indentation", type: "length", min: 0, value: 0, interval: 50, onchange: `document.querySelector('.text-indentation-enabled').toggled = this.value;`})),
        ),
        $new("span",
            $new("a", {grow: 3, t: "colon[t:text.indentation.step-size]"}),
            $new("span", {grow: 2}, $new("number-input", {class: "text-indentation-step-size", tName: "text.indentation.step-size", type: "length", min: 0, value: 50, onchange: `document.querySelector('.text-indentation').interval = this.value;`})),
        ),
    ),
);
let addTableInspectorTab = () => addInspectorTab("table", "􀏣");
let addLayoutInspectorTab = () => addInspectorTab("layout", "􀉅");
let addDocumentInspectorTab = () => addInspectorTab("document", "􀈷");

let genInspector = () => {
    addTextInspectorTab();
    addTableInspectorTab();
    addDocumentInspectorTab();
    addLayoutInspectorTab();
    let html = $new(`<tabs class="no-top-curve">
        <tab-content class="table" hidden>
            <span class="name" t="table"></span>
            <span>
                <a grow="3" t="colon[t:table.row-count]"></a>
                <span grow="2"><number-input t-name="table.row-count" type="number" value="5" decimals="0"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:table.colum-count]"></a>
                <span grow="2"><number-input t-name="table.colum-count" type="number" value="4" decimals="0"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="table.headers"></span>
            <span>
                <a grow="3" t="colon[t:table.header-count.top]"></a>
                <span grow="2"><number-input t-name="table.header-count.top" type="number" value="1" decimals="0"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:table.header-count.bottom]"></a>
                <span grow="2"><number-input t-name="table.header-count.bottom" type="number" value="1" decimals="0"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:table.header-count.left]"></a>
                <span grow="2"><number-input t-name="table.header-count.left" type="number" value="1" decimals="0"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="table.cell"></span>
            <span>
                <a grow="3" t="colon[t:table.column-width]"></a>
                <span grow="2"><number-input t-name="table.column-width" type="length" value="80"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:table.row-height]"></a>
                <span grow="2"><number-input t-name="table.row-height" type="length" value="20"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="table.data-type"></span>
            <span><list-select t-name="table.data-type" options='[{"options":[{"id":"text","tName":"table.data-type.text"},{"id":"number","tName":"table.data-type.number"},{"id":"boolean","tName":"table.data-type.boolean"},{"id":"date","tName":"table.data-type.date"}]}]' selected="text"></list-select></span>
            <span><i>Equation?</i></span>
            <span class="separator"></span>
            <span class="name">
                <a grow="2" t="table.cell-background"></a>
                <span><color-input t-name="table.cell-background" types="*"></color-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="table.borders"></span>
            <div>
                <span class="table-border-options">
                    <script>
                        document.addEventListener("DOMContentLoaded", () => {
                            let tableBorderSelectionPresets = [
                                [0, 1, 2, 3, 4, 5],
                                [0, 2, 3, 5],
                                [1, 4],
                            ];
                            document.querySelectorAll(".table-border-selection-presets toggle-button").forEach((ep, ip) => ep.ontoggle = () => {
                                document.querySelectorAll(".table-border-selection-presets toggle-button").forEach(e => e.toggled = ep == e);
                                document.querySelectorAll(".table-border-selection toggle-button").forEach((e, i) => e.toggled = tableBorderSelectionPresets[ip].indexOf(i) > -1);
                            });
                            document.querySelectorAll(".table-border-selection toggle-button").forEach(em => em.ontoggle = () => document.querySelectorAll(".table-border-selection-presets toggle-button").forEach((ep, ip) => ep.toggled = Array.from(document.querySelectorAll(".table-border-selection toggle-button")).reduce((matches, e, i) => matches && e.toggled == (tableBorderSelectionPresets[ip].indexOf(i) > -1), true)));
                        });
                    </script>
                    <button-group class="table-border-selection-presets">
                        <toggle-button t-name="table.borders.all" toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.outer">
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 1H15V15H1V1"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.inner">
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 1V15M1 8H15"/>
                            </svg>
                        </toggle-button>
                    </button-group>
                    <button-group grow="2" class="table-border-selection">
                        <toggle-button t-name="table.borders.left" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 1V15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.center" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 1V15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.right" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 1V15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.top" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 1H15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.middle" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 8H15"/>
                            </svg>
                        </toggle-button>
                        <toggle-button t-name="table.borders.bottom" group="Table Border Selection" multi-select toggled>
                            <svg width="16" height="16">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" d="M1 1H15V15H1V1M8 1V15M1 8H15"/>
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M1 15H15"/>
                            </svg>
                        </toggle-button>
                    </button-group>
                </span>
                <line-input></line-input>
            </div>
        </tab-content>
        <tab-content class="layout" hidden>
            <span class="name"><check-box toggle-element=".fixed-position" toggled t="layout.position.fixed"></check-box></span>
            <toggleable-section class="fixed-position">
                <span>
                    <a grow="3" t="colon[t:layout.position.left]"></a>
                    <span grow="2"><number-input t-name="layout.position.left" type="length" value="100"></number-input></span>
                </span>
                <span>
                    <a grow="3" t="colon[t:layout.position.top]"></a>
                    <span grow="2"><number-input t-name="layout.position.top" type="length" value="50"></number-input></span>
                </span>
                <span><check-box toggle-element=".push-text" toggled t="layout.push-text"></check-box></span>
                <toggleable-section class="push-text">
                    <span>
                        <a grow="3" t="colon[t:layout.space]"></a>
                        <span grow="2"><number-input t-name="layout.space" type="length" value="15"></number-input></span>
                    </span>
                    <span><check-box t="layout.tight-flow"></check-box></span>
                </toggleable-section>
            </toggleable-section>
            <span class="separator"></span>
            <span class="name" t="object.size"></span>
            <span>
                <a grow="3" t="colon[t:object.size.width]"></a>
                <span grow="2"><number-input t-name="object.size.width" type="length" value="200"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:object.size.height]"></a>
                <span grow="2"><number-input t-name="object.size.height" type="length" value="20"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name"><a t="object.transformations"></a><button style="max-width: min-content;">􀅼</button></span>
            <div>
                <span>
                    <list-select t-name="object.transformation" options='[{"options":[{"id":"rotate","tName":"object.transformation.rotate"},{"id":"mirror","tName":"object.transformation.mirror"}]}]' selected="rotate"></list-select>
                    <button-group style="max-width: min-content;">
                        <button>􀆇</button>
                        <button>􀆈</button>
                    </button-group>
                </span>
                <span>
                    <a grow="3" t="colon[t:object.transformation.rotate.angle]"></a>
                    <span grow="2"><number-input t-name="object.transformations.rotation" type="angle" value="0"></number-input></span>
                </span>
            </div>
            <div>
                <span>
                    <list-select t-name="object.transformation" options='[{"options":[{"id":"rotate","tName":"object.transformation.rotate"},{"id":"mirror","tName":"object.transformation.mirror"}]}]' selected="mirror"></list-select>
                    <button-group style="max-width: min-content;">
                        <button>􀆇</button>
                        <button>􀆈</button>
                    </button-group>
                </span>
                <span>
                    <a grow="3" t="colon[t:object.transformation.mirror.direction]"></a>
                    <button-group grow="2">
                        <toggle-button group="Mirror Direction">􀡠</toggle-button>
                        <toggle-button group="Mirror Direction">􀡛</toggle-button>
                    </button-group>
                </span>
            </div>
            <span><button>􀅼</button></span>
            <span class="separator"></span>
            <span class="name"><i>More...</i></span>
        </tab-content>
        <tab-content class="document" hidden>
            <span class="name"><i>Section settings</i></span>
            <span class="separator"></span>
            <span class="name" t="page.size"></span>
            <span>
                <a grow="3" t="colon[t:page.size.template]"></a>
                <span grow="2"><list-select t-name="page.size.template" options='[{"id":"paper","tName":"page.size.template.paper","options":[{"id":"a1","tName":"page.size.template.a1"},{"id":"a2","tName":"page.size.template.a2"},{"id":"a3","tName":"page.size.template.a3"},{"id":"a4","tName":"page.size.template.a4"},{"id":"a5","tName":"page.size.template.a5"},{"id":"a5","tName":"page.size.template.a5"},{"id":"a6","tName":"page.size.template.a6"},{"id":"letter","tName":"page.size.template.letter"}]},{"id":"screen","tName":"page.size.template.screen","options":[{"id":"hd","tName":"page.size.template.hd"},{"id":"4k","tName":"page.size.template.4k"}]}]' selected="a4"></list-select></span> <!-- TODO Generate the page sizes from the ones in layout.js -->
            </span>
            <span>
                <a grow="3" t="colon[t:page.size.width]"></a>
                <span grow="2"><number-input t-name="page.size.width" type="length" value="21 cm"></number-input></span>
            </span> <!-- TODO Button to switch width and height -->
            <span>
                <a grow="3" t="colon[t:page.size.height]"></a>
                <span grow="2"><number-input t-name="page.size.height" type="length" value="29.7 cm"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="page.size"></span>
            <span>
                <span grow="3"><list-select t-name="page.size.template" options='[{"id":"paper","tName":"page.size.template.paper","options":[{"id":"a1","tName":"page.size.template.a1"},{"id":"a2","tName":"page.size.template.a2"},{"id":"a3","tName":"page.size.template.a3"},{"id":"a4","tName":"page.size.template.a4"},{"id":"a5","tName":"page.size.template.a5"},{"id":"a5","tName":"page.size.template.a5"},{"id":"a6","tName":"page.size.template.a6"},{"id":"letter","tName":"page.size.template.letter"}]},{"id":"screen","tName":"page.size.template.screen","options":[{"id":"hd","tName":"page.size.template.hd"},{"id":"4k","tName":"page.size.template.4k"}]}]' selected="a4"></list-select></span> <!-- TODO Generate the page sizes from the ones in layout.js -->
                <span grow="2"><button>􁻮 Flip</button></span> <!-- TODO Translation -->
            </span>
            <span>
                <span grow="3"><check-box toggled t="colon[t:page.size.fixed-width]"></check-box></span>
                <span grow="2"><number-input t-name="page.size.width" type="length" value="21 cm"></number-input></span> <!-- TODO Make it switch between fixed an minimum size -->
            </span>
            <span>
                <span grow="3"><check-box toggled t="colon[t:page.size.fixed-height]"></check-box></span>
                <span grow="2"><number-input t-name="page.size.height" type="length" value="29.7 cm"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name" t="page.margin"></span>
            <span>
                <a grow="3" t="colon[t:page.margin.top]"></a>
                <span grow="2"><number-input t-name="page.margin.top" type="length" value="50"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:page.margin.bottom]"></a>
                <span grow="2"><number-input t-name="page.margin.bottom" type="length" value="50"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:page.margin.left]"></a>
                <span grow="2"><number-input t-name="page.margin.left" type="length" value="50"></number-input></span>
            </span>
            <span>
                <a grow="3" t="colon[t:page.margin.right]"></a>
                <span grow="2"><number-input t-name="page.margin.right" type="length" value="50"></number-input></span>
            </span>
            <span class="separator"></span>
            <span class="name"><check-box toggle-element=".header" toggled t="page.header"></check-box></span>
            <toggleable-section class="header">
                <span>
                    <a grow="3" t="colon[t:page.header.height]"></a>
                    <span grow="2"><number-input t-name="page.header.height" type="length" value="20"></number-input></span>
                </span>
                <span>
                    <a grow="3" t="colon[t:page.header.margin]"></a>
                    <span grow="2"><number-input t-name="page.header.margin" type="length" value="20"></number-input></span>
                </span>
            </toggleable-section>
            <span class="separator"></span>
            <span class="name"><check-box toggle-element=".footer" toggled t="page.footer"></check-box></span>
            <toggleable-section class="footer">
                <span>
                    <a grow="3" t="colon[t:page.footer.height]"></a>
                    <span grow="2"><number-input t-name="page.footer.height" type="length" value="20"></number-input></span>
                </span>
                <span>
                    <a grow="3" t="colon[t:page.footer.margin]"></a>
                    <span grow="2"><number-input t-name="page.footer.margin" type="length" value="20"></number-input></span>
                </span>
            </toggleable-section>
            <span class="separator"></span>
            <span class="name"><i>Page numbers</i></span>
            <span class="separator"></span>
            <span class="name"><i>Page settings or something</i></span>
            <span><check-box toggled t="page.main-content"></check-box></span>
            <span>
                <a grow="3" t="colon[t:page.background]"></a>
                <span grow="2"><color-input t-name="page.background" types="*"></color-input></span>
            </span>
            <span class="separator"></span>
            <span><button t="page.apply-to-all-sections"></button></span>
        </tab-content>
    </tabs>`);
};
