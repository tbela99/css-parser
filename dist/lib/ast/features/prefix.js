import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';
import { pseudoAliasMap } from '../../syntax/syntax.js';
import { splitRule } from '../minify.js';
import { renderToken } from '../../renderer/render.js';
import { funcLike } from '../../syntax/constants.js';
import { FeatureWalkMode } from './type.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxConfig } from '../../validation/config.js';
import { splitTokenList } from '../../validation/utils/list.js';

const config = getSyntaxConfig();
function replacePseudo(tokens) {
    return tokens.map((raw) => raw.map((r) => {
        if (r.includes("(")) {
            const index = r.indexOf("(");
            const name = r.slice(0, index) + "()";
            if (name in pseudoAliasMap) {
                return pseudoAliasMap[name] + r.slice(index);
            }
            return r;
        }
        return r in pseudoAliasMap && pseudoAliasMap[r] in config[ValidationSyntaxGroupEnum.Selectors]
            ? pseudoAliasMap[r]
            : r;
    }));
}
function replaceAstNodes(tokens, root) {
    let result = false;
    for (const { value, parent } of walkValues(tokens, root)) {
        if (value.typ == EnumToken.MediaQueryConditionTokenType) {
            const token = value.l.find((t) => t.typ == EnumToken.IdenTokenType);
            if (token != null) {
                if (token.val in pseudoAliasMap) {
                    token.val = pseudoAliasMap[token.val];
                    if (["min-resolution", "max-resolution"].includes(token.val) &&
                        value.r?.[0]?.typ == EnumToken.NumberTokenType) {
                        Object.assign(value.r?.[0], {
                            typ: EnumToken.ResolutionTokenType,
                            unit: "x",
                        });
                        result = true;
                    }
                }
            }
        }
        else if (value.typ == EnumToken.IdenTokenType ||
            value.typ == EnumToken.PseudoClassFuncTokenType ||
            value.typ == EnumToken.PseudoClassTokenType ||
            value.typ == EnumToken.PseudoElementTokenType) {
            let key = value.val +
                (value.typ == EnumToken.PseudoClassFuncTokenType ? "()" : "");
            if (key in pseudoAliasMap) {
                const isPseudClass = pseudoAliasMap[key].startsWith("::");
                value.val = pseudoAliasMap[key];
                if (value.typ == EnumToken.IdenTokenType &&
                    ["min-resolution", "max-resolution"].includes(value.val) &&
                    parent?.typ == EnumToken.MediaQueryConditionTokenType &&
                    parent.r?.[0]?.typ == EnumToken.NumberTokenType) {
                    Object.assign(parent.r?.[0], {
                        typ: EnumToken.ResolutionTokenType,
                        unit: "x",
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
    if (tokens.find((t) => t.typ == EnumToken.CommaTokenType) != null) {
        const set = new Set();
        const split = splitTokenList(tokens, [EnumToken.CommaTokenType]);
        tokens.length = 0;
        tokens.push(...split.reduce((acc, curr) => {
            const str = curr.reduce((acc, curr) => acc + renderToken(curr), "");
            if (set.has(str)) {
                return acc;
            }
            set.add(str);
            if (acc.length > 0) {
                tokens.push({
                    typ: EnumToken.CommaTokenType,
                });
            }
            return acc.concat(curr);
        }, []));
    }
    return result;
}
class ComputePrefixFeature {
    get ordering() {
        return 2;
    }
    get processMode() {
        return FeatureWalkMode.Pre;
    }
    static register(options) {
        if (options.removePrefix) {
            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }
    run(node) {
        if (node.typ == EnumToken.RuleNodeType) {
            node.sel = replacePseudo(splitRule(node.sel)).reduce((acc, curr, index) => acc + (index > 0 ? "," : "") + curr.join(""), "");
            if (node.tokens != null) {
                replaceAstNodes(node.tokens);
            }
        }
        else if (node.typ == EnumToken.DeclarationNodeType) {
            if (node.nam.charAt(0) == "-") {
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
                if ((value.typ == EnumToken.IdenTokenType ||
                    (value.typ != EnumToken.ParensTokenType && funcLike.includes(value.typ))) &&
                    value.val.match(/^-([^-]+)-(.+)$/) != null) {
                    if (value.val.endsWith("-gradient")) {
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
                    if (value.typ == EnumToken.IdenTokenType || funcLike.includes(value.typ)) {
                        const match = value.val.match(/^-([^-]+)-(.+)$/);
                        if (match != null) {
                            value.val = match[2];
                        }
                    }
                }
                node.val = nodes;
            }
        }
        else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
            if (node.nam.startsWith("-")) {
                const match = node.nam.match(/^-([^-]+)-(.+)$/);
                if (match != null && "@" + match[2] in config.atRules) {
                    node.nam = match[2];
                }
            }
            if (node.typ == EnumToken.AtRuleNodeType && node.val !== "") {
                if (replaceAstNodes(node.tokens)) {
                    node.val = node.tokens.reduce((acc, curr) => acc + renderToken(curr), "");
                }
            }
        }
        return node;
    }
}

export { ComputePrefixFeature };
