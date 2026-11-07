import { numericTokenTypes } from "../arena.ts";
import type { Token } from "../../../@types/index.d.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { mathFuncs } from "../../syntax/constants.ts";
import { EnumToken } from "../types.ts";
import { type AstArena, TokenField } from "../arena.ts";
import { compute, type Fraction, rem } from "./math.ts";

const numbers = new Set(["sin", "cos", "asin", "acos", "sign", "tan"]);

type ArithmeticOperator = EnumToken.Add | EnumToken.Plus | EnumToken.Sub | EnumToken.Div | EnumToken.Mul;

/**
 * numeric value of a token: a number or a fraction
 * @param arena
 * @param token
 */
function numericValue(arena: AstArena, token: Token): number | Fraction | null {
    const fraction: Token = arena.getFraction(token);

    if (fraction != 0) {
        return [arena.numericValue[arena.firstChild[fraction]], arena.numericValue[arena.lastChild[fraction]]];
    }

    return getValue(arena, token);
}

/**
 * set the numeric value of a token: a number or a fraction
 * @param arena
 * @param token
 * @param val
 */
function setNumericValue(arena: AstArena, token: Token, val: number | Fraction): void {
    if (typeof val == "number") {
        arena.setFraction(token, null);
        arena.numericValue[token] = val;
        return;
    }

    arena.setFraction(
        token,
        arena.createFraction(
            arena.createToken(EnumToken.NumberTokenType, val[0]),
            arena.createToken(EnumToken.NumberTokenType, val[1]),
        ),
    );
}

/**
 * allocate a token with the location of another token
 * @param arena
 * @param typ
 * @param location
 * @param val
 * @param unit
 */
function tokenAt(arena: AstArena, typ: EnumToken, location: Token, val?: number | string, unit?: string): Token {
    const token: Token = arena.createToken(typ, val, unit);

    arena.copyLocation(token, location);
    return token;
}

/**
 * evaluate an array of tokens. the tokens are cloned: the result does not share any token with the input
 * @param arena
 * @param tokens
 */
export function evaluate(arena: AstArena, tokens: Token[]): Token[] {
    return evaluateTokens(
        arena,
        tokens.map((token: Token) => arena.clone(token, true)),
    );
}

/**
 * evaluate an array of tokens. the tokens are moved into the result
 * @param arena
 * @param tokens
 */
function evaluateTokens(arena: AstArena, tokens: Token[]): Token[] {
    let nodes: Token[];

    if (
        tokens.length == 1 &&
        (arena.dataTypes[tokens[0]] == EnumToken.MathFunctionTokenType ||
            arena.dataTypes[tokens[0]] == EnumToken.FunctionTokenType) &&
        mathFuncs.includes(arena.strings[arena.stringValue[tokens[0]]])
    ) {
        const chi: Token[][] = [];

        for (let t = arena.firstToken[tokens[0]]; t != 0; t = arena.nextSibling[t]) {
            const typ: EnumToken = arena.dataTypes[t];

            if (chi.length == 0 || typ == EnumToken.CommaTokenType) {
                chi.push([]);
            }

            if (typ == EnumToken.WhitespaceTokenType || typ == EnumToken.CommaTokenType) {
                continue;
            }

            chi[chi.length - 1].push(t);
        }

        const children: Token[] = [];

        for (let i = 0; i < chi.length; i++) {
            if (children.length > 0) {
                children.push(arena.createToken(EnumToken.CommaTokenType));
            }

            for (const token of evaluateTokens(arena, chi[i])) {
                children.push(token);
            }
        }

        arena.setTokenList(tokens[0], children);

        const result = evaluateFunc(arena, tokens[0]);

        if (result == null) {
            return tokens;
        }

        if (
            arena.dataTypes[result[0]] === EnumToken.MathFunctionTokenType &&
            arena.strings[arena.stringValue[result[0]]] === "calc" &&
            arena.tokenCount(result[0]) === 1
        ) {
            return arena.tokens(result[0]);
        }

        return result;
    }

    nodes = inlineExpression(arena, evaluateExpression(arena, buildExpression(arena, tokens)));

    if (nodes.length <= 1) {
        if (nodes.length == 1) {
            if (arena.dataTypes[nodes[0]] == EnumToken.BinaryExpressionTokenType) {
                return inlineExpression(arena, nodes[0]);
            }

            if (
                arena.dataTypes[nodes[0]] == EnumToken.IdenTokenType &&
                // @ts-expect-error
                typeof Math[arena.strings[arena.stringValue[nodes[0]]].toUpperCase()] == "number"
            ) {
                // @ts-ignore
                const val: number = Math[arena.strings[arena.stringValue[nodes[0]]].toUpperCase()] as number;

                arena.resetToken(nodes[0], EnumToken.NumberTokenType, val);
                return nodes;
            }
        }

        return nodes;
    }

    const map: Map<EnumToken, Token[]> = new Map();
    let token: Token;
    let typ: EnumToken;
    let i: number;

    for (i = 0; i < nodes.length; i++) {
        token = nodes[i];
        typ = arena.dataTypes[token];

        if (typ == EnumToken.Add || typ == EnumToken.Plus) {
            continue;
        }

        if (typ == EnumToken.Sub) {
            if (!isScalarToken(arena, nodes[i + 1])) {
                token = arena.createList(EnumToken.ListToken, [nodes[i], nodes[i + 1]]);
                arena.spanLocation(token, nodes[i], nodes[i + 1]);
            } else {
                token = doEvaluate(arena, nodes[i + 1], tokenAt(arena, EnumToken.NumberTokenType, nodes[i + 1], -1), EnumToken.Mul);
            }

            i++;
            typ = arena.dataTypes[token];
        }

        if (!map.has(typ)) {
            map.set(typ, [token]);
        } else {
            (map.get(typ) as Token[]).push(token);
        }
    }

    const result: Token[] = [];

    for (const [key, values] of map) {
        const token: Token = values.reduce((acc: Token, curr: Token) => doEvaluate(arena, acc, curr, EnumToken.Add));

        if (arena.dataTypes[token] != EnumToken.BinaryExpressionTokenType) {
            // inlined: arena.isNumeric(token)
            if (numericTokenTypes.has(arena.dataTypes[token]) && arena.numericValue[token] < 0) {
                arena.numericValue[token] = -arena.numericValue[token];
                result.push(tokenAt(arena, EnumToken.Sub, token), token);
                continue;
            }
        }

        if (result.length > 0 && key != EnumToken.ListToken) {
            // inlined: arena.isNumeric(token)
            if (numericTokenTypes.has(arena.dataTypes[token]) && arena.numericValue[token] == 0) {
                continue;
            }

            result.push(tokenAt(arena, EnumToken.Add, token));
        }

        result.push(token);
    }

    return result;
}

/**
 * evaluate arithmetic operation
 * @param arena
 * @param l
 * @param r
 * @param op
 */
function doEvaluate(arena: AstArena, l: Token, r: Token, op: ArithmeticOperator): Token {
    const defaultReturn = (): Token => {
        const token: Token = arena.createBinaryExpression(op, l, r);

        arena.spanLocation(token, l, r);
        return token;
    };

    let lType: EnumToken = arena.dataTypes[l];
    let rType: EnumToken = arena.dataTypes[r];

    if (
        !isScalarToken(arena, l) ||
        !isScalarToken(arena, r) ||
        (lType == rType && arena.unit[l] != 0 && arena.unit[r] != 0 && arena.unit[l] != arena.unit[r])
    ) {
        return defaultReturn();
    }

    if (lType == EnumToken.IdenTokenType) {
        const val: string = arena.strings[arena.stringValue[l]];

        if (equalsIgnoreCase(val, "Infinity")) {
            arena.dataTypes[l] = lType = EnumToken.InfinityTokenType;
        } else if (equalsIgnoreCase(val, "-Infinity")) {
            arena.dataTypes[l] = lType = EnumToken.NegativeInfinityTokenType;
        } else if (equalsIgnoreCase(val, "NaN")) {
            arena.dataTypes[l] = lType = EnumToken.NaNTokenType;
        }
    }

    if (rType == EnumToken.IdenTokenType) {
        const val: string = arena.strings[arena.stringValue[r]];

        if (equalsIgnoreCase(val, "Infinity")) {
            arena.dataTypes[r] = rType = EnumToken.InfinityTokenType;
        } else if (equalsIgnoreCase(val, "-Infinity")) {
            arena.dataTypes[r] = rType = EnumToken.NegativeInfinityTokenType;
        }
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword#notes
    if (lType == EnumToken.NaNTokenType || rType == EnumToken.NaNTokenType) {
        return computeNaN(arena, l, r, defaultReturn);
    }

    if (
        lType == EnumToken.InfinityTokenType ||
        lType == EnumToken.NegativeInfinityTokenType ||
        rType == EnumToken.InfinityTokenType ||
        rType == EnumToken.NegativeInfinityTokenType
    ) {
        return computeInfinity(arena, l, r, op, defaultReturn);
    }

    if (lType == EnumToken.FunctionTokenType || lType == EnumToken.MathFunctionTokenType) {
        const val = evaluateFunc(arena, l);

        if (
            val == null ||
            (val.length == 1 &&
                (arena.dataTypes[val[0]] == EnumToken.MathFunctionTokenType ||
                    arena.dataTypes[val[0]] == EnumToken.FunctionTokenType))
        ) {
            return defaultReturn();
        }

        if (val.length == 1) {
            l = val[0];
            lType = arena.dataTypes[l];
        }
    }

    if (rType == EnumToken.FunctionTokenType || rType == EnumToken.MathFunctionTokenType) {
        const val = evaluateFunc(arena, r);

        if (
            val == null ||
            (val.length == 1 &&
                (arena.dataTypes[val[0]] == EnumToken.MathFunctionTokenType ||
                    arena.dataTypes[val[0]] == EnumToken.FunctionTokenType))
        ) {
            return defaultReturn();
        }

        if (val.length == 1) {
            r = val[0];
            rType = arena.dataTypes[r];
        }
    }

    if (op == EnumToken.Add || op == EnumToken.Plus || op == EnumToken.Sub) {
        if (lType != rType) {
            return defaultReturn();
        }
    }

    let typ: EnumToken =
        lType == EnumToken.NumberTokenType || lType === EnumToken.IdenTokenType
            ? rType
            : rType == EnumToken.NumberTokenType
              ? lType
              : lType == EnumToken.PercentageTokenType
                ? rType
                : lType;

    let v1: number | Fraction | null = numericValue(arena, l);
    let v2: number | Fraction | null = numericValue(arena, r);

    if (op == EnumToken.Mul) {
        if (lType != EnumToken.NumberTokenType && rType != EnumToken.NumberTokenType) {
            if (typeof v1 == "number" && lType == EnumToken.PercentageTokenType) {
                v1 = [v1, 100];
            } else if (typeof v2 == "number" && rType == EnumToken.PercentageTokenType) {
                v2 = [v2, 100];
            }
        }
    }

    if (op == EnumToken.Div && v2 == 0) {
        if (v1 == 0) {
            arena.resetToken(l, EnumToken.IdenTokenType, "NaN");
            return l;
        }

        let sign = Math.sign(v1 as number) * Math.sign(v2 as number);

        sign = Object.is(sign, -0) ? -1 : 1;

        arena.resetToken(l, lType == EnumToken.IdenTokenType ? EnumToken.NumberTokenType : lType, sign);

        return defaultReturn();
    }

    // @ts-ignore
    const val: number | Fraction = compute(v1, v2, op);

    // the result inherits the unit of the dimension operand
    const base: Token = lType === EnumToken.NumberTokenType || lType === EnumToken.IdenTokenType ? r : l;
    const token: Token = arena.createToken(typ == EnumToken.IdenTokenType ? EnumToken.NumberTokenType : typ);

    arena.unit[token] = arena.unit[base];
    setNumericValue(arena, token, val);
    arena.spanLocation(token, l, r);

    return token;
}

/**
 *
 * @param arena
 * @param l
 * @param r
 * @param defaultReturn
 * @returns
 */
function computeNaN(arena: AstArena, l: Token, r: Token, defaultReturn: () => Token): Token {
    const lType: EnumToken = arena.dataTypes[l];
    const rType: EnumToken = arena.dataTypes[r];

    if (lType == EnumToken.NaNTokenType) {
        if (
            rType == EnumToken.NumberTokenType ||
            (rType == EnumToken.IdenTokenType &&
                // @ts-expect-error
                typeof Math[arena.strings[arena.stringValue[r]].toUpperCase()] == "string")
        ) {
            return l;
        }

        // NaN Infinity e pi ...
        if (
            rType == EnumToken.IdenTokenType ||
            rType == EnumToken.InfinityTokenType ||
            rType == EnumToken.NegativeInfinityTokenType
        ) {
            return l;
        }

        // inlined: arena.isNumeric(r)
        if (numericTokenTypes.has(arena.dataTypes[r])) {
            setNumericValue(arena, r, 1);
        }

        return rType == EnumToken.NaNTokenType ? l : defaultReturn();
    }

    if (rType == EnumToken.NaNTokenType) {
        if (
            lType == EnumToken.NumberTokenType ||
            (lType == EnumToken.IdenTokenType &&
                // @ts-expect-error
                typeof Math[arena.strings[arena.stringValue[l]].toUpperCase()] == "string")
        ) {
            return r;
        }

        // inlined: arena.isNumeric(l)
        if (numericTokenTypes.has(arena.dataTypes[l])) {
            setNumericValue(arena, l, 1);
        }
    }

    return defaultReturn();
}

/**
 *
 * @param arena
 * @param l
 * @param r
 * @param op
 * @param defaultReturn
 * @returns
 */
function computeInfinity(
    arena: AstArena,
    l: Token,
    r: Token,
    op: ArithmeticOperator,
    defaultReturn: () => Token,
): Token {
    const lType: EnumToken = arena.dataTypes[l];
    const rType: EnumToken = arena.dataTypes[r];

    if (lType == EnumToken.InfinityTokenType || lType == EnumToken.NegativeInfinityTokenType) {
        if (rType == EnumToken.InfinityTokenType || rType == EnumToken.NegativeInfinityTokenType) {
            // Infinity / Infinity Infinity - Infinity
            if (op == EnumToken.Div || (op == EnumToken.Add && lType != rType) || (op == EnumToken.Sub && lType == rType)) {
                arena.dataTypes[l] = EnumToken.NaNTokenType;
                return l;
            }

            if (lType != rType) {
                arena.dataTypes[l] = EnumToken.NegativeInfinityTokenType;
            }

            return l;
        }

        const value = getValue(arena, r) as number;
        const sign = Math.sign(value);

        const isNumber: boolean = rType == EnumToken.NumberTokenType || rType == EnumToken.IdenTokenType;

        // Infinity * 0
        if (value == 0 && op == EnumToken.Mul) {
            arena.dataTypes[l] = EnumToken.NaNTokenType;
            return isNumber ? l : defaultReturn();
        }

        if (isNumber) {
            arena.numericValue[r] /= arena.numericValue[r] * sign;
        }

        if (op == EnumToken.Div) {
            if (isNumber) {
                arena.resetToken(r, EnumToken.NumberTokenType, sign < 0 ? -0 : 0);
                return r;
            }

            return defaultReturn();
        }

        if (sign == -1) {
            arena.dataTypes[l] =
                lType == EnumToken.InfinityTokenType ? EnumToken.NegativeInfinityTokenType : EnumToken.InfinityTokenType;
        }

        return isNumber ? l : defaultReturn();
    }

    if (rType == EnumToken.InfinityTokenType || rType == EnumToken.NegativeInfinityTokenType) {
        const value: number = getValue(arena, l) as number;
        let sign = Math.sign(value);
        const isNumber: boolean = lType == EnumToken.NumberTokenType || lType == EnumToken.IdenTokenType;

        if (isNumber) {
            arena.resetToken(l, EnumToken.NumberTokenType, sign);
        }

        if (value == 0 && op == EnumToken.Mul) {
            arena.dataTypes[l] = EnumToken.NaNTokenType;
            return l;
        }

        if (op == EnumToken.Div) {
            if (isNumber) {
                arena.resetToken(l, EnumToken.NumberTokenType, sign < 0 ? -0 : 0);
                return l;
            }

            return defaultReturn();
        }

        return isNumber || value == 0 ? r : defaultReturn();
    }

    return defaultReturn();
}

/**
 * numeric value of a scalar token
 * @param arena
 * @param t
 */
function getValue(arena: AstArena, t: Token): number | null {
    const typ: EnumToken = arena.dataTypes[t];

    if (typ == EnumToken.IdenTokenType) {
        // @ts-ignore
        return Math[arena.strings[arena.stringValue[t]].toUpperCase()] as number;
    }

    if (typ == EnumToken.FractionTokenType) {
        return arena.numericValue[arena.firstChild[t]] / arena.numericValue[arena.lastChild[t]];
    }

    // inlined: arena.isNumeric(t)
    if (!numericTokenTypes.has(arena.dataTypes[t])) {
        // not a number
        return NaN;
    }

    const fraction: Token = arena.getFraction(t);

    if (fraction != 0) {
        return arena.numericValue[arena.firstChild[fraction]] / arena.numericValue[arena.lastChild[fraction]];
    }

    return arena.numericValue[t];
}

/**
 * convert an angle token to radians (in place)
 * @param arena
 * @param token
 */
function toRadians(arena: AstArena, token: Token): Token {
    if (arena.dataTypes[token] == EnumToken.NumberTokenType) {
        arena.dataTypes[token] = EnumToken.AngleTokenType;
        // inlined: arena.setUnitString(token, "rad")
        arena.unit[token] = "rad" == null ? 0 : arena.internString("rad");
    } else if (arena.dataTypes[token] == EnumToken.AngleTokenType && arena.strings[arena.unit[token]] != "rad") {
        switch (arena.strings[arena.unit[token]]) {
            case "deg":
                arena.numericValue[token] *= Math.PI / 180;
                // inlined: arena.setUnitString(token, "rad")
                arena.unit[token] = "rad" == null ? 0 : arena.internString("rad");
                break;
            case "grad":
                arena.numericValue[token] *= Math.PI / 200;
                // inlined: arena.setUnitString(token, "rad")
                arena.unit[token] = "rad" == null ? 0 : arena.internString("rad");
                break;
            case "turn":
                arena.numericValue[token] *= 2 * Math.PI;
                // inlined: arena.setUnitString(token, "rad")
                arena.unit[token] = "rad" == null ? 0 : arena.internString("rad");
                break;
        }
    }

    return token;
}

/**
 * evaluate a math function
 * @param arena
 * @param token
 */
export function evaluateFunc(arena: AstArena, token: Token): Token[] | null {
    const values: Token[] = arena.tokens(token);
    const name: string = arena.strings[arena.stringValue[token]];

    switch (name) {
        case "sin":
        case "cos":
        case "tan":
            for (let i = 0; i < values.length; i++) {
                toRadians(arena, values[i]);
            }

        case "asin":
        case "acos":
        case "atan":
        case "abs":
        case "sign":
        case "sqrt":
        case "exp": {
            const value: Token[] = evaluateTokens(arena, values);

            let val: number =
                arena.dataTypes[value[0]] == EnumToken.NumberTokenType ||
                arena.dataTypes[value[0]] == EnumToken.AngleTokenType ||
                arena.dataTypes[value[0]] == EnumToken.PercentageTokenType
                    ? (getValue(arena, value[0]) as number)
                    : (getValue(arena, value[0]) as number);

            // @ts-ignore
            const computed: number = Math[name](val);

            return [
                name == "asin" || name == "acos" || name == "atan"
                    ? tokenAt(arena, EnumToken.AngleTokenType, value[0], computed, "rad")
                    : tokenAt(arena, numbers.has(name) ? EnumToken.NumberTokenType : arena.dataTypes[value[0]], value[0], computed),
            ];
        }

        case "hypot": {
            const chi = values.filter(
                (t) =>
                    ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(
                        arena.dataTypes[t],
                    ),
            );

            let all: number[] = [];
            let ref = chi[0];
            let value: number = 0;

            for (let i = 0; i < chi.length; i++) {
                const val = getValue(arena, chi[i]) as number;

                if (Number.isNaN(val)) {
                    return null;
                }

                all.push(val);
                value += val * val;
            }

            const result: Token = arena.clone(ref, true);

            setNumericValue(arena, result, Math.hypot(...all));
            arena.copyLocation(result, token);
            return [result];
        }

        case "mod":
        case "atan2":
        case "pow":
        case "rem": {
            {
                const first: Token = arena.firstToken[token];
                const typ: EnumToken = first == 0 ? 0 : arena.dataTypes[first];

                for (let t = first == 0 ? 0 : arena.nextSibling[first]; t != 0; t = arena.nextSibling[t]) {
                    if (
                        arena.dataTypes[t] == EnumToken.WhitespaceTokenType ||
                        arena.dataTypes[t] == EnumToken.CommaTokenType ||
                        arena.dataTypes[t] == EnumToken.CommentTokenType
                    ) {
                        continue;
                    }

                    if (arena.dataTypes[t] != typ) {
                        return null;
                    }
                }
            }
            const chi = values.filter(
                (t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(arena.dataTypes[t]),
            );

            if (name == "atan2") {
                for (let i = 0; i < chi.length; i++) {
                    toRadians(arena, chi[i]);
                }
            }

            // https://developer.mozilla.org/en-US/docs/Web/CSS/mod
            const v1: Token[] = evaluateTokens(arena, [chi[0]]);
            const v2: Token[] = evaluateTokens(arena, [chi[2]]);
            const val1 = getValue(arena, v1[0]) as number;
            const val2 = getValue(arena, v2[0]) as number;
            const result: Token = arena.clone(v1[0], true);

            if (name == "rem") {
                setNumericValue(arena, result, +(val1 % val2).toFixed(rem(val1, val2)));
                return [result];
            }

            arena.copyLocation(result, token);

            if (name == "pow") {
                setNumericValue(arena, result, Math.pow(val1, val2));
                return [result];
            }

            if (name == "atan2") {
                arena.dataTypes[result] = EnumToken.AngleTokenType;
                // inlined: arena.setUnitString(result, "rad")
                arena.unit[result] = "rad" == null ? 0 : arena.internString("rad");
                setNumericValue(arena, result, Math.atan2(val1, val2));
                return [result];
            }

            setNumericValue(arena, result, val2 == 0 ? val1 : val1 - Math.floor(val1 / val2) * val2);
            return [result];
        }

        case "clamp":
            arena.setTokenList(token, values);

            return [token];

        case "log":
        case "round":
        case "min":
        case "max": {
            const strategy =
                name == "round" && values.length > 0 && arena.dataTypes[values[0]] == EnumToken.IdenTokenType
                    ? arena.strings[arena.stringValue[values.shift() as Token]]
                    : null;
            const valuesMap = new Map();

            for (const curr of values) {
                if (
                    arena.dataTypes[curr] == EnumToken.CommaTokenType ||
                    arena.dataTypes[curr] == EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[curr] == EnumToken.CommentTokenType
                ) {
                    continue;
                }

                // the argument is evaluated on a copy: the function is returned unchanged when it cannot be computed
                const result: Token[] = evaluateTokens(arena, [arena.clone(curr, true)]);

                const key: string = arena.dataTypes[result[0]] + arena.strings[arena.unit[result[0]]];

                if (!valuesMap.has(key)) {
                    valuesMap.set(key, []);
                }

                valuesMap.get(key)!.push(result[0]);
            }

            if (valuesMap.size == 1) {
                const values = valuesMap.values().next().value as Token[];

                if (name == "log") {
                    const val1 = getValue(arena, values[0]) as number;
                    const val2 = values.length == 2 ? (getValue(arena, values[1]) as number) : null;
                    const result: Token = arena.clone(values[0], true);

                    setNumericValue(arena, result, Math.log(val1) / Math.log(val2 as number));
                    arena.copyLocation(result, token);
                    return [result];
                }

                if (name == "min" || name == "max") {
                    let val = getValue(arena, values[0]) as number;
                    let val2: number = val;
                    let ret = values[0];

                    for (const curr of values.slice(1)) {
                        val2 = getValue(arena, curr) as number;

                        if (val2 < val && name == "min") {
                            val = val2;
                            ret = curr;
                        } else if (val2 > val && name == "max") {
                            val = val2;
                            ret = curr;
                        }
                    }

                    return [ret];
                }

                if (name == "round") {
                    let val = getValue(arena, values[0]) as number;
                    let val2 = getValue(arena, values[1]) as number;

                    if (strategy == null || strategy == "down") {
                        val = val - (val % val2);
                    } else {
                        val =
                            strategy == "to-zero"
                                ? Math.trunc(val / val2) * val2
                                : strategy == "nearest"
                                  ? Math.round(val / val2) * val2
                                  : Math.ceil(val / val2) * val2;
                    }

                    const result: Token = arena.clone(values[0], true);

                    setNumericValue(arena, result, val);
                    arena.copyLocation(result, token);
                    return [result];
                }
            }
        }
    }

    return [token];
}

/**
 * convert BinaryExpression into an array
 * @param arena
 * @param token
 */
export function inlineExpression(arena: AstArena, token: Token): Token[] {
    const result: Token[] = [];

    if (arena.dataTypes[token] == EnumToken.BinaryExpressionTokenType) {
        const op: EnumToken = arena.numericValue[token];

        if (op == EnumToken.Mul || op == EnumToken.Div) {
            result.push(token);
        } else {
            const l: Token = arena.field(token, TokenField.L);
            const r: Token = arena.field(token, TokenField.R);

            for (const child of inlineExpression(arena, l)) {
                result.push(child);
            }

            result.push(tokenAt(arena, op, token));

            for (const child of inlineExpression(arena, r)) {
                result.push(child);
            }
        }
    } else {
        result.push(token);
    }

    return result;
}

/**
 * evaluate expression
 * @param arena
 * @param token
 */
function evaluateExpression(arena: AstArena, token: Token): Token {
    if (arena.dataTypes[token] != EnumToken.BinaryExpressionTokenType) {
        return token;
    }

    let l: Token = arena.field(token, TokenField.L);
    let r: Token = arena.field(token, TokenField.R);

    if (arena.dataTypes[r] == EnumToken.BinaryExpressionTokenType) {
        r = evaluateExpression(arena, r);
    }

    if (arena.dataTypes[l] == EnumToken.BinaryExpressionTokenType) {
        l = evaluateExpression(arena, l);
    }

    return doEvaluate(arena, l, r, arena.numericValue[token] as ArithmeticOperator);
}

function isScalarToken(arena: AstArena, token: Token): boolean {
    const typ: EnumToken = arena.dataTypes[token];

    return (
        arena.unit[token] != 0 ||
        typ == EnumToken.MathFunctionTokenType ||
        (typ == EnumToken.FunctionTokenType && mathFuncs.includes(arena.strings[arena.stringValue[token]])) ||
        (typ == EnumToken.IdenTokenType &&
            // @ts-ignore
            typeof Math[arena.strings[arena.stringValue[token]].toUpperCase()] == "number") ||
        (typ == EnumToken.IdenTokenType && arena.strings[arena.stringValue[token]] == "NaN") ||
        (typ == EnumToken.IdenTokenType &&
            (equalsIgnoreCase(arena.strings[arena.stringValue[token]], "Infinity") ||
                equalsIgnoreCase(arena.strings[arena.stringValue[token]], "-Infinity"))) ||
        typ == EnumToken.NumberTokenType ||
        typ == EnumToken.FractionTokenType ||
        typ == EnumToken.PercentageTokenType ||
        typ == EnumToken.NaNTokenType ||
        typ == EnumToken.InfinityTokenType ||
        typ == EnumToken.NegativeInfinityTokenType
    );
}

/**
 *
 * generate a binary expression tree
 * @param arena
 * @param tokens
 */
export function buildExpression(arena: AstArena, tokens: Token[]): Token {
    return factor(
        arena,
        factor(
            arena,
            tokens.filter((t) => arena.dataTypes[t] != EnumToken.WhitespaceTokenType),
            ["/", "*"],
        ),
        ["+", "-"],
    )[0];
}

function getArithmeticOperation(
    op: "+" | "-" | "/" | "*",
): EnumToken.Mul | EnumToken.Div | EnumToken.Add | EnumToken.Sub {
    if (op == "+") {
        return EnumToken.Add;
    }

    if (op == "-") {
        return EnumToken.Sub;
    }

    if (op == "/") {
        return EnumToken.Div;
    }

    return EnumToken.Mul;
}

/**
 *
 * generate a binary expression tree
 * @param arena
 * @param token
 */
function factorToken(arena: AstArena, token: Token): Token {
    const typ: EnumToken = arena.dataTypes[token];

    if (
        typ == EnumToken.ParensTokenType ||
        ((typ == EnumToken.MathFunctionTokenType || typ == EnumToken.FunctionTokenType) &&
            arena.strings[arena.stringValue[token]] == "calc")
    ) {
        return buildExpression(arena, arena.tokens(token));
    }

    return token;
}

/**
 * generate a binary expression tree
 * @param arena
 * @param tokens
 * @param ops
 */
function factor(arena: AstArena, tokens: Token[], ops: Array<"+" | "-" | "/" | "*">): Token[] {
    let isOp: boolean;
    const opList: EnumToken[] = ops.map((x) => getArithmeticOperation(x));

    if (tokens.length == 1) {
        return [factorToken(arena, tokens[0])];
    }

    for (let i = 0; i < tokens.length; i++) {
        if (arena.dataTypes[tokens[i]] == EnumToken.ListToken) {
            tokens.splice(i, 1, ...arena.tokens(tokens[i]));
        }

        const typ: EnumToken = arena.dataTypes[tokens[i]];

        isOp = opList.includes(typ === EnumToken.Plus ? EnumToken.Add : typ);

        if (
            isOp ||
            typ === EnumToken.Star ||
            (typ == EnumToken.LiteralTokenType && ops.includes(arena.strings[arena.stringValue[tokens[i]]] as "+"))
        ) {
            const op: EnumToken = isOp
                ? typ === EnumToken.Plus
                    ? EnumToken.Add
                    : typ
                : getArithmeticOperation(arena.strings[arena.stringValue[tokens[i]]] as "-" | "+" | "/" | "*");
            const expression: Token = arena.createBinaryExpression(
                op,
                factorToken(arena, tokens[i - 1]),
                factorToken(arena, tokens[i + 1]),
            );

            arena.spanLocation(expression, tokens[i - 1], tokens[i + 1]);
            tokens.splice(i - 1, 3, expression);

            i--;
        }
    }

    return tokens;
}
