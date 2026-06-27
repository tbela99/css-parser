import type { ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
export declare function parseMediaqueryList(stream: Token[], options: ParserOptions): {
    errors: ErrorDescription[];
    success: boolean;
};
