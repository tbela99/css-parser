/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { setIdentity, multiplyInto, toZero } from './utils.js';
import { EnumToken } from '../types.js';
import { translateX, translateY, translateZ, translate, translate3d } from './translate.js';
import { getAngle, getNumber } from '../../syntax/color/color.js';
import { rotate, rotate3D } from './rotate.js';
import { scale3d, scale, scaleX, scaleY, scaleZ } from './scale.js';
import { minify } from './minify.js';
import { skew, skewX, skewY } from './skew.js';
import { serialize, setMatrixValues } from './matrix.js';
import { perspective } from './perspective.js';
import { length2Px } from '../../syntax/syntax.js';

/**
 * kind of a transform function name, and family of the name (see {@link transformKind})
 */
var TransformKind;
(function (TransformKind) {
    TransformKind[TransformKind["None"] = 0] = "None";
    TransformKind[TransformKind["Translate"] = 1] = "Translate";
    TransformKind[TransformKind["TranslateX"] = 2] = "TranslateX";
    TransformKind[TransformKind["TranslateY"] = 3] = "TranslateY";
    TransformKind[TransformKind["TranslateZ"] = 4] = "TranslateZ";
    TransformKind[TransformKind["Translate3d"] = 5] = "Translate3d";
    TransformKind[TransformKind["Rotate"] = 6] = "Rotate";
    TransformKind[TransformKind["RotateX"] = 7] = "RotateX";
    TransformKind[TransformKind["RotateY"] = 8] = "RotateY";
    TransformKind[TransformKind["RotateZ"] = 9] = "RotateZ";
    TransformKind[TransformKind["Rotate3d"] = 10] = "Rotate3d";
    TransformKind[TransformKind["Scale"] = 11] = "Scale";
    TransformKind[TransformKind["ScaleX"] = 12] = "ScaleX";
    TransformKind[TransformKind["ScaleY"] = 13] = "ScaleY";
    TransformKind[TransformKind["ScaleZ"] = 14] = "ScaleZ";
    TransformKind[TransformKind["Scale3d"] = 15] = "Scale3d";
    TransformKind[TransformKind["Skew"] = 16] = "Skew";
    TransformKind[TransformKind["SkewX"] = 17] = "SkewX";
    TransformKind[TransformKind["SkewY"] = 18] = "SkewY";
    TransformKind[TransformKind["Perspective"] = 19] = "Perspective";
    TransformKind[TransformKind["Matrix"] = 20] = "Matrix";
    TransformKind[TransformKind["Matrix3d"] = 21] = "Matrix3d";
    /**
     * the name of the `transform` property or of a prefixed version (`-webkit-transform`)
     */
    TransformKind[TransformKind["Property"] = 22] = "Property";
    /**
     * mask of the kind
     */
    TransformKind[TransformKind["KindMask"] = 255] = "KindMask";
    /**
     * the name starts with `translate`
     */
    TransformKind[TransformKind["TranslateFamily"] = 256] = "TranslateFamily";
    /**
     * the name starts with `rotate`
     */
    TransformKind[TransformKind["RotateFamily"] = 512] = "RotateFamily";
    /**
     * the name starts with `scale`
     */
    TransformKind[TransformKind["ScaleFamily"] = 768] = "ScaleFamily";
    /**
     * mask of the family
     */
    TransformKind[TransformKind["FamilyMask"] = 768] = "FamilyMask";
})(TransformKind || (TransformKind = {}));
/**
 * the transform functions, by name (case-sensitive)
 */
const transformKinds = new Map([
    ["translate", 1 /* TransformKind.Translate */],
    ["translateX", 2 /* TransformKind.TranslateX */],
    ["translateY", 3 /* TransformKind.TranslateY */],
    ["translateZ", 4 /* TransformKind.TranslateZ */],
    ["translate3d", 5 /* TransformKind.Translate3d */],
    ["rotate", 6 /* TransformKind.Rotate */],
    ["rotateX", 7 /* TransformKind.RotateX */],
    ["rotateY", 8 /* TransformKind.RotateY */],
    ["rotateZ", 9 /* TransformKind.RotateZ */],
    ["rotate3d", 10 /* TransformKind.Rotate3d */],
    ["scale", 11 /* TransformKind.Scale */],
    ["scaleX", 12 /* TransformKind.ScaleX */],
    ["scaleY", 13 /* TransformKind.ScaleY */],
    ["scaleZ", 14 /* TransformKind.ScaleZ */],
    ["scale3d", 15 /* TransformKind.Scale3d */],
    ["skew", 16 /* TransformKind.Skew */],
    ["skewX", 17 /* TransformKind.SkewX */],
    ["skewY", 18 /* TransformKind.SkewY */],
    ["perspective", 19 /* TransformKind.Perspective */],
    ["matrix", 20 /* TransformKind.Matrix */],
    ["matrix3d", 21 /* TransformKind.Matrix3d */],
]);
/**
 * the transform property and its prefixed versions
 */
const transformProperty = /^(-[a-z]+-)?transform$/;
/**
 * the arena of the strings read by {@link computeTransformKind}: the function passed to the string table is not a
 * closure (no allocation per call)
 */
let kindArena = null;
/**
 * see {@link transformKind}
 * @param id
 */
function computeTransformKind(id) {
    const name = kindArena.resolveString(id);
    let kind = transformKinds.get(name) ?? 0 /* TransformKind.None */;
    if (kind === 0 /* TransformKind.None */ && transformProperty.test(name)) {
        return 22 /* TransformKind.Property */;
    }
    if (name.startsWith("translate")) {
        kind |= 256 /* TransformKind.TranslateFamily */;
    }
    else if (name.startsWith("rotate")) {
        kind |= 512 /* TransformKind.RotateFamily */;
    }
    else if (name.startsWith("scale")) {
        kind |= 768 /* TransformKind.ScaleFamily */;
    }
    return kind;
}
/**
 * the kind of a string ({@link TransformKind.KindMask}: transform function or transform property) and the family of a
 * transform function name ({@link TransformKind.FamilyMask}). computed once per interned string
 * @param arena
 * @param id interned string id
 */
function transformKind(arena, id) {
    kindArena = arena;
    return arena.stringDerived(id, 2 /* StringDerived.TransformKind */, computeTransformKind);
}
/**
 * numeric arguments of a transform function (the first 16 arguments), reused
 */
const args = new Float64Array(16);
/**
 * the matrix of the values of `matrix()` and `matrix3d()`
 */
const valuesMatrix = new Float64Array(16);
/**
 * multiply a matrix in place by the matrix of a transform function
 * @param arena
 * @param token
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
function computeTransform(arena, token, matrixVar) {
    if (arena.dataTypes[token] !== EnumToken.TransformFunctionTokenType) {
        return false;
    }
    const kind = transformKind(arena, arena.stringValue[token]) & 255 /* TransformKind.KindMask */;
    // number of arguments
    let count = 0;
    let child;
    let typ;
    switch (kind) {
        case 1 /* TransformKind.Translate */:
        case 2 /* TransformKind.TranslateX */:
        case 3 /* TransformKind.TranslateY */:
        case 4 /* TransformKind.TranslateZ */:
        case 5 /* TransformKind.Translate3d */: {
            let val;
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType ||
                    typ === EnumToken.WhitespaceTokenType) {
                    continue;
                }
                val = length2Px(arena, child);
                if (val == null) {
                    return false;
                }
                if (count < 16) {
                    args[count] = val;
                }
                count++;
            }
            if (count === 0 ||
                count > (kind === 5 /* TransformKind.Translate3d */ ? 3 : kind === 1 /* TransformKind.Translate */ ? 2 : 1)) {
                return false;
            }
            if (kind === 2 /* TransformKind.TranslateX */) {
                translateX(args[0], matrixVar);
            }
            else if (kind === 3 /* TransformKind.TranslateY */) {
                translateY(args[0], matrixVar);
            }
            else if (kind === 4 /* TransformKind.TranslateZ */) {
                translateZ(args[0], matrixVar);
            }
            else if (kind === 1 /* TransformKind.Translate */) {
                translate(args[0], count > 1 ? args[1] : undefined, matrixVar);
            }
            else {
                translate3d(args[0], count > 1 ? args[1] : undefined, count > 2 ? args[2] : undefined, matrixVar);
            }
            return true;
        }
        case 6 /* TransformKind.Rotate */:
        case 7 /* TransformKind.RotateX */:
        case 8 /* TransformKind.RotateY */:
        case 9 /* TransformKind.RotateZ */:
        case 10 /* TransformKind.Rotate3d */: {
            let x = 0;
            let y = 0;
            let z = 0;
            // the first three arguments and the last argument
            let first = 0;
            let second = 0;
            let third = 0;
            let last = 0;
            // the whitespace tokens are arguments
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.CommentTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }
                if (count === 0) {
                    first = child;
                }
                else if (count === 1) {
                    second = child;
                }
                else if (count === 2) {
                    third = child;
                }
                last = child;
                count++;
            }
            if (count !== (kind === 10 /* TransformKind.Rotate3d */ ? 4 : 1)) {
                return false;
            }
            if (kind === 7 /* TransformKind.RotateX */) {
                x = 1;
            }
            else if (kind === 8 /* TransformKind.RotateY */) {
                y = 1;
            }
            else if (kind === 6 /* TransformKind.Rotate */ || kind === 9 /* TransformKind.RotateZ */) {
                z = 1;
            }
            else {
                x = getNumber(arena, first);
                y = getNumber(arena, second);
                z = getNumber(arena, third);
            }
            const angle = getAngle(arena, last);
            if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || Number.isNaN(angle)) {
                return false;
            }
            if (kind === 6 /* TransformKind.Rotate */ || kind === 9 /* TransformKind.RotateZ */) {
                rotate(angle * 2 * Math.PI, matrixVar);
            }
            else {
                rotate3D(angle * 2 * Math.PI, x, y, z, matrixVar);
            }
            return true;
        }
        case 11 /* TransformKind.Scale */:
        case 12 /* TransformKind.ScaleX */:
        case 13 /* TransformKind.ScaleY */:
        case 14 /* TransformKind.ScaleZ */:
        case 15 /* TransformKind.Scale3d */:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.CommentTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }
                // whitespace tokens are not allowed
                if (typ !== EnumToken.NumberTokenType && typ !== EnumToken.PercentageTokenType) {
                    return false;
                }
                if (count < 16) {
                    args[count] = getNumber(arena, child);
                }
                count++;
            }
            if (kind === 15 /* TransformKind.Scale3d */) {
                if (count !== 3) {
                    return false;
                }
                scale3d(args[0], args[1], args[2], matrixVar);
            }
            else if (kind === 11 /* TransformKind.Scale */) {
                if (count !== 1 && count !== 2) {
                    return false;
                }
                scale(args[0], count > 1 ? args[1] : args[0], matrixVar);
            }
            else if (count !== 1) {
                return false;
            }
            else if (kind === 12 /* TransformKind.ScaleX */) {
                scaleX(args[0], matrixVar);
            }
            else if (kind === 13 /* TransformKind.ScaleY */) {
                scaleY(args[0], matrixVar);
            }
            else {
                scaleZ(args[0], matrixVar);
            }
            return true;
        case 16 /* TransformKind.Skew */:
        case 17 /* TransformKind.SkewX */:
        case 18 /* TransformKind.SkewY */:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType ||
                    typ === EnumToken.WhitespaceTokenType) {
                    continue;
                }
                if (count < 16) {
                    args[count] = getAngle(arena, child) * 2 * Math.PI;
                }
                count++;
            }
            if (count === 0 || count > (kind === 16 /* TransformKind.Skew */ ? 2 : 1)) {
                return false;
            }
            if (kind === 16 /* TransformKind.Skew */) {
                skew(args[0], count > 1 ? args[1] : undefined, matrixVar);
            }
            else if (kind === 17 /* TransformKind.SkewX */) {
                skewX(args[0], matrixVar);
            }
            else {
                skewY(args[0], matrixVar);
            }
            return true;
        case 19 /* TransformKind.Perspective */: {
            // null for `none`
            let distance = null;
            let val;
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.CommentTokenType || typ === EnumToken.WhitespaceTokenType) {
                    continue;
                }
                count++;
                if (typ === EnumToken.IdenTokenType && arena.resolveString(arena.stringValue[child]) === "none") {
                    distance = null;
                    continue;
                }
                val = length2Px(arena, child);
                if (val == null) {
                    return false;
                }
                distance = val;
            }
            if (count !== 1) {
                return false;
            }
            perspective(distance, matrixVar);
            return true;
        }
        case 20 /* TransformKind.Matrix */:
        case 21 /* TransformKind.Matrix3d */:
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.WhitespaceTokenType ||
                    typ === EnumToken.CommentTokenType ||
                    typ === EnumToken.CommaTokenType) {
                    continue;
                }
                if (count < 16) {
                    args[count] = getNumber(arena, child);
                }
                count++;
            }
            if (count !== (kind === 20 /* TransformKind.Matrix */ ? 6 : 16)) {
                return false;
            }
            multiplyInto(matrixVar, setMatrixValues(args, count, valuesMatrix), matrixVar);
            return true;
    }
    return false;
}
/**
 * multiply a matrix in place by the matrices of a list of transform functions
 * @param arena
 * @param tokens
 * @param start index of the first function
 * @param end index after the last function
 * @param matrixVar
 * @returns false if the matrix cannot be computed. the matrix is then partially updated
 */
function computeMatrix(arena, tokens, start, end, matrixVar) {
    for (let i = start; i < end; i++) {
        if (!computeTransform(arena, tokens[i], matrixVar)) {
            return false;
        }
    }
    return true;
}
/**
 * the matrix of the transform list
 */
const transformMatrix = new Float64Array(16);
/**
 * the matrix of a run of functions of the transform list
 */
const runMatrix = new Float64Array(16);
/**
 * the transform functions of the runs: index of the first token of each run, then the end of the last run. the arrays
 * are reused: their length is not reset (see {@link runCount} and {@link tokenCount})
 */
const runs = [];
/**
 * the tokens of the transform list without the comments and the whitespace tokens, see {@link splitTransformList}
 */
const tokens = [];
/**
 * number of values of {@link runs}
 */
let runCount = 0;
/**
 * number of values of {@link tokens}
 */
let tokenCount = 0;
/**
 * the result of the computation, reused
 */
const computed = {
    values: transformMatrix,
    matrix: 0,
    cumulative: [],
    minified: [],
    created: true,
};
/**
 * compute the matrix of a transform list
 * @param arena
 * @param transformList the tokens of the value
 * @returns null if the matrix cannot be computed
 */
function compute(arena, transformList) {
    let token;
    let child;
    let kind;
    let typ;
    // all transform function arguments must be 0 or scale(1)
    for (let i = 0; i < transformList.length; i++) {
        token = transformList[i];
        kind = transformKind(arena, arena.stringValue[token]) & 255 /* TransformKind.KindMask */;
        if (kind === 6 /* TransformKind.Rotate */ ||
            kind === 7 /* TransformKind.RotateX */ ||
            kind === 8 /* TransformKind.RotateY */ ||
            kind === 9 /* TransformKind.RotateZ */ ||
            kind === 10 /* TransformKind.Rotate3d */) {
            for (child = arena.firstToken[token]; child !== 0; child = arena.nextSibling[child]) {
                typ = arena.dataTypes[child];
                if (typ === EnumToken.WhitespaceTokenType || typ === EnumToken.CommaTokenType) {
                    continue;
                }
                if ((typ !== EnumToken.AngleTokenType &&
                    typ !== EnumToken.NumberTokenType &&
                    typ !== EnumToken.PercentageTokenType) ||
                    // angle >= 360deg, do not transform
                    Math.abs(getAngle(arena, child)) >= 1) {
                    return null;
                }
            }
        }
    }
    splitTransformList(arena, transformList);
    // a new array: it may become the value of the declaration
    const cumulative = [];
    const matrix = setIdentity(transformMatrix);
    let minified;
    // the runs produced tokens: `none` is the value of an empty list
    let empty = true;
    computed.created = true;
    for (let run = 0; run < runCount - 1; run++) {
        const start = runs[run];
        const end = runs[run + 1];
        if (!computeMatrix(arena, tokens, start, end, setIdentity(runMatrix))) {
            return null;
        }
        multiplyInto(matrix, runMatrix, matrix);
        minified = minify(arena, runMatrix);
        if (minified == null) {
            computed.created = false;
            empty = false;
            for (let i = start; i < end; i++) {
                pushTransform(arena, cumulative, tokens[i]);
            }
        }
        else {
            empty &&= minified.length === 0;
            for (let i = 0; i < minified.length; i++) {
                pushTransform(arena, cumulative, minified[i]);
            }
        }
    }
    const serialized = serialize(arena, matrix);
    if (!empty && cumulative.length === 0) {
        cumulative.push(arena.createToken(EnumToken.IdenTokenType, "none"));
    }
    computed.cumulative = cumulative;
    computed.matrix = serialize(arena, toZero(matrix));
    computed.minified = minify(arena, matrix) ?? [serialized];
    return computed;
}
/**
 * append a token to a transform list. `none` is omitted
 * @param arena
 * @param list
 * @param token
 */
function pushTransform(arena, list, token) {
    if (arena.dataTypes[token] !== EnumToken.IdenTokenType ||
        arena.resolveString(arena.stringValue[token]) !== "none") {
        list.push(token);
    }
}
/**
 * split a transform list into runs (see {@link runs} and {@link tokens}): the consecutive translations, rotations and
 * scales are grouped, the other tokens are alone. the comments and the whitespace tokens are ignored
 * @param arena
 * @param transformList
 */
function splitTransformList(arena, transformList) {
    // family of the current run
    let pattern = 0;
    let family;
    let typ;
    let token;
    runCount = 0;
    // the runs index the list without the ignored tokens
    tokenCount = 0;
    for (let i = 0; i < transformList.length; i++) {
        token = transformList[i];
        typ = arena.dataTypes[token];
        if (typ === EnumToken.CommentTokenType || typ === EnumToken.WhitespaceTokenType) {
            continue;
        }
        if (typ === EnumToken.TransformFunctionTokenType) {
            family = transformKind(arena, arena.stringValue[token]) & 768 /* TransformKind.FamilyMask */;
            if (pattern !== 0 && family === pattern) {
                // continue the current run
                tokens[tokenCount++] = token;
                continue;
            }
            pattern = family;
        }
        runs[runCount++] = tokenCount;
        tokens[tokenCount++] = token;
    }
    runs[runCount++] = tokenCount;
}

export { TransformKind, compute, computeMatrix, computeTransform, transformKind };
