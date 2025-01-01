import { EnumToken } from '../types.js';
import { getConfig } from '../../validation/config.js';
import { walkValues } from '../walk.js';
import { ValidationTokenEnum } from '../../validation/parser/types.js';
import '../../validation/parser/parse.js';

const config = getConfig();
class ComputePrefixFeature {
    static get ordering() {
        return 2;
    }
    static register(options) {
        if (options.removePrefix) {
            for (const feature of options.features) {
                if (feature instanceof ComputePrefixFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }
    run(ast) {
        // @ts-ignore
        const j = ast.chi.length;
        let k = 0;
        // @ts-ignore
        for (; k < j; k++) {
            // @ts-ignore
            const node = ast.chi[k];
            if (node.typ == EnumToken.DeclarationNodeType) {
                if (node.nam.charAt(0) == '-') {
                    const match = node.nam.match(/^-(.*?)-(.*)$/);
                    if (match != null) {
                        const nam = match[2];
                        if (nam.toLowerCase() in config.declarations) {
                            node.nam = nam;
                        }
                    }
                }
                if (node.nam.toLowerCase() in config.declarations) {
                    for (const { value } of walkValues(node.val)) {
                        if (value.typ == EnumToken.IdenTokenType && value.val.charAt(0) == '-' && value.val.charAt(1) != '-') {
                            // @ts-ignore
                            const values = config.declarations[node.nam].ast.slice();
                            const match = value.val.match(/^-(.*?)-(.*)$/);
                            if (match != null) {
                                const val = matchToken({ ...value, val: match[2] }, values);
                                if (val != null) {
                                    // @ts-ignore
                                    value.val = val.val;
                                }
                            }
                        }
                    }
                }
            }
        }
        return ast;
    }
}
function matchToken(token, matches) {
    let result;
    for (let i = 0; i < matches.length; i++) {
        switch (matches[i].typ) {
            case ValidationTokenEnum.Whitespace:
            case ValidationTokenEnum.Comma:
                break;
            case ValidationTokenEnum.Keyword:
                if (token.typ == EnumToken.IdenTokenType && token.val == matches[i].val) {
                    return token;
                }
                break;
            case ValidationTokenEnum.PropertyType:
                if (['ident', 'custom-ident'].includes(matches[i].val)) {
                    if (token.typ == EnumToken.IdenTokenType && token.val == matches[i].val) {
                        return token;
                    }
                }
                else {
                    const val = matches[i].val;
                    if (val in config.declarations || val in config.syntaxes) {
                        // @ts-ignore
                        result = matchToken(token, (config.syntaxes[val] ?? config.declarations[val]).ast.slice());
                        if (result != null) {
                            return result;
                        }
                    }
                }
                break;
            case ValidationTokenEnum.PipeToken:
            case ValidationTokenEnum.ColumnToken:
            case ValidationTokenEnum.AmpersandToken:
                result = matchToken(token, matches[i].l);
                if (result == null) {
                    result = matchToken(token, matches[i].r);
                }
                if (result != null) {
                    return result;
                }
                break;
            case ValidationTokenEnum.Bracket:
                result = matchToken(token, matches[i].chi);
                if (result != null) {
                    return result;
                }
                break;
        }
    }
    return null;
}

export { ComputePrefixFeature };
