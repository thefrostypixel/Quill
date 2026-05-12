let quillFileContents = {
    paragraphStyles: { // TODO Make styles lists where entries contain names.
        // TODO Text color
        "Title": {
            family: "Helvetica",
            size: 24,
            weight: 700,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
        "Text": {
            family: "Helvetica",
            size: 12,
            weight: 400,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
    },
    sectionStyles: {},
    sections: [
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            /*Background, page numbering, ...*/
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Left header text ",
                        },
                    ],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Middle header text ",
                        },
                    ],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Right header text ",
                        },
                    ],
                },
            },
            footer: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Left footer text This is a really long text to see if text overflowing works as expected ",
                        },
                    ],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Middle footer text ",
                        },
                    ],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Right\nfooter\ntext ",
                        },
                    ],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            style: {
                                weight: 400,
                            },
                            text: "Page ",
                        },
                        {
                            type: "text",
                            text: " Title",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Here is an assortment that contains various text styles, like ",
                        },
                        {
                            type: "text",
                            style: {
                                size: 16,
                            },
                            text: "large",
                        },
                        {
                            type: "text",
                            text: ", ",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "bold",
                        },
                        {
                            type: "text",
                            text: "l, ",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "italic",
                        },
                        {
                            type: "text",
                            text: ", ",
                        },
                        {
                            type: "text",
                            style: {
                                underline: {
                                    type: "solid",
                                    width: .04,
                                    color: {
                                        type: "solid",
                                        r: 1,
                                        g: 1,
                                        b: 1,
                                        a: 1,
                                    },
                                },
                            },
                            text: "underlined",
                        },
                        {
                            type: "text",
                            text: " and ",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "w",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "e",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "i",
                        },
                        {
                            type: "text",
                            text: "r",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "d",
                        },
                        {
                            type: "text",
                            text: " text, as well as ",
                        },
                        {
                            type: "text",
                            text: "links",
                            link: "#",
                        },
                        {
                            type: "text",
                            text: ". Additionally, there's also some more text here to see how well the text wrapping works."
                            // + " abcaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabc abcaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabc a",
                        },
                        {
                            type: "text",
                            text: "a\nb\nc\n",
                            link: "#",
                        },
                        {
                            type: "text",
                            text: "This was a triumph! I'm making a note here: Huge success! It's hard to overstate my satisfaction. Aperture Science: We do what we must because we can For the good of all of us. Except the ones who are dead. But there's no sense crying over every mistake. You just keep on trying 'til you run out of cake. And the science gets done. And you make a neat gun for the people who are still alive.\n"
                                + "I'm not even angry... I'm being so sincere x2 now. Even though you broke my heart, and killed me. And tore me to pieces. And threw every piece into a fire. As they burned it hurt because I was so happy for you! Now, these points of data make a beautiful line. And we're out of beta. We're releasing on time! So I'm GLaD I got burned! Think of all the things we learned! for the people who are still alive.\n"
                                + "Go ahead and leave me... I think I'd prefer to stay inside... Maybe you'll find someone else to help you. Maybe Black Mesa? That was a joke. Ha Ha. Fat Chance! Anyway this cake is great! It's so delicious and moist! Look at me: still talking when there's science to do! When I look out there, it makes me glad I'm not you. I've experiments to run. There is research to be done. On the people who are still alive.\n"
                                + "And believe me I am still alive. I'm doing science and I'm still alive. I feel fantastic and I'm still alive. While you're dying I'll be still alive. And when you're dead I will be still alive. Still alive. Still alive."
                            // + " aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ",
                        },
                        {
                            type: "text",
                            style: {
                                size: 18,
                            },
                            text: "g",
                            link: "#",
                        },
                        {
                            type: "text",
                            text: "💀",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Here is an assortment that contains various text styles, like ",
                        },
                        {
                            type: "text",
                            style: {
                                size: 16,
                            },
                            text: "large",
                        },
                        {
                            type: "text",
                            text: ", ",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "bold",
                        },
                        {
                            type: "text",
                            text: "l, ",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "italic",
                        },
                        {
                            type: "text",
                            text: ", ",
                        },
                        {
                            type: "text",
                            style: {
                                underline: {
                                    type: "solid",
                                    width: .04,
                                    color: {
                                        type: "solid",
                                        r: 1,
                                        g: 1,
                                        b: 1,
                                        a: 1,
                                    },
                                },
                            },
                            text: "underlined",
                        },
                        {
                            type: "text",
                            text: " and ",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "w",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "e",
                        },
                        {
                            type: "text",
                            style: {
                                italic: true,
                            },
                            text: "i",
                        },
                        {
                            type: "text",
                            text: "r",
                        },
                        {
                            type: "text",
                            style: {
                                weight: 700,
                            },
                            text: "d",
                        },
                        {
                            type: "text",
                            text: " text, as well as ",
                        },
                        {
                            type: "text",
                            text: "links",
                            link: "#",
                        },
                        {
                            type: "text",
                            text: ". Additionally, there's also some more text here to see how well the text wrapping works."
                            // + " abcaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabc ",
                        },
                        /*{
                            type: "text",
                            text: "abcaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabc",
                        },*/
                        /*{
                            type: "text",
                            text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ",
                        },
                        {
                            type: "text",
                            text: "bbbbbbbb ",
                        },
                        {
                            type: "text",
                            text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ",
                        },
                        {
                            type: "text",
                            text: "a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a ",
                        },
                        {
                            type: "text",
                            text: "a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a ",
                        },*/
                    ],
                },
            ],
            fixed: [
                {
                    page: 0,
                    x: 150,
                    y: 250,
                    pushFlowing: true,
                    tightFlow: true,
                    space: 10,
                    data: {
                        type: "box",
                        w: 100,
                        h: 100,
                        cornerRadius: 50,
                        background: {
                            type: "solid",
                            r: .8980392156862745,
                            g: .32941176470588235,
                            b: .32941176470588235,
                            a: 1,
                        },
                    },
                },
                {
                    page: 0,
                    x: 100,
                    y: 468,
                    pushFlowing: true,
                    data: {
                        type: "box",
                        w: 100,
                        h: 100,
                        cornerRadius: 50,
                        background: {
                            type: "solid",
                            r: .8980392156862745,
                            g: .32941176470588235,
                            b: .32941176470588235,
                            a: 1,
                        },
                    },
                },
                {
                    page: 0,
                    x: 200,
                    y: 568,
                    pushFlowing: true,
                    data: {
                        type: "box",
                        w: 300,
                        h: 50,
                        cornerRadius: 50,
                        background: {
                            type: "solid",
                            r: .8980392156862745,
                            g: .32941176470588235,
                            b: .32941176470588235,
                            a: 1,
                        },
                    },
                },
                {
                    page: 0,
                    x: 200,
                    y: 650,
                    pushFlowing: true,
                    tightFlow: true,
                    data: {
                        type: "box",
                        w: 100,
                        h: 100,
                        cornerRadius: 50,
                        background: {
                            type: "solid",
                            r: .8980392156862745,
                            g: .32941176470588235,
                            b: .32941176470588235,
                            a: 1,
                        },
                    },
                },
            ],
        },
    ],
};

let bigFileContents = {
    paragraphStyles: { // TODO Make styles lists where entries contain names.
        // TODO Text color
        "Title": {
            family: "Helvetica",
            size: 24,
            weight: 700,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
        "Text": {
            family: "Helvetica",
            size: 12,
            weight: 400,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
        "Footnotes": {
            family: "Helvetica",
            size: 8,
            weight: 400,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
    },
    sectionStyles: {
        "Footnote": {
            family: "Helvetica",
            size: 8,
            weight: 400,
            italic: false,
            underline: {
                type: "none",
            },
            strikethrough: {
                type: "none",
            },
            aboveParagraphSpace: 0,
            belowParagraphSpace: 0,
            lineSpace: 1,
            // …
        },
    },
    sections: [
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Left header text ",
                        },
                    ],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Middle header text ",
                        },
                    ],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Right header text ",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "Was ist JavaScript und\nwarum ist es so beliebt?",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "Gliederung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "1. Die Entstehung von JavaScript",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "1.1. JavaScripts Syntax und Besonderheiten",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "2. JavaScripts Rolle im Internet",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "2.1. DOM-Manipulation und Ereignis-Verarbeitung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "2.2. JavaScript-Engines und die Wichtigkeit von Browser-Kompatibilität",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "3. Das Ökosystem: Frameworks und Bibliotheken",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "4. Grafische und serverseitige Anwendungen",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "5. Zusammenfassung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "5.1. Eigene Meinung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "6. Quellen",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "1. Die Entstehung von JavaScript",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript, oft als JS abgekürzt, ist eine Programmiersprache, mit der Internetseiten ihren Inhalt dynamisch verändern können. Auch kann Nutzern die Möglichkeit geboten werden, mit Seiten zu interagieren. So könnte beim Drücken eines Knopfes JavaScript ausgeführt werden, welches daraufhin ein Menü anzeigt. Fast nichts, das wir heutzutage im Internet unternehmen, wäre ohne JavaScript möglich. Es wird von allen modernen Webbrowsern unterstützt und von über 98% aller Webseiten benutzt.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "1",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Der erste beliebte Webbrowser, Mosaic, wurde 1993 veröffentlicht, doch damals waren Webseiten nur statisch und die Interaktion von Nutzern mit ihnen war auf das Klicken auf Links beschränkt. Ein Jahr später wurde der Netscape Navigator veröffentlicht, welcher ein weiteres Jahr später die Möglichkeit hinzugefügt bekam, Java-Programme in Webseiten einzubetten.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "2",
                        },
                        {
                            type: "text",
                            text: " Gleichzeitig wurde an einer neuen Programmiersprache, die LiveScript heißen und so ähnlich wie Java sein sollte, gearbeitet. Kurz danach wurde LiveScript zu JavaScript umbenannt, um die Beliebtheit von Java zu dieser Zeit zu nutzen, doch dies führte auch zu viel Verwirrung, da die beiden Sprachen, bis auf den Namen, nicht viel miteinander zu tun hatten.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "3, 4",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "1996 hat Microsoft JavaScript kopiert, um rechtliche Konflikte zu vermeiden JScript genannt, und zu ihrem eigenen Webbrowser, Internet Explorer, hinzugefügt.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "5",
                        },
                        {
                            type: "text",
                            text: " Diese Umbenennung führte allerdings zu viel Verwirrung, da viele JavaScript und JScript für ähnlich, aber nicht identisch hielten.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "6",
                        },
                        {
                            type: "text",
                            text: " Gleichzeitig kam auch Unterstützung für die Programmer-Sprache CSS zu Internet Explorer, mit der Internetseiten schöner gestaltet werden konnten. Dies führte dazu, dass Internet Explorer zu Beginn der 2000er mit Abstand der beliebteste Browser wurde. Das von Netscapes entwickelte JavaScript wurde 1997 von der ECMA International Organisation als ECMAScript standardisiert und in den nächsten Jahren wurden ECMAScript 2 und 3 veröffentlicht, damit alle Webbrowser die gleichen Funktionen anbieten konnten.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Mozilla veröffentlichte 2004 ihren Firefox Browser, welcher 2005 auch ECMAScript unterstützte, und zusammen mit Adobe arbeiteten sie an einer neuen Version von ECMAScript, ECMAScript 4, welches jedoch nie veröffentlicht wurde.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "7",
                        },
                        {
                            type: "text",
                            text: " 2008 veröffentlichten Google ihren eigenen Google Chrome Browser, welcher JavaScript durch die V8 Engine deutlich schneller ausführen konnte als andere Browser zu dieser Zeit.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "8",
                        },
                        {
                            type: "text",
                            text: " Dies führte dazu, dass er der beliebteste Browser wurde und alle anderen Webbrowser eine komplett neue JavaScript Engine brauchten. Weil Googles V8 die schnellste JavaScript Engine ist, nutzen sie heutzutage viele Webbrowser, wie zum Beispiel Microsoft Edge, welcher 2020 Internet Explorer als den in Windows eingebauten Webbrowser ablöste.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "9",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "1. W3Techs: Usage statistics of client-side programming languages for websites\n2. The History of the Web: Web Components Before Web Components\n3. Code Guppy: How JavaScript got its name?\n4. Tech Insider: Netscape and Sun Announce JavaScript\n5. DevX: JScript: Definition, Examples\n6. Thought Co: JavaScript and JScript: What's the Difference?\n7. Auto0: The Real Story Behind ECMAScript 4\n8. Life Hacker: Lifehacker Speed Tests: Safari 4, Chrome 2, and More\n9. CSB News: Microsoft permanently disables Internet Explorer for all devices",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "1.1. JavaScripts Syntax und Besonderheiten",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript ist eine Objekt-orientierte Programmiersprache was bedeutet, dass Programme in JavaScript hauptsächlich aus Objekten bestehen. Diese Objekte enthalten sowohl Werte, die für jedes Objekt einer Objektart, auch Klasse genannt, unterschiedlich sein können, als auch Funktionen, die auf diese Werte zugreifen können.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "10",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Zusätzlich zeichnet sich JavaScript durch sein Ereignis-Modell aus. Im Gegensatz zu anderen Programmiersprachen, in denen alle paar Millisekunden überprüft werden muss, ob etwas passiert ist, werden in JavaScript sogenannte „Ereignishörer“ registriert, die der Browser erst dann aufruft, wenn das jeweilige Ereignis aufgetreten ist, wie dass ein Nutzer auf einen Knopf drückt oder etwas eintippt. Es können auch sogenannte Auszeiten registriert werden, die eine Funktion nach einer bestimmten Zeitspanne ausführen, und Intervalle, die die Funktion nach der bestimmten Zeitspanne wiederholen, bis sie unterbrochen werden. Dadurch hat JavaScript übersichtlicheren Quelltext und ist deutlich leistungsfähiger als herkömmliche Sprachen, da es nur ausgeführt werden muss, wenn es wirklich benötigt wird.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "11",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Ein großer Nachteil von JavaScript ist allerdings, dass es nur einen Thread benutzt, was bedeutet, dass mehrere Aufgaben nicht gleichzeitig ausgeführt werden können. Stattdessen müssen sie nacheinander ausgeführt werden, was deutlich länger dauert und besonders problematisch werden kann, wenn eine Aufgabe sehr lange dauert oder aufgrund eines Fehlers nie fertig wird, da dies die gesamte Funktionalität der Internetseite blockiert und der Nutzer nicht mehr mit ihr interagieren kann.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "12",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Ein weiterer häufiger Kritikpunkt ist, dass JavaScript keine Typisierung hat. Dies bedeutet, dass an der gleichen Stelle alle Arten von Werten gespeichert werden können. Dies kann zu Verwirrung führen wenn unklar ist, ob an einer Stelle eine Zahl, ein Text oder eine Liste gespeichert werden soll. Wenn an einer Stelle aus Versehen etwas von der falschen Art gespeichert wird, kann dies zu Fehlern führen und das Programm funktioniert nicht mehr ordnungsgemäß. Um dieses Problem zu lösen und Typisierung zu JavaScript hinzuzufügen, hat Microsoft eine neue Programmiersprache namens „TypeScript“ erstellt, die allerdings nicht von Webbrowsern unterstützt wird.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "13",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "In JavaScript ist es möglich, eine Funktion wie einen ganz normalen Wert, wie zum Beispiel eine Zahl, zu behandeln, mit dem einzigen Unterschied, dass diese Funktion ausgeführt werden kann. In JavaScript ist es dadurch möglich, einer Funktion beim Ausführen eine andere Funktion mitzugeben, welche dann ausgeführt werden kann. Dadurch unterscheidet es sich von anderen Sprachen, in denen einer Funktion ein fester Name gegeben wird, unter dem sie ausgeführt werden muss.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "14",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "10. Simpli Learn: What Is OOP In JavaScript And How Is It Implemented?\n11. Reintech: What is event-driven programming and how is it used in JavaScript?\n12. Elijah Trillionz: Why is JavaScript Single-Threaded and Non-Blocking\n13. TypeScript: TypeScript for JavaScript Programmers\n14. scaler Topics: What are First Class Functions in JavaScript?",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "2. JavaScripts Rolle im Internet",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript ermöglicht es Seiten im Internet, nahezu alles zu realisieren, wodurch sie sogar mehr wie eine reguläre Anwendung und weniger wie eine Webseite wirken können. Eine Funktion, die es in JavaScript ermöglicht, deutlich mehr darzustellen, als mit herkömmlichen Elementen, ist das Leinwand-Element, auf dem Grafiken wie Linien, Kreise, Kurven, Texte und beliebige andere Formen frei platziert werden können.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "15",
                        },
                        {
                            type: "text",
                            text: " Dies ermöglicht es Internetseiten, Verschiedenstes zu beinhalten, wie vollständige und interaktive Karten der Erde, die unter anderem Satellitenbilder und Routen-Vorschläge anzeigen können. Mit Leinwänden ist sogar vollständige 3D-Grafik möglich, mit der unter anderem Spiele, die komplett in JavaScript geschrieben wurden, direkt im Webbrowser spielbar sind.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Zusätzlich zeichnet sich JavaScript durch sein Ereignis-Modell aus. Im Gegensatz zu anderen Programmiersprachen, in denen alle paar Millisekunden überprüft werden muss, ob etwas passiert ist, werden in JavaScript sogenannte „Ereignishörer“ registriert, die der Browser erst dann aufruft, wenn das jeweilige Ereignis aufgetreten ist, wie dass ein Nutzer auf einen Knopf drückt oder etwas eintippt. Es können auch sogenannte Auszeiten registriert werden, die eine Funktion nach einer bestimmten Zeitspanne ausführen, und Intervalle, die die Funktion nach der bestimmten Zeitspanne wiederholen, bis sie unterbrochen werden. Dadurch hat JavaScript übersichtlicheren Quelltext und ist deutlich leistungsfähiger als herkömmliche Sprachen, da es nur ausgeführt werden muss, wenn es wirklich benötigt wird.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "11",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Eine weitere sehr wichtige Funktion ist es, Audio- und Videodateien in Internetseiten einzubetten, denn im Gegensatz zu Bilder können diese mit JavaScript in Internetseiten eingebettet und gesteuert werden. So kann unter anderem gestartet, pausiert oder die Lautstärke oder Geschwindigkeit verändert werden.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "16",
                        },
                        {
                            type: "text",
                            text: " Dies ermöglicht es, Inhalte wie Videos oder Musik für die Nutzer bereitzustellen, ohne welche Webseiten wie YouTube und Spotify nicht existieren könnten.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Es ist aber auch möglich, nicht nur einfache Bilder oder Videos, sondern vollständige Internetseiten als sogenannte iframes in einer Seite einzubetten, mit denen via JavaScript von der Hauptseite interagiert werden kann",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "17",
                        },
                        {
                            type: "text",
                            text: " Dies kann zum Beispiel genutzt werden, um Felder zum Anmelden mit dem Benutzerkonto-System eines Drittanbieters wie Google anzuzeigen und dem Nutzer so das schnelle Anmelden mit diesem Drittanbieter zu ermöglichen, oder um Videos von einer Seite wie YouTube einzubetten.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "18",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "In JavaScript ist es möglich, sogenannte Cookies, die aus einem Namen, einem Wert und anderen optionalen Eigenschaften bestehen, vom Webbrowser speichern zu lassen. Sie können zum Beispiel dafür genutzt werden, die Anmeldedaten der Nutzer zu speichern, damit sie nicht bei jedem Besuch der Seite erneut eingegeben werden müssen. Aber Cookies können auch für von Nutzern unerwünschtes genutzt werden, wie für Tracking, welches Daten über Nutzer sammelt, um ihnen gezielte Werbung anzuzeigen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "19",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Für das Anzeigen dieser Werbung wird auch JavaScript verwendet, um beim Laden der Seite von einem Werbeanbieter Werbung nachzuladen und diese dem Nutzer anzuzeigen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "20",
                        },
                        {
                            type: "text",
                            text: " Da diese Werbung manchmal sehr aufdringlich wird, nutzen viele Nutzer Werbeblocker, die versuchen, sämtliche von JavaScript ausgehende Anfragen an Werbeanbieter zu blockieren. Um das zu verhindern, versuchen manche Seiten, wie neuerdings YouTube, noch mehr JavaScript zu nutzen, um diese Werbeblocker zu erkennen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "21",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "15. Eloquent JavaScript: Drawing on Canvas\n16. Go Make Things: How to play a sound with JavaScript\n17. Log Rocket: The ultimate guide to iframes\n18. Google Identity: Sign In with Google for Web\n19. JavaScript.Info: Cookies, document.cookie\n20. Jivochat: How to Add Ads to Your Website\n21. Wired: YouTube's Crackdown Spurs Record Uninstalls of Ad Blockers",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "2.1. DOM-Manipulation und Ereignis-Verarbeitung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Mit JavaScript ist es möglich, das sogenannte Dokumenten-Objekt-Modell, kurz DOM, aus dem Internetseiten aufgebaut sind, zu verändern. Existierende Elemente können gesucht, verändert und gelöscht werden und neue Elemente erstellt und als sogenannte Kinder in existierenden eingefügt werden. Dies ermöglicht es zum Beispiel, beim Drücken eines Knopfes oder beim Kontext-Klicken auf eine Fläche ein Menü zu erstellen und an der Stelle des Mauszeigers anzuzeigen. In diesem kann der Nutzer dann etwas auswählen, woraufhin die gewählte Option ausgeführt und das Menü wieder geschlossen wird.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "22",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Mit JavaScript können auch bereits existierende Objekte verändert werden, beispielsweise so, dass Nutzer durch das Drücken von verschiedenen Knöpfen zwischen den zugehörigen Kästen wechseln können, in dem diese dynamisch versteckt und wieder gezeigt werden, oder dass ein Knopf deaktiviert wird, sodass der Nutzer ihn nicht drücken kann, bis dieser durch das Ankreuzen eines Kästchens den Bedingungen zustimmt, woraufhin der Knopf aktiviert wird.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript kann ebenfalls genutzt werden, um die Seite anpassungsfähiger zu gestalten. So kann die Internetseite beim Druck eines Knopfes zwischen einem hellen und einem dunklen Modus umschalten, um die Augen der Benutzer zu schonen, Sehschwachen mit kontrastreichen Farben helfen oder sich an Farbenblinde anpassen. Es ist auch möglich, die Größe und Anordnung von Elementen auf der Seite je nach Größe des Bildschirms zu verändern. So kann sichergestellt werden, dass eine Internetseite sowohl auf einem Desktop-Computer, also auch auf einem Handy gut aussieht und problemfrei funktioniert.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "23",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Ebenfalls können Inhalte dynamisch vom Server geladen und zur Internetseite hinzugefügt werden. Dadurch ist es zum Beispiel möglich, nicht alle Inhalte auf einmal zu laden, und sie stattdessen erst, wenn der Nutzer sie erreicht hat und sie benötigt werden, zu laden, um weniger Daten zu transferieren. Auch Seiten wie TikTok, auf denen Nutzer unendlich nach unten rollen können, können mit der Fähigkeit, das Dokument oder DOM zu manipulieren, erstellt werden, in dem das JavaScript, wenn der Nutzer das Ende der Seite erreicht hat, neue Inhalte nachlädt und Elemente mit den neuen Inhalten erstellt und ans Ende der Seite hinzufügt. Ohne dies wären auch Seiten, auf denen Nutzer einander Nachrichten schreiben können, nicht umsetzbar, da diese mit dem Server verbunden sind und neue Nachrichten, die Nutzer erhalten, sofort zum Dokument hinzufügen und dem Nutzer zeigen müssen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "24",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Eine weitere genauso wichtige Funktion ist die bereits erwähnte Möglichkeit, mit sogenannten Ereignishörern auf Ereignisse zu reagieren. Diese Ereignishörer können zu beliebigen Elementen hinzugefügt werden, auf verschiedenes wie das Drücken von Maustasten, das Bewegen einer Maus oder das Tippen auf einer Tastatur reagieren und mit den Informationen wie die Position der Maus oder den gedrückten Tasten auf der Tastatur beliebig handeln.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "25",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "22. The Odin Project: DOM Manipulation and Events\n23. Make Use Of: How to Make Your Website Responsive and Interactive With CSS and JavaScript\n24. Geeks for Geeks: How to dynamically create new elements in JavaScript?\n25. Java T Point: JavaScript addEventListener()",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "2.2. JavaScript-Engines und die Wichtigkeit\nvon Browser-Kompatibilität",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Es gibt viele verschiedene JavaScript Engines, die alle das Ziel haben, den gleichen Quelltext genau gleich und so schnell und effizient wie möglich auszuführen. Zwar benutzt Mozilla Firefox die von Mozilla entwickelte SpiderMonkey Engine, Safari nutzt Apples JavaScriptCore und Internet Explorer benutzte bis zu seiner Abschaffung Microsofts Chakra Engine, aber die meisten anderen Webbrowser wie Opera, Brave, Vivaldi, Samsung Internet und Microsofts Edge Browser, seitdem er nicht mehr Microsofts für Internet Explorers entwickelte Chakra Engine nutzt, basieren auf Google Chrome und nutzen Googles V8 Engine. Durch die Verwendung ihrer Engine in vielen verschiedenen Browsern hat Google, obwohl nur in etwa 60% der Nutzer Chrome nutzen, auf etwa 75% aller Nutzer Einfluss.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "26",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Ein Problem war lange Zeit Microsofts Internet Explorer, denn während andere Webbrowser wie Netscape Navigator und Firefox gemeinsam an dem einheitlichen ECMAScript Standard entwickelten, implementierte Microsoft zwar alle Änderungen am ECMAScript Standard, aber sie arbeiteten hauptsächlich daran, ihre eigenen Funktionen zu ihrem JScript hinzuzufügen. Dies hatte jedoch das Problem, dass Internetseiten, die Funktionen von JScript nutzten, nicht mit anderen Webbrowsern wie Netscape Navigator oder Firefox kompatibel waren.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "27",
                        },
                        {
                            type: "text",
                            text: " Allerdings hatte es auch Vorteile, da Punkte, in denen JScript besser als JavaScript war, in ECMAScript übernommen wurden, wodurch es noch besser wurde.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Heutzutage gibt es kaum noch Unterschiede in der Funktionalität von Webbrowsern, und der gleiche Quelltext wird nahezu immer genau gleich ausgeführt, weshalb Quelltext, der nur für einen Browser ausgelegt ist, nur sehr selten benötigt wird. Dies erleichtert die Entwicklung deutlich, besonders wenn komplexe Anwendungen programmiert werden, bei denen es sehr lange dauern würde, den gesamten Quelltext für verschiedene Browser umzuschreiben und zu testen, da Entwickler diese unterschiedlichen Versionen von JavaScript beziehungsweise JScript lernen müssten. Die einzigen merkbaren Unterschiede sind heutzutage zum Glück die Geschwindigkeit, mit der unterschiedliche Engines das gleiche JavaScript ausführen können, und der Arbeitsspeicher, den sie dabei benötigen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "28",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Zwar ist Kompatibilität mit verschiedenen Webbrowsern mittlerweile sehr einfach, aber dafür steigt die Wichtigkeit der Kompatibilität mit mobilen Geräten wie Handys und Tablets, da diese immer beliebter werden und rund die Hälfte aller Internet-Nutzer sie heutzutage nutzen. Daher ist es wichtig, dass Webseiten sowohl kleine Bildschirme unterstützen, als auch Touch-Steuerung, da auf diesen mobilen Geräten kein Rechtsklick möglich ist und eine Tastatur nur bei einer direkten Eingabe in Eingabefeldern angezeigt wird. Dafür gibt es allerdings Gesten mit mehreren Fingern, die wiederum nicht an Computern möglich sind.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "29",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "26. Stat Counter: Browser Market Share Worldwide\n27. Codedamn: Fixing JavaScript Compatibility Issues with Internet Explorer\n28. Browser Stack: How to resolve JavaScript Cross Browser Compatibility Issues\n29. Intuit: Mobile Website Design 101: Build a Mobile‑Friendly Site",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "3. Das Ökosystem: Frameworks und Bibliotheken",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Frameworks und Bibliotheken sind in der Entwicklung von JavaScript-Anwendungen sehr wichtig, da sie Entwicklern leistungsstarke Werkzeuge bieten, um effiziente und dynamische Internetseiten zu erstellen. Frameworks sind strukturierte Grundlagen, die Entwicklern vorgegebene Strukturen und Architekturen für ihre Anwendungen bieten und enthalten oft vordefinierte Funktionen, um die Entwicklung einfacher und schneller zu gestalten. Bibliotheken hingegen sind Sammlungen von vordefinierten Funktionen, die Entwickler benutzen können, um bestimmte Aufgaben zu erledigen, ohne diese selbst zu programmieren.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "30",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Es gibt eine große und stetig wachsende Anzahl von JavaScript-Frameworks, wie React, das am häufigsten verwendete Framework, welches die Art und Weise, wie Benutzeroberflächen entwickelt werden, revolutionierte, indem es ein modulares System einführte, das auf Komponenten basiert. Diese Modularisierung ermöglicht nicht nur eine einfachere Wartung des Quelltexts, sondern fördert auch die Wiederverwendbarkeit von Komponenten, was insgesamt zu einer effizienteren Entwicklung führt.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Angular, ein weiteres großes Framework, konzentriert sich auf die Erstellung von Anwendungen, die nur aus einer einzelnen Seite bestehen, wobei es TypeScript als Programmiersprache verwendet, was die Programmierung vereinfacht. Vue.js hingegen zeichnet sich durch seine Leichtgewichtigkeit, Flexibilität und Anfängerfreundlichkeit aus und ermöglicht eine schrittweise Implementierung, was besonders für Entwickler, die neu in der Webentwicklung sind, ein Vorteil ist.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "31",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Svelte ist ein kompiliertes Framework und geht einen innovativen Weg, indem es den Quelltext kompiliert, um hochleistungsfähiges JavaScript zu generieren, weshalb Svelte besonders effizient ist, und Entwickler, die optimierte Internetseiten erstellen möchten, anspricht.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "32",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Next.js erleichtern die Verwendung von React und bietet zusätzliche Funktionen, um die Entwicklung weiter zu beschleunigen, während Nuxt.js das gleiche für Vue.js bietet.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "33",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Eine der wichtigsten JavaScript-Bibliotheken ist jQuery, denn es vereinfacht DOM-Manipulation und Ereignis-Verarbeitung, wodurch es bei der Entwicklung interaktiver Webseiten oft hilfreich ist. Obwohl viele dieser Funktionen heutzutage auch von Frameworks direkt angeboten werden, ist jQuery bei der Entwicklung in JavaScript sehr wichtig.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "34",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Es gibt allerdings auch viele weitere Bibliotheken. So ist D3.js eine leistungsstarke Bibliothek für die einfache Erstellung von interaktiven Graphen und anderen Visualisierungen,",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "35",
                        },
                        {
                            type: "text",
                            text: " Lodash enthält viele nützlichen Funktionen, die die Arbeit mit verschiedenen Datenstrukturen, wie Listen und Objekten, erleichtern,",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "36",
                        },
                        {
                            type: "text",
                            text: " und Three.js ermöglicht durch die Nutzung von WebGL vollständige und komplexe 3D-Grafiken und Animation direkt im Webbrowser.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "37",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "30. Assono: Die Bedeutung von JavaScript-Frameworks\n31. Angular: Introduction to Angular concepts\n32. Iteratec: Modern Full-Stack – Warum Svelte anders ist, und ausgezeichnet!\n33. Kinsta: Was ist Next.js? Ein Blick auf das beliebte JavaScript-Framework\n34. Digital Ocean: An Introduction to jQuery\n35. D3 by Observable: What is D3?\n36. Educative: What is Lodash?\n37. Three.js Journey: What is WebGL and why use Three.js",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "4. Grafische und serverseitige Anwendungen",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript wurde entwickelt, um Internetseiten interaktiv zu gestalten, und wird auch primär dafür verwendet. Allerdings wird es auch oft für andere Zwecke genutzt, wie unter Anderem um mit Programmen wie Electron aus Internetseiten normale Computer-Programme zu erstellen, oder um JavaScript ohne grafisches Fenster auszuführen, zum Beispiel als Server mit Programmen wie Node.js oder dem neuen Bun.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Electron ermöglicht es, mit HTML, CSS und JavaScript erstellte Internetseiten als normale Computer-Programme zu verpacken. Dies vereinfacht das Erstellen von grafischen Elementen und Animationen, da bereits gewohnte Web-Technologien genutzt werden, in denen Elemente einfach erstellt und verändert werden können, und bereits existierende Internetseiten können leicht zu Programmen konvertiert werden. Es ist auch nicht notwendig, direkt mit dem Betriebssystem zu arbeiten, wodurch das Erstellen von grafischen Programmen, die unter mehreren Betriebssystemen funktionieren, deutlich erleichtert wird. Allerdings hat Electron den großen Nachteil, dass es, da JavaScript nicht direkt auf dem Prozessor läuft, nicht sehr schnell ist und sehr viel Arbeitsspeicher benötigt. Zusätzlich hat jedes Programm eine komplette JavaScript-Laufzeit und Engine zur HTML-Darstellung, und damit große Teile von Google Chrome eingebaut, weshalb die Programm-Dateien sehr groß sind.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "38",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Node.js ermöglicht es, JavaScript und TypeScript über die Konsole auf einem Server auszuführen und ermöglicht es so, nicht nur die Seite, die dem Nutzer angezeigt wird, sondern auch den Server im Hintergrund vollständig in JavaScript zu implementieren. Dafür nutzt Node.js Googles V8 Engine für JavaScript mit zusätzlichen Funktionen, die unter anderem das Lesen und Schreiben von Dateien ermöglichen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "39",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Ein wichtiger Teil von Node.js ist der Node Package Manager, kurz npm, bei dem jeder sogenannte Pakete, die hilfreiche Module und Bibliotheken beinhalten können, hochladen kann. Andere Nutzer können dann einfach den Namen des Paketes angeben, woraufhin es automatisch heruntergeladen und, wenn eine neue Aktualisierung verfügbar ist, aktualisiert wird. Dadurch müssen Entwickler nicht alles selbst schreiben und können stattdessen einfach das Paket, das oft besser als etwas selbst implementiertes ist, nutzen.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "40",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Seit September 2023 gibt es allerdings auch eine neue Alternative zu Node.js. Bun ist mit Node.js kompatibel und enthält sowohl neue und einfachere, als auch die gleichen Funktionen wie Node.js, weshalb es einfach in ein bestehendes Node.js Projekt eingesetzt werden kann. Es erleichtert aber auch den Start mit serverseitigem JavaScript, da die Installation und das Lernen von Bun einfacher sind und es viele Werkzeuge für das Testen von Programmen bietet. Auch nutzt Bun Apples JavaScriptCore, welches deutlich schneller und insgesamt effizienter als Googles V8 und damit auch Node.js ist.",
                        },
                        {
                            type: "text",
                            styleName: "Footnote",
                            text: "41",
                        },
                    ],
                },
                {
                    styleName: "Footnotes",
                    contents: [
                        {
                            type: "text",
                            text: "38. Kirupa: What Is Electron and Why Is It So Polarizing?\n39. Tech Target: What is the Node.js (Node) runtime environment?\n40. Studio by UXPin: What is npm?\n41. Builder.io: Bun vs Node.js: Everything you need to know",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "5. Zusammenfassung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript, oft als JS abgekürzt, wurde 1995 von Netscapes für ihren Browser entwickelt, damit Internetseiten Nutzern interaktive Inhalte bieten können. Es wurde 1997 von ECMA International standardisiert, wird von allen verbreiteten Browsern genau gleich unterstützt, wird aktiv weiter entwickelt und ist eine sehr beliebte Programmiersprache.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript ermöglicht es unter anderem, den Inhalt einer Seite zu verändern, neue Elemente zu erstellen und existierende zu ändern oder zu entfernen. Zusätzlich kann es auf Ereignisse wie das Drücken von Knöpfen und Tastatureingaben reagieren, was es sehr leistungsstark macht.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript kann nicht nur in allen Webbrowsern verwendet werden, denn Projekte wie Electron ermöglichen es, aus Internetseiten normale Anwendungen zu erstellen, die dadurch nicht mehr im Browser laufen und zusätzliche Funktionen nutzen können. Mit Projekten wie Node.js oder dem neuen Bun ist es sogar möglich, auch den Server, der die Internetseite bereitstellt, direkt in JavaScript zu programmieren. Dank diesen Projekten kann es für nahezu alles verwendet werden und ist äußerst flexibel und vielseitig.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Oft muss vieles allerdings nicht selbst programmiert werden, da es sehr viele Bibliotheken gibt, die bereits viele Funktionen enthalten, wie Three.js, welches vollständige 3D-Darstellung bereitstellt. Zusätzlich können Frameworks wie React oder Angular die Programmierung stark vereinfachen, wodurch es sehr leicht zu nutzen und anfängerfreundlich ist.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Zwar hatJavaScript auch viele Nachteile, wie dass es keine Typisierung hat, mehrere Aufgaben nicht gleichzeitig ausführen kann und sehr viel Arbeitsspeicher benötigt, doch trotzdem ist es seit 11 Jahren, unter anderem dank seiner Flexibilität, Vielseitigkeit und Anfängerfreundlichkeit, die beliebteste Programmiersprache.",
                        },
                    ],
                },
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "5.1. Eigene Meinung",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "JavaScript hat Internetseiten durch die Möglichkeit, sie interaktiv zu gestalten, revolutioniert und ohne es wäre das Internet wahrscheinlich nie so beliebt geworden, wie es heute ist.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Anwendungen, die mit Electron oder ähnlichen Projekten erstellt wurden, finde ich eher unpraktisch, da sie meist langsamer sind, mehr Arbeitsspeicher benötigen und, aufgrund des eingebauten Google Chrome Browsers, mehr Speicherplatz belegen. Aber ich verstehe auch, dass es deutlich einfacher ist, Anwendungen mit Werkzeugen wie Electron zu erstellen.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Es gibt viele nützliche Frameworks und Bibliotheken, die die Entwicklung vereinfachen. Allerdings gibt es mittlerweile so viele, dass die große Anzahl an Frameworks für Leute, die mit JavaScript anfangen wollen, überwältigend sein kann.",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "Insgesamt finde ich, dass JavaScript für die Erstellung von Internetseiten sehr gut geeignet ist, da es viele Möglichkeiten bietet, einfach zu lernen und zu nutzen ist und Internetseiten oft, im Gegensatz zu komplexen 3D Spielen, keine hohe Leistung benötigen, obwohl selbst diese mittlerweile in JavaScript möglich sind.",
                        },
                    ],
                },
            ],
            fixed: [],
        },
        {
            pageSizeTemplateGroup: "paper",
            pageSizeTemplateName: "A4",
            pageW: 595.28,
            pageH: 841.89,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 50,
            marginBottom: 50,
            header: {
                enabled: true,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [
                        {
                            type: "text",
                            text: "Name",
                        },
                    ],
                },
            },
            footer: {
                enabled: false,
                h: 20,
                margin: 20,
                contentLeft: {
                    styleName: "text",
                    contents: [],
                },
                contentMiddle: {
                    styleName: "text",
                    contents: [],
                },
                contentRight: {
                    styleName: "text",
                    contents: [],
                },
            },
            paragraphs: [
                {
                    styleName: "Title",
                    contents: [
                        {
                            type: "text",
                            text: "6. Quellen",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "1. W3Techs: Usage statistics of client-side programming languages for websites.\nw3techs.com/technologies/overview/client_side_language\t\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "2. The History of the Web: Web Components Before Web Components\nthehistoryoftheweb.com/web-components-before-web-components\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "3. Code Guppy: How JavaScript got its name?\ncodeguppy.com/blog/how-javascript-got-its-name\t\t\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "4. Tech Insider: Netscape and Sun Announce JavaScript\ntech-insider.org/java/research/1995/1204.html\t\t\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "5. DevX: JScript: Definition, Examples\ndevx.com/terms/jscript\t\t\t\t\t\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "6. Thought Co: JavaScript and JScript: What's the Difference?\nthoughtco.com/javascript-and-jscript-whats-the-difference-2037681\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "7. Auto0: The Real Story Behind ECMAScript 4\nauth0.com/blog/the-real-story-behind-es4\t\t\t\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "8. Life Hacker: Lifehacker Speed Tests: Safari 4, Chrome 2, and More\nlifehacker.com/lifehacker-speed-tests-safari-4-chrome-2-and-more-5286869\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "9. CSB News: Microsoft permanently disables Internet Explorer for all devices\ncbsnews.com/news/microsoft-permanently-disables-internet-explorer\t\t\t(Stand 5.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "10. Simpli Learn: What Is OOP In JavaScript And How Is It Implemented?\nsimplilearn.com/tutorials/javascript-tutorial/oop-in-javascript\t\t\t\t(Stand 10.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "11. Reintech: What is event-driven programming and how is it used in JavaScript?\nreintech.io/blog/what-is-event-driven-programming-in-javascript\t\t\t(Stand 10.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "12. Elijah Trillionz: Why is JavaScript Single-Threaded and Non-Blocking\nelijahtrillionz.com/why-is-javascript-single-threaded-and-non-blocking\t\t\t(Stand 10.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "13. TypeScript: TypeScript for JavaScript Programmers\ntypescriptlang.org/docs/handbook/typescript-in-5-minutes\t\t\t\t(Stand 10.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "14. scaler Topics: What are First Class Functions in JavaScript?\nscaler.com/topics/first-class-function-in-javascript\t\t\t\t\t(Stand 10.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "15. Eloquent JavaScript: Drawing on Canvas\neloquentjavascript.net/17_canvas.html\t\t\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "16. Go Make Things: How to play a sound with JavaScript\ngomakethings.com/how-to-play-a-sound-with-javascript\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "17. Log Rocket: The ultimate guide to iframes\nblog.logrocket.com/the-ultimate-guide-to-iframes\t\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "18. Google Identity: Sign In with Google for Web\ndevelopers.google.com/identity/gsi\t\t\t\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "19. JavaScript.Info: Cookies, document.cookie\njavascript.info/cookie\t\t\t\t\t\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "20. Jivochat: How to Add Ads to Your Website\njivochat.com/blog/marketing/how-to-add-ads-to-your-website\t\t\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "21. Wired: YouTube's Crackdown Spurs Record Uninstalls of Ad Blockers\nwired.com/story/youtubes-ad-blocker-crackdown-spurs-record-uninstalls\t\t(Stand 19.10.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "22. The Odin Project: DOM Manipulation and Events\ntheodinproject.com/lessons/foundations-dom-manipulation-and-events\t\t(Stand 3.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "23. Make Use Of: How to Make Your Website Responsive and Interactive With CSS and JavaScript\nmakeuseof.com/how-to-make-website-responsive\t\t\t\t\t(Stand 3.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "24. Geeks for Geeks: How to dynamically create new elements in JavaScript?\ngeeksforgeeks.org/how-to-dynamically-create-new-elements-in-javascript\t\t(Stand 3.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "25. Java T Point: JavaScript addEventListener()\njavatpoint.com/javascript-addeventlistener\t\t\t\t\t\t(Stand 3.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "26. Stat Counter: Browser Market Share Worldwide\ngs.statcounter.com/browser-market-share\t\t\t\t\t\t(Stand 13.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "27. Codedamn: Fixing JavaScript Compatibility Issues with Internet Explorer\ncodedamn.com/news/javascript/javascript-not-working-in-internet-explorer\t\t(Stand 13.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "28. Browser Stack: How to resolve JavaScript Cross Browser Compatibility Issues\nbrowserstack.com/guide/resolve-javascript-cross-browser-compatibility-issues\t\t(Stand 13.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "29. Intuit: Mobile Website Design 101: Build a Mobile‑Friendly Site\nmailchimp.com/resources/mobile-website\t\t\t\t\t\t(Stand 13.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "30. Assono: Die Bedeutung von JavaScript-Frameworks\nassono.de/blog/die-bedeutung-von-javascript-frameworks\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "31. Angular: Introduction to Angular concepts\nangular.io/guide/architecture\t\t\t\t\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "32. Iteratec: Modern Full-Stack – Warum Svelte anders ist, und ausgezeichnet!\nexplore.iteratec.com/blog/warum-svelte-anders-ist\t\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "33. Kinsta: Was ist Next.js? Ein Blick auf das beliebte JavaScript-Framework\nkinsta.com/de/wissensdatenbank/next-js\t\t\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "34. Digital Ocean: An Introduction to jQuery\ndigitalocean.com/community/tutorials/an-introduction-to-jquery\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "35. D3 by Observable: What is D3?\nd3js.org/what-is-d3\t\t\t\t\t\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "36. Educative: What is Lodash?\neducative.io/answers/what-is-lodash\t\t\t\t\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "37. Three.js Journey: What is WebGL and why use Three.js\nthreejs-journey.com/lessons/what-is-webgl-and-why-use-three-js\t\t\t(Stand 21.11.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "38. Kirupa: What Is Electron and Why Is It So Polarizing?\nkirupa.com/apps/what_is_electron.htm\t\t\t\t\t\t(Stand 5.12.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "39. Tech Target: What is the Node.js (Node) runtime environment?\ntechtarget.com/whatis/definition/Nodejs\t\t\t\t\t\t(Stand 5.12.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "40. Studio by UXPin: What is npm?\nuxpin.com/studio/blog/what-is-npm\t\t\t\t\t\t\t(Stand 5.12.2023)",
                        },
                    ],
                },
                {
                    styleName: "Text",
                    contents: [
                        {
                            type: "text",
                            text: "41. Builder.io: Bun vs Node.js: Everything you need to know\nbuilder.io/blog/bun-vs-node-js\t\t\t\t\t\t\t(Stand 5.12.2023)",
                        },
                    ],
                },
            ],
            fixed: [],
        },
    ],
};

let quillFileFormat = {
    id: "Quill",
    version: 1,
    tableGroups: {
        "Paragraph Section": {
            field: "type",
            tables: [
                {
                    name: "text",
                    table: "Text Paragraph Section",
                },
                {
                    name: "box",
                    table: "Box Object Data",
                },
                // Other objects like images…
            ],
        },
        "Object Data": {
            field: "type",
            tables: [
                {
                    name: "box",
                    table: "Box Object Data",
                },
                // Other objects like images…
            ],
        },
        "Color": {
            field: "type",
            tables: [
                {
                    name: "solid",
                    table: "Solid Color",
                },
                {
                    name: "linear",
                    table: "Linear Color Gradient",
                },
                {
                    name: "radial",
                    table: "Radial Color Gradient",
                },
            ],
        },
        "Line": {
            field: "type",
            tables: [
                {
                    name: "none",
                },
                {
                    name: "solid",
                    table: "Solid Line",
                },
                {
                    name: "dashed",
                    table: "Dashed Line",
                },
                {
                    name: "dotted",
                    table: "Dotted Line",
                },
                {
                    name: "wave",
                    table: "Wave Line",
                },
                {
                    name: "stacked",
                    table: "Stacked Line",
                },
            ],
        },
        "Single Line": {
            field: "type",
            tables: [
                {
                    name: "solid",
                    table: "Solid Line",
                },
                {
                    name: "dashed",
                    table: "Dashed Line",
                },
                {
                    name: "dotted",
                    table: "Dotted Line",
                },
                {
                    name: "wave",
                    table: "Wave Line",
                },
            ],
        },
    },
    tables: [
        {
            name: "Quill Document",
            fields: [
                {
                    name: "paragraphStyles",
                    type: "map",
                    key: {
                        type: "string",
                    },
                    value: {
                        type: "table",
                        table: "Paragraph Style",
                    },
                },
                {
                    name: "sectionStyles",
                    type: "map",
                    key: {
                        type: "string",
                    },
                    value: {
                        type: "table",
                        table: "Section Style",
                    },
                },
                {
                    name: "sections",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Document Section",
                    },
                },
            ],
        },
        {
            name: "Paragraph Style",
            fields: [
                {
                    name: "family",
                    type: "string",
                },
                {
                    name: "size",
                    type: "float",
                    precision: 4,
                },
                {
                    name: "weight",
                    type: "int",
                    size: 2,
                },
                {
                    name: "italic",
                    type: "bool",
                },
                {
                    name: "underline",
                    type: "table",
                    table: "Line",
                },
                {
                    name: "strikethrough",
                    type: "table",
                    table: "Line",
                },
                {
                    name: "aboveParagraphSpace",
                    type: "float",
                    precision: 4,
                },
                {
                    name: "belowParagraphSpace",
                    type: "float",
                    precision: 4,
                },
                {
                    name: "lineSpace",
                    type: "float",
                    precision: 4,
                },
            ],
        },
        {
            name: "Section Style",
            fields: [
                {
                    name: "family",
                    type: "string",
                    optional: true,
                },
                {
                    name: "size",
                    type: "float",
                    precision: 4,
                    optional: true,
                },
                {
                    name: "weight",
                    type: "int",
                    size: 2,
                    optional: true,
                },
                {
                    name: "italic",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "underline",
                    type: "table",
                    table: "Line",
                    optional: true,
                },
                {
                    name: "strikethrough",
                    type: "table",
                    table: "Line",
                    optional: true,
                },
                {
                    name: "aboveParagraphSpace",
                    type: "float",
                    precision: 4,
                    optional: true,
                },
                {
                    name: "belowParagraphSpace",
                    type: "float",
                    precision: 4,
                    optional: true,
                },
                {
                    name: "lineSpace",
                    type: "float",
                    precision: 4,
                    optional: true,
                },
            ],
        },
        {
            name: "Document Section",
            fields: [
                {
                    name: "pageSizeTemplateGroup",
                    type: "string",
                },
                {
                    name: "pageSizeTemplateName",
                    type: "string",
                },
                {
                    name: "pageW",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                    optional: true,
                },
                {
                    name: "pageH",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                    optional: true,
                },
                {
                    name: "marginLeft",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "marginRight",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "marginTop",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "marginBottom",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "header",
                    type: "table",
                    table: "Header / Footer",
                },
                {
                    name: "footer",
                    type: "table",
                    table: "Header / Footer",
                },
                {
                    name: "paragraphs",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Paragraph",
                    },
                    optional: true,
                },
                {
                    name: "fixed",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Fixed Object",
                    },
                }
            ],
        },
        {
            name: "Header / Footer",
            fields: [
                {
                    name: "enabled",
                    type: "bool",
                },
                {
                    name: "h",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "margin",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "contentLeft",
                    type: "table",
                    table: "Paragraph",
                },
                {
                    name: "contentMiddle",
                    type: "table",
                    table: "Paragraph",
                },
                {
                    name: "contentRight",
                    type: "table",
                    table: "Paragraph",
                },
            ],
        },
        {
            name: "Paragraph",
            fields: [
                {
                    name: "styleName",
                    type: "string",
                },
                {
                    name: "contents",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Paragraph Section",
                    },
                },
            ],
        },
        {
            name: "Text Paragraph Section",
            fields: [
                {
                    name: "styleName",
                    type: "string",
                    optional: true,
                },
                {
                    name: "style",
                    type: "table",
                    table: "Section Style",
                    optional: true,
                },
                {
                    name: "text",
                    type: "string",
                },
                {
                    name: "link",
                    type: "string",
                    optional: true,
                },
            ],
        },
        {
            name: "Fixed Object",
            fields: [
                {
                    name: "page",
                    type: "int",
                    unsigned: true,
                },
                {
                    name: "x",
                    type: "float",
                    precision: 4,
                },
                {
                    name: "y",
                    type: "float",
                    precision: 4,
                },
                {
                    name: "pushFlowing",
                    type: "bool",
                },
                {
                    name: "tightFlow",
                    type: "bool",
                    optional: true,
                },
                {
                    name: "space",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                    optional: true,
                },
                {
                    name: "data",
                    type: "table",
                    table: "Object Data",
                },
            ],
        },
        {
            name: "Box Object Data",
            fields: [
                {
                    name: "w",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "h",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "cornerRadius",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "background",
                    type: "table",
                    table: "Color",
                },
            ],
        },
        // Other objects like images…
        {
            name: "Solid Color",
            fields: [
                {
                    name: "r",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "g",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "b",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "a",
                    type: "range",
                    precision: 2,
                },
            ],
        },
        {
            name: "Linear Color Gradient",
            fields: [
                {
                    name: "colors",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Positioned Color",
                    },
                },
                {
                    name: "angle",
                    type: "range",
                    max: 360,
                    precision: 2,
                },
            ],
        },
        {
            name: "Radial Color Gradient",
            fields: [
                {
                    name: "colors",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Positioned Color",
                    },
                },
            ],
        },
        {
            name: "Positioned Color",
            fields: [
                {
                    name: "r",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "g",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "b",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "a",
                    type: "range",
                    precision: 2,
                },
                {
                    name: "pos",
                    type: "range",
                    precision: 2,
                },
            ],
        },
        {
            name: "Solid Line",
            fields: [
                {
                    name: "width",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "color",
                    type: "table",
                    table: "Color",
                },
            ],
        },
        {
            name: "Dashed Line",
            fields: [
                {
                    name: "width",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "length",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "gap",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "color",
                    type: "table",
                    table: "Color",
                },
            ],
        },
        {
            name: "Dotted Line",
            fields: [
                {
                    name: "width",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "gap",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "color",
                    type: "table",
                    table: "Color",
                },
            ],
        },
        {
            name: "Wave Line",
            fields: [
                {
                    name: "width",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "size",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "color",
                    type: "table",
                    table: "Color",
                },
            ],
        },
        {
            name: "Stacked Line",
            fields: [
                {
                    name: "count",
                    type: "int",
                    unsigned: true,
                },
                {
                    name: "space",
                    type: "float",
                    precision: 4,
                    unsigned: true,
                },
                {
                    name: "lines",
                    type: "list",
                    content: {
                        type: "table",
                        table: "Single Line",
                    },
                },
            ],
        },
    ],
    main: {
        type: "table",
        table: "Quill Document",
    },
};

/*(() => {
    console.time("SDBF with password");
    antica.SDBF.fromBinary(antica.SDBF.toBinary(quillFileContents, quillFileFormat, "Password"), quillFileFormat, "Password");
    console.timeEnd("SDBF with password");

    let toHex = array => [...array].map(n => (+n).toString(16).toUpperCase().padStart(2, "0")).join("");
    let result = `Quill Document:\nJson: ${JSON.stringify(quillFileContents).length} Bytes`;

    let cf = antica.SDBF.toBinary(quillFileContents, quillFileFormat, "Password");
    let cfResult = antica.SDBF.fromBinary(cf, quillFileFormat, "Password");
    result += `\nCompressed Formatted: ${JSON.stringify(quillFileContents) == JSON.stringify(cfResult) ? `${cf.length} Bytes` : "Broken"}`;

    let ucf = antica.SDBF.toBinary(quillFileContents, Object.assign({compression: false}, quillFileFormat), "Password");
    let ucfResult = antica.SDBF.fromBinary(ucf, Object.assign({compression: false}, quillFileFormat), "Password");
    result += `\nUncompressed Formatted: ${JSON.stringify(quillFileContents) == JSON.stringify(ucfResult) ? `${ucf.length} Bytes` : "Broken"}`;

    let cd = antica.SDBF.toBinary(quillFileContents, {}, "Password");
    let cdResult = antica.SDBF.fromBinary(cd, {}, "Password");
    result += `\nCompressed Dynamic: ${JSON.stringify(quillFileContents) == JSON.stringify(cdResult) ? `${cd.length} Bytes` : "Broken"}`;

    let ucd = antica.SDBF.toBinary(quillFileContents, {compression: false}, "Password");
    let ucdResult = antica.SDBF.fromBinary(ucd, {compression: false}, "Password");
    result += `\nUncompressed Dynamic: ${JSON.stringify(quillFileContents) == JSON.stringify(ucdResult) ? `${ucd.length} Bytes` : "Broken"}`;

    console.log(result);

    console.log(toHex(antica.SDBF.toBinary(bigFileContents, Object.assign({compression: false}, /!*quillFileFormat*!/))));
})();*/
