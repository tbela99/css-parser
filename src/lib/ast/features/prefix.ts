import {EnumToken, SyntaxValidationResult} from "../types.ts";
import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    FunctionToken,
    IdentToken,
    ParserOptions,
    Token
} from "../../../@types/index.d.ts";
import {
    getSyntaxConfig,
    ValidationAmpersandToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationKeywordToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationSyntaxGroupEnum,
    ValidationToken,
    ValidationTokenEnum
} from '../../validation/index.ts'
import {walkValues} from "../walk.ts";
import {pseudoAliasMap} from "../../syntax/index.ts";
import {definedPropertySettings, splitRule} from "../minify.ts";
import type {ValidationConfiguration} from "../../../@types/validation.d.ts";
import {renderToken} from "../../renderer/index.ts";
import {parseAtRulePrelude, parseString} from "../../parser/index.ts";
import {funcLike} from "../../syntax/color/utils/index.ts";
import {evaluateSyntax} from "../../validation/syntax.ts";

const config: ValidationConfiguration = getSyntaxConfig();

function replacePseudo(tokens: string[][]): string[][] {

    return tokens.map((raw) => raw.map(r => {

        if (r.includes('(')) {

            const index = r.indexOf('(');
            const name = r.slice(0, index) + '()';

            if (name in pseudoAliasMap) {

                return pseudoAliasMap[name] + r.slice(index);
            }

            return r;
        }

        return r in pseudoAliasMap && pseudoAliasMap[r] in config[ValidationSyntaxGroupEnum.Selectors] ? pseudoAliasMap[r] : r;
    }));
}

function replaceAstNodes(tokens: Token[], root?: AstNode): boolean {

    let result: boolean = false;
    for (const {value, parent} of walkValues(tokens, root)) {

        if (value.typ == EnumToken.IdenTokenType || value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) {

            let key: string = value.val + (value.typ == EnumToken.PseudoClassFuncTokenType ? '()' : '');

            if (key in pseudoAliasMap) {

                const isPseudClass: boolean = pseudoAliasMap[key].startsWith('::');
                value.val = pseudoAliasMap[key];

                if (value.typ == EnumToken.IdenTokenType &&
                    ['min-resolution', 'max-resolution'].includes(value.val) &&
                    parent?.typ == EnumToken.MediaQueryConditionTokenType &&
                    parent.r?.[0]?.typ == EnumToken.NumberTokenType) {

                    Object.assign(parent.r?.[0], {

                        typ: EnumToken.ResolutionTokenType,
                        unit: 'x',
                    });

                } else if (isPseudClass && value.typ == EnumToken.PseudoElementTokenType) {

                    // @ts-ignore
                    value.typ = EnumToken.PseudoClassTokenType;
                }

                result = true;
            }
        }
    }

    return result;
}

export class ComputePrefixFeature {

    get ordering() {
        return 2;
    }

    get preProcess(): boolean {
        return true;
    }

    get postProcess(): boolean {
        return false;
    }

    static register(options: ParserOptions) {

        if (options.removePrefix) {

            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }

    run(node: AstNode) {

        if (node.typ == EnumToken.RuleNodeType) {

            (node as AstRule).sel = replacePseudo(splitRule((node as AstRule).sel)).reduce((acc, curr, index) => acc + (index > 0 ? ',' : '') + curr.join(''), '');

            if ((node as AstRule).raw != null) {

                (node as AstRule).raw = replacePseudo((node as AstRule).raw as string[][]);
            }

            if ((node as AstRule).optimized != null) {

                (node as AstRule).optimized!.selector = replacePseudo((node as AstRule).optimized!.selector as string[][]);
            }

            if ((node as AstRule).tokens != null) {

                replaceAstNodes((node as AstRule).tokens as Token[]);
            }

        } else if (node.typ == EnumToken.DeclarationNodeType) {

            if ((<AstDeclaration>node).nam.charAt(0) == '-') {

                const match = (<AstDeclaration>node).nam.match(/^-([^-]+)-(.+)$/);

                if (match != null) {

                    let nam: string = match[2];

                    if (!(nam in config.declarations)) {

                        if ( (<AstDeclaration>node).nam in pseudoAliasMap) {

                            nam = pseudoAliasMap[ (<AstDeclaration>node).nam];

                        }
                    }

                    if (nam in config.declarations ) {

                        (<AstDeclaration>node).nam = nam;
                    }
                }
            }

            let hasPrefix: boolean = false;

            for (const {value} of walkValues((<AstDeclaration>node).val)) {

                if ((value.typ == EnumToken.IdenTokenType || (value.typ != EnumToken.ParensTokenType && funcLike.includes(value.typ))) && (value as IdentToken | FunctionToken).val.match(/^-([^-]+)-(.+)$/) != null) {

                    if ((value as IdentToken | FunctionToken).val.endsWith('-gradient')) {

                        // not supported yet
                        break;
                    }

                    hasPrefix = true;
                    break;
                }
            }

            if (hasPrefix) {

                const nodes = structuredClone(node.val);

                for (const {value} of walkValues(nodes)) {

                    if ((value.typ == EnumToken.IdenTokenType || funcLike.includes(value.typ))) {

                        const match = (value as IdentToken | FunctionToken).val.match(/^-([^-]+)-(.+)$/);

                        if (match == null) {

                            continue;
                        }

                        (value as IdentToken | FunctionToken).val = match[2];
                    }
                }

                if (SyntaxValidationResult.Valid == evaluateSyntax({...node, val: nodes}, {}).valid) {

                    (<AstDeclaration>node).val = nodes;
                }
            }

        } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframeAtRuleNodeType) {

            if ((node as AstAtRule).nam.startsWith('-')) {

                const match = (node as AstAtRule).nam.match(/^-([^-]+)-(.+)$/);

                if (match != null && '@' + match[2] in config.atRules) {

                    (node as AstAtRule).nam = match[2];
                }
            }

            if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).val !== '') {

                if ((node as AstAtRule).tokens == null) {

                    Object.defineProperty(node, 'tokens', {
                        // @ts-ignore
                        ...definedPropertySettings,
                        value: parseAtRulePrelude(parseString((node as AstAtRule).val), node as AstAtRule),
                    })
                }

                if (replaceAstNodes((node as AstAtRule).tokens as Token[])) {
                    (node as AstAtRule).val = ((node as AstAtRule).tokens as Token[]).reduce((acc, curr) => acc + renderToken(curr), '');
                }
            }
        }

        return node;
    }
}

function matchToken(token: Token, matches: ValidationToken[]): null | Token {

    let result: null | Token;
    for (let i = 0; i < matches.length; i++) {

        switch (matches[i].typ) {

            case ValidationTokenEnum.Whitespace:
            case ValidationTokenEnum.Comma:

                break;

            case ValidationTokenEnum.Keyword:

                if (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val == (matches[i] as ValidationKeywordToken).val) {

                    return token;
                }

                break;

            case ValidationTokenEnum.PropertyType:

                if (['ident', 'custom-ident'].includes((matches[i] as ValidationPropertyToken).val)) {

                    if (token.typ == EnumToken.IdenTokenType && (token as IdentToken).val == (matches[i] as ValidationPropertyToken).val) {

                        return token;
                    }
                } else {

                    const val: string = (matches[i] as ValidationPropertyToken).val as string;

                    if (val in config.declarations || val in config.syntaxes) {

                        // @ts-ignore
                        result = matchToken(token, ((config.syntaxes[val] ?? config.declarations[val]) as ValidationToken[]).ast.slice());

                        if (result != null) {

                            return result;
                        }
                    }
                }

                break;

            case ValidationTokenEnum.PipeToken:

                for (let j = 0; j < (<ValidationPipeToken>matches[i]).chi.length; j++) {

                    result = matchToken(token, (<ValidationPipeToken>matches[i]).chi[j]);

                    if (result != null) {

                        return result;
                    }
                }

                break;
            case ValidationTokenEnum.ColumnToken:
            case ValidationTokenEnum.AmpersandToken:

                result = matchToken(token, (<ValidationColumnToken | ValidationAmpersandToken>matches[i]).l);

                if (result == null) {

                    result = matchToken(token, (<ValidationColumnToken | ValidationAmpersandToken>matches[i]).r);
                }

                if (result != null) {

                    return result;
                }

                break;

            case ValidationTokenEnum.Bracket:

                result = matchToken(token, (<ValidationBracketToken>matches[i]).chi);

                if (result != null) {

                    return result;
                }

                break;
        }
    }

    return null;
}