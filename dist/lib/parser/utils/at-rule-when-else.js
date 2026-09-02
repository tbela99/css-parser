import { EnumToken } from '../../ast/types.js';
import { trimArray } from '../../validation/match.js';
import { tokensfuncDefMap, LOCEND, LOCSTA, LOCSRCID } from '../../syntax/constants.js';
import { parseMediaqueryList } from './at-rule-media.js';
import { parseAtRuleSupportSyntax } from './at-rule-support.js';

function matchAtRuleWhenElseSyntax(stream, context, options = {}) {
    const tokens = [];
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let scope = new Set();
    const errors = [];
    // const scopes: Array<Set<EnumToken>> = [scope];
    for (; i < stream.length; i++) {
        tokens.push(stream[i]);
        if (expectAndOr) {
            let k = i;
            while (k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)) {
                tokens.push(stream[k]);
                k++;
            }
            expectAndOr = false;
        }
        switch (stream[i].typ) {
            case EnumToken.IdenTokenType:
                {
                    const val = stream[i].val.toLowerCase();
                    if ("and" === val || "or" === val) {
                        Object.assign(stream[i], {
                            typ: "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType,
                        });
                        scope.add(stream[i].typ);
                        stack.push(stream[i]);
                        // break;
                    }
                }
                break;
            case EnumToken.SupportsFunctionTokenDefType:
            case EnumToken.WhenElseFunctionTokenDefType:
                {
                    let matchCount = 1;
                    let j = i + 1;
                    for (; j < stream.length; j++) {
                        if (stream[j].typ === EnumToken.EndParensTokenType) {
                            matchCount--;
                            if (matchCount === 0) {
                                break;
                            }
                        }
                        else if (stream[j].typ === EnumToken.StartParensTokenType ||
                            tokensfuncDefMap.has(stream[j].typ)) {
                            matchCount++;
                        }
                    }
                    const slice = stream.slice(i, j + 1);
                    const funcName = stream[i].val.toLowerCase();
                    const tokenList = [
                        {
                            typ: EnumToken.StartParensTokenType,
                            [LOCSRCID]: stream[i][LOCSRCID],
                            [LOCSTA]: stream[i][LOCSTA],
                            [LOCEND]: stream[j]?.[LOCEND],
                        },
                        // @ts-expect-error
                    ].concat(slice.slice(1));
                    if ("media" === funcName) {
                        const result = parseMediaqueryList(tokenList, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    else if ("supports" === funcName) {
                        const result = parseAtRuleSupportSyntax(tokenList, context, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    else if (stream[i].typ === EnumToken.SupportsFunctionTokenDefType) {
                        tokenList.splice(0, tokenList.length, ...slice);
                        const result = parseAtRuleSupportSyntax(stream.slice(i, j + 1), context, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    stream[i][LOCEND] = stream[j]?.[LOCEND];
                    Object.assign(stream[i], {
                        typ: tokensfuncDefMap.get(stream[i].typ),
                        chi: stream[i].typ === EnumToken.SupportsFunctionTokenDefType
                            ? trimArray(slice.slice(1, -1))
                            : tokenList[0].chi,
                    });
                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        const index = tokens.indexOf(stack.at(-1));
                        const index2 = stack.length > 1 ? tokens.indexOf(stack.at(-2)) + 1 : 0;
                        tokens[index2] = {
                            typ: EnumToken.WhenElseQueryConditionTokenType,
                            op: stack.at(-1),
                            l: trimArray(tokens.slice(index2, index)),
                            r: trimArray(tokens.slice(index + 1)),
                            [LOCSRCID]: stack.at(-1)[LOCSRCID],
                            [LOCSTA]: stack.at(-1)[LOCSTA],
                            [LOCEND]: stream[i]?.[LOCEND],
                        };
                        tokens.length = index2 + 1;
                        stack.pop();
                    }
                    i = j;
                    expectAndOr = true;
                }
                break;
        }
    }
    stream.length = 0;
    for (const token of trimArray(tokens)) {
        stream.push(token);
    }
    return { success, errors };
}

export { matchAtRuleWhenElseSyntax };
