import {ParseResult, ParserOptions, TransformOptions, TransformResult} from "../@types";

export * from '../lib';
export * from './load';
export * from './resolve';

export const matchUrl = /^(https?:)?\/\//;

import {parse as doParse, transform as doTransform} from "../lib";
import {load, resolve} from "../node";

export function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    if (opt.processImport) {

        Object.assign(opt, {load, resolve});
    }

    return doParse(iterator, opt);
}

export function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    if (options.processImport) {

        Object.assign(options, {load, resolve});
    }

    return doTransform(css, options);
}