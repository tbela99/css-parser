import config from './config.json.js';
import './parser/types.js';
import { parseSyntax } from './parser/parse.js';

const parsedSyntaxes = new Map();
Object.freeze(config);
function getSyntaxConfig() {
    // @ts-ignore
    return config;
}
function getParsedSyntax(group, key) {
    //
    // console.error({group, key});
    if (!(key in config[group])) {
        const matches = key.match(/(@?)(-[a-zA-Z]+)-(.*?)$/);
        if (matches != null) {
            key = matches[1] + matches[3];
        }
        if (!(key in config[group])) {
            return null;
        }
    }
    const index = group + '.' + key;
    // @ts-ignore
    // console.error(`> group: '${group}' | key: '${key}' | syntax: "${config[group][key].syntax}"`);
    // @ts-ignore
    if (!parsedSyntaxes.has(index)) {
        // @ts-ignore
        parsedSyntaxes.set(index, parseSyntax(config[group][key].syntax).chi);
    }
    return parsedSyntaxes.get(index);
}

export { getParsedSyntax, getSyntaxConfig };
