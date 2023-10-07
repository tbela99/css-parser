export { EnumToken, NodeType } from '../lib/ast/types.js';
export { combinators, hasDeclaration, minify, reduceSelector, splitRule } from '../lib/ast/minify.js';
export { walk, walkValues } from '../lib/ast/walk.js';
export { expand, replaceCompound } from '../lib/ast/features/expand.js';
import { doRender } from '../lib/renderer/render.js';
export { colorsFunc, reduceNumber, renderToken } from '../lib/renderer/render.js';
import { doParse } from '../lib/parser/parse.js';
export { parseString, urlTokenMatcher } from '../lib/parser/parse.js';
export { tokenize } from '../lib/parser/tokenize.js';
export { isAngle, isAtKeyword, isColor, isDigit, isDimension, isFrequency, isFunction, isHash, isHexColor, isIdent, isIdentCodepoint, isIdentStart, isLength, isNewLine, isNonPrintable, isNumber, isPercentage, isPseudo, isResolution, isTime, isWhiteSpace, parseDimension } from '../lib/parser/utils/syntax.js';
export { getConfig } from '../lib/parser/utils/config.js';
export { funcList, matchType } from '../lib/parser/utils/type.js';
import { load } from './load.js';
import { resolve, dirname } from '../lib/fs/resolve.js';
export { matchUrl } from '../lib/fs/resolve.js';

function render(data, options = {}) {
    return doRender(data, Object.assign(options, { load, resolve, dirname, cwd: options.cwd ?? process.cwd() }));
}
async function parse(iterator, opt = {}) {
    return doParse(iterator, Object.assign(opt, { load, resolve, dirname, cwd: opt.cwd ?? process.cwd() }));
}
async function transform(css, options = {}) {
    options = { minify: true, removeEmpty: true, removeCharset: true, ...options };
    const startTime = performance.now();
    return parse(css, options).then((parseResult) => {
        const rendered = render(parseResult.ast, options);
        return {
            ...parseResult,
            ...rendered,
            errors: parseResult.errors.concat(rendered.errors),
            stats: {
                bytesOut: rendered.code.length,
                ...parseResult.stats,
                render: rendered.stats.total,
                total: `${(performance.now() - startTime).toFixed(2)}ms`
            }
        };
    });
}

export { dirname, doParse, doRender, load, parse, render, resolve, transform };
