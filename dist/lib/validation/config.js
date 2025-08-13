import config from './config.json.js';
import './parser/types.js';
import { parseSyntax } from './parser/parse.js';

const parsedSyntaxes = new Map();
Object.freeze(config);
function getSyntaxConfig() {
    // @ts-ignore
    return config;
}
function getSyntax(group, key) {
    // @ts-ignore
    let obj = config[group];
    const keys = Array.isArray(key) ? key : [key];
    for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        if (!(key in obj)) {
            if ((i == 0 && key.charAt(0) == '@') || key.charAt(0) == '-') {
                const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
                if (matches != null) {
                    key = matches[1] + matches[3];
                }
            }
        }
        // @ts-ignore
        obj = obj[key];
    }
    // @ts-ignore
    return obj?.syntax ?? null;
}
function getParsedSyntax(group, key) {
    // @ts-ignore
    let obj = config[group];
    const keys = Array.isArray(key) ? key : [key];
    for (let i = 0; i < keys.length; i++) {
        key = keys[i];
        if (!(key in obj)) {
            if ((i == 0 && key.charAt(0) == '@') || key.charAt(0) == '-') {
                const matches = key.match(/^(@?)(-[a-zA-Z]+)-(.*?)$/);
                if (matches != null) {
                    key = matches[1] + matches[3];
                }
            }
            if (!(key in obj)) {
                return null;
            }
        }
        // @ts-ignore
        obj = obj[key];
    }
    const index = group + '.' + keys.join('.');
    // @ts-ignore
    if (!parsedSyntaxes.has(index)) {
        // @ts-ignore
        const syntax = parseSyntax(obj.syntax);
        // @ts-ignore
        parsedSyntaxes.set(index, syntax.chi);
    }
    return parsedSyntaxes.get(index);
}

export { getParsedSyntax, getSyntax, getSyntaxConfig };
