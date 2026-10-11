import type {
    AngleToken,
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    AttrToken,
    BinaryExpressionToken,
    ClassSelectorToken,
    ColorToken,
    CommentToken,
    DashedIdentToken,
    ErrorDescription,
    FractionToken,
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
    MediaFeatureToken,
    MediaQueryConditionToken,
    MediaQueryUnaryFeatureToken,
    MediaRangeQueryToken,
    NumberToken,
    PercentageToken,
    PseudoElementToken,
    PseudoPageToken,
    RenderOptions,
    SourceLocation,
    StringToken,
    SupportsQueryConditionToken,
    SupportsQueryUnaryConditionToken,
    Token,
    WhenElseQueryConditionToken,
    WhenElseUnaryConditionToken,
    WrappedValuesToken,
} from "../../@types/index.d.ts";
import { convertColor, EnumAstNodeStatus, expand, RenderResult, SourceMap } from "../../node.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import { Arena } from "../parser/arena.ts";
import { LineMap } from "../parser/linesmap.ts";
import { SourceFile } from "../parser/source.ts";
import { toDegrees } from "../parser/utils/angle.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { getAngle } from "../syntax/color/color.ts";
import { reduceHexValue } from "../syntax/color/hex.ts";
import { anglePrecision, pseudoElements, tokensfuncSet, urlTokenMatcher } from "../syntax/constants.ts";
import {
    minifyNumber,
    parseColor,
    reduceColorStops,
    reduceConicColorStops,
    reducegradientBackgroundPosition,
    toPrecisionAngle,
    toPrecisionValue,
} from "../syntax/syntax.ts";

export function print(node: number, arena: Arena, options: RenderOptions = {}): RenderResult {
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
        minifyValues: true,
        sourcemap: false,
        convertColor: true,
        expandNestingRules: false,
        preserveLicense: false,
        ...options,
    };

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const sourcemap: SourceMap | null = options.sourcemap ? new SourceMap() : null;
    const sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> } | null =
        options.sourcemap ? { sources: [], maps: [] } : null;
    const cache: {
        [key: string]: any;
    } = Object.create(null);

    const sourceLocation = {
        srcId: 0,
        sta: 0,
        end: 0,
    } as SourceLocation;
    const lineMap: LineMap | null = options.sourcemap ? new LineMap() : null;

    let code: string = "";
    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }

    const result: RenderResult = {
        code:
            code +
            printNode(
                // options.expandNestingRules &&
                // [EnumToken.StyleSheetNodeType, EnumToken.AtRuleNodeType, EnumToken.RuleNodeType].includes(
                //     data.typ,
                // ) &&
                // "chi" in data
                // ? expand(data as AstStyleSheet | AstAtRule | AstRule)
                // :
                node,
                arena,
                options,
                sourcemaps,
                sourceLocation,
                lineMap,
                errors,
                function reducer(acc: string, curr: number): string {
                    if (arena.getType(curr) == EnumToken.CommentTokenType && options.removeComments) {
                        const val = arena.getValue(curr);

                        if (!options.preserveLicense || !val.startsWith("/*!")) {
                            return acc;
                        }

                        return acc + val;
                    }

                    return acc + printValue(curr, arena, options, cache, reducer, errors);
                },
                cache,
            ),
        errors,
        stats: {
            total: `${(performance.now() - startTime).toFixed(2)}ms`,
        },
    };

    if (sourcemap != null) {
        let source: SourceFile;
        for (const sourceId of sourcemaps!.sources) {
            source = options!.sourcesMap!.get(sourceId)! as SourceFile;
            sourcemap.addSourceContent(source.id, source.getFileName(), source.getContent());
        }

        sourcemap.add(sourcemaps!.maps!);
        result.map = sourcemap;

        if (options.sourcemap === "inline") {
            result.code += `\n/*# sourceMappingURL=${result.map.toUrl()} */`;
        }
    }

    return result;
}

function printNode(
    data: number,
    arena: Arena,
    options: RenderOptions,
    sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> } | null,
    sourceLocation: SourceLocation,
    lineMap: LineMap | null,
    errors: ErrorDescription[],
    reducer: (acc: string, curr: number) => string,
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

    // @ts-ignore
    let children: string = "";
    let str: string = "";
    let val: string;

    let typ: number = arena.getType(data);
    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    switch (typ) {
        case EnumToken.DeclarationNodeType:
            return `${arena.getName(data)}:${options.indent}${(options.minifyValues
                ? filterValues(arena.children(data), arena)
                : arena.children(data)
            ).reduce(reducer, "")}`;

        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
            str = arena.getValue(data);

            if (str.startsWith("/*# sourceMappingURL=")) {
                // ignore sourcemap comment
                return "";
            }

            return !options.removeComments || (options.preserveLicense && str.startsWith("/*!")) ? str : "";

        case EnumToken.StyleSheetNodeType:
            for (const node of arena.children(data)) {
                str = printNode(
                    node,
                    arena,
                    options,
                    sourcemaps,
                    sourceLocation,
                    lineMap,
                    errors,
                    reducer,
                    cache,
                    level,
                    indents,
                );

                if (str === "") {
                    continue;
                }

                if (children.length > 0) {
                    str = options.newLine + str;
                }

                children += str;

                if (sourcemaps != null && str !== "" && options.newLine) {
                    move(sourceLocation, lineMap!, options.newLine as string);
                }
            }

            return children;

        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyframesRuleNodeType:
        case EnumToken.KeyframesAtRuleNodeType:
            if (
                (typ == EnumToken.AtRuleNodeType || EnumToken.KeyframesAtRuleNodeType == typ) &&
                !arena.hasFlags(data, EnumAstNodeStatus.HasChildren)
            ) {
                str = arena.getValue(data);
                return `${indent}@${arena.getName(data)}${str === "" ? "" : options.indent || " "}${str};`;
            }

            str = arena.getValue(data);
            const lineMapLength = lineMap ? lineMap.getLineStarts().length : 0;
            const prelude =
                (indent.length > 0 ? options.newLine : "") +
                indent +
                (typ === EnumToken.AtRuleNodeType || typ === EnumToken.KeyframesAtRuleNodeType
                    ? `@${arena.getName(data)}${str === "" ? "" : options.indent || " "}${str}${options.indent}{`
                    : str + `${options.indent}{`);

            if (sourcemaps != null) {
                updateSourceMap(data, options, cache, sourcemaps, sourceLocation, lineMap!, prelude);
            }

            let node: number;
            let recordDeclarationSourceMap: boolean = typ == EnumToken.AtRuleNodeType;
            const kids = arena.children(data);

            for (let i = 0; i < kids.length; i++) {
                node = kids[i];
                typ = arena.getType(node);
                if (typ == EnumToken.CommentNodeType) {
                    val = arena.getValue(node);
                    str = options.removeComments && (!options.preserveLicense || !val.startsWith("/*!")) ? "" : val;
                } else if (typ == EnumToken.DeclarationNodeType) {
                    str = `${arena.getName(node)}:${options.indent}${(options.minifyValues
                        ? filterValues(arena.children(node), arena)
                        : arena.children(node)
                    )
                        .reduce(reducer, "")
                        .trimEnd()};`;
                } else {
                    str = printNode(
                        node,
                        arena,
                        options,
                        sourcemaps,
                        sourceLocation,
                        lineMap,
                        errors,
                        reducer,
                        cache,
                        level + 1,
                        indents,
                    );

                    if (str === "") {
                        continue;
                    }

                    children += str;
                    str = "";
                    continue;
                }

                if (str === "") {
                    continue;
                }

                str = options.newLine + indentSub + str;
                children += str;

                if (sourcemaps != null && str !== "") {
                    if (arena.getType(node) == EnumToken.DeclarationNodeType && recordDeclarationSourceMap) {
                        // if declaration is child of at-rule, then record it
                        // .rule {
                        //     @media screen {
                        //         color: red;
                        //     }
                        // }
                        // @ts-ignore
                        updateSourceMap(node, options, cache, sourcemaps, sourceLocation, lineMap!, str);
                    } else {
                        move(sourceLocation, lineMap!, str);
                    }
                }
            }

            if (children.endsWith(";")) {
                children = children.slice(0, -1);
                sourceLocation.end--;
            }

            if (options.removeEmpty && children === "") {
                if (sourcemaps != null) {
                    sourceLocation.end -= prelude.length;
                    lineMap!.getLineStarts().length = lineMapLength;
                }
                return "";
            }

            const end: string = options.newLine + indent + `}`;

            if (sourcemaps != null) {
                move(sourceLocation, lineMap!, end);
            }

            return prelude + children + end;

        default:
            return "";
    }
}

/**
 * render ast token
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 * @private
 */
export function printValue(
    token: number,
    arena: Arena,
    options: RenderOptions,
    cache: {
        [key: string]: any;
    } = Object.create(null),
    reducer?: null | ((acc: string, curr: number) => string),
    errors?: ErrorDescription[],
): string {
    const typ = arena.getType(token);

    if (typ === EnumToken.WhenElseFunctionTokenType && arena.equalsIgnoreCase(token, "val", "supports")) {
        options = { ...options, minifyValues: false, minify: false, convertColor: false };
        reducer = null;
    }

    options.minifyValues ??= options.minify;

    if (reducer == null) {
        reducer = function (acc: string, curr: number): string {
            if (arena.getType(curr) == EnumToken.CommentTokenType && options.removeComments) {
                if (!options.preserveLicense || !arena.startsWith(curr, "val", "/*!")) {
                    return acc;
                }

                return acc + arena.getValue(curr);
            }

            return acc + printValue(curr, arena, options, cache, reducer, errors);
        };
    }

    switch (typ) {
        case EnumToken.UrlFunctionTokenDefType:
        case EnumToken.FunctionTokenDefType:
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
            return arena.getValue(token) + "(";

        case EnumToken.ListTokenType:
            return arena
                .children(token)
                .reduce((acc: string, curr: number) => acc + printValue(curr, arena, options, cache), "");

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
                    result = "(" + printValue((token as BinaryExpressionToken).l, arena, options, cache) + ")";
                } else {
                    result = printValue((token as BinaryExpressionToken).l, options, cache);
                }

                result += (token as BinaryExpressionToken).op == EnumToken.Mul ? "*" : "/";

                if (
                    (token as BinaryExpressionToken).r.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(
                        ((token as BinaryExpressionToken).r as BinaryExpressionToken).op,
                    )
                ) {
                    result += "(" + printValue((token as BinaryExpressionToken).r, options, cache) + ")";
                } else {
                    result += printValue((token as BinaryExpressionToken).r, options, cache);
                }

                return result;
            }

            return (
                printValue((token as BinaryExpressionToken).l, options, cache) +
                ((token as BinaryExpressionToken).op == EnumToken.Add ? " + " : " - ") +
                printValue((token as BinaryExpressionToken).r, options, cache)
            );

        case EnumToken.FractionTokenType:
            const fraction: string =
                printValue((token as FractionToken).l) + "/" + printValue((token as FractionToken).r);

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

        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Star:
        case EnumToken.Mul:
            return "*";

        case EnumToken.Div:
            return "/";

        case EnumToken.WrappedValuesTokenType:
            return (
                "{" +
                (token as WrappedValuesToken).chi.reduce(
                    (acc: string, curr: Token) => acc + printValue(curr, options, cache),
                    "",
                ) +
                "}"
            );

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

                        return acc + printValue(curr, options, cache);
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
                const fnName: string = (token as ColorToken).val;
                const isLegacy: boolean = ["rgb", "rgba", "hsl", "hsla"].includes((token as ColorToken).val);
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

                                return acc.trimStart() + printValue(curr, options, cache);
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
                                printValue(curr, options, cache)
                            );
                        }, "")
                        .trimStart() +
                    ")"
                );
            }

        case EnumToken.UrlFunctionTokenType:
            if (options.minifyValues && token.typ === EnumToken.UrlFunctionTokenType) {
                if ((token as FunctionToken).chi[0]?.typ === EnumToken.BadUrlTokenType) {
                    return "url()";
                }

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
            if (options.minifyValues && token.typ === EnumToken.ImageFunctionTokenType) {
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

                                        // while (k < slice.length && slice[k].typ !== EnumToken.CommaTokenType) {
                                        //     k++;
                                        // }

                                        slice.splice(i, k - i + 1);
                                    }
                                }
                            }

                            if (slice[i]?.typ === EnumToken.CommaTokenType) {
                                i++;
                                // while (
                                //     i < slice.length &&
                                //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                                //         slice[i].typ === EnumToken.CommentTokenType)
                                // ) {
                                //     i++;
                                // }
                            }

                            if (slice[i]?.typ === EnumToken.ColorTokenType) {
                                for (const token of reduceColorStops(slice.splice(i, slice.length - i))) {
                                    slice.push(token);
                                }
                            }
                        }

                        break;

                    case "radial-gradient":
                    case "repeating-radial-gradient":
                        {
                            let i: number = 0;

                            // while (
                            //     i < slice.length &&
                            //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                            //         slice[i].typ === EnumToken.CommentTokenType)
                            // ) {
                            //     i++;
                            // }

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
                                for (const token of form) {
                                    result.push(token);
                                }
                            }

                            if (size.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }

                                for (const token of size) {
                                    result.push(token);
                                }
                            }

                            if (positions.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }

                                result.push(
                                    { typ: EnumToken.IdenTokenType, val: "at" },
                                    { typ: EnumToken.WhitespaceTokenType },
                                );

                                for (const token of positions) {
                                    result.push(token);
                                }
                            }

                            if (colorSpaceDef.length > 0) {
                                if (result.length > 0) {
                                    result.push({ typ: EnumToken.WhitespaceTokenType });
                                }

                                for (const token of colorSpaceDef) {
                                    result.push(token);
                                }
                            }

                            if (result.length > 0) {
                                result.push({ typ: EnumToken.CommaTokenType });
                            }

                            for (const token of reduceColorStops(slice.slice(i))) {
                                result.push(token);
                            }

                            slice.length = 0;

                            for (const token of result) {
                                slice.push(token);
                            }
                        }
                        break;

                    case "conic-gradient":
                    case "repeating-conic-gradient":
                        {
                            let i: number = 0;

                            const angles: Token[] = [];
                            const positions: Token[] = [];
                            const colorSpaceDef: Token[] = [];

                            // while (
                            //     i < slice.length &&
                            //     (slice[i].typ === EnumToken.WhitespaceTokenType ||
                            //         slice[i].typ === EnumToken.CommentTokenType)
                            // ) {
                            //     i++;
                            // }

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
                                    );

                                    for (const position of positions) {
                                        angles.push(position);
                                    }
                                }
                            }

                            if (angles.length > 0) {
                                for (const angle of angles) {
                                    result.push(angle);
                                }
                                result.push({ typ: EnumToken.CommaTokenType });
                            }

                            if (colorSpaceDef.length > 0) {
                                if (colorSpaceDef.length > 0) {
                                    if (result.length > 0) {
                                        result.push({ typ: EnumToken.WhitespaceTokenType });
                                    }

                                    for (const token of colorSpaceDef) {
                                        result.push(token);
                                    }
                                }

                                result.push({ typ: EnumToken.CommaTokenType });
                            }

                            for (const token of reduceConicColorStops(slice.slice(i))) {
                                result.push(token);
                            }

                            slice.length = 0;

                            for (let j = 0; j < result.length; j++) {
                                slice.push(result[j]);
                            }
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
                            printValue(
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

            return ((token as FunctionToken).val ?? "") + "(" + (token as FunctionToken).chi.reduce(reducer, "") + ")";

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
                    ? printValue(<FractionToken>(token as LengthToken).val, options, cache)
                    : minifyNumber(<string | number>(token as LengthToken).val);
            let unit: string = (token as LengthToken).unit;

            if (token.typ == EnumToken.AngleTokenType && !val.includes("/")) {
                const angle: number = getAngle(<AngleToken>token);

                let v: string;
                let value: string = val + unit;

                for (const u of ["deg", "turn", "rad", "grad"]) {
                    if ((token as AngleToken).unit == u) {
                        continue;
                    }

                    switch (u) {
                        case "deg":
                            v = minifyNumber(
                                toPrecisionAngle(angle * 360, anglePrecision, false).toFixed(anglePrecision),
                            );

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "turn":
                            v = minifyNumber(toPrecisionAngle(angle, anglePrecision, false).toFixed(anglePrecision));

                            if (v.length + 4 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "rad":
                            v = minifyNumber(
                                toPrecisionAngle(angle * (2 * Math.PI), anglePrecision, false).toFixed(anglePrecision),
                            );

                            if (v.length + 3 < value.length) {
                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case "grad":
                            v = minifyNumber(
                                toPrecisionAngle(angle * 400, anglePrecision, false).toFixed(anglePrecision),
                            );

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

            return val.includes("/") ? val.replace("/", unit + "/") : minifyNumber(toPrecisionValue(val)) + unit;

        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:
            const uni: string = token.typ == EnumToken.PercentageTokenType ? "%" : "fr";
            const perc: string = arena.hasFlags(token, EnumAstNodeStatus.HasFractionValue)
                ? printValue(arena.getNumericValue(token), arena, options, cache)
                : minifyNumber(arena.getNumericValue(token));

            return options.minifyValues && perc == "0"
                ? "0"
                : perc.includes("/")
                  ? perc.replace("/", uni + "/")
                  : perc + uni;

        case EnumToken.NumberTokenType:
            return arena.hasFlags(token, EnumAstNodeStatus.HasFractionValue)
                ? printValue(arena.getNumericValue(token), arena, options, cache)
                : minifyNumber(arena.getNumericValue(token));

        case EnumToken.InfinityTokenType:
            return "1/0";
        case EnumToken.NegativeInfinityTokenType:
            return "-1/0";

        case EnumToken.NaNTokenType:
            return "NaN";

        case EnumToken.AtRuleTokenType:
            return "@" + arena.getName(token);

        case EnumToken.CommentTokenType:
        case EnumToken.CDOCOMMNodeType:
            if (options.removeComments && (!options.preserveLicense || !arena.startsWith(token, "val", "/*!"))) {
                return "";
            }

        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (typ == EnumToken.PseudoElementTokenType) {
                let val = arena.getValue(token);
                let slice = val.slice(1);

                if (pseudoElements.includes(slice)) {
                    return slice;
                }
            }

        case EnumToken.UrlTokenTokenType:

        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:
            return arena.getValue(
                token 
            );

        case EnumToken.NestingSelectorTokenType:
            return "&";

        case EnumToken.InvalidAttrTokenType:
            return (
                "[" +
                arena.children(token).reduce(
                    (acc: string, curr: number): string => acc + printValue(curr, arena, options, cache),
                    "",
                )
            );

        case EnumToken.InvalidClassSelectorTokenType:
            return arena.getValue(token );

        case EnumToken.SupportsQueryUnaryConditionTokenType:
        case EnumToken.WhenElseUnaryConditionTokenType:
            return (
                printValue(
                    arena.getLeft(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                
                printValue(
                    arena.getRight(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                )
            );

        case EnumToken.SupportsQueryConditionTokenType:
        case EnumToken.WhenElseQueryConditionTokenType:
            return (
                
                printValue(
                    arena.getLeft(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                
                printValue(
                    arena.getOp(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                
                printValue(
                    arena.getRight(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                )
            );

        case EnumToken.IfConditionTokenType:
            return (token as IfConditionToken).l.length == 0
                ? ""
                : (token as SupportsQueryConditionToken | WhenElseQueryConditionToken).l.reduce(
                      (acc, curr) => acc + printValue(curr, options, cache, reducer, errors),
                      "",
                  ) +
                      ":" +
                      (options.indent ?? "") +
                      (token as SupportsQueryConditionToken).r.reduce(
                          (acc, curr) => acc + printValue(curr, options, cache, reducer, errors),
                          "",
                      );

        case EnumToken.IfElseConditionTokenType:
            return (
                printValue((token as IfElseConditionToken).l, options, cache, reducer, errors) +
                (options.indent ?? "") +
                printValue((token as IfElseConditionToken).r, options, cache, reducer, errors)
            );

        case EnumToken.DeclarationNodeType:
            return (
                arena.getName(token) +
                ":" +
                (options.minifyValues ? filterValues(arena.children(token), arena) : arena.children(token)).reduce(
                    (acc: string, curr: number): string => acc + printValue(curr, arena, options, cache, reducer, errors),
                    "",
                )
            );

        case EnumToken.MediaQueryUnaryFeatureTokenType:
            return (
                printValue(
                    arena.getLeft(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
                ) +
                " " +
                printValue(
                    arena.getRight(token ) as number,
                    arena,
                    options,
                    cache,
                    reducer,
                    errors,
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
                    (acc, curr) => acc + printValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                indent +
                printValue((token as MediaQueryConditionToken).op, options, cache, reducer, errors) +
                indent +
                (token as MediaQueryConditionToken).r.reduce(
                    (acc: string, curr: Token): string => acc + printValue(curr, options, cache, reducer, errors),
                    "",
                )
            );
        }

        case EnumToken.MediaRangeQueryTokenType:
            return (
                (token as MediaRangeQueryToken).l.reduce(
                    (acc: string, curr: Token): string => acc + printValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                printValue((token as MediaRangeQueryToken).op1, options, cache, reducer, errors) +
                (token as MediaRangeQueryToken).val.reduce(
                    (acc: string, curr: Token): string => acc + printValue(curr, options, cache, reducer, errors),
                    "",
                ) +
                printValue((token as MediaRangeQueryToken).op2, options, cache, reducer, errors) +
                (token as MediaRangeQueryToken).r.reduce(
                    (acc: string, curr: Token): string => acc + printValue(curr, options, cache, reducer, errors),
                    "",
                )
            );

        case EnumToken.MediaFeatureTokenType:
            return arena.getValue(token );

        case EnumToken.NotTokenType:
            return "not";

        case EnumToken.OnlyTokenType:
            return "only";
        case EnumToken.AndTokenType:
            return "and";

        case EnumToken.OrTokenType:
            return "or";

        case EnumToken.InvalidMediaQueryTokenType:
        case EnumToken.InvalidCommentTokenType:
        case EnumToken.BadCommentTokenType:
        case EnumToken.BadCdoTokenType:
        case EnumToken.BadStringTokenType:
        case EnumToken.BadUrlTokenType:
        case EnumToken.EOFTokenType:
            return "";

        default:
            console.debug({ token });
            throw new Error(`Unsupported token type for ${EnumToken[typ]}`);
    }

    // errors?.push({ action: "ignore", message: `render: unexpected token ${JSON.stringify(token, null, 1)}` });
    // return "";
}

/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
export function filterValues(values: number[], arena: Arena): number[] {
    let i: number = 0;
    let typ: EnumToken;

    for (; i < values.length; i++) {
        typ = arena.getType(values[i]);

        if (typ == EnumToken.ImportantTokenType && arena.getType(values[i - 1]) === EnumToken.WhitespaceTokenType) {
            values.splice(i - 1, 1);
        } else if (
            tokensfuncSet.has(typ) &&
            arena.hasFlags(values[i], EnumAstNodeStatus.HasChildren) &&
            typ != EnumToken.WildCardFunctionTokenType &&
            arena.getType(values[i + 1]) == EnumToken.WhitespaceTokenType
        ) {
            values.splice(i + 1, 1);
        }
    }

    return values;
}

/**
 * Update source map
 * @param node
 * @param options
 * @param cache
 * @param sourcemaps
 * @param sourceLocation
 * @param lineMap
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
    sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> },
    sourceLocation: SourceLocation,
    lineMap: LineMap,
    str: string,
) {
    let offset: number = 0;

    // eat leanding whitespace
    while (offset < str.length && isWhiteSpace(str.charCodeAt(offset))) {
        offset++;
    }

    if (offset > 0) {
        move(sourceLocation, lineMap, str, 0, offset + 1);
    }

    if (node[LOCSTA] != null) {
        const source = options.sourcesMap!.get(node[LOCSRCID]!) as SourceFile;
        const inputSourceMap = source.getInputSourceMap();
        const offsets: [number, number] = source.getOffsets(node[LOCSTA]) as [number, number];
        const [newLine, newColumn] = lineMap.getOffsets(sourceLocation.end);
        let records: Array<[string | null, number, number, string | null]> | null = null;
        let srcId: number = node[LOCSRCID]!;
        let sourceFileName: string | null = (source.getFileName() as string) || null;
        let sourceContent: string | null; // = (source.getContent() as string) || null;

        if (inputSourceMap != null && (records = inputSourceMap.find(offsets[0], offsets[1])) != null) {
            let newId: number | null = null;

            for (const record of records) {
                newId = null;

                // @ts-ignore
                sourceFileName = (record[0] as string) || null;
                // @ts-ignore
                offsets[0] = record[1] as number;
                // @ts-ignore
                offsets[1] = record[2] as number;

                sourceContent = (record[3] as string) || null;

                if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
                    if (cache[sourceFileName] == null) {
                        const absolute = options.resolve!(dirname(options.output as string), options.cwd as string)
                            .absolute as string;
                        const absoluteSourcePath = options.resolve!(
                            dirname(options.src! || ("" as string)),
                            options.cwd as string,
                        ).absolute;
                        // resolution is relative to the source file
                        const absoluteSourceFileName = options.resolve!(sourceFileName, absoluteSourcePath as string)
                            .absolute as string;

                        cache[sourceFileName] = options.resolve!(absoluteSourceFileName, absolute).relative as string;
                    }

                    sourceFileName = cache[sourceFileName] as string;
                }

                for (const [id, file] of options.sourcesMap!.entries()) {
                    if (file.getFileName() === sourceFileName) {
                        newId = id;
                        break;
                    }

                    if (sourceFileName == null && file.getContent() === sourceContent) {
                        newId = id;
                        break;
                    }
                }

                if (newId == null) {
                    const source = new SourceFile(sourceContent as string, [], sourceFileName);

                    options.sourcesMap!.set(source.id, source);
                    newId = source.id;
                }

                srcId = newId as number;

                if (!sourcemaps.sources.includes(srcId)) {
                    sourcemaps.sources.push(srcId);
                }

                sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
            }
        } else {
            // if (sourceFileName != null && options.output != null && !sourceFileName.startsWith("data:")) {
            //     if (cache[sourceFileName] == null) {
            //         const absolute = options.resolve!(dirname(options.output as string), options.cwd as string)
            //             .absolute as string;
            //         const absoluteSourceFileName = options.resolve!(sourceFileName, options.cwd as string)
            //             .absolute as string;

            //         cache[sourceFileName] = options.resolve!(absoluteSourceFileName, absolute).relative as string;
            //     }

            //     sourceFileName = cache[sourceFileName] as string;
            // }

            if (!sourcemaps.sources.includes(srcId)) {
                sourcemaps.sources.push(srcId);
            }

            sourcemaps.maps.push([newLine, newColumn, srcId, offsets[0], offsets[1]]);
        }
    }

    move(sourceLocation, lineMap, str, offset);
}

/**
 * Update position
 * @param sourceLocation
 * @param lineMap
 * @param str
 * @param start
 * @param end
 */
export function move(sourceLocation: SourceLocation, lineMap: LineMap, str: string, start?: number, end?: number) {
    let i: number = start ?? 0;
    let j: number = end ?? str.length;
    let codepoint: number;
    let char: string;

    for (; i < j; i++) {
        char = str.charAt(i);
        codepoint = char.charCodeAt(0);
        sourceLocation.end += char.length;

        if (
            codepoint == 0xa || // \n
            codepoint == 0xb || // \v
            codepoint == 0xc || // \f
            codepoint == 0xd || // \r
            codepoint == 0x2028 || // \u2028
            codepoint == 0x2029 // \u2029
        ) {
            if (codepoint == 0xd && i + 1 < str.length && str.charCodeAt(i + 1) == 0xa) {
                // defer CRLF to the LF step so the next line starts after both characters
            } else if (codepoint == 0xa && i > 0 && str.charCodeAt(i - 1) == 0xd) {
                // nope
            } else {
                lineMap.addLineStart(sourceLocation.end);
            }
        }
    }
}
