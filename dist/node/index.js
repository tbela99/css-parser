import { parse as parse$1 } from '../lib/parser/parse.js';
export { parseString, urlTokenMatcher } from '../lib/parser/parse.js';
import '../lib/renderer/utils/color.js';
import { transform as transform$1 } from '../lib/transform.js';
import { load } from './load.js';
import { resolve } from '../lib/fs/resolve.js';
export { dirname, matchUrl } from '../lib/fs/resolve.js';

function parse(iterator, opt = {}) {
    return parse$1(iterator, Object.assign(opt, { load, resolve, cwd: opt.cwd ?? process.cwd() }));
}
function transform(css, options = {}) {
    return transform$1(css, Object.assign(options, { load, resolve, cwd: options.cwd ?? process.cwd() }));
}

export { load, parse, resolve, transform };
