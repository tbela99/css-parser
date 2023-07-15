import {ParseResult, ParserOptions, TransformOptions, TransformResult} from "../@types";

export * from '../lib';
export * from './load';
export * from '../lib/fs';

import {parse as doParse, transform as doTransform} from "../lib";
import {load, resolve} from "../node";

export function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    Object.assign(opt, {load, resolve, cwd: opt.cwd ?? process.cwd()});

    return doParse(iterator, opt);
}

export function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    Object.assign(options, {load, resolve, cwd: options.cwd ?? process.cwd()});

    return doTransform(css, options);
}