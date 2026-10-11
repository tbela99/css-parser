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
    MediaFeatureToken,
    MediaQueryConditionToken,
    MediaQueryUnaryFeatureToken,
    MediaRangeQueryToken,
    NumberToken,
    PercentageToken,
    PseudoElementToken,
    PseudoPageToken,
    RenderOptions,
    RenderResult,
    SourceLocation,
    StringToken,
    SupportsQueryConditionToken,
    SupportsQueryUnaryConditionToken,
    Token,
    WhenElseQueryConditionToken,
    WhenElseUnaryConditionToken,
    WrappedValuesToken,
} from "../../@types/index.d.ts";
import { convertColor, getAngle } from "../syntax/color/color.ts";
import { reduceHexValue } from "../syntax/color/hex.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import { expand } from "../ast/expand.ts";
import { SourceMap } from "./sourcemap/sourcemap.ts";
import {
    anglePrecision,
    LOCSRCID,
    LOCSTA,
    PARENT,
    pseudoElements,
    tokensfuncSet,
    urlTokenMatcher,
} from "../syntax/constants.ts";
import {
    isWhiteSpace,
    minifyNumber,
    parseColor,
    reduceColorStops,
    reduceConicColorStops,
    reducegradientBackgroundPosition,
    toPrecisionAngle,
    toPrecisionValue,
} from "../syntax/syntax.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";
import { toDegrees } from "../parser/utils/angle.ts";
import { LineMap } from "../parser/linesmap.ts";
import { dirname } from "../fs/resolve.ts";
import { SourceFile } from "../parser/source.ts";
import { cloneNode } from "../ast/clone.ts";
import { Arena } from "../parser/arena.ts";

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
        minifyValues: true,
        sourcemap: false,
        convertColor: true,
        expandNestingRules: false,
        preserveLicense: false,
        ...options,
    };

    if (options.withParents) {
        let parent: AstNode;

        while (data[PARENT] != null) {
            // @ts-ignore
            // parent = { ...data[PARENT], chi: [data] };

            parent = cloneNode(data[PARENT]!) as AstNode;
            // @ts-ignore
            parent.chi = [data];

            // @ts-ignore
            parent[PARENT] = data[PARENT][PARENT];

            // @ts-ignore
            data = parent;
        }
    }

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

    if (mapping != null) {
        if (mapping.importMapping != null) {
            const absolutePath = options.resolve!(
                options.output != null ? dirname(options.output as string) : dirname(options.src as string),
                options.cwd as string,
            ).absolute;

            for (let [key, value] of Object.entries(mapping.importMapping)) {
                key = options.resolve!(options.resolve!(key, options.cwd as string).absolute, absolutePath).relative;

                if (!key.startsWith("/") && !key.startsWith(".")) {
                    key = "./" + key;
                }

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

        if (sourcemap != null) {
            move(sourceLocation, lineMap!, code);
        }
    }

    if (options.output != null) {
        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
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
                sourcemaps,
                sourceLocation,
                lineMap,
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

/**
 * render ast node
 * @param data
 * @param options
 * @param sourcemaps
 * @param sourceLocation
 * @param lineMap
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
    sourcemaps: { sources: number[]; maps: Array<[number, number, number, number, number]> } | null,
    sourceLocation: SourceLocation,
    lineMap: LineMap | null,
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

    // @ts-ignore
    let children: string = "";
    let str: string = "";

    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    switch (data.typ) {
        case EnumToken.DeclarationNodeType:
            return `${(<AstDeclaration>data).nam}:${options.indent}${(options.minifyValues
                ? filterValues((<AstDeclaration>data).val)
                : (<AstDeclaration>data).val
            ).reduce(reducer, "")}`;

        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:
            if ((<AstComment>data).val.startsWith("/*# sourceMappingURL=")) {
                // ignore sourcemap comment
                return "";
            }

            return !options.removeComments || (options.preserveLicense && (<AstComment>data).val.startsWith("/*!"))
                ? (<AstComment>data).val
                : "";

        case EnumToken.StyleSheetNodeType:
            for (const node of (<AstStyleSheet>data).chi) {
                str = renderAstNode(
                    node,
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
            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ) && !("chi" in data)) {
                return `${indent}@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === "" ? "" : options.indent || " "}${
                    (<AstAtRule>data).val
                };`;
            }

            const lineMapLength = lineMap ? lineMap.getLineStarts().length : 0;
            const prelude =
                (indent.length > 0 ? options.newLine : "") +
                indent +
                ([EnumToken.AtRuleNodeType, EnumToken.KeyframesAtRuleNodeType].includes(data.typ)
                    ? `@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === "" ? "" : options.indent || " "}${
                          (<AstAtRule>data).val
                      }${options.indent}{`
                    : (<AstRule>data).sel + `${options.indent}{`);

            if (sourcemaps != null) {
                updateSourceMap(data, options, cache, sourcemaps, sourceLocation, lineMap!, prelude);
            }

            let node: AstNode;
            let recordDeclarationSourceMap: boolean = data.typ == EnumToken.AtRuleNodeType;
            for (let i = 0; i < (data as AstRule | AstAtRule).chi!.length; i++) {
                node = (data as AstRule | AstAtRule).chi![i];
                if (node.typ == EnumToken.CommentNodeType) {
                    str =
                        options.removeComments &&
                        (!options.preserveLicense || !(<AstComment>node).val.startsWith("/*!"))
                            ? ""
                            : (<AstComment>node).val;
                } else if (node.typ == EnumToken.DeclarationNodeType) {
                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(options.minifyValues
                        ? filterValues((<AstDeclaration>node).val)
                        : (<AstDeclaration>node).val
                    )
                        .reduce(reducer, "")
                        .trimEnd()};`;
                } else {
                    str = renderAstNode(
                        node,
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
                    if (node.typ == EnumToken.DeclarationNodeType && recordDeclarationSourceMap) {
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
