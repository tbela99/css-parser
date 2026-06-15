import type { Token, AstRule, AstAtRule, AstKeyFrameRule, AstKeyframesAtRule, AstStyleSheet, ParserOptions, ErrorDescription, AstInvalidRule, AtRuleToken } from "../../../@types/index.d.ts";
/**
 * parse selector
 */
export declare function parseSelector(tokens: Token[], context: AtRuleToken | AstRule | AstAtRule | AstKeyFrameRule | AstKeyframesAtRule | AstStyleSheet | null, options: ParserOptions, errors: ErrorDescription[]): AstRule | AstInvalidRule | AstKeyFrameRule;
