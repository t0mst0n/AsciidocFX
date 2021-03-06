/*
 * to-asciidoc - an HTML to Asciidoc converter
 *
 * Copyright 2015, asciidocfx
 * Licenced under the MIT licence
 *
 */

var nbspRegex = new RegExp(String.fromCharCode(160), "g");

function removeNRBreaks(text) {
    return text
        .replace(/^(\n|\r)+/, "") // Remove line-breaks from start
        .replace(/(\n|\r)+$/, ""); // Remove line-breaks from end
}

function repeatStuff(s, n) {
    var a = [];
    while (a.length < n) {
        a.push(s);
    }
    return a.join('');
}

var toMarkdown = function (string) {

    string = string.replace(nbspRegex, " ");

    var all = document.createElement("div");
    all.innerHTML = string;

    // fix for apple converted space
    var spans = all.querySelectorAll("span.Apple-converted-space");
    for (var i = 0; i < spans.length; i++) {
        var parentNode = spans[i].parentNode || "";
        if (parentNode)
            parentNode.replaceChild(document.createTextNode(" "), spans[i]);
    }

    // crayon-syntax higlighter fix
    $(all).find("div[class*='crayon-syntax']").each(function () {
        var elem = $(this);
        elem.find(".crayon-line").append("\n");
        elem.find(".crayon-num").remove();
        var code = $("<code></code>");
        code.append(elem.text());
        elem.replaceWith(code);
    });


    // google syntax higlighter fix
    $(all).find("div.syntaxhighlighter").each(function () {
        var elem = $(this);
        elem.find(".line").append("\n");
        elem.find(".number,.toolbar,.gutter").remove();
        console.log(elem.text());
        var code = $("<code></code>");
        code.append(elem.text());
        elem.replaceWith(code);
    });

    // table converter
    var tables = all.querySelectorAll("table");
    for (var i = 0; i < tables.length; i++) {
        var tableText = "";
        var table = tables[i];
        var trs = table.querySelectorAll("tr");
        var caption = table.querySelector("caption");

        tableText += "\n\n";
        if (caption)
            tableText += "." + caption.innerText.replace(/Table \d+\. /, "") + "\n";

        for (var j = 0; j < trs.length; j++) {
            var tr = trs[j];
            var tdSelector = tr.querySelectorAll("td");
            var thSelector = tr.querySelectorAll("th");
            var columns = tdSelector.length == 0 ? thSelector : tdSelector;
            var lastCellLength = 0;

            var row = [].slice.call(columns).map(function (e) {
                var cellContent = (e.innerHTML ? removeNRBreaks(traverse(e.innerHTML)) : "");
                lastCellLength = cellContent.length == 0 ? 2 : cellContent.length;
                return "| " + cellContent;
            }).join(" ");

            tableText += row + "\n";

            if (thSelector.length != 0)
                tableText += [].slice.call(columns).map(function (e) {
                    return "| " + repeatStuff("-", lastCellLength);
                }).join(" ") + "\n";
        }

        if (table.parentNode)
            table.parentNode.replaceChild(document.createTextNode(tableText), table);
    }


    // fix pre > code block
    var codes = all.querySelectorAll("pre,code,pre>code");
    for (var i = 0; i < codes.length; i++) {
        var code = codes[i];
        if (code.innerHTML.split(/\n|\r|<br>|<\/br>/).length > 1) {
            if (code.parentNode)
                code.parentNode.replaceChild(document.createTextNode("\n```java\n" + code.innerText + "\n```\n"), code);
        }
    }

//
//    for (var i = 0; i < codes.length; i++) {
//        var code = codes[i];
//        if (code.innerHTML.split(/\n|\r|<br>|<\/br>/).length > 1) {
//            if (code.parentNode)
//                code.parentNode.replaceChild(document.createTextNode("\n[source,java]\n----\n" + code.innerText + "\n----\n"), code);
//        }
//    }

//    console.log($(all).html());

    // remove anchor surrounding an img
    var images = all.querySelectorAll("img");
    for (var i = 0; i < images.length; i++) {
        var parentNode = images[i].parentNode || "";
        if (parentNode.parentNode)
            if (parentNode.constructor == HTMLAnchorElement)
                parentNode.parentNode.replaceChild(images[i], parentNode);
    }

    string = traverse(all.innerHTML);

    function traverse(string) {
        var ELEMENTS = [
            {
                patterns: ["script", "iframe", "meta", "embed"],
                replacement: function (str, attrs, innerHTML) {
                    return "";
                }
            },
            {
                patterns: ["div", "span", "body", "i", "section", "html", "article", "header", "label", "textarea", "kbd"],
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? innerHTML : '';
                }
            },
            {
                patterns: 'p',
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? '\n\n' + innerHTML + '\n' : '';
                }
            },
            {
                patterns: 'br',
                type: 'void',
                replacement: '  \n'
            },
            {
                patterns: 'h([1-6])',
                patterns: 'h([1-6])',
                replacement: function (str, hLevel, attrs, innerHTML) {
                    var hPrefix = '';
                    for (var i = 0; i < hLevel; i++) {
                        hPrefix += '#';
                    }
                    return '\n\n' + hPrefix + ' ' + innerHTML + '\n';
                }
            },
            {
                patterns: 'hr',
                type: 'void',
                replacement: '\n\n* * *\n'
            },
            {
                patterns: 'a',
                replacement: function (str, attrs, innerHTML) {
                    var href = attrs.match(attrRegExp('href')),
                        title = attrs.match(attrRegExp('title'));
                    return href ? '[' + innerHTML + ']' + '(' + href[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')' : str;
                }
            },
            {
                patterns: ['b', 'strong'],
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? '**' + innerHTML + '**' : '';
                }
            },
            {
                patterns: ['i', 'em'],
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? '__' + innerHTML + '__' : '';
                }
            },
            {
                patterns: 'u',
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? '[underline]##' + innerHTML + '##' : '';
                }
            },
            {
                patterns: 'del',
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? '[line-through]##' + innerHTML + '##' : '';
                }
            },
            {
                patterns: 'code',
                replacement: function (str, attrs, innerHTML) {
                    return innerHTML ? "`" + innerHTML + "`" : '';
                }
            },
            {
                patterns: 'img',
                type: 'void',
                replacement: function (str, attrs, innerHTML) {
                    var src = attrs.match(attrRegExp('src')),
                        alt = attrs.match(attrRegExp('alt')),
                        title = attrs.match(attrRegExp('title'));
                    return src ? '![' + (alt && alt[1] ? alt[1] : '') + ']' + '(' + src[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')' : '';
                }
            }
        ];

        for (var i = 0, len = ELEMENTS.length; i < len; i++) {
            if (typeof ELEMENTS[i].patterns === 'string') {
                string = replaceEls(string, {
                    tag: ELEMENTS[i].patterns,
                    replacement: ELEMENTS[i].replacement,
                    type: ELEMENTS[i].type
                });
            }
            else {
                for (var j = 0, pLen = ELEMENTS[i].patterns.length; j < pLen; j++) {
                    string = replaceEls(string, {
                        tag: ELEMENTS[i].patterns[j],
                        replacement: ELEMENTS[i].replacement,
                        type: ELEMENTS[i].type
                    });
                }
            }
        }

        function replaceEls(html, elProperties) {
            var pattern = elProperties.type === 'void' ? '<' + elProperties.tag + '\\b([^>]*)\\/?>' : '<' + elProperties.tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + elProperties.tag + '>',
                regex = new RegExp(pattern, 'gi'),
                markdown = '';
            if (typeof elProperties.replacement === 'string') {
                markdown = html.replace(regex, elProperties.replacement);
            }
            else {
                markdown = html.replace(regex, function (str, p1, p2, p3) {
                    return elProperties.replacement.call(this, str, p1, p2, p3);
                });
            }
            return markdown;
        }

        return string;
    }

    function strip(html) {
        html = html.replace(/<[\/]?(meta)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(code)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(span)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(div)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(section)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(i)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(html)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(body)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(article)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(header)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(address)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(abbr)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(small)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(table)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(td)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(tr)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(tbody)[^><]*>/ig, "");
        html = html.replace(/<[\/]?(th)[^><]*>/ig, "");
        html = html.replace(/(&gt;)/ig, ">");
        html = html.replace(/(&lt;)/ig, "<");
        html = html.replace(/(&amp;)/ig, "&");
        html = html.replace(/(\u2014)/ig, "--");
        html = html.replace(/(\u2009)/ig, " ");
        return html;
    }

    function attrRegExp(attr) {
        return new RegExp(attr + '\\s*=\\s*["\']?([^"\']*)["\']?', 'i');
    }

    // Pre code blocks

    string = string.replace(/<pre\b[^>]*>`([\s\S]*?)`<\/pre>/gi, function (str, innerHTML) {
        var text = text.replace(/^\t+/g, '  '); // convert tabs to spaces (you know it makes sense)
        text = text.replace(/\n/g, '\n    ');
        return '\n\n    ' + text + '\n';
    });

    // Lists

    // Escape numbers that could trigger an ol
    // If there are more than three spaces before the code, it would be in a pre tag
    // Make sure we are escaping the period not matching any character
    string = string.replace(/^(\s{0,3}\d+)\. /g, '$1\\. ');

    // Converts lists that have no child lists (of same type) first, then works its way up
    var noChildrenRegex = /<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;
    while (string.match(noChildrenRegex)) {
        string = string.replace(noChildrenRegex, function (str) {
            return replaceLists(str);
        });
    }

    function replaceLists(html) {

        html = html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, function (str, listType, innerHTML) {
            var lis = innerHTML.split('</li>');
            lis.splice(lis.length - 1, 1);

            for (i = 0, len = lis.length; i < len; i++) {
                if (lis[i]) {
                    var prefix = (listType === 'ol') ? (i + 1) + ".  " : "*   ";
                    lis[i] = lis[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function (str, innerHTML) {

                        innerHTML = innerHTML.replace(/^\s+/, '');
                        innerHTML = innerHTML.replace(/\n\n/g, '\n\n    ');
                        // indent nested lists
                        innerHTML = innerHTML.replace(/\n([ ]*)+(\*|\d+\.) /g, '\n$1    $2 ');
                        return prefix + innerHTML;
                    });
                }
                lis[i] = lis[i].replace(/(.) +$/m, '$1');
            }
            return lis.join('\n');
        });

        return '\n\n' + html.replace(/[ \t]+\n|\s+$/g, '');
    }

    // Blockquotes
    var deepest = /<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;
    while (string.match(deepest)) {
        string = string.replace(deepest, function (str) {
            return replaceBlockquotes(str);
        });
    }

    function replaceBlockquotes(html) {
        html = html.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, function (str, inner) {
            inner = inner.replace(/^\s+|\s+$/g, '');
            inner = cleanUp(inner);
            inner = inner.replace(/^/gm, '> ');
            inner = inner.replace(/^(>([ \t]{2,}>)+)/gm, '> >');
            return inner;
        });
         return "\n"+html+"\n";;
    }

    function cleanUp(string) {
        string = strip(string);
        string = string.replace(/^[\t\r\n]+|[\t\r\n]+$/g, ''); // trim leading/trailing whitespace
        string = string.replace(/\n\s+\n/g, '\n\n');
        string = string.replace(/\n{3,}/g, '\n\n'); // limit consecutive linebreaks to 2
        string = strip(string);
        return string;
    }

    return cleanUp(string);
};
