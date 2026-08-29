import { EnumToken } from '../../ast/types.js';
import { getSyntaxRule } from '../../validation/config.js';
import { trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { tokensfuncDefMap, LOCEND, LOCSTA } from '../../syntax/constants.js';
import { parseMediaqueryList } from './at-rule-media.js';
import { parseAtRuleSupportSyntax } from './at-rule-support.js';

function matchAtRuleImportSyntax(atRule, stream, context, options) {
    let success = true;
    let index = 0;
    let i = 0;
    let matchCount;
    const errors = [];
    const tokens = [];
    const stack = [];
    const prelude = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@import")
        .getPreludeRules()
        .slice(1);
    trimArray(stream);
    // <string> | <url>
    if (stream[index]?.typ === EnumToken.StringTokenType) {
        tokens.push(stream[index++]);
    }
    else if (stream[index]?.typ === EnumToken.UrlFunctionTokenDefType) {
        // match ending ')'
        let matchCount = 0;
        let k = 0;
        for (; k < stream.length; k++) {
            if (stream[k]?.typ === EnumToken.EndParensTokenType) {
                matchCount--;
            }
            else if (stream[k]?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[k]?.typ)) {
                matchCount++;
            }
            if (matchCount === 0) {
                break;
            }
        }
        const slice = stream.slice(index + 1, k);
        stream[0][LOCEND] = stream[1][LOCEND];
        tokens.push(Object.assign({
            typ: tokensfuncDefMap.get(stream[0].typ),
            chi: trimArray(slice),
        }));
        index = k + 1;
    }
    else {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "Expected string or url()",
                    syntax: "@import",
                    node: stream[0],
                    location: options.source.getSourceLocation(stream[0]?.[LOCSTA]),
                },
            ],
        };
    }
    while (index + 1 < prelude.length &&
        (stream[index]?.typ == EnumToken.WhitespaceTokenType || stream[index]?.typ == EnumToken.CommentTokenType)) {
        tokens.push(stream[index++]);
    }
    // layer | layer(<layer-name>)
    if (stream[index]?.typ === EnumToken.IdenTokenType &&
        "layer".localeCompare(stream[index].val) === 0) {
        tokens.push(stream[index++]);
    }
    else if (tokensfuncDefMap.has(stream[index]?.typ) &&
        "layer".localeCompare(stream[index].val) === 0) {
        stack.push(stream[index]);
        tokens.push(stream[index++]);
        // <layer-name">
        if (stream[index]?.typ === EnumToken.EndParensTokenType) {
            i = tokens.indexOf(stack.at(-1));
            tokens.splice(index, 1);
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name>`,
                        syntax: "@import",
                        node: stream[index],
                        location: options.source.getSourceLocation(stream[index]?.[LOCSTA]),
                    },
                ],
            };
        }
        else if (stream[index]?.typ === EnumToken.IdenTokenType) {
            tokens.push(stream[index++]);
            while (stream[index]?.typ == EnumToken.ClassSelectorTokenType) {
                tokens.push(stream[index++]);
            }
            i = tokens.indexOf(stack.at(-1));
            tokens.splice(index, 1);
            Object.assign(stack.at(-1), {
                typ: EnumToken.FunctionTokenType,
                chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
            });
            stack.pop();
        }
        else {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name>`,
                        syntax: "@import",
                        node: stream[index],
                        location: options.source.getSourceLocation(stream[index]?.[LOCSTA]),
                    },
                ],
            };
        }
    }
    while (stream[index]?.typ === EnumToken.WhitespaceTokenType || stream[index]?.typ === EnumToken.CommentTokenType) {
        tokens.push(stream[index++]);
    }
    // supports([ <supports-condition> | <declaration> ] )
    if (index < stream.length &&
        tokensfuncDefMap.has(stream[index].typ) &&
        "supports".localeCompare(stream[index].val) === 0) {
        stack.push(stream[index]);
        tokens.push(stream[index++]);
        matchCount = 1;
        // <supports-condition>
        // else {
        // match the next ')'
        while (index < stream.length && matchCount > 0) {
            if (stream[index]?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[index]?.typ)) {
                matchCount++;
            }
            else if (stream[index]?.typ === EnumToken.EndParensTokenType) {
                matchCount--;
                if (matchCount === 0) {
                    tokens.splice(index, 1);
                    i = tokens.indexOf(stack.at(-1));
                    Object.assign(stack.at(-1), {
                        typ: tokensfuncDefMap.get(stack.at(-1).typ),
                        chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
                    });
                    stack.pop();
                    break;
                }
            }
            tokens.push(stream[index++]);
        }
        // support() is the last item in tokens array
        {
            const result = parseAtRuleSupportSyntax(tokens[tokens.length - 1].chi, context, options);
            if (!result.success && result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
                return {
                    success: false,
                    errors,
                };
            }
        }
    }
    const splice = stream.splice(index, stream.length - index);
    const sliced = parseMediaqueryList(splice, options);
    for (const sp of splice) {
        tokens.push(sp);
    }
    if (sliced.errors.length > 0) {
        for (const error of sliced.errors) {
            errors.push(error);
        }
    }
    if (!sliced.success) {
        success = false;
    }
    stream.length = 0;
    for (const token of trimArray(tokens)) {
        stream.push(token);
    }
    return {
        success,
        errors,
    };
}

export { matchAtRuleImportSyntax };
