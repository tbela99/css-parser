import { EnumToken } from "../types.ts";
import type {
    AngleToken,
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    FunctionToken,
    IdentToken,
    MediaQueryConditionToken,
    NumberToken,
    ParserOptions,
    PercentageToken,
    PseudoClassToken,
    Token,
} from "../../../@types/index.d.ts";
import { walkValues } from "../walk.ts";
import { pseudoAliasMap } from "../../syntax/syntax.ts";
import { splitRule } from "../minify.ts";
import type { ValidationConfiguration } from "../../../@types/validation.d.ts";
import { renderValue } from "../../renderer/render.ts";
import { funcLike, regMatchLinearGradient, regMatchRadialGradient } from "../../syntax/constants.ts";
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

function replaceAstNodes(tokens: Token[], root?: AstNode): boolean {
    let result: boolean = false;
    for (const { value, parent } of walkValues(tokens, root)) {
        if (value.typ == EnumToken.MediaQueryConditionTokenType) {
            const token = (value as MediaQueryConditionToken).l.find(
                (t) => t.typ == EnumToken.IdenTokenType,
            ) as IdentToken;

            if (token != null) {
                if (token.val in pseudoAliasMap) {
                    token.val = pseudoAliasMap[token.val];

                    if (
                        (equalsIgnoreCase(token.val, "min-resolution") ||
                            equalsIgnoreCase(token.val, "max-resolution")) &&
                        // ["min-resolution", "max-resolution"].includes((token as IdentToken).val) &&
                        (value as MediaQueryConditionToken).r?.[0]?.typ == EnumToken.NumberTokenType
                    ) {
                        Object.assign((value as MediaQueryConditionToken).r?.[0], {
                            typ: EnumToken.ResolutionTokenType,
                            unit: "x",
                        });
                        result = true;
                    }
                }
            }
        } else if (
            value.typ == EnumToken.IdenTokenType ||
            value.typ == EnumToken.PseudoClassFuncTokenType ||
            value.typ == EnumToken.PseudoClassTokenType ||
            value.typ == EnumToken.PseudoElementTokenType
        ) {
            let key: string =
                (value as IdentToken | PseudoClassToken).val +
                (value.typ == EnumToken.PseudoClassFuncTokenType ? "()" : "");

            if (key in pseudoAliasMap) {
                const isPseudClass: boolean = pseudoAliasMap[key].startsWith("::");
                (value as PseudoClassToken).val = pseudoAliasMap[key];

                if (
                    value.typ == EnumToken.IdenTokenType &&
                    ["min-resolution", "max-resolution"].includes((value as IdentToken).val) &&
                    parent?.typ == EnumToken.MediaQueryConditionTokenType &&
                    (parent as MediaQueryConditionToken).r?.[0]?.typ == EnumToken.NumberTokenType
                ) {
                    Object.assign((parent as MediaQueryConditionToken).r?.[0], {
                        typ: EnumToken.ResolutionTokenType,
                        unit: "x",
                    });
                } else if (isPseudClass && value.typ == EnumToken.PseudoElementTokenType) {
                    // @ts-ignore
                    value.typ = EnumToken.PseudoClassTokenType;
                }

                result = true;
            }
        }
    }

    if (tokens.find((t) => t.typ == EnumToken.CommaTokenType) != null) {
        const set = new Set<string>();

        const split = splitTokenList(tokens, [EnumToken.CommaTokenType]);

        tokens.length = 0;
        tokens.push(
            ...split.reduce((acc, curr) => {
                const str = curr.reduce((acc, curr) => acc + renderValue(curr), "");
                if (set.has(str)) {
                    return acc;
                }
                set.add(str);

                if (acc.length > 0) {
                    acc.push({
                        typ: EnumToken.CommaTokenType,
                    });
                }

                return acc.concat(curr);
            }, [] as Token[]),
        );
    }

    return result;
}

export class ComputePrefixFeature {
    get ordering() {
        return 2;
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

    run(node: AstNode): AstNode | null {
        if (node.typ == EnumToken.RuleNodeType) {
            (node as AstRule).sel = replacePseudo(splitRule((node as AstRule).sel)).reduce(
                (acc, curr, index) => acc + (index > 0 ? "," : "") + curr.join(""),
                "",
            );

            if ((node as AstRule).tokens != null) {
                replaceAstNodes((node as AstRule).tokens as Token[]);
            }
        } else if (node.typ == EnumToken.DeclarationNodeType) {
            if ((<AstDeclaration>node).nam.charAt(0) == "-") {
                const match = (<AstDeclaration>node).nam.match(/^-([^-]+)-(.+)$/);

                if (match != null) {
                    let nam: string = match[2];

                    if (!(nam in config.declarations)) {
                        if ((<AstDeclaration>node).nam in pseudoAliasMap) {
                            nam = pseudoAliasMap[(<AstDeclaration>node).nam];
                        }
                    }

                    if (nam in config.declarations) {
                        (<AstDeclaration>node).nam = nam;
                    }
                }
            }

            let hasPrefix: boolean = false;

            for (const { value } of walkValues((<AstDeclaration>node).val)) {
                if (
                    (value.typ == EnumToken.IdenTokenType ||
                        (value.typ != EnumToken.ParensTokenType && funcLike.includes(value.typ))) &&
                    (value as IdentToken | FunctionToken).val.match(/^-([^-]+)-(.+)$/) != null
                ) {
                    if ((value as FunctionToken).val.endsWith("-gradient")) {
                        if (regMatchLinearGradient.test((value as IdentToken | FunctionToken).val)) {
                            this.webkitLinearToLinearGradient(value as FunctionToken);
                        } else if (regMatchRadialGradient.test((value as IdentToken | FunctionToken).val)) {
                            this.webkitRadialToRadialGradient(value as FunctionToken);
                        } else if (equalsIgnoreCase((value as IdentToken | FunctionToken).val, "-webkit-gradient")) {
                            this.webkitGradientToGradient(value as FunctionToken);
                        }

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
                        const match = (value as IdentToken | FunctionToken).val.match(/^-([^-]+)-(.+)$/);

                        if (match != null) {
                            (value as IdentToken | FunctionToken).val = match[2];
                        }
                    }
                }

                (<AstDeclaration>node).val = nodes;
            }
        } else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
            if ((node as AstAtRule).nam.startsWith("-")) {
                const match = (node as AstAtRule).nam.match(/^-([^-]+)-(.+)$/);

                if (match != null && "@" + match[2] in config.atRules) {
                    (node as AstAtRule).nam = match[2];
                }
            }

            if (node.typ == EnumToken.AtRuleNodeType && (node as AstAtRule).val !== "") {
                if (replaceAstNodes((node as AstAtRule).tokens as Token[])) {
                    (node as AstAtRule).val = ((node as AstAtRule).tokens as Token[]).reduce(
                        (acc, curr) => acc + renderValue(curr),
                        "",
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
    webkitLinearToLinearGradient(token: FunctionToken): void {
        let i: number;
        let k: number;
        let to: string;
        let val: string;
        let key: string;

        const tokens = token.chi as Token[];

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
                tokens[i].typ == EnumToken.AngleTokenType ||
                (tokens[i].typ == EnumToken.NumberTokenType && (tokens[i] as AngleToken).val == 0)
            ) {
                (tokens[i] as AngleToken | NumberToken).val =
                    (90 -
                        // @ts-expect-error
                        ((tokens[i] as AngleToken | NumberToken).typ == EnumToken.NumberTokenType
                            ? (tokens[i] as NumberToken)
                            : (toDegrees(tokens[i] as AngleToken).val as number))) %
                    360;
            } else if (tokens[i].typ == EnumToken.IdenTokenType) {
                key = (tokens[i] as IdentToken).val.toLowerCase();
                switch (key) {
                    case "right":
                    case "left":
                        tokens.splice(
                            i,
                            1,
                            { typ: EnumToken.IdenTokenType, val: "to" },
                            { typ: EnumToken.WhitespaceTokenType },
                            {
                                typ: EnumToken.IdenTokenType,
                                val: key == "right" ? "left" : "right",
                            },
                        );
                        i += 2;
                        break;

                    case "top":
                    case "bottom":
                        k = i + 1;

                        to = key == "top" ? "bottom" : "top";

                        while (
                            k < tokens.length &&
                            (tokens[k].typ === EnumToken.WhitespaceTokenType ||
                                tokens[k].typ === EnumToken.CommentTokenType)
                        ) {
                            k++;
                        }

                        if (tokens[k]?.typ === EnumToken.IdenTokenType) {
                            val = "";

                            if (equalsIgnoreCase((tokens[k] as IdentToken).val, "left")) {
                                val = "right";
                            }

                            if (equalsIgnoreCase((tokens[k] as IdentToken).val, "right")) {
                                val = "left";
                            }

                            if (val !== "") {
                                tokens.splice(
                                    i,
                                    k - i + 1,
                                    { typ: EnumToken.IdenTokenType, val: "to" },
                                    { typ: EnumToken.WhitespaceTokenType },
                                    { typ: EnumToken.IdenTokenType, val: to },
                                    { typ: EnumToken.WhitespaceTokenType },
                                    { typ: EnumToken.IdenTokenType, val },
                                );
                                i += 4;
                                break;
                            }
                        }

                        tokens.splice(
                            i,
                            1,
                            { typ: EnumToken.IdenTokenType, val: "to" },
                            { typ: EnumToken.WhitespaceTokenType },
                            { typ: EnumToken.IdenTokenType, val: to },
                        );
                        i += 2;
                        break;
                }
            }
        }

        token.val = equalsIgnoreCase(token.val, "-webkit-repeating-linear-gradient")
            ? "repeating-linear-gradient"
            : "linear-gradient";
    }

    /**
     * Convert -webkit-gradient(linear) to linear-gradient or linear-gradient syntax
     * @param token
     * @returns
     */
    webkitGradientToGradient(token: FunctionToken): void {
        let i: number = 0;
        let k: number;
        let key: string = "";
        let commaCount: number;
        let type: string = "";
        let tokens = token.chi.slice();

        while (
            i < tokens.length &&
            (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType)
        ) {
            i++;
        }

        if (i >= tokens.length || tokens[i].typ !== EnumToken.IdenTokenType) {
            return;
        }

        // linear or radial
        if (equalsIgnoreCase((tokens[i] as IdentToken).val, "linear")) {
            type = "linear-gradient";
            i++;
        } else {
            return;
        }

        while (
            i < tokens.length &&
            (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType)
        ) {
            i++;
        }

        if (tokens[i].typ !== EnumToken.CommaTokenType) {
            return;
        }

        tokens.splice(0, i + 1);

        commaCount = 0;

        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.CommaTokenType) {
                commaCount++;

                if (commaCount > 1) {
                    break;
                }
            }

            if (tokens[i].typ === EnumToken.IdenTokenType) {
                key += (key.length > 0 ? " " : "") + (tokens[i] as IdentToken).val;
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
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "bottom" });
        } else if (key === "left bottom left top") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "top" });
        } else if (key === "left top right top") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "right" });
        } else if (key === "right top left top") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "left" });
        } else if (key === "left top right bottom") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "bottom" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "right" });
        } else if (key === "right top left bottom") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "bottom" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "left" });
        } else if (key === "left bottom right top") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "top" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "right" });
        } else if (key === "right bottom left top") {
            replacements.push({ typ: EnumToken.IdenTokenType, val: "to" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "top" });
            replacements.push({ typ: EnumToken.WhitespaceTokenType });
            replacements.push({ typ: EnumToken.IdenTokenType, val: "left" });
        }

        tokens.splice(0, i, ...replacements);

        let checkStop: boolean = true;
        let checkStopIndex: number = replacements.length + 1;
        let colorStop: Token[] = [];

        for (i = replacements.length + 1; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.CommaTokenType && checkStop) {
                checkStopIndex = i;
                continue;
            }

            if (tokens[i].typ === EnumToken.FunctionTokenType) {
                if (equalsIgnoreCase((tokens[i] as FunctionToken).val, "to")) {
                    colorStop.push(tokens[checkStopIndex], ...(tokens[i] as FunctionToken).chi);
                    tokens.splice(checkStopIndex!, i - checkStopIndex! + 1);

                    i = checkStopIndex!;
                    checkStop = false;
                } else if (equalsIgnoreCase((tokens[i] as FunctionToken).val, "from")) {
                    k = (tokens[i] as FunctionToken).chi.length + 1;
                    tokens.splice(
                        i,
                        1,
                        ...(tokens[i] as FunctionToken).chi,
                        { typ: EnumToken.WhitespaceTokenType },
                        { typ: EnumToken.PercentageTokenType, val: 0 },
                    );
                    i += k;
                } else if (equalsIgnoreCase((tokens[i] as FunctionToken).val, "color-stop")) {
                    k = (tokens[i] as FunctionToken).chi.length - 1;
                    tokens.splice(
                        i,
                        1,
                        // @ts-expect-error
                        ...(tokens[i] as FunctionToken).chi.reverse().map((t: Token) =>
                            t.typ === EnumToken.CommaTokenType
                                ? { typ: EnumToken.WhitespaceTokenType }
                                : t.typ === EnumToken.NumberTokenType
                                  ? ({
                                        typ: EnumToken.PercentageTokenType,
                                        // @ts-expect-error
                                        val: (t as NumberToken).val * 100,
                                    } as PercentageToken)
                                  : t,
                        ),
                    );
                    i += k;
                }
            }
        }

        if (colorStop.length > 0) {
            tokens.push(...colorStop);
        }

        if (type !== "") {
            token.val = type;

            token.chi.length = 0;
            token.chi.push(...tokens);
        }
    }

    /**
     * Convert -webkit-radial-gradient to radial-gradient syntax
     * @param tokens
     * @returns
     */
    webkitRadialToRadialGradient(token: FunctionToken): Token[] {
        let i: number = 0;
        const tokens = token.chi as Token[];

        while (
            i < tokens.length &&
            (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType)
        ) {
            i++;
        }

        const positions: Token[] = [];
        const form: Token[] = [];
        const size: Token[] = [];
        const colorStops: Token[] = [];

        if (
            tokens[i]?.typ === EnumToken.PercentageTokenType ||
            (tokens[i]?.typ === EnumToken.NumberTokenType && 0 === (tokens[i] as NumberToken).val) ||
            (tokens[i]?.typ === EnumToken.IdenTokenType &&
                (equalsIgnoreCase((tokens[i] as IdentToken).val, "center") ||
                    equalsIgnoreCase((tokens[i] as IdentToken).val, "top") ||
                    equalsIgnoreCase((tokens[i] as IdentToken).val, "bottom") ||
                    equalsIgnoreCase((tokens[i] as IdentToken).val, "left") ||
                    equalsIgnoreCase((tokens[i] as IdentToken).val, "right")))
        ) {
            do {
                positions.push(tokens[i]);
                i++;
            } while (tokens[i]?.typ !== EnumToken.CommaTokenType);

            if (tokens[i]?.typ === EnumToken.CommaTokenType) {
                i++;
            }
        }

        if (tokens[i]?.typ === EnumToken.IdenTokenType) {
            if (
                equalsIgnoreCase((tokens[i] as IdentToken).val, "closest-side") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "closest-corner") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "farthest-side") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "farthest-corner")
            ) {
                size.push(tokens[i++]);
            } else if (
                equalsIgnoreCase((tokens[i] as IdentToken).val, "circle") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "ellipse")
            ) {
                form.push(tokens[i++]);
            }

            while (tokens[i]?.typ === EnumToken.WhitespaceTokenType || tokens[i]?.typ === EnumToken.CommentTokenType) {
                i++;
            }

            if (tokens[i]?.typ === EnumToken.CommaTokenType) {
                i++;
            }
        }

        if (tokens[i]?.typ === EnumToken.IdenTokenType) {
            if (
                equalsIgnoreCase((tokens[i] as IdentToken).val, "closest-side") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "closest-corner") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "farthest-side") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "farthest-corner")
            ) {
                size.push(tokens[i++]);
            } else if (
                equalsIgnoreCase((tokens[i] as IdentToken).val, "circle") ||
                equalsIgnoreCase((tokens[i] as IdentToken).val, "ellipse")
            ) {
                form.push(tokens[i++]);
            }

            while (tokens[i]?.typ === EnumToken.WhitespaceTokenType || tokens[i]?.typ === EnumToken.CommentTokenType) {
                i++;
            }

            if (tokens[i]?.typ === EnumToken.CommaTokenType) {
                i++;
            }
        }

        colorStops.push(...tokens.slice(i));

        tokens.length = 0;

        if (form.length > 0 || size.length > 0) {
            if (form.length === 0) {
                form.push({ typ: EnumToken.IdenTokenType, val: "ellipse" });
            }
            if (size.length > 0) {
                form.push({ typ: EnumToken.WhitespaceTokenType });
                form.push(...size);
            }

            if (positions.length > 0) {
                form.push(
                    { typ: EnumToken.WhitespaceTokenType },
                    { typ: EnumToken.IdenTokenType, val: "at" },
                    { typ: EnumToken.WhitespaceTokenType },
                    ...positions,
                );
            }

            tokens.push(...form, { typ: EnumToken.CommaTokenType });
        }

        token.val = equalsIgnoreCase(token.val, "-webkit-repeating-radial-gradient")
            ? "repeating-radial-gradient"
            : "radial-gradient";

        tokens.push(...colorStops);
        return tokens;
    }
}
