/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import config from '../../data/validation.json.js';
import { trimSyntaxArray, parseSyntax } from './parser/parse.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from './parser/typedef.js';
import { memoize } from '../parser/utils/cache.js';

const parsedSyntaxes = new Map();
Object.freeze(config);
function getSyntaxConfig() {
    // @ts-expect-error
    return config;
}
/**
 * find a syntax definition in a group.
 *
 * the syntaxes are generated from webref (see scripts/webref.ts): the functions and the patched syntaxes are stored in
 * the {@link ValidationSyntaxGroupEnum.Syntaxes} group, the value types are stored in the
 * {@link ValidationSyntaxGroupEnum.Types} group with their name without the angle brackets (`color`).
 * a {@link ValidationSyntaxGroupEnum.Syntaxes} lookup falls back to the {@link ValidationSyntaxGroupEnum.Types} group
 * @param group
 * @param key
 */
function lookupNode(group, key) {
    const groups = config;
    if (groups[group]?.[key] != null) {
        let node = groups[group][key];
        // an alias uses the syntax of the standard property: `-webkit-align-content` is an alias of `align-content`.
        // the name of the declaration is not changed
        for (let i = 0; node.alias != null && i < 4; i++) {
            const target = groups[group][node.alias];
            if (target == null) {
                return null;
            }
            node = target;
        }
        return node.alias != null ? null : node;
    }
    if (group === ValidationSyntaxGroupEnum.Syntaxes) {
        return groups[ValidationSyntaxGroupEnum.Types]?.[key] ?? null;
    }
    return null;
}
/**
 * true if a type or a function syntax is defined
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
function hasSyntax(key) {
    return lookupNode(ValidationSyntaxGroupEnum.Syntaxes, key) != null;
}
/**
 * return the raw syntax of a type or a function
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
function getSyntax(key) {
    return lookupNode(ValidationSyntaxGroupEnum.Syntaxes, key)?.syntax ?? null;
}
function findNode(group, key) {
    let obj = lookupNode(group, key);
    if (obj == null) {
        if (key.charAt(0) === "@" || key.charAt(0) === "-") {
            const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
            if (matches != null) {
                key = matches[1] + matches[3];
            }
        }
        obj = lookupNode(group, key);
        if (obj == null) {
            return null;
        }
    }
    return obj;
}
const getParsedSyntax = memoize((group, key) => {
    // @ts-expect-error
    const obj = findNode(group, key);
    if (obj == null) {
        return null;
    }
    const index = group + "." + key;
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
    if (blockStart !== -1) {
        i = syntaxRules.length;
        while (i--) {
            if (syntaxRules[i].typ === ValidationTokenEnum.CloseCurlyBrace) {
                blockEnd = i;
                break;
            }
        }
    }
    let block = blockStart === -1 ? null : trimSyntaxArray(syntaxRules.slice(blockStart + 1, blockEnd));
    let prelude = trimSyntaxArray(blockStart === -1 ? syntaxRules.slice() : syntaxRules.slice(0, blockStart));
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
    let optionalBody = false;
    if (block == null || block.length === 0) {
        let k = prelude.length - 1;
        if (ValidationTokenEnum.SemiColon === prelude[k].typ) {
            k--;
        }
        if (k >= 0 && ValidationTokenEnum.Bracket === prelude[k].typ) {
            if (prelude[k].chi[0].typ ===
                ValidationTokenEnum.OpenCurlyBrace &&
                prelude[k].chi.at(-1).typ ===
                    ValidationTokenEnum.CloseCurlyBrace) {
                block = prelude[k].chi.slice(1, -1);
                optionalBody = prelude[k].isOptional ?? false;
            }
        }
    }
    return {
        optionalBody,
        acceptAnyDeclaration: node.syntax.includes("<declaration-list>"),
        acceptAnyRule: node.syntax.includes("<group-rule-body>") ||
            node.syntax.includes("<stylesheet>"),
        getPreludeRules: () => prelude,
        getBlockRules: () => (block == null || block.length === 0 ? null : block),
        // getRules: () => syntaxRules,
        getPropertyDescriptors: () => propertyDescriptors,
    };
});

export { getParsedSyntax, getSyntax, getSyntaxConfig, getSyntaxRule, hasSyntax };
