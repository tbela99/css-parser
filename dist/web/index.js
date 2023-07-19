import { parse as parse$1 } from '../lib/parser/parse.js';
export { deduplicate, deduplicateRule, hasDeclaration, reduceSelector } from '../lib/parser/deduplicate.js';
export { render, renderToken } from '../lib/renderer/render.js';
export { walk } from '../lib/walker/walk.js';
import { transform as transform$1 } from '../lib/transform.js';
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
