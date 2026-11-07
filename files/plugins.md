---
title: Plugins API
group: Documents
category: Guides
---

# Plugins

The CSS parser supports plugin-style extensions through its [visitor API](./transform.md). 

### Example

A plugin implemented as visitor function that inlines all images under a specific size.

```ts
import {
    EnumToken,
    load,
    Token,
    transform,
    ResponseType,
    AstArena,
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
    return async function UrlFunctionTokenType(arena: AstArena, node: Token) {
        // the parent of a top level value token is the declaration node id
        if (arena.getType(arena.getParent(node)) == EnumToken.DeclarationNodeType) {
            const t = arena.findToken(
                node,
                (arena, t) => arena.getType(t) != EnumToken.WhitespaceTokenType && arena.getType(t) != EnumToken.CommaTokenType,
            );

            if (t == null) {
                return;
            }

            const url = arena.getType(t) == EnumToken.StringTokenType ? arena.str(t).slice(1, -1) : arena.str(t);

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

            arena.setType(t, EnumToken.StringTokenType);
            arena.setStr(t, `"data:image/${matches[3].toLowerCase()};base64,${toBase64(new Uint8Array(buffer))}"`);
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

Here is the same example, with the plugin executed when entering the node.

```ts
import {
    AstArena,
    EnumToken,
    load,
    ResponseType,
    Token,
    transform,
    WalkerEvent,
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
    return {
        UrlFunctionTokenType: {
            type: WalkerEvent.Enter,
            handler: async function (arena: AstArena, node: Token) {
                // the parent of a top level value token is the declaration node id
                if (arena.getType(arena.getParent(node)) == EnumToken.DeclarationNodeType) {
                    const t = arena.findToken(
                        node,
                        (arena: AstArena, t: Token) => arena.getType(t) != EnumToken.WhitespaceTokenType && arena.getType(t) != EnumToken.CommaTokenType,
                    );

                    if (t == null) {
                        return;
                    }

                    const url = arena.getType(t) == EnumToken.StringTokenType ? arena.str(t).slice(1, -1) : arena.str(t);

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

                    arena.setType(t, EnumToken.StringTokenType);
                    arena.setStr(t, `"data:image/${matches[3].toLowerCase()};base64,${toBase64(new Uint8Array(buffer))}"`);
                }
            }
        }
    }
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