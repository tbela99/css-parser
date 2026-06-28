import type { ColorToken, Token } from "../../../../@types/index.ts";
import { ColorType } from "../../../ast/types.ts";
export declare function makeColor(kind: ColorType, components: Token[], alpha?: Token): ColorToken | null;
