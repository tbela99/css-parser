import {ParseResult, ParserOptions, TransformOptions, TransformResult} from "../@types";

export * from '../lib';
export * from './load';
export * from '../lib/fs';

import {parse as doParse, transform as doTransform} from "../lib";
import {dirname, load, resolve} from "./index";

export function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(iterator, Object.assign(opt, {
        load,
        resolve,
        cwd: opt.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}

export function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    return doTransform(css, Object.assign(options, {
        load,
        resolve,
        cwd: options.cwd ?? self.location.pathname.endsWith('/') ? self.location.pathname : dirname(self.location.pathname)
    }));
}