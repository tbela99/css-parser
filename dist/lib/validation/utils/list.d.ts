import { EnumToken } from "../../ast/types.ts";
import type { Token } from "../../../@types/index.d.ts";
export declare function stripCommaToken(tokenList: Token[]): Token[] | null;
export declare function splitTokenList(tokenList: Token[], split?: EnumToken[], includeSplitToken?: boolean): Token[][];
