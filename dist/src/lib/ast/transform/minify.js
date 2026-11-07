/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { identity, multiply, decompose, round, toZero } from './utils.js';
import { epsilon } from '../../syntax/constants.js';
import { EnumToken } from '../types.js';
import { computeMatrix } from './compute.js';
import { parseMatrix } from './matrix.js';

// translate → rotate → skew → scale
function minify(arena, matrix) {
    const decomposed = decompose(matrix);
    if (decomposed == null) {
        return null;
    }
    const transforms = new Set(["translate", "scale", "skew", "perspective", "rotate"]);
    const scales = new Set(["x", "y", "z"]);
    const skew = new Set(["x", "y"]);
    let result = [];
    // check identity
    if (round(decomposed.translate[0]) == 0 &&
        round(decomposed.translate[1]) == 0 &&
        round(decomposed.translate[2]) == 0) {
        transforms.delete("translate");
    }
    if (round(decomposed.scale[0]) == 1 && round(decomposed.scale[1]) == 1 && round(decomposed.scale[2]) == 1) {
        transforms.delete("scale");
    }
    if (round(decomposed.skew[0]) == 0 && round(decomposed.skew[1]) == 0) {
        transforms.delete("skew");
    }
    if (round(decomposed.perspective[2]) == 0) {
        transforms.delete("perspective");
    }
    if (round(decomposed.rotate[3]) == 0) {
        transforms.delete("rotate");
    }
    if (transforms.has("translate")) {
        let coordinates = new Set(["x", "y", "z"]);
        for (let i = 0; i < 3; i++) {
            if (round(decomposed.translate[i]) == 0) {
                coordinates.delete(i == 0 ? "x" : i == 1 ? "y" : "z");
            }
        }
        if (coordinates.size == 1) {
            if (coordinates.has("x")) {
                result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[0]), "px")]));
            }
            else {
                let axis = coordinates.has("y") ? "y" : "z";
                let index = axis == "y" ? 1 : 2;
                result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "translate" + axis.toUpperCase(), [arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[index]), "px")]));
            }
        }
        else if (coordinates.has("z")) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "translate3d", [
                decomposed.translate[0] == 0
                    ? arena.createToken(EnumToken.NumberTokenType, 0)
                    : arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[0]), "px"),
                arena.createToken(EnumToken.CommaTokenType),
                decomposed.translate[1] == 0
                    ? arena.createToken(EnumToken.NumberTokenType, 0)
                    : arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[1]), "px"),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[2]), "px"),
            ]));
        }
        else {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [
                arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[0]), "px"),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.LengthTokenType, round(decomposed.translate[1]), "px"),
            ]));
        }
    }
    if (transforms.has("rotate")) {
        const [x, y, z, angle] = decomposed.rotate;
        if (y == 0 && z == 0) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "rotateX", [
                arena.createToken(EnumToken.AngleTokenType, round(angle), "deg"),
            ]));
        }
        else if (x == 0 && z == 0) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "rotateY", [
                arena.createToken(EnumToken.AngleTokenType, round(angle), "deg"),
            ]));
        }
        else if (x == 0 && y == 0) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "rotate", [
                arena.createToken(EnumToken.AngleTokenType, round(angle), "deg"),
            ]));
        }
        else {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "rotate3d", [
                arena.createToken(EnumToken.NumberTokenType, round(x)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.NumberTokenType, round(y)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.NumberTokenType, round(z)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.AngleTokenType, round(angle), "deg"),
            ]));
        }
    }
    if (transforms.has("skew")) {
        if (round(decomposed.skew[1]) == 0) {
            skew.delete("y");
        }
        for (let i = 0; i < 2; i++) {
            decomposed.skew[i] = round((Math.atan(decomposed.skew[i]) * 180) / Math.PI);
        }
        if (skew.size == 1) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "skew" + (skew.has("x") ? "" : "Y"), [arena.createToken(EnumToken.AngleTokenType, round(decomposed.skew[0]), "deg")]));
        }
        else {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "skew", [
                arena.createToken(EnumToken.AngleTokenType, round(decomposed.skew[0]), "deg"),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.AngleTokenType, round(decomposed.skew[1]), "deg"),
            ]));
        }
    }
    if (transforms.has("scale")) {
        const [sx, sy, sz] = toZero(decomposed.scale);
        if (sz == 1) {
            scales.delete("z");
        }
        if (sy == 1) {
            scales.delete("y");
        }
        if (sx == 1) {
            scales.delete("x");
        }
        if (scales.size == 1) {
            let prefix = scales.has("x") ? "X" : scales.has("y") ? "Y" : "Z";
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "scale" + prefix, [arena.createToken(EnumToken.NumberTokenType, round(prefix == "Z" ? sz : prefix == "Y" ? sy : sx))]));
        }
        else if (!scales.has("z")) {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [
                arena.createToken(EnumToken.NumberTokenType, round(sx)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.NumberTokenType, round(sy)),
            ]));
        }
        else {
            result.push(arena.createFunction(EnumToken.TransformFunctionTokenType, "scale3d", [
                arena.createToken(EnumToken.NumberTokenType, round(sx)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.NumberTokenType, round(sy)),
                arena.createToken(EnumToken.CommaTokenType),
                arena.createToken(EnumToken.NumberTokenType, round(sz)),
            ]));
        }
    }
    // identity
    return result.length == 0 || (result.length == 1 && eqMatrix(arena, identity(), result))
        ? [
            arena.createToken(EnumToken.IdenTokenType, "none"),
        ]
        : result;
}
function eqMatrix(arena, a, b) {
    let mat = identity();
    let tmp = identity();
    const data = (Array.isArray(a) || ArrayBuffer.isView(a) ? a : parseMatrix(arena, a));
    for (const transform of b) {
        tmp = computeMatrix(arena, [transform], identity());
        if (tmp == null) {
            return false;
        }
        mat = multiply(mat, tmp);
    }
    if (mat == null) {
        return false;
    }
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (Math.abs(mat[i * 4 + j] - data[i * 4 + j]) > epsilon) {
                return false;
            }
        }
    }
    return true;
}
function minifyTransformFunctions(arena, transform) {
    const name = arena.strings[arena.stringValue[transform]];
    if ("skewX" == name) {
        // inlined: arena.setStr(transform, "skew")
        arena.stringValue[transform] = arena.internString("skew");
        return transform;
    }
    if (!["translate", "translate3d", "scale", "scale3d"].includes(name)) {
        return transform;
    }
    const values = [];
    for (const token of arena.tokens(transform)) {
        if (arena.dataTypes[token] == EnumToken.CommentTokenType ||
            arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
            arena.dataTypes[token] == EnumToken.CommaTokenType) {
            continue;
        }
        if (![
            EnumToken.NumberTokenType,
            EnumToken.LengthTokenType,
            EnumToken.AngleTokenType,
            EnumToken.PercentageTokenType,
        ].includes(arena.dataTypes[token])) {
            return transform;
        }
        if (arena.dataTypes[token] == EnumToken.PercentageTokenType &&
            !arena.hasFraction(token) &&
            name.startsWith("scale")) {
            arena.dataTypes[token] = EnumToken.NumberTokenType;
            arena.numericValue[token] /= 100;
        }
        values.push(token);
    }
    if (values.length == 0) {
        return transform;
    }
    if ((name == "translate" || name == "scale") && values.length > 2) {
        return transform;
    }
    const ignoredValue = name.startsWith("scale") ? 1 : 0;
    const t = new Set(["x", "y", "z"]);
    for (let i = 0; i < 3; i++) {
        const axis = i == 0 ? "x" : i == 1 ? "y" : "z";
        if (values.length <= i || arena.numericValue[values[i]] == ignoredValue) {
            t.delete(axis);
        }
    }
    if (name == "translate3d" || name == "translate") {
        if (t.size == 0) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [arena.createToken(EnumToken.NumberTokenType, 0)]);
        }
        if (t.size == 1) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "translate" + (t.has("x") ? "" : t.has("y") ? "Y" : "Z"), [values[t.has("x") ? 0 : t.has("y") ? 1 : 2]]);
        }
        if (t.size == 2) {
            if (t.has("z")) {
                return transform;
            }
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "translate", [values[0], arena.createToken(EnumToken.CommaTokenType), values[1]]);
        }
    }
    if (name == "scale3d" || name == "scale") {
        if (t.size == 0) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [arena.createToken(EnumToken.NumberTokenType, 1)]);
        }
        if (t.size == 1) {
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "scale" + (t.has("x") ? "X" : t.has("y") ? "Y" : "Z"), [values[t.has("x") ? 0 : t.has("y") ? 1 : 2]]);
        }
        if (t.size == 2) {
            if (t.has("z")) {
                return transform;
            }
            return arena.createFunction(EnumToken.TransformFunctionTokenType, "scale", [values[0], arena.createToken(EnumToken.CommaTokenType), values[1]]);
        }
    }
    return transform;
}

export { eqMatrix, minify, minifyTransformFunctions };
