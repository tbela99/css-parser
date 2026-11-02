import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import type { Token, AstNode, ParserOptions } from "../../../@types/index.d.ts";
import { walkValues } from "../walk.ts";
import { pseudoAliasMap } from "../../syntax/syntax.ts";
import { splitRule } from "../minify.ts";
import type { ValidationConfiguration } from "../../../@types/validation.d.ts";
import { renderValue } from "../../printer/render.ts";
import { funcLike, regMatchLinearGradient, regMatchRadialGradient } from "../../syntax/constants.ts";
import { type AstArena, TokenField } from "../arena.ts";
import { FeatureWalkMode } from "./type.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import { getSyntaxConfig } from "../../validation/config.ts";
import { splitTokenList } from "../../validation/utils/list.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { toDegrees } from "../../parser/utils/angle.ts";

const config: ValidationConfiguration = getSyntaxConfig();

function replacePseudo(tokens: string[][]): string[][] {
    return tokens.map((raw) =>
        raw.map((r) => {
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
        }),
    );
}

function replaceAstNodes(arena: AstArena, tokens: Token[], root?: AstNode): boolean {
    let result: boolean = false;

    for (const { value } of walkValues(arena, tokens, root)) {
        const typ: EnumToken = arena.dataTypes[value];

        if (typ == EnumToken.MediaQueryConditionTokenType) {
            const token: Token | undefined = arena
                .fieldTokens(value, TokenField.L)
                .find((t: Token) => arena.dataTypes[t] == EnumToken.IdenTokenType);

            if (token != null) {
                let val: string = arena.strings[arena.stringValue[token]];

                if (val in pseudoAliasMap) {
                    val = pseudoAliasMap[val];
                    arena.setStr(token, val);

                    const r: Token[] = arena.fieldTokens(value, TokenField.R);

                    if (
                        (equalsIgnoreCase(val, "min-resolution") || equalsIgnoreCase(val, "max-resolution")) &&
                        r.length > 0 &&
                        arena.dataTypes[r[0]] == EnumToken.NumberTokenType
                    ) {
                        arena.dataTypes[r[0]] = EnumToken.ResolutionTokenType;
                        arena.setUnitString(r[0], "x");
                        result = true;
                    }

                    let isMin: boolean = val.startsWith("min-");
                    let isMax: boolean = val.startsWith("max-");

                    if (isMin || isMax) {
                        arena.setStr(token, val.slice(4));
                        arena.dataTypes[arena.field(value, TokenField.Op)] = isMax
                            ? EnumToken.LteTokenType
                            : EnumToken.GteTokenType;
                    }
                }
            }
        } else if (
            typ == EnumToken.IdenTokenType ||
            typ == EnumToken.PseudoClassFuncTokenType ||
            typ == EnumToken.PseudoClassTokenType ||
            typ == EnumToken.PseudoElementTokenType
        ) {
            let key: string =
                arena.strings[arena.stringValue[value]] + (typ == EnumToken.PseudoClassFuncTokenType ? "()" : "");

            if (key in pseudoAliasMap) {
                const isPseudClass: boolean = pseudoAliasMap[key].startsWith("::");

                arena.setStr(value, pseudoAliasMap[key]);

                if (isPseudClass && typ == EnumToken.PseudoElementTokenType) {
                    arena.dataTypes[value] = EnumToken.PseudoClassTokenType;
                }

                result = true;
            }
        }
    }

    // remove duplicate tokens
    if (tokens.find((t: Token) => arena.dataTypes[t] == EnumToken.CommaTokenType) != null) {
        const set = new Set<string>();

        const split: Token[][] = splitTokenList(arena, tokens, [EnumToken.CommaTokenType]);

        tokens.length = 0;

        for (const token of split.reduce((acc: Token[], curr: Token[]) => {
            const str = curr.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr), "");
            if (set.has(str)) {
                return acc;
            }
            set.add(str);

            if (acc.length > 0) {
                acc.push(arena.createToken(EnumToken.CommaTokenType));
            }

            return acc.concat(curr);
        }, [] as Token[])) {
            tokens.push(token);
        }
    }

    return result;
}

export class ComputePrefixFeature {
    get ordering() {
        return 0;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Pre;
    }

    static register(options: ParserOptions) {
        if (options.removePrefix) {
            // @ts-ignore
            options.features.push(new ComputePrefixFeature(options));
        }
    }

    run(arena: AstArena, node: AstNode): AstNode | null {
        if (
            arena.flags[node] &
            (EnumAstNodeStatus.Disallowed | EnumAstNodeStatus.Invalid | EnumAstNodeStatus.Malformed)
        ) {
            return null;
        }

        const typ: EnumToken = arena.dataTypes[node];

        if (typ == EnumToken.RuleNodeType) {
            arena.setSelector(
                node,
                replacePseudo(splitRule(arena.strings[arena.name[node]])).reduce(
                    (acc, curr, index) => acc + (index > 0 ? "," : "") + curr.join(""),
                    "",
                ),
            );

            if (arena.firstToken[node] != 0) {
                const tokens: Token[] = arena.tokens(node);

                replaceAstNodes(arena, tokens, node);
                arena.setTokenList(node, tokens);
            }
        } else if (typ == EnumToken.DeclarationNodeType) {
            const name: string = arena.strings[arena.name[node]];

            if (name.charAt(0) == "-") {
                const match = name.match(/^-([^-]+)-(.+)$/);

                if (match != null) {
                    let nam: string = match[2];

                    if (!(nam in config.declarations)) {
                        if (name in pseudoAliasMap) {
                            nam = pseudoAliasMap[name];
                        }
                    }

                    if (nam in config.declarations) {
                        arena.name[node] = arena.internString(nam);
                    }
                }
            }

            let hasPrefix: boolean = false;

            for (const { value } of walkValues(arena, arena.tokens(node), node)) {
                const typ: EnumToken = arena.dataTypes[value];
                const val: string = arena.strings[arena.stringValue[value]];

                if (
                    (typ == EnumToken.IdenTokenType || (typ != EnumToken.ParensTokenType && funcLike.includes(typ))) &&
                    val.match(/^-([^-]+)-(.+)$/) != null
                ) {
                    if (val.endsWith("-gradient")) {
                        if (regMatchLinearGradient.test(val)) {
                            this.webkitLinearToLinearGradient(arena, value);
                        } else if (regMatchRadialGradient.test(val)) {
                            this.webkitRadialToRadialGradient(arena, value);
                        } else if (equalsIgnoreCase(val, "-webkit-gradient")) {
                            this.webkitGradientToGradient(arena, value);
                        }

                        // not supported yet
                        break;
                    }

                    hasPrefix = true;
                    break;
                }
            }

            if (hasPrefix) {
                for (const { value } of walkValues(arena, arena.tokens(node), node)) {
                    if (arena.dataTypes[value] == EnumToken.IdenTokenType || funcLike.includes(arena.dataTypes[value])) {
                        const match = arena.strings[arena.stringValue[value]].match(/^-([^-]+)-(.+)$/);

                        if (match != null) {
                            arena.setStr(value, match[2]);
                        }
                    }
                }
            }
        } else if (typ == EnumToken.AtRuleNodeType || typ == EnumToken.KeyframesAtRuleNodeType) {
            const name: string = arena.strings[arena.name[node]];

            if (name.startsWith("-")) {
                const match = name.match(/^-([^-]+)-(.+)$/);

                if (match != null && "@" + match[2] in config.atRules) {
                    arena.name[node] = arena.internString(match[2]);
                }
            }

            if (typ == EnumToken.AtRuleNodeType && arena.stringValue[node] !== 0) {
                const tokens: Token[] = arena.tokens(node);
                const result: boolean = replaceAstNodes(arena, tokens, node);

                arena.setTokenList(node, tokens);

                if (result) {
                    arena.stringValue[node] = arena.internString(
                        tokens.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr), ""),
                    );
                }
            }
        }

        return node;
    }

    /**
     * Convert -webkit-linear-gradient to linear-gradient syntax
     * @param tokens
     * @returns
     */
    webkitLinearToLinearGradient(arena: AstArena, token: Token): void {
        let i: number;
        let k: number;
        let to: string;
        let val: string;
        let key: string;

        const tokens: Token[] = arena.tokens(token);

        // conversion rules
        // translation:
        // - left -> to right
        // - right -> to left
        // - top -> to bottom
        // - top right -> to bottom left
        // - top left -> to bottom right
        // - bottom -> to top
        // - bottom right -> to top left
        // - bottom left -> to top right
        // https://drafts.csswg.org/css-images-3/#linear-gradients
        // final angle:
        // - to top -> 0deg
        // - to right -> 90deg
        // - to bottom -> 180deg
        // - to left -> 270deg

        for (i = 0; i < tokens.length; i++) {
            if (
                arena.dataTypes[tokens[i]] == EnumToken.AngleTokenType ||
                (arena.dataTypes[tokens[i]] == EnumToken.NumberTokenType && arena.numericValue[tokens[i]] == 0)
            ) {
                arena.numericValue[tokens[i]] =
                    (90 -
                        (arena.dataTypes[tokens[i]] == EnumToken.NumberTokenType
                            ? arena.numericValue[tokens[i]]
                            : arena.numericValue[toDegrees(arena, tokens[i])])) %
                    360;
            } else if (arena.dataTypes[tokens[i]] == EnumToken.IdenTokenType) {
                key = arena.strings[arena.stringValue[tokens[i]]].toLowerCase();
                switch (key) {
                    case "right":
                    case "left":
                        tokens.splice(
                            i,
                            1,
                            arena.createToken(EnumToken.IdenTokenType, "to"),
                            arena.createToken(EnumToken.WhitespaceTokenType),
                            arena.createToken(EnumToken.IdenTokenType, key == "right" ? "left" : "right"),
                        );
                        i += 2;
                        break;

                    case "top":
                    case "bottom":
                        k = i + 1;

                        to = key == "top" ? "bottom" : "top";

                        while (
                            k < tokens.length &&
                            (arena.dataTypes[tokens[k]] === EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[tokens[k]] === EnumToken.CommentTokenType)
                        ) {
                            k++;
                        }

                        if (arena.dataTypes[tokens[k]] === EnumToken.IdenTokenType) {
                            val = "";

                            if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[k]]], "left")) {
                                val = "right";
                            }

                            if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[k]]], "right")) {
                                val = "left";
                            }

                            if (val !== "") {
                                tokens.splice(
                                    i,
                                    k - i + 1,
                                    arena.createToken(EnumToken.IdenTokenType, "to"),
                                    arena.createToken(EnumToken.WhitespaceTokenType),
                                    arena.createToken(EnumToken.IdenTokenType, to),
                                    arena.createToken(EnumToken.WhitespaceTokenType),
                                    arena.createToken(EnumToken.IdenTokenType, val),
                                );
                                i += 4;
                                break;
                            }
                        }

                        tokens.splice(
                            i,
                            1,
                            arena.createToken(EnumToken.IdenTokenType, "to"),
                            arena.createToken(EnumToken.WhitespaceTokenType),
                            arena.createToken(EnumToken.IdenTokenType, to),
                        );
                        i += 2;
                        break;
                }
            }
        }

        arena.setStr(
            token,
            equalsIgnoreCase(arena.strings[arena.stringValue[token]], "-webkit-repeating-linear-gradient")
                ? "repeating-linear-gradient"
                : "linear-gradient",
        );
        arena.setTokenList(token, tokens);
    }

    /**
     * Convert -webkit-gradient(linear) to linear-gradient or linear-gradient syntax
     * @param token
     * @returns
     */
    webkitGradientToGradient(arena: AstArena, token: Token): void {
        let i: number = 0;
        let k: number;
        let key: string = "";
        let commaCount: number;
        let type: string = "";
        let tokens: Token[] = arena.tokens(token);

        // linear or radial
        if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "linear")) {
            type = "linear-gradient";
            i++;
        }

        tokens.splice(0, i + 1);
        commaCount = 0;

        for (i = 0; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.CommaTokenType) {
                commaCount++;

                if (commaCount > 1) {
                    break;
                }
            }

            if (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType) {
                key += (key.length > 0 ? " " : "") + arena.strings[arena.stringValue[tokens[i]]];
            }
        }

        // mapping keywords
        // left top → left bottom	to bottom
        // left bottom → left top	to top
        // left top → right top	to right
        // right top → left top	to left
        // left top → right bottom	to bottom right
        // right top → left bottom	to bottom left
        // left bottom → right top	to top right
        // right bottom → left top	to top left

        const replacements: Token[] = [];

        if (key === "left top left bottom") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "bottom"),
            );
        } else if (key === "left bottom left top") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "top"),
            );
        } else if (key === "left top right top") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "right"),
            );
        } else if (key === "right top left top") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "left"),
            );
        } else if (key === "left top right bottom") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "bottom"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "right"),
            );
        } else if (key === "right top left bottom") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "bottom"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "left"),
            );
        } else if (key === "left bottom right top") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "top"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "right"),
            );
        } else if (key === "right bottom left top") {
            replacements.push(
                arena.createToken(EnumToken.IdenTokenType, "to"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "top"),
                arena.createToken(EnumToken.WhitespaceTokenType),
                arena.createToken(EnumToken.IdenTokenType, "left"),
            );
        }

        tokens.splice(0, i, ...replacements);

        let checkStop: boolean = true;
        let checkStopIndex: number = replacements.length + 1;
        let colorStop: Token[] = [];

        for (i = replacements.length + 1; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.CommaTokenType && checkStop) {
                checkStopIndex = i;
                continue;
            }

            if (arena.dataTypes[tokens[i]] === EnumToken.FunctionTokenType) {
                if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "to")) {
                    colorStop.push(tokens[checkStopIndex]);

                    for (const token of arena.tokens(tokens[i])) {
                        colorStop.push(token);
                    }

                    tokens.splice(checkStopIndex!, i - checkStopIndex! + 1);

                    i = checkStopIndex!;
                    checkStop = false;
                } else if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "from")) {
                    k = arena.tokens(tokens[i]).length + 1;
                    tokens.splice(
                        i,
                        1,
                        ...arena.tokens(tokens[i]),
                        arena.createToken(EnumToken.WhitespaceTokenType),
                        arena.createToken(EnumToken.PercentageTokenType, 0),
                    );
                    i += k;
                } else if (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "color-stop")) {
                    k = arena.tokens(tokens[i]).length - 1;
                    tokens.splice(
                        i,
                        1,
                        ...arena
                            .tokens(tokens[i])
                            .reverse()
                            .map((t: Token): Token =>
                                arena.dataTypes[t] === EnumToken.CommaTokenType
                                    ? arena.createToken(EnumToken.WhitespaceTokenType)
                                    : arena.dataTypes[t] === EnumToken.NumberTokenType
                                      ? arena.createToken(EnumToken.PercentageTokenType, arena.numericValue[t] * 100)
                                      : t,
                            ),
                    );
                    i += k;
                }
            }
        }

        if (colorStop.length > 0) {
            for (const t of colorStop) {
                tokens.push(t);
            }
        }

        if (type !== "") {
            arena.setStr(token, type);
            arena.setTokenList(token, tokens);
        }
    }

    /**
     * Convert -webkit-radial-gradient to radial-gradient syntax
     * @param tokens
     * @returns
     */
    webkitRadialToRadialGradient(arena: AstArena, token: Token): Token[] {
        let i: number = 0;
        const tokens = arena.tokens(token);

        while (
            i < tokens.length &&
            (arena.dataTypes[tokens[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[tokens[i]] === EnumToken.CommentTokenType)
        ) {
            i++;
        }

        const positions: Token[] = [];
        const form: Token[] = [];
        const size: Token[] = [];
        const colorStops: Token[] = [];

        if (
            arena.dataTypes[tokens[i]] === EnumToken.PercentageTokenType ||
            (arena.dataTypes[tokens[i]] === EnumToken.NumberTokenType && 0 === arena.numericValue[tokens[i]]) ||
            (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType &&
                (equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "center") ||
                    equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "top") ||
                    equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "bottom") ||
                    equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "left") ||
                    equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "right")))
        ) {
            do {
                positions.push(tokens[i]);
                i++;
            } while (arena.dataTypes[tokens[i]] !== EnumToken.CommaTokenType);

            if (arena.dataTypes[tokens[i]] === EnumToken.CommaTokenType) {
                i++;
            }
        }

        if (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType) {
            if (
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "closest-side") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "closest-corner") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "farthest-side") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "farthest-corner")
            ) {
                size.push(tokens[i++]);
            } else if (
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "circle") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "ellipse")
            ) {
                form.push(tokens[i++]);
            }

            while (arena.dataTypes[tokens[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[tokens[i]] === EnumToken.CommentTokenType) {
                i++;
            }

            if (arena.dataTypes[tokens[i]] === EnumToken.CommaTokenType) {
                i++;
            }
        }

        if (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType) {
            if (
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "closest-side") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "closest-corner") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "farthest-side") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "farthest-corner")
            ) {
                size.push(tokens[i++]);
            } else if (
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "circle") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[tokens[i]]], "ellipse")
            ) {
                form.push(tokens[i++]);
            }

            while (arena.dataTypes[tokens[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[tokens[i]] === EnumToken.CommentTokenType) {
                i++;
            }

            if (arena.dataTypes[tokens[i]] === EnumToken.CommaTokenType) {
                i++;
            }
        }

        for (let m = i; m < tokens.length; m++) {
            colorStops.push(tokens[m]);
        }

        tokens.length = 0;

        if (form.length > 0 || size.length > 0) {
            if (form.length === 0) {
                form.push(arena.createToken(EnumToken.IdenTokenType, "ellipse"));
            }
            if (size.length > 0) {
                form.push(arena.createToken(EnumToken.WhitespaceTokenType));

                for (const token of size) {
                    form.push(token);
                }
            }

            if (positions.length > 0) {
                form.push(
                    arena.createToken(EnumToken.WhitespaceTokenType),
                    arena.createToken(EnumToken.IdenTokenType, "at"),
                    arena.createToken(EnumToken.WhitespaceTokenType),
                );

                for (const position of positions) {
                    form.push(position);
                }
            }

            for (const token of form) {
                tokens.push(token);
            }

            tokens.push(arena.createToken(EnumToken.CommaTokenType));
        }

        arena.setStr(
            token,
            equalsIgnoreCase(arena.strings[arena.stringValue[token]], "-webkit-repeating-radial-gradient")
                ? "repeating-radial-gradient"
                : "radial-gradient",
        );

        for (const colorStop of colorStops) {
            tokens.push(colorStop);
        }

        arena.setTokenList(token, tokens);
        return tokens;
    }
}
