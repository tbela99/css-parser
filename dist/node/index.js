import { parse as parse$1 } from '../lib/parser/parse.js';
import '../lib/renderer/utils/color.js';
import { transform as transform$1 } from '../lib/transform.js';
import { load } from './load.js';
import { resolve } from '../lib/fs/resolve.js';
export { dirname, matchUrl } from '../lib/fs/resolve.js';

function parse(iterator, opt = {}) {
    Object.assign(opt, { load, resolve, cwd: opt.cwd ?? process.cwd() });
    return parse$1(iterator, opt);
}
function transform(css, options = {}) {
    Object.assign(options, { load, resolve, cwd: options.cwd ?? process.cwd() });
    return transform$1(css, options);
}

export { load, parse, resolve, transform };
