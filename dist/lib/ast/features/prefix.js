import { EnumToken } from '../types.js';
import { getSyntaxConfig } from '../../validation/config.js';
import '../../validation/parser/types.js';
import '../../validation/parser/parse.js';
import { splitRule } from '../minify.js';
import { walkValues } from '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { webkitPseudoAliasMap } from '../../syntax/syntax.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';
import '../../validation/syntaxes/complex-selector.js';
import '../../validation/syntax.js';

const config = getSyntaxConfig();
function replacePseudo(tokens) {
    return tokens.map((raw) => raw.map(r => {
        if (r.startsWith(':-')) {
            const i = r.indexOf('(');
            let key = i != -1 ? r.slice(1, i) + '()' : r.slice(1);
            if (key in webkitPseudoAliasMap) {
                return ':' + webkitPseudoAliasMap[key] + (i == -1 ? '' : r.slice(i));
            }
        }
        return r;
    }));
}
function replaceAstNodes(tokens) {
    for (const { value } of walkValues(tokens)) {
        if (value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType) {
            if (value.val.startsWith(':-')) {
                let key = value.val.slice(1) + (value.typ == EnumToken.PseudoClassFuncTokenType ? '()' : '');
                if (key in webkitPseudoAliasMap) {
                    value.val = ':' + webkitPseudoAliasMap[key];
                }
            }
        }
    }
}
class ComputePrefixFeature {
    get ordering() {
        return 2;
    }
    get preProcess() {
        return true;
    }
    get postProcess() {
        return false;
    }
    static register(options) {
        if (options.removePrefix) {
            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }
    run(node) {
        if (node.typ == EnumToken.RuleNodeType) {
            node.sel = replacePseudo(splitRule(node.sel)).reduce((acc, curr, index) => acc + (index > 0 ? ',' : '') + curr.join(''), '');
            if (node.raw != null) {
                node.raw = replacePseudo(node.raw);
            }
            if (node.optimized != null) {
                node.optimized.selector = replacePseudo(node.optimized.selector);
            }
            if (node.tokens != null) {
                replaceAstNodes(node.tokens);
            }
        }
        else if (node.typ == EnumToken.DeclarationNodeType) {
            if (node.nam.charAt(0) == '-') {
                const match = node.nam.match(/^-([^-]+)-(.+)$/);
                if (match != null) {
                    const nam = match[2];
                    if (nam.toLowerCase() in config.declarations) {
                        node.nam = nam;
                        replaceAstNodes(node.val);
                    }
                }
            }
        }
        return node;
    }
}

export { ComputePrefixFeature };
