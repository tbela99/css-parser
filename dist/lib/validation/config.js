import config from './config.json.js';
import { trimSyntaxArray, parseSyntax } from './parser/parse.js';
import { ValidationTokenEnum } from './parser/typedef.js';
import { memoize } from '../parser/utils/cache.js';

const parsedSyntaxes = new Map();
Object.freeze(config);
function getSyntaxConfig() {
    // @ts-expect-error
    return config;
}
function findNode(group, key) {
    // @ts-expect-error
    let obj = config[group];
    const keys = Array.isArray(key) ? key : [key];
    for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        if (!(key in obj)) {
            if ((i == 0 && key.charAt(0) == "@") || key.charAt(0) == "-") {
                const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
                if (matches != null) {
                    key = matches[1] + matches[3];
                }
            }
            if (!(key in obj)) {
                return null;
            }
        }
        // @ts-expect-error
        obj = obj[key];
    }
    return obj;
}
const getParsedSyntax = memoize((group, key) => {
    // @ts-expect-error
    const obj = findNode(group, key);
    if (obj == null) {
        return null;
    }
    const keys = Array.isArray(key) ? key : [key];
    const index = group + "." + keys.join(".");
    if (!parsedSyntaxes.has(index)) {
        const syntax = Object.freeze(trimSyntaxArray(parseSyntax(obj.syntax)));
        parsedSyntaxes.set(index, syntax);
    }
    return parsedSyntaxes.get(index);
});
const getSyntaxRule = memoize((group, key) => {
    const node = findNode(group, key);
    if (node == null) {
        return null;
    }
    let syntaxRules = getParsedSyntax(group, key);
    if (syntaxRules == null) {
        return null;
    }
    let blockStart = -1;
    let blockEnd = -1;
    let i;
    for (i = 0; i < syntaxRules.length; i++) {
        if (syntaxRules[i].typ === ValidationTokenEnum.OpenCurlyBrace ||
            syntaxRules[i].typ === ValidationTokenEnum.SemiColon) {
            blockStart = i;
            break;
        }
    }
    if (blockStart != -1) {
        i = syntaxRules.length;
        while (i--) {
            if (syntaxRules[i].typ === ValidationTokenEnum.CloseCurlyBrace) {
                blockEnd = i;
                break;
            }
        }
    }
    const block = blockStart == -1 ? null : trimSyntaxArray(syntaxRules.slice(blockStart + 1, blockEnd));
    const prelude = trimSyntaxArray(blockStart == -1 ? syntaxRules.slice() : syntaxRules.slice(0, blockStart));
    let propertyDescriptors = null;
    // @ts-expect-error
    if (node.descriptors != null) {
        propertyDescriptors = {};
        // @ts-expect-error
        for (const [key, value] of Object.entries(node.descriptors)) {
            // @ts-expect-error
            propertyDescriptors[key] = parseSyntax(typeof value === "string" ? value : value.syntax);
        }
    }
    return {
        acceptAnyDeclaration: node.syntax.includes("<declaration-list>"),
        acceptAnyRule: node.syntax.includes("<group-rule-body>") ||
            node.syntax.includes("<stylesheet>"),
        getPreludeRules: () => prelude,
        getBlockRules: () => (block == null || block.length === 0 ? null : block),
        getRules: () => syntaxRules,
        getPropertyDescriptors: () => propertyDescriptors,
    };
});

export { getParsedSyntax, getSyntaxConfig, getSyntaxRule };
