import { EnumToken, SyntaxValidationResult } from '../types.js';
import { getSyntaxConfig } from '../../validation/config.js';
import '../../validation/parser/types.js';
import '../../validation/parser/parse.js';
import { splitRule } from '../minify.js';
import { walkValues } from '../walk.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { pseudoAliasMap } from '../../syntax/syntax.js';
import { renderToken } from '../../renderer/render.js';
import { funcLike } from '../../syntax/color/utils/constants.js';
import '../../validation/syntaxes/complex-selector.js';
import { evaluateSyntax } from '../../validation/syntax.js';

const config = getSyntaxConfig();
function replacePseudo(tokens) {
    return tokens.map((raw) => raw.map(r => {
        if (r.includes('(')) {
            const index = r.indexOf('(');
            const name = r.slice(0, index) + '()';
            if (name in pseudoAliasMap) {
                return pseudoAliasMap[name] + r.slice(index);
            }
            return r;
        }
        return r in pseudoAliasMap && pseudoAliasMap[r] in config["selectors" /* ValidationSyntaxGroupEnum.Selectors */] ? pseudoAliasMap[r] : r;
    }));
}
function replaceAstNodes(tokens, root) {
    let result = false;
    for (const { value, parent } of walkValues(tokens, root)) {
        if (value.typ == EnumToken.IdenTokenType || value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) {
            let key = value.val + (value.typ == EnumToken.PseudoClassFuncTokenType ? '()' : '');
            if (key in pseudoAliasMap) {
                const isPseudClass = pseudoAliasMap[key].startsWith('::');
                value.val = pseudoAliasMap[key];
                if (value.typ == EnumToken.IdenTokenType &&
                    ['min-resolution', 'max-resolution'].includes(value.val) &&
                    parent?.typ == EnumToken.MediaQueryConditionTokenType &&
                    parent.r?.[0]?.typ == EnumToken.NumberTokenType) {
                    Object.assign(parent.r?.[0], {
                        typ: EnumToken.ResolutionTokenType,
                        unit: 'x',
                    });
                }
                else if (isPseudClass && value.typ == EnumToken.PseudoElementTokenType) {
                    // @ts-ignore
                    value.typ = EnumToken.PseudoClassTokenType;
                }
                result = true;
            }
        }
    }
    return result;
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
            // if ((node as AstRule).raw != null) {
            //
            //     (node as AstRule).raw = replacePseudo((node as AstRule).raw as string[][]);
            // }
            //
            // if ((node as AstRule).optimized != null) {
            //
            //     (node as AstRule).optimized!.selector = replacePseudo((node as AstRule).optimized!.selector as string[][]);
            // }
            if (node.tokens != null) {
                replaceAstNodes(node.tokens);
            }
        }
        else if (node.typ == EnumToken.DeclarationNodeType) {
            if (node.nam.charAt(0) == '-') {
                const match = node.nam.match(/^-([^-]+)-(.+)$/);
                if (match != null) {
                    let nam = match[2];
                    if (!(nam in config.declarations)) {
                        if (node.nam in pseudoAliasMap) {
                            nam = pseudoAliasMap[node.nam];
                        }
                    }
                    if (nam in config.declarations) {
                        node.nam = nam;
                    }
                }
            }
            let hasPrefix = false;
            for (const { value } of walkValues(node.val)) {
                if ((value.typ == EnumToken.IdenTokenType || (value.typ != EnumToken.ParensTokenType && funcLike.includes(value.typ))) && value.val.match(/^-([^-]+)-(.+)$/) != null) {
                    if (value.val.endsWith('-gradient')) {
                        // not supported yet
                        break;
                    }
                    hasPrefix = true;
                    break;
                }
            }
            if (hasPrefix) {
                const nodes = structuredClone(node.val);
                for (const { value } of walkValues(nodes)) {
                    if ((value.typ == EnumToken.IdenTokenType || funcLike.includes(value.typ))) {
                        const match = value.val.match(/^-([^-]+)-(.+)$/);
                        if (match != null) {
                            value.val = match[2];
                        }
                    }
                }
                if (SyntaxValidationResult.Valid == evaluateSyntax({ ...node, val: nodes }, {}).valid) {
                    node.val = nodes;
                }
            }
        }
        else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframeAtRuleNodeType) {
            if (node.nam.startsWith('-')) {
                const match = node.nam.match(/^-([^-]+)-(.+)$/);
                if (match != null && '@' + match[2] in config.atRules) {
                    node.nam = match[2];
                }
            }
            if (node.typ == EnumToken.AtRuleNodeType && node.val !== '') {
                // if ((node as AstAtRule).tokens == null) {
                //
                //     Object.defineProperty(node, 'tokens', {
                //         // @ts-ignore
                //         ...definedPropertySettings,
                //         value: parseAtRulePrelude(parseString((node as AstAtRule).val), node as AstAtRule),
                //     })
                // }
                if (replaceAstNodes(node.tokens)) {
                    node.val = node.tokens.reduce((acc, curr) => acc + renderToken(curr), '');
                }
            }
        }
        return node;
    }
}

export { ComputePrefixFeature };
