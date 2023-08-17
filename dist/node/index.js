import { parse as parse$1 } from '../lib/parser/parse.js';
export { parseString, urlTokenMatcher } from '../lib/parser/parse.js';
export { tokenize } from '../lib/parser/tokenize.js';
export { isAngle, isAtKeyword, isColor, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isHexDigit, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, parseDimension } from '../lib/parser/utils/syntax.js';
export { getConfig } from '../lib/parser/utils/config.js';
export { funcList, matchType } from '../lib/parser/utils/type.js';
export { colorsFunc, render, renderToken } from '../lib/renderer/render.js';
import { transform as transform$1 } from '../lib/transform.js';
export { combinators, hasDeclaration, minify, minifyRule, reduceSelector } from '../lib/ast/minify.js';
export { walk } from '../lib/ast/walk.js';
import { load } from './load.js';
import { resolve } from '../lib/fs/resolve.js';
export { dirname, matchUrl } from '../lib/fs/resolve.js';

async function parse(iterator, opt = {}) {
    return parse$1(iterator, Object.assign(opt, { load, resolve, cwd: opt.cwd ?? process.cwd() }));
}
async function transform(css, options = {}) {
    return transform$1(css, Object.assign(options, { load, resolve, cwd: options.cwd ?? process.cwd() }));
}

export { load, parse, resolve, transform };
