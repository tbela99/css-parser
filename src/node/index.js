export * from '../lib';
export * from './load';
export * from '../lib/fs';
import { parse as doParse, transform as doTransform } from "../lib";
import { load, resolve } from "../node";
export function parse(iterator, opt = {}) {
    return doParse(iterator, Object.assign(opt, { load, resolve, cwd: opt.cwd ?? process.cwd() }));
}
export function transform(css, options = {}) {
    return doTransform(css, Object.assign(options, { load, resolve, cwd: options.cwd ?? process.cwd() }));
}
