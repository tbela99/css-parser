import { parse as parse$1 } from '../lib/parser/parse.js';
export { parseString, urlTokenMatcher } from '../lib/parser/parse.js';
export { tokenize } from '../lib/parser/tokenize.js';
export { isAngle, isAtKeyword, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isHexDigit, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, parseDimension } from '../lib/parser/utils/syntax.js';
export { getConfig } from '../lib/parser/utils/config.js';
export { matchType } from '../lib/parser/utils/type.js';
export { render, renderToken } from '../lib/renderer/render.js';
import { transform as transform$1 } from '../lib/transform.js';
export { combinators, hasDeclaration, minify, minifyRule, reduceSelector } from '../lib/ast/minify.js';
export { walk } from '../lib/ast/walk.js';
import { load } from './load.js';
import { resolve, dirname } from '../lib/fs/resolve.js';
export { matchUrl } from '../lib/fs/resolve.js';

function parse(iterator, opt = {}) {
    return parse$1(iterator, Object.assign(opt, {
        load,
        resolve,
        cwd: opt.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}
function transform(css, options = {}) {
    return transform$1(css, Object.assign(options, {
        load,
        resolve,
        cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}

export { dirname, load, parse, resolve, transform };
