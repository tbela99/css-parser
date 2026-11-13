import type { Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { convertColor, getNumber } from "./color.ts";
import { ColorType, EnumToken } from "../../ast/types.ts";
import { evaluate, evaluateFunc } from "../../ast/math/expression.ts";
import { colorFuncColorSpace, colorRange, colorsFunc, mathFuncs } from "../constants.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { getColorComponents } from "./utils/components.ts";
import { ValueWalker } from "../../ast/walk.ts";

type RGBKeyType = "r" | "g" | "b" | "alpha";
type HSLKeyType = "h" | "s" | "l" | "alpha";
type HWBKeyType = "h" | "w" | "b" | "alpha";
type LABKeyType = "l" | "a" | "b" | "alpha";
type OKLABKeyType = "l" | "a" | "b" | "alpha";
type XYZKeyType = "x" | "y" | "z" | "alpha";
type LCHKeyType = "l" | "c" | "h" | "alpha";
type OKLCHKeyType = "l" | "c" | "h" | "alpha";

export type RelativeColorTypes =
    | RGBKeyType
    | HSLKeyType
    | HWBKeyType
    | LABKeyType
    | OKLABKeyType
    | LCHKeyType
    | OKLCHKeyType
    | XYZKeyType;

/**
 * Parse relative color components
 * @param arena
 * @param relativeKeys
 * @param original
 * @param rExp
 * @param gExp
 * @param bExp
 * @param aExp
 * @returns
 */
export function parseRelativeColorComponents(
    arena: AstArena,
    relativeKeys: string,
    original: Token,
    rExp: Token,
    gExp: Token,
    bExp: Token,
    aExp: Token | null,
): Record<RelativeColorTypes, Token> | null {
    let r: Token;
    let g: Token;
    let b: Token;
    let alpha: Token | null = null;

    let keys: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>{};
    let values: Record<RelativeColorTypes, number | Token | null> = <
        Record<RelativeColorTypes, number | Token | null>
    >{};

    // colorFuncColorSpace x,y,z or r,g,b
    const names: string = relativeKeys.startsWith("xyz")
        ? "xyz"
        : ["srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "rgb"].some((t) =>
                equalsIgnoreCase(t, relativeKeys),
            )
          ? "rgb"
          : relativeKeys.slice(-3);

    const allComponents: Token[] = aExp == null ? [rExp, gExp, bExp] : [rExp, gExp, bExp, aExp];
    const components = getColorComponents(arena, original);

    const validKeys = names.split("");
    let val: string = "";

    if (components != null) {
        for (const component of components) {
            allComponents.push(component);
        }
    }

    // ensure all components are valid for the color space
    for (const component of allComponents) {
        if (component == null) {
            continue;
        }
        if (arena.dataTypes[component] == EnumToken.IdenTokenType) {
            val = arena.strings[arena.stringValue[component]];

            if (
                // @ts-expect-error
                typeof Math[val.toUpperCase()] !== "number" &&
                !equalsIgnoreCase(val, "in") &&
                !equalsIgnoreCase(val, "hue") &&
                !equalsIgnoreCase(val, "from") &&
                !equalsIgnoreCase(val, "alpha") &&
                !equalsIgnoreCase(val, "none") &&
                !equalsIgnoreCase(val, "shorter") &&
                !equalsIgnoreCase(val, "longer") &&
                !equalsIgnoreCase(val, "increasing") &&
                !equalsIgnoreCase(val, "decreasing") &&
                !colorsFunc.some((t) => equalsIgnoreCase(t, val)) &&
                !colorFuncColorSpace.includes(val) &&
                !validKeys.includes(val)
            ) {
                return null;
            }

            continue;
        }

        if (
            arena.dataTypes[component] === EnumToken.MathFunctionTokenType &&
            equalsIgnoreCase("calc", arena.strings[arena.stringValue[component]])
        ) {
            // inlined: arena.walkValues(arena.tokens(component))
            for (const value of new ValueWalker(arena, arena.tokens(component))) {
                if (arena.dataTypes[value] == EnumToken.IdenTokenType) {
                    val = arena.strings[arena.stringValue[value]].toLowerCase();

                    if (
                        // @ts-expect-error
                        typeof Math[val.toUpperCase()] !== "number" &&
                        val != "in" &&
                        val != "hue" &&
                        val != "from" &&
                        val != "alpha" &&
                        val != "none" &&
                        val != "shorter" &&
                        val != "longer" &&
                        val != "increasing" &&
                        val != "decreasing" &&
                        !colorsFunc.includes(val) &&
                        !colorFuncColorSpace.includes(val) &&
                        !validKeys.includes(val)
                    ) {
                        return null;
                    }
                }
            }
        }
    }

    const converted: Token | null = convertColor(
        arena,
        original,
        ColorType[relativeKeys.toUpperCase().replaceAll("-", "_") as keyof typeof ColorType],
    );

    if (converted == null) {
        return null;
    }

    const children: Token[] = arena
        .tokens(converted)
        .filter(
            (t) =>
                ![EnumToken.WhitespaceTokenType, EnumToken.LiteralTokenType, EnumToken.CommentTokenType].includes(
                    arena.dataTypes[t],
                ),
        );
    [r, g, b, alpha] = arena.colorType[converted] == ColorType.COLOR ? children.slice(1) : children;

    values = <Record<RelativeColorTypes, number | Token | null>>{
        [names[0]]: getValue(arena, r, converted, names[0]),
        [names[1]]: getValue(arena, g, converted, names[1]), // string,
        [names[2]]: getValue(arena, b, converted, names[2]),
        // @ts-ignore
        alpha:
            alpha == null
                ? numberToken(arena, 1, b)
                : arena.dataTypes[alpha] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[alpha]] == "none"
                  ? numberToken(arena, 0, alpha)
                  : arena.dataTypes[alpha] == EnumToken.PercentageTokenType
                    ? numberToken(arena, getNumber(arena, alpha), alpha)
                    : alpha,
    };

    keys = <Record<RelativeColorTypes, Token>>{
        [names[0]]: getValue(arena, rExp, converted, names[0]),
        [names[1]]: getValue(arena, gExp, converted, names[1]),
        [names[2]]: getValue(arena, bExp, converted, names[2]),
        // @ts-ignore
        alpha: getValue(
            arena,
            aExp == null
                ? numberToken(arena, 1, bExp)
                : arena.dataTypes[aExp] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[aExp]] == "none"
                  ? numberToken(arena, 0, aExp)
                  : aExp,
        ),
    };

    const result = computeComponentValue(arena, keys, values);

    if (result != null) {
        if ("hsl" == relativeKeys) {
            toPercentage(arena, result.s);
            toPercentage(arena, result.l);
        } else if ("hwb" == relativeKeys) {
            toPercentage(arena, result.w);
            toPercentage(arena, result.b);
        }
    }

    // @ts-ignore
    if (arena.dataTypes[result?.alpha] == EnumToken.NumberTokenType && arena.numericValue[result.alpha] === 1) {
        // @ts-ignore
        const { alpha, ...components } = result;
        return components as Record<RelativeColorTypes, Token>;
    }

    return result;
}

/**
 * Get token numeric value
 * @param arena
 * @param t
 * @param converted
 * @param component
 * @returns
 */
function getValue(arena: AstArena, t: Token, converted?: Token, component?: string): Token {
    if (arena.dataTypes[t] == EnumToken.PercentageTokenType) {
        let value: number = getNumber(arena, t);

        if (converted != null) {
            let colorSpace: string = ColorType[arena.colorType[converted]].toLowerCase().replaceAll("-", "_");

            if (colorSpace in colorRange) {
                // @ts-ignore
                value *= colorRange[colorSpace as keyof typeof colorRange][component].at(-1);
            }
        }

        return numberToken(arena, value, t);
    }

    return t;
}

/**
 * Compute component value
 * @param arena
 * @param expr
 * @param values
 * @returns
 */
function computeComponentValue(
    arena: AstArena,
    expr: Record<RelativeColorTypes, Token>,
    values: Record<RelativeColorTypes, number | Token | null>,
): Record<RelativeColorTypes, Token> | null {
    for (const object of [values, expr]) {
        if ("h" in object) {
            // normalize hue
            // inlined: arena.walkValues([object.h as Token])
            for (const k of new ValueWalker(arena, [object.h as Token])) {
                if (arena.dataTypes[k] == EnumToken.AngleTokenType && arena.strings[arena.unit[k]] == "deg") {
                    arena.dataTypes[k] = EnumToken.NumberTokenType;
                }
            }
        }
    }

    for (const [key, exp] of Object.entries(expr)) {
        if (
            [
                EnumToken.NumberTokenType,
                EnumToken.PercentageTokenType,
                EnumToken.AngleTokenType,
                EnumToken.LengthTokenType,
            ].includes(arena.dataTypes[exp])
        ) {
        } else if (arena.dataTypes[exp] == EnumToken.IdenTokenType && arena.strings[arena.stringValue[exp]] in values) {
            expr[<RelativeColorTypes>key] = values[<RelativeColorTypes>arena.strings[arena.stringValue[exp]]] as Token;
        } else if (
            arena.dataTypes[exp] == EnumToken.MathFunctionTokenType ||
            (arena.dataTypes[exp] == EnumToken.FunctionTokenType &&
                mathFuncs.includes(arena.strings[arena.stringValue[exp]]))
        ) {
            // inlined: arena.walkValues(arena.tokens(exp))
            for (const value of new ValueWalker(arena, arena.tokens(exp))) {
                if (arena.dataTypes[value] == EnumToken.IdenTokenType) {
                    const name: string = arena.strings[arena.stringValue[value]];
                    const replacement: number | Token | null | undefined = values[name as RelativeColorTypes];

                    // replace the identifier by its value
                    if (replacement != null) {
                        arena.copyToken(value, replacement as Token);
                    } else {
                        // @ts-ignore
                        const constant: number = Math[name.toUpperCase()] as number;

                        arena.resetToken(value, EnumToken.NumberTokenType, constant);
                    }
                }
            }

            const result: Token[] =
                (arena.dataTypes[exp] === EnumToken.MathFunctionTokenType ||
                    (arena.dataTypes[exp] == EnumToken.FunctionTokenType &&
                        mathFuncs.includes(arena.strings[arena.stringValue[exp]]))) &&
                arena.strings[arena.stringValue[exp]] !== "calc"
                    ? (evaluateFunc(arena, exp) as Token[])
                    : evaluate(arena, arena.tokens(exp));

            if (result.length == 1 && arena.dataTypes[result[0]] != EnumToken.BinaryExpressionTokenType) {
                expr[<RelativeColorTypes>key] = result[0];
            }
        }
    }

    return <Record<RelativeColorTypes, Token>>expr;
}

/**
 * allocate a number token with the location of another token
 * @param arena
 * @param val
 * @param location
 */
function numberToken(arena: AstArena, val: number, location: Token | null | undefined): Token {
    const token: Token = arena.createToken(EnumToken.NumberTokenType, val);

    if (location != null) {
        arena.copyLocation(token, location);
    }

    return token;
}

/**
 * convert a number token to a percentage (in place)
 * @param arena
 * @param token
 */
function toPercentage(arena: AstArena, token: Token): void {
    arena.numericValue[token] = getNumber(arena, token) * 100;
    arena.dataTypes[token] = EnumToken.PercentageTokenType;
}
