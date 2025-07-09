import type {
    AstAtRule,
    AstRule,
    AttrToken,
    MatchExpressionToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    PseudoElementToken,
    Token
} from "../../../@types/index.d.ts";
import type {
    ValidationConfiguration,
    ValidationSelectorOptions,
    ValidationSyntaxResult
} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";
import {mozExtensions, webkitExtensions} from "../../syntax/index.ts";
import {getSyntaxConfig} from "../config.ts";

export function validateCompoundSelector(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected selector',
            tokens
        }
    }

    tokens = tokens.slice();
    consumeWhitespace(tokens);

    const config: ValidationConfiguration = getSyntaxConfig();

    let match: number = 0;
    let length: number = tokens.length;

    while (tokens.length > 0) {

        while (tokens.length > 0 && tokens[0].typ == EnumToken.NestingSelectorTokenType) {

            if (!options?.nestedSelector) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    // @ts-ignore
                    node: tokens[0],
                    syntax: null,
                    error: 'nested selector not allowed',
                    tokens
                }
            }

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        // <type-selector>
        while (tokens.length > 0 &&
        [
            EnumToken.IdenTokenType,
            EnumToken.NameSpaceAttributeTokenType,
            EnumToken.ClassSelectorTokenType,
            EnumToken.HashTokenType,
            EnumToken.UniversalSelectorTokenType
        ].includes(tokens[0].typ)) {

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        while (tokens.length > 0 && tokens[0].typ == EnumToken.PseudoClassFuncTokenType) {

            if (
                !mozExtensions.has((tokens[0] as PseudoClassFunctionToken).val + '()') &&
                !webkitExtensions.has((tokens[0] as PseudoClassFunctionToken).val + '()') &&
                !(((tokens[0] as PseudoClassFunctionToken).val + '()') in config.selectors)
            ) {

                if (!options?.lenient || /^(:?)-webkit-/.test((tokens[0] as PseudoClassFunctionToken).val)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + (tokens[0] as PseudoClassFunctionToken).val + '()',
                        tokens
                    }
                }
            }

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        while (tokens.length > 0 && (tokens[0].typ == EnumToken.PseudoElementTokenType || tokens[0].typ == EnumToken.PseudoClassTokenType)) {

            const isPseudoElement: boolean = tokens[0].typ == EnumToken.PseudoElementTokenType;

            if (
                // https://developer.mozilla.org/en-US/docs/Web/CSS/WebKit_Extensions#pseudo-elements
                !(isPseudoElement && (tokens[0] as PseudoClassToken | PseudoElementToken).val.startsWith('::-webkit-')) &&
                !mozExtensions.has((tokens[0] as PseudoClassToken | PseudoElementToken).val) &&
                !webkitExtensions.has((tokens[0] as PseudoClassToken | PseudoElementToken).val) &&
                !((tokens[0] as PseudoClassToken | PseudoElementToken).val in config.selectors) &&
                !(!isPseudoElement &&
                    (':' +(tokens[0] as PseudoClassToken | PseudoElementToken).val) in config.selectors)
            ) {

                if (!options?.lenient || /^(:?)-webkit-/.test((tokens[0] as PseudoClassToken | PseudoElementToken).val)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + (tokens[0] as PseudoClassToken | PseudoElementToken).val,
                        tokens
                    }
                }
            }

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        while (tokens.length > 0 && tokens[0].typ == EnumToken.AttrTokenType) {

            const children: Token[] = (tokens[0] as AttrToken).chi.slice() as Token[];

            consumeWhitespace(children);

            if (children.length == 0) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: null,
                    error: 'invalid attribute selector',
                    tokens
                }
            }

            if (![
                EnumToken.IdenTokenType,
                EnumToken.NameSpaceAttributeTokenType,
                EnumToken.MatchExpressionTokenType
            ].includes(children[0].typ)) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: null,
                    error: 'invalid attribute selector',
                    tokens
                }
            }

            if (children[0].typ == EnumToken.MatchExpressionTokenType) {

                if (children.length != 1) {

                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid <attribute-selector>',
                        tokens
                    }
                }

                if (![
                        EnumToken.IdenTokenType,
                        EnumToken.NameSpaceAttributeTokenType
                    ].includes((children[0] as MatchExpressionToken).l.typ) ||
                    ![
                        EnumToken.EqualMatchTokenType, EnumToken.DashMatchTokenType,
                        EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                        EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType].includes((children[0] as MatchExpressionToken).op.typ) ||
                    !([
                        EnumToken.StringTokenType,
                        EnumToken.IdenTokenType
                    ].includes((children[0] as MatchExpressionToken).r.typ)
                    )) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector',
                        tokens
                    }
                }

                if ((children[0] as MatchExpressionToken).attr != null && !['i', 's'].includes((children[0] as MatchExpressionToken).attr as string)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector',
                        tokens
                    }
                }
            }

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        if (length == tokens.length) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                // @ts-ignore
                node: tokens[0],
                // @ts-ignore
                syntax: null,
                error: 'expected compound selector',
                tokens
            }
        }

        length = tokens.length;
    }

    return match == 0 ? {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected compound selector',
            tokens
        } as ValidationSyntaxResult :
        // @ts-ignore
        {
            valid: ValidationLevel.Valid,
            matches: [] as Token[],
            // @ts-ignore
            node: root as Token,
            // @ts-ignore
            syntax: null,
            error: null,
            tokens
        } as ValidationSyntaxResult
}
