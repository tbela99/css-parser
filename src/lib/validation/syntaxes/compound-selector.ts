import type {AstAtRule, AstRule, Token} from "../../../@types";
import type {
    ValidationConfiguration,
    ValidationSelectorOptions,
    ValidationSyntaxResult
} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";
import {mozExtensions, webkitExtensions} from "../../syntax";
import {getSyntaxConfig} from "../config";

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
                !mozExtensions.has(tokens[0].val + '()') &&
                !webkitExtensions.has(tokens[0].val + '()') &&
                !((tokens[0].val + '()') in config.selectors)
            ) {

                if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + tokens[0].val + '()',
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
                !(isPseudoElement && tokens[0].val.startsWith('::-webkit-')) &&
                !mozExtensions.has(tokens[0].val) &&
                !webkitExtensions.has(tokens[0].val) &&
                !(tokens[0].val in config.selectors) &&
                !(!isPseudoElement &&
                    (':' + tokens[0].val) in config.selectors)
            ) {

                if (!options?.lenient || /^(:?)-webkit-/.test(tokens[0].val)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'unknown pseudo-class: ' + tokens[0].val,
                        tokens
                    }
                }
            }

            match++;
            tokens.shift();
            consumeWhitespace(tokens);
        }

        while (tokens.length > 0 && tokens[0].typ == EnumToken.AttrTokenType) {

            const children: Token[] = tokens[0].chi.slice() as Token[];

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
                    ].includes(children[0].l.typ) ||
                    ![
                        EnumToken.EqualMatchTokenType, EnumToken.DashMatchTokenType,
                        EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                        EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType].includes(children[0].op.typ) ||
                    ![
                        EnumToken.StringTokenType,
                        EnumToken.IdenTokenType
                    ].includes(children[0].r.typ)) {

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

                if (children[0].attr != null && !['i', 's'].includes(children[0].attr)) {

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
