import {ParseResult, ParserOptions, TransformOptions, TransformResult} from "../@types";

export * from '../lib';
export * from './load';
export * from '../lib/fs';

import {parse as doParse, transform as doTransform} from "../lib";
import {load, resolve} from "../node";

export async function parse(iterator: string, opt: ParserOptions = {}): Promise<ParseResult> {

    return doParse(iterator, Object.assign(opt, {load, resolve, cwd: opt.cwd ?? process.cwd()}));
}

export async function transform(css: string, options: TransformOptions = {}): Promise<TransformResult> {

    return doTransform(css, Object.assign(options, {load, resolve, cwd: options.cwd ?? process.cwd()}));
}