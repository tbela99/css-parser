import config from './config.json.js';
import './parser/types.js';
import { parseSyntax, walkValidationToken, renderSyntax } from './parser/parse.js';

const parsedSyntaxes = new Map();
Object.freeze(config);
function getSyntaxConfig() {
    // @ts-ignore
    return config;
}
function getParsedSyntax(group, key) {
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
    if (!parsedSyntaxes.has(index)) {
        // @ts-ignore
        const syntax = parseSyntax(config[group][key].syntax);
        for (const node of syntax.chi) {
            for (const { token, parent } of walkValidationToken(node)) {
                token.text = renderSyntax(token);
            }
        }
        // @ts-ignore
        parsedSyntaxes.set(index, syntax.chi);
    }
    return parsedSyntaxes.get(index);
}

export { getParsedSyntax, getSyntaxConfig };
