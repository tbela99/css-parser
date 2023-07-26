export * from '../lib';
export * from './load';
export * from '../lib/fs';
import { parse as doParse, transform as doTransform } from "../lib";
import { dirname, load, resolve } from "./index";
export function parse(iterator, opt = {}) {
    return doParse(iterator, Object.assign(opt, {
        load,
        resolve,
        cwd: opt.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}
export function transform(css, options = {}) {
    return doTransform(css, Object.assign(options, {
        load,
        resolve,
        cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}
