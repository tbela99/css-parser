import type {
    AngleToken,
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstStyleSheet,
    AtRuleToken,
    AttrToken,
    BinaryExpressionToken,
    ClassSelectorToken,
    ColorToken,
    CommentToken,
    ComposesSelectorToken,
    CssVariableImportTokenType,
    CssVariableMapTokenType,
    CssVariableToken,
    DashedIdentToken,
    ErrorDescription,
    FractionToken,
    FunctionDefToken,
    FunctionToken,
    HashToken,
    IdentListToken,
    IdentToken,
    IfConditionToken,
    IfElseConditionToken,
    InvalidAttrToken,
    InvalidClassSelectorToken,
    LengthToken,
    ListToken,
    LiteralToken,
    Location,
    MatchExpressionToken,
    MediaFeatureToken,
    MediaQueryConditionToken,
    MediaQueryUnaryFeatureToken,
    MediaRangeQueryToken,
    NameSpaceAttributeToken,
    NumberToken,
    PercentageToken,
    Position,
    PseudoElementToken,
    PseudoPageToken,
    RenderOptions,
    RenderResult,
    StringToken,
    SupportsQueryConditionToken,
    SupportsQueryUnaryConditionToken,
    Token,
    WhenElseQueryConditionToken,
    WhenElseUnaryConditionToken,
} from "../../@types/index.d.ts";
import { convertColor, toPrecisionAngle } from "../syntax/color/color.ts";
import { getAngle } from "../syntax/color/color.ts";
import { reduceHexValue } from "../syntax/color/hex.ts";
import { ColorType, EnumToken, minifyNumber } from "../ast/types.ts";
import { expand } from "../ast/expand.ts";
import { SourceMap } from "./sourcemap/sourcemap.ts";
import { anglePrecision, colorPrecision, colorsFunc, LOC, PARENT, tokensfuncSet, urlTokenMatcher } from "../syntax/constants.ts";
import {
    isColor,
    parseColor,
    pseudoElements,
    reducegradientBackgroundPosition,
    reduceColorStops,
    reduceConicColorStops,
} from "../syntax/syntax.ts";
import { move } from "../parser/tokenize.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { toDegrees } from "../parser/utils/angle.ts";

/**
 * render ast
 * @param data
 * @param options
 * @param mapping
 * @private
 */
export function doRender(
    data: AstNode,
    options: RenderOptions = {},
    mapping?: {
        mapping: Record<string, string>;
        importMapping: Record<string, Record<string, string>> | null;
    } | null,
): RenderResult {
    const minify: boolean = options.minify ?? true;
    const beautify: boolean = options.beautify ?? !minify;

    options = {
        ...(beautify
            ? {
                  indent: " ",
                  newLine: "\n",
              }
            : {
                  indent: "",
                  newLine: "",
              }),
        ...(minify
            ? {
                  removeEmpty: true,
                  removeComments: true,

                  minify: true,
              }
            : {
                  removeEmpty: false,
                  removeComments: false,
              }),
        sourcemap: false,
        convertColor: true,
        expandNestingRules: false,
        preserveLicense: false,
        ...options,
    };

    if (options.withParents) {
        // @ts-ignore
        let parent: AstNode = data[PARENT];

        while (data[PARENT] != null) {
            // @ts-ignore
            parent = { ...data[PARENT], chi: [{ ...data }] };

            // @ts-ignore
            parent[PARENT] = data[PARENT][PARENT];

            // @ts-ignore
            data = parent;
        }
    }

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const sourcemap: SourceMap | null = options.sourcemap ? new SourceMap() : null;
    const cache: {
        [key: string]: any;
    } = Object.create(null);

    const position = {
        ind: 0,
        lin: 1,
        col: 1,
    } as Position;

    let code: string = "";

    if (mapping != null) {
        if (mapping.importMapping != null) {
            for (const [key, value] of Object.entries(mapping.importMapping)) {
                code += `:import("${key}")${options.indent}{${options.newLine}${Object.entries(value).reduce(
                    (acc, [k, v]) =>
                        acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${v}:${options.indent}${k};`,
                    "",
                )}${options.newLine}}${options.newLine}`;
            }
        }

        code += `:export${options.indent}{${options.newLine}${Object.entries(mapping.mapping).reduce(
            (acc, [k, v]) =>
                acc + (acc.length > 0 ? options.newLine : "") + `${options.indent}${k}:${options.indent}${v};`,
            "",
        )}${options.newLine}}${options.newLine}`;
        move(position, code);
    }

    const result: RenderResult = {
        code:
            code +
            renderAstNode(
                options.expandNestingRules &&
                    [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(
                        data.typ,
                    ) &&
                    "chi" in data
                    ? expand(data as AstStyleSheet | AstAtRule | AstRule)
                    : data,
                options,
                sourcemap,
                position,
                errors,
                function reducer(acc: string, curr: Token): string {
                    if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {
                        if (!options.preserveLicense || !(curr as AstComment).val.startsWith("/*!")) {
                            return acc;
                        }

                        return acc + (curr as AstComment).val;
                    }

                    return acc + renderValue(curr, options, cache, reducer, errors);
                },
                cache,
            ),
        errors,
        stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    };

    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }

    if (sourcemap != null) {
        result.map = sourcemap;

        if (options.sourcemap === "inline") {
            result.code += `\n/*# sourceMappingURL=data:application/json,${encodeURIComponent(
                JSON.stringify(result.map),
            )} */`;
        }
    }

    return result;
}

/**
 * Update source map
 * @param node
 * @param options
 * @param cache
 * @param sourcemap
 * @param position
 * @param str
 *
 * @internal
 */
function updateSourceMap(
    node: AstRuleList | AstComment,
    options: RenderOptions,
    cache: {
        [p: string]: any;
    },
    sourcemap: SourceMap,
    position: Position,
    str: string,
) {
    if (
        [
            EnumToken.RuleNodeType,
            EnumToken.AtRuleNodeType,
            EnumToken.KeyFramesRuleNodeType,
            EnumToken.KeyframesAtRuleNodeType,
        ].includes(node.typ)
    ) {
        let src: string = (<Location>node[LOC])?.src ?? "";

        sourcemap.add(
            // @ts-ignore
            { src, sta: { ...position } },
            {
                ...(<Location>node[LOC]),
                // @ts-ignore
                src,
            },
        );
    }

    move(position, str);
}

/**
 * render ast node
 * @param data
 * @param options
 * @param sourcemap
 * @param position
 * @param errors
 * @param reducer
 * @param cache
 * @param level
 * @param indents
 *
 * @internal
 */
function renderAstNode(
    data: AstNode,
    options: RenderOptions,
    sourcemap: SourceMap | null,
    position: Position,
    errors: ErrorDescription[],
    reducer: (acc: string, curr: Token) => string,
    cache: {
        [key: string]: any;
    },
    level: number = 0,
    indents: string[] = [],
): string {
    if (indents.length < level + 1) {
        indents.push((<string>options.indent).repeat(level));
    }

    if (indents.length < level + 2) {
        indents.push((<string>options.indent).repeat(level + 1));
    }

    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    switch (data.typ) {
        case EnumToken.DeclarationNodeType:
            return `${(<AstDeclaration>data).nam}:${options.indent}${(options.minify
                ? filterValues((<AstDeclaration>data).val)
                : (<AstDeclaration>data).val
            ).reduce(reducer, "")}`;

        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
            if ((<AstComment>data).val.startsWith("/*# sourceMappingURL=")) {
                // ignore sourcemap
                return "";
            }

            return !options.removeComments || (options.preserveLicense && (<AstComment>data).val.startsWith("/*!"))
                ? (<AstComment>data).val
                : "";

        case EnumToken.StyleSheetNodeType:
            return (<AstStyleSheet>data).chi.reduce((css: string, node: AstRuleList | AstComment) => {
                const str: string = renderAstNode(
                    node,
                    options,
                    sourcemap,
                    { ...position },
                    errors,
                    reducer,
                    cache,
                    level,
                    indents,
                );

                if (str === "") {
                    return css;
                }

                if (css === "") {
                    if (sourcemap != null && node[LOC] != null) {
                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }

                    return str;
                }

                if (sourcemap != null && node[LOC] != null) {
                    move(position, <string>options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }

                return `${css}${options.newLine}${str}`;
            }, "");

        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyFramesRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType:
            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ) && !("chi" in data)) {
                return `${indent}@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === "" ? "" : options.indent || " "}${
                    (<AstAtRule>data).val
                };`;
            }

            // @ts-ignore
            let children: string = (<AstRule>data).chi.reduce((css: string, node: AstNode) => {
                let str: string;

                if (node.typ == EnumToken.CommentNodeType) {
                    str =
                        options.removeComments &&
                        (!options.preserveLicense || !(<AstComment>node).val.startsWith("/*!"))
                            ? ""
                            : (<AstComment>node).val;
                } else if (node.typ == EnumToken.DeclarationNodeType) {
                    if (!(<AstDeclaration>node).nam.startsWith("--") && (<AstDeclaration>node).val.length === 0) {
                        // @ts-ignore
                        errors.push(<ErrorDescription>{
                            action: "ignore",
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node[LOC],
                        });
                        return "";
                    }

                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(options.minify
                        ? filterValues((<AstDeclaration>node).val)
                        : (<AstDeclaration>node).val
                    )
                        .reduce(reducer, "")
                        .trimEnd()};`;
                } else if (node.typ == EnumToken.AtRuleNodeType && !("chi" in node)) {
                    str = `${(<AstAtRule>node).val === "" ? "" : options.indent || " "}${(<AstAtRule>node).val};`;
                } else {
                    str = renderAstNode(
                        node,
                        options,
                        sourcemap,
                        { ...position },
                        errors,
                        reducer,
                        cache,
                        level + 1,
                        indents,
                    );
                }

                if (css === "") {
                    return str;
                }

                if (str === "") {
                    return css;
                }

                return `${css}${options.newLine}${indentSub}${str}`;
            }, "");

            if (options.removeEmpty && children === "") {
                return "";
            }

            if (children.endsWith(";")) {
                children = children.slice(0, -1);
            }

            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ)) {
                return (
                    `@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === "" ? "" : options.indent || " "}${
                        (<AstAtRule>data).val
                    }${options.indent}{${options.newLine}` +
                    (children === "" ? "" : indentSub + children + options.newLine) +
                    indent +
                    `}`
                );
            }

            return (
                (<AstRule>data).sel +
                `${options.indent}{${options.newLine}` +
                (children === "" ? "" : indentSub + children + options.newLine) +
                indent +
                `}`
            );

        case EnumToken.CssVariableTokenType:
        case EnumToken.CssVariableImportTokenType:
            return `@value ${(<CssVariableToken | CssVariableImportTokenType>data).val}:${options.indent}${filterValues(
                options.minify
                    ? (<CssVariableToken | CssVariableImportTokenType>data).val
                    : (<CssVariableToken>data).val,
            )
                .reduce(reducer, "")
                .trim()};`;

        case EnumToken.CssVariableDeclarationMapTokenType:
            return `@value ${filterValues((data as CssVariableMapTokenType).vars)
                .reduce((acc, curr) => acc + renderValue(curr), "")
                .trim()} from ${filterValues((data as CssVariableMapTokenType).from)
                .reduce((acc, curr) => acc + renderValue(curr), "")
                .trim()};`;

        case EnumToken.InvalidDeclarationNodeType:
        case EnumToken.InvalidRuleNodeType:
        case EnumToken.InvalidAtRuleNodeType:

        default:
            return "";
    }
}

/**
 * render ast token
 * @param token
 * @param options
 * @private
 */
export function renderValue(
    token: Token,
    options: RenderOptions = {},
    cache: {
        [key: string]: any;
    } = Object.create(null),
    reducer?: null | ((acc: string, curr: Token) => string),
    errors?: ErrorDescription[],
): string {
    if (
        token.typ === EnumToken.WhenElseFunctionTokenType &&
        equalsIgnoreCase((token as FunctionToken).val, "supports")
    ) {
        options = { ...options, minify: false, convertColor: false };
        reducer = null;
    }

    if (reducer == null) {
        reducer = function (acc: string, curr: Token): string {
            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !(curr as AstComment).val.startsWith("/*!")) {
                    return acc;
                }

                return acc + (curr as AstComment).val;
            }

            return acc + renderValue(curr, options, cache, reducer, errors);
        };
    }

    if (token.typ == EnumToken.FunctionTokenType && colorsFunc.includes((token as FunctionToken).val)) {
        if (isColor(token)) {
            // @ts-ignore
            token.typ = EnumToken.ColorTokenType;

            if (
                // @ts-ignore
                (token as ColorToken)!.chi[0]!.typ == EnumToken.IdenTokenType &&
                // @ts-ignore
                ((token as ColorToken)!.chi[0] as IdentToken).val == "from"
            ) {
                // @ts-ignore
                (<ColorToken>token).cal = "rel";
            } else {
                // @ts-ignore
                if (
                    (token as ColorToken).val == "color-mix" &&
                    (token as ColorToken).chi?.[0]?.typ == EnumToken.IdenTokenType &&
                    ((token as ColorToken).chi?.[0] as IdentToken).val == "in"
                ) {
                    // @ts-ignore
                    (<ColorToken>token).cal = "mix";
                } else {
                    // @ts-ignore
                    if ((token as ColorToken).val == "color") {
                        // @ts-ignore
                        token.cal = "col";
                    }

                    // @ts-ignore
                    (token as ColorToken).chi = (token as ColorToken).chi!.filter(
                        (t: Token) =>
                            ![
                                EnumToken.WhitespaceTokenType,
                                EnumToken.CommaTokenType,
                                EnumToken.CommentTokenType,
                            ].includes(t.typ),
                    );
                }
            }
        }
    }

    switch (token.typ) {
        case EnumToken.FunctionTokenDefType:
        case EnumToken.UrlFunctionTokenDefType:
        case EnumToken.MathFunctionTokenDefType:
        case EnumToken.ImageFunctionTokenDefType:
        case EnumToken.ColorFunctionTokenDefType:
        case EnumToken.TimingFunctionTokenDefType:
        case EnumToken.WhenElseFunctionTokenDefType:
        case EnumToken.SupportsFunctionTokenDefType:
        case EnumToken.TimelineFunctionTokenDefType:
        case EnumToken.GridTemplateFuncTokenDefType:
        case EnumToken.TransformFunctionTokenDefType:
        case EnumToken.ContainerFunctionTokenDefType:
        case EnumToken.PseudoClassFunctionTokenDefType:
        case EnumToken.GeneralEnclosedFunctionTokenDefType:
        case EnumToken.CustomFunctionTokenDefType:
        case EnumToken.WildCardFunctionTokenDefType:
            return (token as FunctionDefToken).val + "(";

        case EnumToken.ListToken:
            return (token as ListToken).chi.reduce(
                (acc: string, curr: Token) => acc + renderValue(curr, options, cache),
                "",
            );

        case EnumToken.BinaryExpressionTokenType:
            if (
                EnumToken.Mul === (token as BinaryExpressionToken).op ||
                EnumToken.Div === (token as BinaryExpressionToken).op
            ) {
                let result: string = "";

                if (
                    (token as BinaryExpressionToken).l.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(
                        ((token as BinaryExpressionToken).l as BinaryExpressionToken).op,
                    )
                ) {
                    result = "(" + renderValue((token as BinaryExpressionToken).l, options, cache) + ")";
                } else {
                    result = renderValue((token as BinaryExpressionToken).l, options, cache);
                }

                result += (token as BinaryExpressionToken).op == EnumToken.Mul ? "*" : "/";

                if (
                    (token as BinaryExpressionToken).r.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(
                        ((token as BinaryExpressionToken).r as BinaryExpressionToken).op,
                    )
                ) {
                    result += "(" + renderValue((token as BinaryExpressionToken).r, options, cache) + ")";
                } else {
                    result += renderValue((token as BinaryExpressionToken).r, options, cache);
                }

                return result;
            }

            return (
                renderValue((token as BinaryExpressionToken).l, options, cache) +
                ((token as BinaryExpressionToken).op == EnumToken.Add ? " + " : " - ") +
                renderValue((token as BinaryExpressionToken).r, options, cache)
            );

        case EnumToken.FractionTokenType:
            const fraction: string =
                renderValue((token as FractionToken).l) + "/" + renderValue((token as FractionToken).r);

            if (+(token as FractionToken).r.val != 0) {
                const value: string = minifyNumber(+(token as FractionToken).l.val / +(token as FractionToken).r.val);

                if (value.length <= fraction.length) {
                    return value;
                }
            }

            return fraction;

        case EnumToken.Add:
            return " + ";

        case EnumToken.Sub:
            return " - ";

        case EnumToken.Star:
        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Mul:
            return "*";

        case EnumToken.Div:
            return "/";

        case EnumToken.ColorTokenType:
            if (
                (token as ColorToken).kin == ColorType.LIGHT_DARK ||
                ("chi" in token && options.convertColor === false && ((token as ColorToken).chi as Token[]).length == 2)
            ) {
                return (
                    (token as ColorToken).val +
                    "(" +
                    ((token as ColorToken).chi as Token[]).reduce((acc: string, curr: Token) => {
                        if (curr.typ === EnumToken.IdenTokenType) {
                            parseColor(curr as IdentToken);
                        }

                        return acc + renderValue(curr, options, cache);
                    }, "") +
                    ")"
                );
            }

            if (options.convertColor !== false) {
                const value: ColorToken | null = convertColor(
                    token as ColorToken,
                    typeof options.convertColor === "boolean"
                        ? ColorType.HEX
                        : (ColorType[
                              (ColorType[options.convertColor ?? "HEX"] as string)
                                  ?.toUpperCase?.()
                                  .replaceAll?.("-", "_") as keyof typeof ColorType
                          ] ?? ColorType.HEX),
                );

                if (value != null) {
                    token = value;
                }

                if ((token as ColorToken).kin == ColorType.HEX || (token as ColorToken).kin == ColorType.LIT) {
                    return reduceHexValue((token as ColorToken).val);
                }
            }

            if (
                (token as ColorToken).kin === ColorType.SYS ||
                (token as ColorToken).kin === ColorType.DPSYS ||
                (token as ColorToken).kin === ColorType.NON_STD
            ) {
                return (token as ColorToken).val;
            }

            if ((token as ColorToken).kin == ColorType.HEX || (token as ColorToken).kin == ColorType.LIT) {
                return (token as ColorToken).val;
            }

            if (Array.isArray((token as ColorToken).chi)) {
                const fnName: string = (token as ColorToken).val.toLowerCase();
                const isLegacy: boolean = ["rgb", "rgba", "hsl", "hsla"].includes(
                    (token as ColorToken).val.toLowerCase(),
                );
                const hasAlpha: boolean = [
                    "rgb",
                    "rgba",
                    "hsl",
                    "hsla",
                    "hwb",
                    "oklab",
                    "oklch",
                    "lab",
                    "lch",
                ].includes(fnName);
                const useAlpha: boolean =
                    (hasAlpha && (token as ColorToken).chi!.length == (isLegacy ? 7 : 4)) ||
                    ("color" == (token as ColorToken).val && (token as ColorToken).chi!.length == 5);

                return (
                    (hasAlpha && (token as ColorToken).val.endsWith("a") ? fnName.slice(0, -1) : fnName) +
                    "(" +
                    (token as ColorToken)
                        .chi!.reduce((acc: string, curr: Token, index: number, array: Token[]) => {
                            if (/[,/]\s*$/.test(acc)) {
                                if (curr.typ == EnumToken.WhitespaceTokenType) {
                                    return acc.trimEnd();
                                }

                                return acc.trimStart() + renderValue(curr, options, cache);
                            }

                            if (isLegacy && curr.typ == EnumToken.CommaTokenType) {
                                return acc.trimEnd() + " ";
                            }

                            if (curr.typ == EnumToken.WhitespaceTokenType) {
                                return acc.trimEnd() + " ";
                            }

                            if (
                                curr.typ == EnumToken.CommaTokenType ||
                                (curr.typ == EnumToken.LiteralTokenType && (curr as LiteralToken).val == "/")
                            ) {
                                return acc.trimEnd() + (curr.typ == EnumToken.CommaTokenType ? "," : "/");
                            }

                            return (
                                acc.trimEnd() +
                                (useAlpha && index == array.length - 1 ? "/" : " ") +
                                renderValue(curr, options, cache)
                            );
                        }, "")
                        .trimStart() +
                    ")"
                );
            }

        case EnumToken.UrlFunctionTokenType:
            if (options.minify && token.typ === EnumToken.UrlFunctionTokenType) {
                for (const child of (token as FunctionToken).chi) {
                    if (child.typ === EnumToken.StringTokenType) {
                        if (
                            (child as StringToken).val.slice(1, 5) !== "data:" &&
                            urlTokenMatcher.test((child as StringToken).val)
                        ) {
                            Object.assign(child, {
                                typ: EnumToken.UrlTokenTokenType,
                                val: (child as StringToken).val.slice(1, -1),
                            });
                        }

                        break;
                    }
                }
            }

        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.MathFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
            if (options.minify && token.typ === EnumToken.ImageFunctionTokenType) {
                const slice = (token as FunctionToken).chi.slice() as Token[];

                switch ((token as FunctionToken).val) {
                    case "linear-gradient":
                    case "repeating-linear-gradient":
                        {
                            let i: number;
                            let k: number;
                            let j: number;
                            let key: string;

                            for (i = 0; i < slice.length; i++) {
                                if (
                                    slice[i].typ == EnumToken.ColorTokenType ||
                                    slice[i].typ === EnumToken.CommaTokenType
                                ) {
                                    break;
                                }

                                if (
                                    slice[i].typ == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "to")
                                ) {
                                    k = i + 1;
                                    while (
                                        k < slice.length &&
                                        (slice[k].typ === EnumToken.WhitespaceTokenType ||
                                            slice[k].typ === EnumToken.CommentTokenType)
                                    ) {
                                        k++;
                                    }

                                    if (k < slice.length && slice[k].typ === EnumToken.IdenTokenType) {
                                        // convert keyword to angle
                                        key = (slice[k] as IdentToken).val.toLowerCase();
                                        switch (key) {
                                            case "right":
                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: 90,
                                                } as AngleToken);
                                                break;
                                            case "left":
                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: 270,
                                                } as AngleToken);
                                                break;
                                            case "top":
                                            case "bottom":
                                                j = k + 1;

                                                while (
                                                    j < slice.length &&
                                                    (slice[j].typ === EnumToken.WhitespaceTokenType ||
                                                        slice[j].typ === EnumToken.CommentTokenType)
                                                ) {
                                                    j++;
                                                }

                                                if (j < slice.length && slice[j].typ !== EnumToken.CommaTokenType) {
                                                    i = j - 1;
                                                    break;
                                                }

                                                // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient#:~:text=If%20unspecified%2C%20it%20defaults%20to%20to%20bottom
                                                if (key === "bottom") {
                                                    // to bottom -> 180deg is the default angle and will be removed
                                                    while (
                                                        k < slice.length &&
                                                        slice[k].typ != EnumToken.CommaTokenType
                                                    ) {
                                                        k++;
                                                    }

                                                    slice.splice(i, k - i + 1);
                                                    i--;
                                                    continue;
                                                }

                                                slice.splice(i, k - i + 1, {
                                                    typ: EnumToken.AngleTokenType,
                                                    val: key === "top" ? 0 : 180,
                                                } as AngleToken);
                                                i--;
                                                break;
                                        }
                                    }
                                } else if (slice[i].typ == EnumToken.AngleTokenType) {
                                    if ((180 - (toDegrees(slice[i] as AngleToken).val as number)) % 360 === 0) {
                                        k = i + 1;

                                        while (k < slice.length && slice[k].typ !== EnumToken.CommaTokenType) {
                                            k++;
                                        }

                                        slice.splice(i, k - i + 1);
                                    }
                                }
                            }

                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }
                            }

                            if (slice[i]?.typ === EnumToken.ColorTokenType) {
                                slice.push(...reduceColorStops(slice.splice(i, slice.length - i)));
                            }
                        }

                        break;

                    case "radial-gradient":
                    case "repeating-radial-gradient":
                        {
                            let i: number = 0;

                            while (
                                i < slice.length &&
                                (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                    slice[i].typ === EnumToken.CommentTokenType)
                            ) {
                                i++;
                            }

                            const positions: Token[] = [];
                            const form: Token[] = [];
                            const size: Token[] = [];
                            const colorSpaceDef: Token[] = [];

                            if (slice[i]?.typ === EnumToken.IdenTokenType) {
                                if (
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "farthest-corner") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "ellipse")
                                ) {
                                    i++;
                                } else if (
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "closest-side") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "closest-corner") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "farthest-side")
                                ) {
                                    size.push(slice[i++]);
                                } else if (equalsIgnoreCase((slice[i] as IdentToken).val, "circle")) {
                                    form.push(slice[i++]);
                                }

                                while (
                                    slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                    slice[i]?.typ === EnumToken.CommentTokenType
                                ) {
                                    i++;
                                }
                            }

                            if (slice[i]?.typ === EnumToken.IdenTokenType) {
                                if (
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "farthest-corner") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "ellipse")
                                ) {
                                    i++;
                                } else if (
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "closest-side") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "closest-corner") ||
                                    equalsIgnoreCase((slice[i] as IdentToken).val, "farthest-side")
                                ) {
                                    size.push(slice[i++]);
                                } else if (equalsIgnoreCase((slice[i] as IdentToken).val, "circle")) {
                                    form.push(slice[i++]);
                                }

                                while (
                                    slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                    slice[i]?.typ === EnumToken.CommentTokenType
                                ) {
                                    i++;
                                }
                            }

                            if (
                                slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase((slice[i] as IdentToken).val, "at")
                            ) {
                                i++;
                            }

                            while (
                                slice[i]?.typ === EnumToken.WhitespaceTokenType ||
                                slice[i]?.typ === EnumToken.CommentTokenType
                            ) {
                                i++;
                            }

                            if (
                                slice[i]?.typ === EnumToken.PercentageTokenType ||
                                (slice[i]?.typ === EnumToken.NumberTokenType && 0 === (slice[i] as NumberToken).val) ||
                                (slice[i]?.typ === EnumToken.IdenTokenType &&
                                    (equalsIgnoreCase((slice[i] as IdentToken).val, "center") ||
                                        equalsIgnoreCase((slice[i] as IdentToken).val, "top") ||
                                        equalsIgnoreCase((slice[i] as IdentToken).val, "bottom") ||
                                        equalsIgnoreCase((slice[i] as IdentToken).val, "left") ||
                                        equalsIgnoreCase((slice[i] as IdentToken).val, "right")))
                            ) {
                                do {
                                    if (
                                        slice[i]?.typ === EnumToken.IdenTokenType &&
                                        "in" === (slice[i] as IdentToken).val
                                    ) {
                                        break;
                                    }

                                    positions.push(slice[i]);
                                    i++;
                                } while (slice[i]?.typ !== EnumToken.CommaTokenType);
                            }

                            while (slice[i]?.typ !== EnumToken.CommaTokenType) {
                                colorSpaceDef.push(slice[i++]);
                            }

                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                            }

                            if (positions.length > 0) {
                                let k: number;
                                let position1: string = "";
                                let position2: string = "";

                                for (k = 0; k < positions.length; k++) {
                                    if (positions[k].typ === EnumToken.IdenTokenType) {
                                        if (position1.length === 0) {
                                            position1 = (positions[k] as IdentToken).val;
                                        } else {
                                            position2 = (positions[k] as IdentToken).val;
                                        }
                                    } else if (
                                        positions[k].typ === EnumToken.PercentageTokenType ||
                                        positions[k].typ === EnumToken.NumberTokenType
                                    ) {
                                        if (position1.length === 0) {
                                            position1 = (positions[k] as PercentageToken | NumberToken).val + "%";
                                        } else {
                                            position2 = (positions[k] as PercentageToken | NumberToken).val + "%";
                                        }
                                    }

                                    if (position2.length > 0) {
                                        break;
                                    }
                                }

                                if (position1.length > 0) {
                                    let key = `${position1} ${position2}`.trim();

                                    if (
                                        key === "50% 50%" ||
                                        key === "center center" ||
                                        key === "50%" ||
                                        key === "center"
                                    ) {
                                        positions.length = 0;
                                    } else if (
                                        key === "0% 0%" ||
                                        key === "0 0" ||
                                        key === "top left" ||
                                        key === "left top"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.PercentageTokenType,
                                            val: 0,
                                        });
                                    } else if (
                                        key === "50% 0%" ||
                                        key === "50% 0" ||
                                        key === "center top" ||
                                        key === "top center"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "top",
                                        });
                                    } else if (key === "top right" || key === "right top") {
                                        positions.splice(
                                            0,
                                            positions.length,
                                            {
                                                typ: EnumToken.PercentageTokenType,
                                                val: 100,
                                            },
                                            { typ: EnumToken.WhitespaceTokenType },
                                            { typ: EnumToken.PercentageTokenType, val: 0 },
                                        );
                                    } else if (
                                        key === "0 50%" ||
                                        key === "0% 50%" ||
                                        key === "left center" ||
                                        key === "center left"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "left",
                                        });
                                    } else if (key === "100% 50%" || key === "right center" || key === "center right") {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "right",
                                        });
                                    } else if (
                                        key === "0 100%" ||
                                        key === "0% 100%" ||
                                        key === "left bottom" ||
                                        key === "bottom left"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "bottom",
                                        });
                                    } else if (
                                        key === "50% 100%" ||
                                        key === "center bottom" ||
                                        key === "bottom center"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.IdenTokenType,
                                            val: "bottom",
                                        });
                                    } else if (
                                        key === "100% 100%" ||
                                        key === "right bottom" ||
                                        key === "bottom right"
                                    ) {
                                        positions.splice(0, positions.length, {
                                            typ: EnumToken.PercentageTokenType,
                                            val: 100,
                                        });
                                    } else if (position1 === position2) {
                                        positions.splice(0, positions.length, positions[k]);
                                    }
                                }
                            }

                            const result: Token[] = [];

                            if (form.length > 0) {
                                result.push(...form);
                            }

                            if (size.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }

                                result.push(...size);
                            }

                            if (positions.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }

                                result.push(
                                    { typ: EnumToken.IdenTokenType, val: "at" },
                                    { typ: EnumToken.WhitespaceTokenType },
                                    ...positions,
                                );
                            }

                            if (colorSpaceDef.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }
                                result.push(...colorSpaceDef);
                            }

                            if (result.length > 0) {
                                result.push({ typ: EnumToken.CommaTokenType });
                            }

                            result.push(...reduceColorStops(slice.slice(i)));

                            slice.length = 0;
                            slice.push(...result);
                        }
                        break;

                    case "conic-gradient":
                    case "repeating-conic-gradient":
                        {
                            let i: number = 0;

                            const angles: Token[] = [];
                            const positions: Token[] = [];
                            const colorSpaceDef: Token[] = [];

                            while (
                                i < slice.length &&
                                (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                    slice[i].typ === EnumToken.CommentTokenType)
                            ) {
                                i++;
                            }

                            if (
                                slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase((slice[i] as IdentToken).val, "from")
                            ) {
                                angles.push(slice[i++]);

                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    angles.push(slice[i++]);
                                }

                                if (
                                    (slice[i]?.typ === EnumToken.NumberTokenType ||
                                        slice[i]?.typ === EnumToken.AngleTokenType) &&
                                    0 === toDegrees(slice[i] as AngleToken).val
                                ) {
                                    angles.length = 0;
                                    i++;
                                } else if (
                                    slice[i]?.typ !== EnumToken.CommaTokenType &&
                                    slice[i].typ != EnumToken.IdenTokenType
                                ) {
                                    angles.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }
                            }

                            if (
                                slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase((slice[i] as IdentToken).val, "at")
                            ) {
                                i++;

                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }

                                let position1: string = "";
                                let position2: string = "";

                                if (
                                    slice[i]?.typ === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", (slice[i] as IdentToken).val)
                                ) {
                                    position1 = (slice[i] as IdentToken).val;
                                    positions.push(slice[i++]);
                                } else if (
                                    slice[i]?.typ === EnumToken.PercentageTokenType ||
                                    slice[i]?.typ === EnumToken.NumberTokenType
                                ) {
                                    position1 = (slice[i] as IdentToken).val + "%";
                                    positions.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    positions.push(slice[i++]);
                                }

                                if (
                                    slice[i]?.typ === EnumToken.IdenTokenType &&
                                    !equalsIgnoreCase("in", (slice[i] as IdentToken).val)
                                ) {
                                    position2 = (slice[i] as IdentToken).val;
                                    positions.push(slice[i++]);
                                } else if (
                                    slice[i]?.typ === EnumToken.PercentageTokenType ||
                                    slice[i]?.typ === EnumToken.NumberTokenType
                                ) {
                                    position2 = (slice[i] as IdentToken).val + "%";
                                    positions.push(slice[i++]);
                                }

                                while (
                                    i < slice.length &&
                                    (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                        slice[i].typ === EnumToken.CommentTokenType)
                                ) {
                                    i++;
                                }

                                if (position1.length > 0) {
                                    reducegradientBackgroundPosition(positions, `${position1} ${position2}`.trim());
                                }
                            }

                            while (
                                i < slice.length &&
                                (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                    slice[i].typ === EnumToken.CommentTokenType)
                            ) {
                                i++;
                            }

                            if (
                                slice[i]?.typ === EnumToken.IdenTokenType &&
                                equalsIgnoreCase("in", (slice[i] as IdentToken).val)
                            ) {
                                while (i < slice.length && slice[i].typ !== EnumToken.CommaTokenType) {
                                    colorSpaceDef.push(slice[i++]);
                                }
                            }

                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                            }

                            const result: Token[] = [];

                            if (positions.length > 0) {
                                if (positions.length > 0) {
                                    if (angles.length > 0) {
                                        angles.push({ typ: EnumToken.WhitespaceTokenType });
                                    }

                                    angles.push(
                                        { typ: EnumToken.IdenTokenType, val: "at" },
                                        { typ: EnumToken.WhitespaceTokenType },
                                        ...positions,
                                    );
                                }
                            }

                            if (angles.length > 0) {
                                result.push(...angles, { typ: EnumToken.CommaTokenType });
                            }

                            if (colorSpaceDef.length > 0) {
                                if (colorSpaceDef.length > 0) {
                                    if (result.length > 0) {
                                        result.push({ typ: EnumToken.WhitespaceTokenType });
                                    }

                                    result.push(...colorSpaceDef);
                                }

                                result.push({ typ: EnumToken.CommaTokenType });
                            }

                            result.push(...reduceConicColorStops(slice.slice(i)));
                            slice.length = 0;
                            slice.push(...result);
                        }
                        break;
                }

                return (token as FunctionToken).val + "(" + slice.reduce(reducer, "") + ")";
            }

        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.WhenElseFunctionTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:
        case EnumToken.SupportsFunctionTokenType:
        case EnumToken.ContainerFunctionTokenType:
        case EnumToken.TransformFunctionTokenType:
        case EnumToken.GeneralEnclosedFunctionTokenType:
        case EnumToken.CustomFunctionTokenType:
        case EnumToken.WildCardFunctionTokenType:
            if (
                token.typ == EnumToken.MathFunctionTokenType &&
                (token as FunctionToken).chi.length == 1 &&
                ![EnumToken.BinaryExpressionTokenType, EnumToken.FractionTokenType, EnumToken.IdenTokenType].includes(
                    (token as FunctionToken).chi[0].typ,
                ) &&
                // @ts-ignore
                ((<FractionToken>((<NumberToken>(token as FunctionToken).chi[0]) as NumberToken).val) as FractionToken)
                    ?.typ != EnumToken.FractionTokenType
            ) {
                return (
                    (token as FunctionToken).val +
                    "(" +
                    (token as FunctionToken).chi.reduce(
                        (acc: string, curr: Token) =>
                            acc +
                            renderValue(
                                curr,
                                token.typ == EnumToken.FunctionTokenType ? { minify: false } : options,
                                cache,
                                reducer,
                            ),
                        "",
                    ) +
                    ")"
                );
            }

            return (
                /* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/ ((
                    token as FunctionToken
                ).val ?? "") +
                "(" +
                (token as FunctionToken).chi.reduce(reducer, "") +
                ")"
            );

        case EnumToken.MatchExpressionTokenType:
            return (
                renderValue((token as MatchExpressionToken).l as Token, options, cache, reducer, errors) +
                renderValue((token as MatchExpressionToken).op, options, cache, reducer, errors) +
                renderValue((token as MatchExpressionToken).r, options, cache, reducer, errors) +
                ((token as MatchExpressionToken).attr ? " " + (token as MatchExpressionToken).attr : "")
            );

        case EnumToken.NameSpaceAttributeTokenType:
            return (
                ((token as NameSpaceAttributeToken).l == null
                    ? ""
                    : renderValue((token as NameSpaceAttributeToken).l as Token, options, cache, reducer, errors)) +
                "|" +
                renderValue((token as NameSpaceAttributeToken).r, options, cache, reducer, errors)
            );

        case EnumToken.ComposesSelectorNodeType:
            return (
                (token as ComposesSelectorToken).l.reduce(
                    (acc: string, curr: Token) => acc + renderValue(curr, options, cache),
                    "",
                ) +
                ((token as ComposesSelectorToken).r == null
                    ? ""
                    : " from " +
                      renderValue((token as ComposesSelectorToken).r as Token, options, cache, reducer, errors))
            );

        case EnumToken.BlockStartTokenType:
            return "{";

        case EnumToken.BlockEndTokenType:
            return "}";

        case EnumToken.StartParensTokenType:
            return "(";

        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:
            return "=";

        case EnumToken.IncludeMatchTokenType:
            return "~=";

        case EnumToken.DashMatchTokenType:
            return "|=";

        case EnumToken.StartMatchTokenType:
            return "^=";

        case EnumToken.EndMatchTokenType:
            return "$=";

        case EnumToken.ContainMatchTokenType:
            return "*=";

        case EnumToken.LtTokenType:
            return "<";

        case EnumToken.LteTokenType:
            return "<=";

        case EnumToken.Tilda:
        case EnumToken.SubsequentSiblingCombinatorTokenType:
            return "~";

        case EnumToken.Plus:
        case EnumToken.NextSiblingCombinatorTokenType:
            return "+";

        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return ">";

        case EnumToken.GteTokenType:
            return ">=";

        case EnumToken.ColumnCombinatorTokenType:
            return "||";

        case EnumToken.EndParensTokenType:
            return ")";

        case EnumToken.AttrStartTokenType:
            return "[";

        case EnumToken.AttrEndTokenType:
            return "]";

        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:
            return " ";

        case EnumToken.ColonTokenType:
            return ":";

        case EnumToken.DoubleColonTokenType:
            return "::";

        case EnumToken.SemiColonTokenType:
            return ";";

        case EnumToken.CommaTokenType:
            return ",";

        case EnumToken.ImportantTokenType:
            return "!important";

        case EnumToken.Pipe:
            return "|";
        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:
            return "[" + (<AttrToken>(token as AttrToken | IdentListToken)).chi.reduce(reducer, "") + "]";

        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:
            let val: string =
                (<FractionToken>(token as LengthToken).val).typ == EnumToken.FractionTokenType
                    ? renderValue(<FractionToken>(token as LengthToken).val, options, cache)
                    : minifyNumber(<string | number>(token as LengthToken).val);
            let unit: string = (token as LengthToken).unit;

            if (token.typ == EnumToken.AngleTokenType && !val.includes("/")) {
                const angle: number = getAngle(<AngleToken>token);

                let v: string;
                let value: string = val + unit;

                for (const u of ["turn", "deg", "rad", "grad"]) {
                    if ((token as AngleToken).unit == u) {
                        continue;
                    }

                    switch (u) {
                        case "turn":
                            v = minifyNumber(toPrecisionAngle(angle, colorPrecision, false));

                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "deg":
                            v = minifyNumber(toPrecisionAngle(angle * 360, colorPrecision, false));

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "rad":
                            v = minifyNumber(toPrecisionAngle(angle * (2 * Math.PI), colorPrecision, false));

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "grad":
                            v = minifyNumber(toPrecisionAngle(angle * 400, colorPrecision, false));

                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;
                    }
                }
            }

            if (val === "0") {
                if (token.typ == EnumToken.TimeTokenType) {
                    return "0s";
                }

                if (token.typ == EnumToken.FrequencyTokenType) {
                    return "0Hz";
                }

                // @ts-ignore
                if (token.typ == EnumToken.ResolutionTokenType) {
                    return "0x";
                }

                return "0";
            }

            if (token.typ == EnumToken.TimeTokenType) {
                if (unit == "ms") {
                    // @ts-ignore
                    const v: string = minifyNumber(val / 1000);

                    if (v.length + 1 <= val.length) {
                        return v + "s";
                    }

                    return val + "ms";
                }

                return val + "s";
            }

            if (token.typ == EnumToken.ResolutionTokenType && unit == "dppx") {
                unit = "x";
            }

            return val.includes("/") ? val.replace("/", unit + "/") : val + unit;

        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni: string = token.typ == EnumToken.PercentageTokenType ? "%" : "fr";
            const perc: string =
                (<FractionToken>(token as PercentageToken).val).typ == EnumToken.FractionTokenType
                    ? renderValue(<FractionToken>(token as PercentageToken).val, options, cache)
                    : minifyNumber((token as PercentageToken).val as number);

            return options.minify && perc == "0" ? "0" : perc.includes("/") ? perc.replace("/", uni + "/") : perc + uni;

        case EnumToken.NumberTokenType:
            return (<FractionToken>(token as NumberToken).val).typ == EnumToken.FractionTokenType
                ? renderValue(<FractionToken>(token as NumberToken).val, options, cache)
                : minifyNumber((token as NumberToken).val as number);

        case EnumToken.AtRuleTokenType:
            return "@" + (token as AtRuleToken).nam;

        case EnumToken.CommentTokenType:
        case EnumToken.CDOCOMMNodeType:
            if (
                options.removeComments &&
                (!options.preserveLicense || !(token as CommentToken).val.startsWith("/*!"))
            ) {
                return "";
            }

        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (
                token.typ == EnumToken.PseudoElementTokenType &&
                pseudoElements.includes((token as PseudoElementToken).val.slice(1))
            ) {
                return (token as PseudoElementToken).val.slice(1);
            }

        case EnumToken.UrlTokenTokenType:

        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return (
                token as
                    | ClassSelectorToken
                    | StringToken
                    | LiteralToken
                    | HashToken
                    | DashedIdentToken
                    | PseudoPageToken
                    | IdentToken
            ).val;

        case EnumToken.NestingSelectorTokenType:
            return "&";

        case EnumToken.InvalidAttrTokenType:
            return (
                "[" +
                (<InvalidAttrToken>token).chi.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                )
            );

        case EnumToken.InvalidClassSelectorTokenType:
            return (token as InvalidClassSelectorToken).val;

        case EnumToken.SupportsQueryUnaryConditionTokenType:
        case EnumToken.WhenElseUnaryConditionTokenType:
            return (
                renderValue(
                    (token as SupportsQueryUnaryConditionToken | WhenElseUnaryConditionToken).l,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                (token as SupportsQueryUnaryConditionToken | WhenElseUnaryConditionToken).r.reduce(
                    (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                    "",
                )
            );

        case EnumToken.SupportsQueryConditionTokenType:
        case EnumToken.WhenElseQueryConditionTokenType:
            return (
                (token as SupportsQueryConditionToken | WhenElseQueryConditionToken).l.reduce(
                    (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                " " +
                renderValue(
                    (token as SupportsQueryConditionToken | WhenElseQueryConditionToken).op,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                (token as SupportsQueryConditionToken).r.reduce(
                    (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                    "",
                )
            );

        case EnumToken.IfConditionTokenType:
            return (token as IfConditionToken).l.length == 0
                ? ""
                : (token as SupportsQueryConditionToken | WhenElseQueryConditionToken).l.reduce(
                      (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                      "",
                  ) +
                      ":" +
                      (token as SupportsQueryConditionToken).r.reduce(
                          (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                          "",
                      );

        case EnumToken.IfElseConditionTokenType:
            return renderValue((token as IfElseConditionToken).l) + renderValue((token as IfElseConditionToken).r);

        case EnumToken.DeclarationNodeType:
            return (
                (<AstDeclaration>token).nam +
                ":" +
                (options.minify ? filterValues((<AstDeclaration>token).val) : (<AstDeclaration>token).val).reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                )
            );

        case EnumToken.MediaQueryUnaryFeatureTokenType:
            return (
                renderValue((token as MediaQueryUnaryFeatureToken).l, options, cache, reducer, errors) +
                " " +
                (token as MediaQueryUnaryFeatureToken).r.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                )
            );

        case EnumToken.MediaQueryConditionTokenType: {
            const indent =
                (token as MediaQueryConditionToken).op.typ == EnumToken.LtTokenType ||
                (token as MediaQueryConditionToken).op.typ == EnumToken.GtTokenType ||
                (token as MediaQueryConditionToken).op.typ == EnumToken.ColonTokenType ||
                (token as MediaQueryConditionToken).op.typ == EnumToken.DelimTokenType ||
                (token as MediaQueryConditionToken).op.typ == EnumToken.LteTokenType ||
                (token as MediaQueryConditionToken).op.typ == EnumToken.GteTokenType
                    ? ""
                    : " ";
            return (
                (token as MediaQueryConditionToken).l.reduce(
                    (acc, curr) => acc + renderValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                indent +
                renderValue((token as MediaQueryConditionToken).op, options, cache, reducer, errors) +
                indent +
                (token as MediaQueryConditionToken).r.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                )
            );
        }

        case EnumToken.MediaRangeQueryTokenType:
            return (
                (token as MediaRangeQueryToken).l.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                ) +
                renderValue((token as MediaRangeQueryToken).op1) +
                (token as MediaRangeQueryToken).val.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                renderValue((token as MediaRangeQueryToken).op2) +
                (token as MediaRangeQueryToken).r.reduce(
                    (acc: string, curr: Token): string => acc + renderValue(curr, options, cache),
                    "",
                )
            );

        case EnumToken.MediaFeatureTokenType:
            return (token as MediaFeatureToken).val;

        case EnumToken.NotTokenType:
            return "not";

        case EnumToken.OnlyTokenType:
            return "only";
        case EnumToken.AndTokenType:
            return "and";

        case EnumToken.OrTokenType:
            return "or";

        case EnumToken.InvalidMediaQueryTokenType:
        // case EnumToken.InvalidDeclarationNodeType:
        case EnumToken.InvalidCommentTokenType:
        case EnumToken.BadCommentTokenType:
        case EnumToken.BadCdoTokenType:
        case EnumToken.BadStringTokenType:
        case EnumToken.EOFTokenType:
            return "";

        default:
            console.debug({ token });
            throw new Error(`Unsupported token type for ${EnumToken[token.typ]}`);
    }

    errors?.push({ action: "ignore", message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    return "";
}

/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
export function filterValues(values: Token[]): Token[] {
    let i: number = 0;

    for (; i < values.length; i++) {
        if (values[i].typ == EnumToken.ImportantTokenType && values[i - 1]?.typ === EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        } else if (
            tokensfuncSet.has(values[i].typ) &&
            "chi" in values[i] &&
            (values[i] as FunctionToken).typ != EnumToken.WildCardFunctionTokenType &&
            values[i + 1]?.typ == EnumToken.WhitespaceTokenType
        ) {
            values.splice(i + 1, 1);
        }
    }

    return values;
}
