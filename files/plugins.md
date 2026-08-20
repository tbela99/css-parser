---
title: Plugins API
group: Documents
category: Guides
---

# Plugins

The CSS parser supports plugin-style extensions through its [visitor API](./transform.md). 

### Example

A plugin implemented as visitor that inlines all images under a specific size.

```ts
import {
    EnumToken,
    FunctionURLToken,
    load,
    StringToken,
    Token,
    transform,
    UrlToken,
    ResponseType,
    AstDeclaration,
    AstNode
} from "@tbela99/css-parser";

function toBase64(arraybuffer: Uint8Array) {
    // @ts-ignore
    if (typeof Uint8Array.prototype.toBase64! == "function") {
        // @ts-ignore
        return arraybuffer.toBase64();
    }

    let binary = "";
    for (const byte of arraybuffer) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function inlineImagesPlugin(maxSize: number, extensions: string[]) {
    return async function UrlFunctionTokenType(node: FunctionURLToken, parent: AstNode) {
        if (parent.typ == EnumToken.DeclarationNodeType) {
            const t = node.chi.find(
                (t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.CommaTokenType,
            ) as Token;

            if (t == null) {
                return;
            }

            const url = t.typ == EnumToken.StringTokenType ? (t as StringToken).val.slice(1, -1) : (t as UrlToken).val;

            if (url.startsWith("data:")) {
                return;
            }

            const matches = /(.*?\/)?([^/.]+)\.([^?#]+)([?#].*)?$/.exec(url);

            if (matches == null || !extensions.includes(matches[3].toLowerCase())) {
                return;
            }

            const buffer = (await load(url, ".", ResponseType.ArrayBuffer)) as ArrayBuffer;

            if (buffer.byteLength > maxSize) {
                return;
            }

            Object.assign(t, {
                typ: EnumToken.StringTokenType,
                val: `"data:image/${matches[3].toLowerCase()};base64,${toBase64(new Uint8Array(buffer))}"`,
            });
        }
    };
}

// 35 kb or something
const maxSize = 35 * 1024;
// accepted images
const extensions = ["jpg", "gif", "png", "webp"];
const css = `
.goal .bg-indigo {
  background: url(/img/animatecss-opengraph.jpg);
}
`;

const result = await transform(css, {
    visitor: inlineImagesPlugin(maxSize, extensions),
});

console.error(result.code);
// .goal .bg-indigo{background:url("data:image/jpg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4QugRXhpZgAA ...")}
```

------
[← Sourcemap](./sourcemap.md) | [Syntax Lowering →](./syntax-lowering.md) 