import type {
    AngleToken,
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AtRuleToken,
    AttrToken,
    BinaryExpressionToken,
    ClassSelectorToken,
    ColorToken,
    CommentToken,
    DashedIdentToken,
    ErrorDescription,
    FractionToken,
    FunctionToken,
    HashToken,
    IdentListToken,
    IdentToken,
    InvalidAttrToken,
    InvalidClassSelectorToken,
    LengthToken,
    ListToken,
    LiteralToken,
    Location,
    MatchExpressionToken,
    MediaFeatureNotToken,
    MediaFeatureOnlyToken,
    MediaFeatureToken,
    MediaQueryConditionToken,
    NameSpaceAttributeToken,
    NumberToken,
    PercentageToken,
    Position,
    PseudoElementToken,
    PseudoPageToken,
    RenderOptions,
    RenderResult,
    StringToken,
    Token,
    UrlToken
} from "../../@types/index.d.ts";
import {
    clamp,
    cmyk2hex,
    color2srgbvalues,
    colorMix,
    COLORS_NAMES,
    getAngle,
    hsl2hex,
    hwb2hex,
    lab2hex,
    lch2hex,
    oklab2hex,
    oklch2hex,
    parseRelativeColor,
    reduceHexValue,
    RelativeColorTypes,
    rgb2hex,
    srgb2hexvalues
} from "./color/index.ts";
import {EnumToken, expand} from "../ast/index.ts";
import {SourceMap} from "./sourcemap/index.ts";
import {colorFuncColorSpace, ColorKind, colorsFunc, funcLike, getComponents} from "./color/utils/index.ts";
import {isColor, isNewLine, mathFuncs, pseudoElements} from "../syntax/index.ts";

export function reduceNumber(val: string | number): string {

    val = String(+val);

    if (val === '0') {

        return '0';
    }

    const chr: string = val.charAt(0);

    if (chr == '-') {

        const slice: string = val.slice(0, 2);

        if (slice == '-0') {

            return val.length == 2 ? '0' : '-' + val.slice(2);
        }

    }

    if (chr == '0') {

        return val.slice(1);
    }

    return val;
}

function update(position: Position, str: string) {

    let i: number = 0;

    for (; i < str.length; i++) {

        if (isNewLine(str[i].charCodeAt(0))) {

            position.lin++;
            position.col = 0;
        } else {

            position.col++
        }
    }
}

/**
 * render ast
 * @param data
 * @param options
 */
export function doRender(data: AstNode, options: RenderOptions = {}): RenderResult {

    const minify: boolean = options.minify ?? true;
    const beautify: boolean = options.beautify ?? !minify;
    options = {
        ...(beautify ? {

            indent: ' ',
            newLine: '\n',
        } : {

            indent: '',
            newLine: '',
        }),
        ...(minify ? {
            removeEmpty: true,
            removeComments: true,
            minify: true
        } : {
            removeEmpty: false,
            removeComments: false,

        }), sourcemap: false, convertColor: true, expandNestingRules: false, preserveLicense: false, ...options
    };

    if (options.withParents) {

        // @ts-ignore
        let parent: AstNode = data.parent;

        // @ts-ignore
        while (data.parent != null) {

            // @ts-ignore
            parent = {...data.parent, chi: [{...data}]};

            // @ts-ignore
            parent.parent = data.parent.parent;

            // @ts-ignore
            data = parent;
        }
    }

    const startTime: number = performance.now();
    const errors: ErrorDescription[] = [];
    const sourcemap: SourceMap | null = options.sourcemap ? new SourceMap : null;
    const cache: {
        [key: string]: any
    } = Object.create(null);

    const result: RenderResult = {
        code: renderAstNode(options.expandNestingRules ? expand(data) : data, options, sourcemap, <Position>{

            ind: 0,
            lin: 1,
            col: 1
        }, errors, function reducer(acc: string, curr: Token): string {

            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {

                if (!options.preserveLicense || !(curr as AstComment).val.startsWith('/*!')) {

                    return acc;
                }

                return acc + (curr as AstComment).val;
            }

            return acc + renderToken(curr, options, cache, reducer, errors);
        }, cache), errors, stats: {

            total: `${(performance.now() - startTime).toFixed(2)}ms`
        }
    };

    if (options.output != null) {

        // @ts-ignore
        options.output = options.resolve(options.output, options.cwd).absolute;
    }

    if (sourcemap != null) {

        result.map = sourcemap;

        if (options.sourcemap === 'inline') {

            result.code += `\n/*# sourceMappingURL=data:application/json,${encodeURIComponent(JSON.stringify(result.map))} */`;
        }
    }

    return result;
}

function updateSourceMap(node: AstRuleList | AstComment, options: RenderOptions, cache: {
    [p: string]: any
}, sourcemap: SourceMap, position: Position, str: string) {


    if ([
        EnumToken.RuleNodeType, EnumToken.AtRuleNodeType,
        EnumToken.KeyFrameRuleNodeType, EnumToken.KeyframeAtRuleNodeType
    ].includes(node.typ)) {

        let src: string = (<Location>node.loc)?.src ?? '';
        let output: string = <string>options.output ?? '';

        if (!(src in cache)) {

            // @ts-ignore
            cache[src] = options.resolve(src, options.cwd ?? '').relative;
        }

        if (!(output in cache)) {

            // @ts-ignore
            cache[output] = options.resolve(output, options.cwd).relative;
        }

        // @ts-ignore
        sourcemap.add({src: cache[output], sta: {...position}}, {
            ...<Location>node.loc,
            // @ts-ignore
            src: options.resolve(cache[src], options.cwd).relative
        });
    }

    update(position, str);
}

/**
 * render ast node
 * @param data
 * @param options
 * @param sourcemap
 * @param position
 * @param errors
 * @param reducer
 * @param cache
 * @param level
 * @param indents
 */
function renderAstNode(data: AstNode, options: RenderOptions, sourcemap: SourceMap | null, position: Position, errors: ErrorDescription[], reducer: (acc: string, curr: Token) => string, cache: {
    [key: string]: any
}, level: number = 0, indents: string[] = []): string {

    if (indents.length < level + 1) {

        indents.push((<string>options.indent).repeat(level))
    }

    if (indents.length < level + 2) {

        indents.push((<string>options.indent).repeat(level + 1));
    }

    const indent: string = indents[level];
    const indentSub: string = indents[level + 1];

    switch (data.typ) {

        case EnumToken.DeclarationNodeType:

            return `${(<AstDeclaration>data).nam}:${options.indent}${(options.minify ? filterValues((<AstDeclaration>data).val) : (<AstDeclaration>data).val).reduce(reducer, '')}`;

        case EnumToken.CommentNodeType:
        case EnumToken.CDOCOMMNodeType:

            if ((<AstComment>data).val.startsWith('/*# sourceMappingURL=')) {

                // ignore sourcemap
                return '';
            }

            return !options.removeComments || (options.preserveLicense && (<AstComment>data).val.startsWith('/*!')) ? (<AstComment>data).val : '';

        case EnumToken.StyleSheetNodeType:

            return (<AstRuleStyleSheet>data).chi.reduce((css: string, node: AstRuleList | AstComment) => {

                const str: string = renderAstNode(node, options, sourcemap, {...position}, errors, reducer, cache, level, indents);

                if (str === '') {

                    return css;
                }

                if (css === '') {

                    if (sourcemap != null && node.loc != null) {

                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }

                    return str;
                }

                if (sourcemap != null && node.loc != null) {

                    update(position, <string>options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }

                return `${css}${options.newLine}${str}`;

            }, '');

        case EnumToken.AtRuleNodeType:
        case EnumToken.RuleNodeType:
        case EnumToken.KeyFrameRuleNodeType:
        case EnumToken.KeyframeAtRuleNodeType:

            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframeAtRuleNodeType].includes(data.typ) && !('chi' in data)) {

                return `${indent}@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === '' ? '' : options.indent || ' '}${(<AstAtRule>data).val};`;
            }

            // @ts-ignore
            let children: string = (<AstRule>data).chi.reduce((css: string, node: AstNode) => {

                let str: string;

                if (node.typ == EnumToken.CommentNodeType) {

                    str = options.removeComments && (!options.preserveLicense || !(<AstComment>node).val.startsWith('/*!')) ? '' : (<AstComment>node).val;
                } else if (node.typ == EnumToken.DeclarationNodeType) {

                    if (!(<AstDeclaration>node).nam.startsWith('--') && (<AstDeclaration>node).val.length == 0) {

                        // @ts-ignore
                        errors.push(<ErrorDescription>{
                            action: 'ignore',
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node.loc
                        });
                        return '';
                    }

                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(options.minify ? filterValues((<AstDeclaration>node).val) : (<AstDeclaration>node).val).reduce(reducer, '').trimEnd()};`;
                } else if (node.typ == EnumToken.AtRuleNodeType && !('chi' in node)) {

                    str = `${(<AstAtRule>data).val === '' ? '' : options.indent || ' '}${(<AstAtRule>data).val};`;
                } else {

                    str = renderAstNode(node, options, sourcemap, {...position}, errors, reducer, cache, level + 1, indents);
                }

                if (css === '') {

                    return str;
                }

                if (str === '') {

                    return css;
                }

                return `${css}${options.newLine}${indentSub}${str}`;
            }, '');

            if (options.removeEmpty && children === '') {

                return '';
            }

            if (children.endsWith(';')) {

                children = children.slice(0, -1);
            }

            if ([EnumToken.AtRuleNodeType, EnumToken.KeyframeAtRuleNodeType].includes(data.typ)) {

                return `@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === '' ? '' : options.indent || ' '}${(<AstAtRule>data).val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`
            }

            return (<AstRule>data).sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`;

        case EnumToken.InvalidDeclarationNodeType:
        case EnumToken.InvalidRuleTokenType:
        case EnumToken.InvalidAtRuleTokenType:

            return '';

        default:

            // return renderToken(data as Token, options, cache, reducer, errors);
            throw new Error(`render: unexpected token ${JSON.stringify(data, null, 1)}`);
    }
}

/**
 * render ast token
 * @param token
 * @param options
 * @param cache
 * @param reducer
 * @param errors
 */
export function renderToken(token: Token, options: RenderOptions = {}, cache: {
    [key: string]: any
} = Object.create(null), reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string {

    if (reducer == null) {

        reducer = function (acc: string, curr: Token): string {

            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {

                if (!options.preserveLicense || !(curr as AstComment).val.startsWith('/*!')) {

                    return acc;
                }

                return acc + (curr as AstComment).val;
            }

            return acc + renderToken(curr, options, cache, reducer, errors);
        }
    }

    if (token.typ == EnumToken.FunctionTokenType && colorsFunc.includes((token as FunctionToken).val)) {

        if (isColor(token)) {

            // @ts-ignore
            token.typ = EnumToken.ColorTokenType;

            // @ts-ignore
            if ((token as ColorToken)!.chi[0]!.typ == EnumToken.IdenTokenType && ((token as ColorToken)!.chi[0] as IdentToken).val == 'from') {

                // @ts-ignore
                (<ColorToken>token).cal = 'rel';
            } else { // @ts-ignore
                if ((token as ColorToken).val == 'color-mix' && (token as ColorToken).chi[0].typ == EnumToken.IdenTokenType && ((token as ColorToken).chi[0] as IdentToken).val == 'in') {

                    // @ts-ignore
                    (<ColorToken>token).cal = 'mix';
                } else {

                    // @ts-ignore
                    if ((token as ColorToken).val == 'color') {
                        // @ts-ignore
                        token.cal = 'col';
                    }

                    // @ts-ignore
                    (token as ColorToken).chi = (token as ColorToken).chi!.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
                }
            }
        }
    }

    switch (token.typ) {

        case EnumToken.ListToken:

            return (token as ListToken).chi.reduce((acc: string, curr: Token) => acc + renderToken(curr, options, cache), '');

        case EnumToken.BinaryExpressionTokenType:

            if ([EnumToken.Mul, EnumToken.Div].includes((token as BinaryExpressionToken).op)) {

                let result: string = '';

                if (
                    (token as BinaryExpressionToken).l.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(((token as BinaryExpressionToken).l as BinaryExpressionToken).op)
                ) {

                    result = '(' + renderToken((token as BinaryExpressionToken).l, options, cache) + ')';
                } else {

                    result = renderToken((token as BinaryExpressionToken).l, options, cache);
                }

                result += (token as BinaryExpressionToken).op == EnumToken.Mul ? '*' : '/';

                if (
                    (token as BinaryExpressionToken).r.typ == EnumToken.BinaryExpressionTokenType &&
                    [EnumToken.Add, EnumToken.Sub].includes(((token as BinaryExpressionToken).r as BinaryExpressionToken).op)
                ) {

                    result += '(' + renderToken((token as BinaryExpressionToken).r, options, cache) + ')';
                } else {

                    result += renderToken((token as BinaryExpressionToken).r, options, cache);
                }

                return result;
            }

            return renderToken((token as BinaryExpressionToken).l, options, cache) + ((token as BinaryExpressionToken).op == EnumToken.Add ? ' + ' : ((token as BinaryExpressionToken).op == EnumToken.Sub ? ' - ' : ((token as BinaryExpressionToken).op == EnumToken.Mul ? '*' : '/'))) + renderToken((token as BinaryExpressionToken).r, options, cache);

        case EnumToken.FractionTokenType:

            const fraction: string = renderToken((token as FractionToken).l) + '/' + renderToken((token as FractionToken).r);

            if (+(token as FractionToken).r.val != 0) {

                const value: string = reduceNumber(+(token as FractionToken).l.val / +(token as FractionToken).r.val);

                if (value.length <= fraction.length) {

                    return value;
                }
            }

            return fraction;

        case EnumToken.Add:

            return ' + ';

        case EnumToken.Sub:
            return ' - ';

        case EnumToken.UniversalSelectorTokenType:
        case EnumToken.Mul:
            return '*';

        case EnumToken.Div:
            return '/';

        case EnumToken.ColorTokenType:

            if ((token as ColorToken).kin == ColorKind.LIGHT_DARK || ('chi' in token && !options.convertColor)) {

                return (token as ColorToken).val + '(' + ((token as ColorToken).chi as Token[]).reduce((acc: string, curr: Token) => acc + renderToken(curr, options, cache), '') + ')';
            }

            if (options.convertColor) {

                if ((token as ColorToken).cal == 'mix' && (token as ColorToken).val == 'color-mix') {

                    const children: Token[][] = (<Token[]>(token as ColorToken).chi).reduce((acc: Token[][], t: Token) => {

                        if (t.typ == EnumToken.ColorTokenType) {

                            acc.push([t]);
                        } else {

                            if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType, EnumToken.CommaTokenType].includes(t.typ)) {

                                acc[acc.length - 1].push(t);
                            }
                        }

                        return acc;
                    }, <Token[][]>[[]]);

                    const value: ColorToken | null = colorMix(<IdentToken>children[0][1], <IdentToken>children[0][2], <ColorToken>children[1][0], <PercentageToken>children[1][1], <ColorToken>children[2][0], <PercentageToken>children[2][1]);

                    if (value != null) {

                        token = value;
                    } else if (!(token as ColorToken).chi!.some(t => t.typ == EnumToken.CommaTokenType)) {

                        (token as ColorToken).chi = children.reduce((acc, curr, index) => {

                            if (acc.length > 0) {

                                acc.push({typ: EnumToken.CommaTokenType});
                            }

                            acc.push(...curr);
                            return acc;
                        }, [] as Token[]);
                    }
                }

                if ((token as ColorToken).cal == 'rel' && ['rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'].includes((token as ColorToken).val)) {

                    const chi: Token[] | null = getComponents(token as ColorToken);
                    const offset: number = (token as ColorToken).val == 'color' ? 2 : 1;

                    if (chi != null) {

                        // @ts-ignore
                        const color: ColorToken = chi[1];
                        const components: Record<RelativeColorTypes, Token> = <Record<RelativeColorTypes, Token>>parseRelativeColor((token as ColorToken).val == 'color' ? (<IdentToken>chi[offset]).val : <string>(token as ColorToken).val, color, chi[offset + 1], chi[offset + 2], chi[offset + 3], chi[offset + 4]);

                        if (components != null) {

                            (token as ColorToken).chi = [...((token as ColorToken).val == 'color' ? [chi[offset]] : []), ...Object.values(components)];

                            delete (token as ColorToken).cal;
                        }
                    }
                }

                if ((token as ColorToken).val == 'color') {

                    if ((<IdentToken>(<Token[]>(token as ColorToken).chi)[0]).typ == EnumToken.IdenTokenType && colorFuncColorSpace.includes(((<Token[]>(token as ColorToken).chi)[0] as IdentToken).val.toLowerCase())) {

                        const values = color2srgbvalues(token as ColorToken) as number[];

                        if (Array.isArray(values) && values.every(t => !Number.isNaN(t))) {

                            // @ts-ignore
                            return reduceHexValue(srgb2hexvalues(...values));
                        }
                    }
                }

                if ((token as ColorToken).cal != null) {

                    let slice: boolean = false;

                    if ((token as ColorToken).cal == 'rel') {

                        const last: Token = <Token>(<Token[]>(token as ColorToken).chi).at(-1);

                        if ((last.typ == EnumToken.NumberTokenType && (last as NumberToken).val == '1') || (last.typ == EnumToken.IdenTokenType && (last as IdentToken).val == 'none')) {

                            const prev: Token = <Token>(<Token[]>(token as ColorToken).chi).at(-2);

                            if (prev.typ == EnumToken.LiteralTokenType && (prev as LiteralToken).val == '/') {

                                slice = true;
                            }
                        }
                    }

                    return clamp(token as ColorToken).val + '(' + (slice ? (<Token[]>(token as ColorToken).chi).slice(0, -2) : <Token[]>(token as ColorToken).chi).reduce((acc: string, curr: Token): string => {

                        const val: string = renderToken(curr, options, cache);

                        if (curr.typ == EnumToken.LiteralTokenType && (curr as LiteralToken).val == '/') {

                            return acc.trimEnd() + '/';
                        }

                        if (curr.typ == EnumToken.CommaTokenType) {

                            return acc.trimEnd() + ',';
                        }

                        if (curr.typ == EnumToken.WhitespaceTokenType) {

                            const v: string = acc.at(-1) as string;

                            if (v == ' ' || v == ',' || v == '/') {

                                return acc.trimEnd();
                            }

                            return acc.trimEnd() + ' ';
                        }

                        if (acc.length > 0) {

                            return acc + (['/', ',', ' '].includes(<string>acc.at(-1)) ? '' : ' ') + val;
                        }

                        return val;
                    }, '') + ')';
                }

                if ((token as ColorToken).kin == ColorKind.LIT && (token as ColorToken).val.localeCompare('currentcolor', undefined, {sensitivity: 'base'}) == 0) {

                    return 'currentcolor';
                }

                clamp(token as ColorToken);

                if (Array.isArray((token as ColorToken).chi) && (token as ColorToken).chi!.some((t: Token): boolean => t.typ == EnumToken.FunctionTokenType || (t.typ == EnumToken.ColorTokenType && Array.isArray((t as ColorToken).chi)))) {

                    const replaceSemiColon: boolean = /^((rgba?)|(hsla?)|(hwb)|((ok)?lab)|((ok)?lch))$/i.test((token as ColorToken).val);

                    return ((token as ColorToken).val.endsWith('a') ? (token as ColorToken).val.slice(0, -1) : (token as ColorToken).val) + '(' + (token as ColorToken).chi!.reduce((acc: string, curr: Token, index: number, array: Token[]): string => {

                        if (curr.typ == EnumToken.Literal && (curr as LiteralToken).val == '/') {

                            return acc.trimEnd() + '/';
                        }

                        if (curr.typ == EnumToken.CommaTokenType) {

                            return acc.trimEnd() + (replaceSemiColon ? ' ' : ',');
                        }

                        if (curr.typ == EnumToken.WhitespaceTokenType) {

                            return /[,\/\s]/.test(acc.at(-1) as string) ? acc.trimEnd() : acc.trimEnd() + ' ';
                        }

                        return acc + renderToken(curr, options, cache)
                    }, '') + ')';
                }

                let value: string | null = (token as ColorToken).kin == ColorKind.HEX ? (token as ColorToken).val.toLowerCase() : ((token as ColorToken).kin == ColorKind.LIT ? COLORS_NAMES[(token as ColorToken).val.toLowerCase()] : '');

                if ((token as ColorToken).val == 'rgb' || (token as ColorToken).val == 'rgba') {

                    value = rgb2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'hsl' || (token as ColorToken).val == 'hsla') {

                    value = hsl2hex(token as ColorToken);

                } else if ((token as ColorToken).val == 'hwb') {

                    value = hwb2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'device-cmyk') {

                    value = cmyk2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'oklab') {

                    value = oklab2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'oklch') {

                    value = oklch2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'lab') {

                    value = lab2hex(token as ColorToken);
                } else if ((token as ColorToken).val == 'lch') {

                    value = lch2hex(token as ColorToken);
                }

                if (value !== '' && value != null) {

                    return reduceHexValue(value);
                }
            }


            if ([ColorKind.HEX, ColorKind.LIT, ColorKind.SYS, ColorKind.DPSYS].includes((token as ColorToken).kin)) {

                return (token as ColorToken).val;
            }

            if (Array.isArray((token as ColorToken).chi)) {

                return ((token as ColorToken).val.endsWith('a') ? (token as ColorToken).val.slice(0, -1) : (token as ColorToken).val) + '(' + (token as ColorToken).chi!.reduce((acc: string, curr: Token) => acc + (acc.length > 0 && !(acc.endsWith('/') || curr.typ == EnumToken.LiteralTokenType) ? ' ' : '') + renderToken(curr, options, cache), '') + ')';
            }

        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.UrlFunctionTokenType:
        case EnumToken.ImageFunctionTokenType:
        case EnumToken.TimingFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:
        case EnumToken.TimelineFunctionTokenType:
        case EnumToken.GridTemplateFuncTokenType:

            if (
                token.typ == EnumToken.FunctionTokenType &&
                mathFuncs.includes((token as FunctionToken).val) &&
                (token as FunctionToken).chi.length == 1 &&
                ![EnumToken.BinaryExpressionTokenType, EnumToken.FractionTokenType, EnumToken.IdenTokenType].includes((token as FunctionToken).chi[0].typ) &&
                // @ts-ignore
                (<FractionToken>(<NumberToken>(token as FunctionToken).chi[0] as NumberToken).val as FractionToken)?.typ != EnumToken.FractionTokenType) {

                return (token as FunctionToken).val + '(' + (token as FunctionToken).chi.reduce((acc: string, curr: Token) => acc + renderToken(curr, options, cache, reducer), '') + ')'
            }

            return (/* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/ (token as FunctionToken).val ?? '') + '(' + (token as FunctionToken).chi.reduce(reducer, '') + ')';

        case EnumToken.MatchExpressionTokenType:
            return renderToken((token as MatchExpressionToken).l as Token, options, cache, reducer, errors) +
                renderToken((token as MatchExpressionToken).op, options, cache, reducer, errors) +
                renderToken((token as MatchExpressionToken).r, options, cache, reducer, errors) +
                ((token as MatchExpressionToken).attr ? ' ' + (token as MatchExpressionToken).attr : '');

        case EnumToken.NameSpaceAttributeTokenType:

            return ((token as NameSpaceAttributeToken).l == null ? '' : renderToken((token as NameSpaceAttributeToken).l as Token, options, cache, reducer, errors)) + '|' +
                renderToken((token as NameSpaceAttributeToken).r, options, cache, reducer, errors);

        case EnumToken.BlockStartTokenType:
            return '{';

        case EnumToken.BlockEndTokenType:
            return '}';

        case EnumToken.StartParensTokenType:
            return '(';

        case EnumToken.DelimTokenType:
        case EnumToken.EqualMatchTokenType:

            return '=';

        case EnumToken.IncludeMatchTokenType:
            return '~=';

        case EnumToken.DashMatchTokenType:
            return '|=';

        case EnumToken.StartMatchTokenType:
            return '^=';

        case EnumToken.EndMatchTokenType:
            return '$=';

        case EnumToken.ContainMatchTokenType:
            return '*=';

        case EnumToken.LtTokenType:
            return '<';

        case EnumToken.LteTokenType:
            return '<=';

        case EnumToken.SubsequentSiblingCombinatorTokenType:

            return '~';

        case EnumToken.NextSiblingCombinatorTokenType:

            return '+';

        case EnumToken.GtTokenType:
        case EnumToken.ChildCombinatorTokenType:
            return '>';

        case EnumToken.GteTokenType:
            return '>=';

        case EnumToken.ColumnCombinatorTokenType:
            return '||';

        case EnumToken.EndParensTokenType:
            return ')';

        case EnumToken.AttrStartTokenType:
            return '[';

        case EnumToken.AttrEndTokenType:
            return ']';

        case EnumToken.DescendantCombinatorTokenType:
        case EnumToken.WhitespaceTokenType:

            return ' ';

        case EnumToken.ColonTokenType:
            return ':';

        case EnumToken.SemiColonTokenType:
            return ';';

        case EnumToken.CommaTokenType:
            return ',';

        case EnumToken.ImportantTokenType:
            return '!important';

        case EnumToken.AttrTokenType:
        case EnumToken.IdenListTokenType:

            return '[' + (<AttrToken>(token as AttrToken | IdentListToken)).chi.reduce(reducer, '') + ']';

        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:

            let val: string = (<FractionToken>(token as LengthToken).val).typ == EnumToken.FractionTokenType ? renderToken(<FractionToken>(token as LengthToken).val, options, cache) : reduceNumber(<string | number>(token as LengthToken).val);
            let unit: string = (token as LengthToken).unit;

            if (token.typ == EnumToken.AngleTokenType && !val.includes('/')) {

                const angle: number = getAngle(<AngleToken>token);

                let v: string;
                let value: string = val + unit;

                for (const u of ['turn', 'deg', 'rad', 'grad']) {

                    if ((token as AngleToken).unit == u) {

                        continue;
                    }

                    switch (u) {

                        case 'turn':

                            v = reduceNumber(angle);

                            if (v.length + 4 < value.length) {

                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case 'deg':

                            v = reduceNumber(angle * 360);

                            if (v.length + 3 < value.length) {

                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case 'rad':

                            v = reduceNumber(angle * (2 * Math.PI));

                            if (v.length + 3 < value.length) {

                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;

                        case 'grad':

                            v = reduceNumber(angle * 400);

                            if (v.length + 4 < value.length) {

                                val = v;
                                unit = u;
                                value = v + u;
                            }

                            break;
                    }
                }
            }

            if (val === '0') {

                if (token.typ == EnumToken.TimeTokenType) {

                    return '0s';
                }

                if (token.typ == EnumToken.FrequencyTokenType) {

                    return '0Hz';
                }

                // @ts-ignore
                if (token.typ == EnumToken.ResolutionTokenType) {

                    return '0x';
                }

                return '0';
            }

            if (token.typ == EnumToken.TimeTokenType) {

                if (unit == 'ms') {

                    // @ts-ignore
                    const v: string = reduceNumber(val / 1000);

                    if (v.length + 1 <= val.length) {

                        return v + 's';
                    }

                    return val + 'ms';
                }

                return val + 's';
            }

            if (token.typ == EnumToken.ResolutionTokenType && unit == 'dppx') {

                unit = 'x';
            }

            return val.includes('/') ? val.replace('/', unit + '/') : val + unit;

        case EnumToken.FlexTokenType:
        case EnumToken.PercentageTokenType:

            const uni: string = token.typ == EnumToken.PercentageTokenType ? '%' : 'fr';

            const perc: string = (<FractionToken>(token as PercentageToken).val).typ == EnumToken.FractionTokenType ? renderToken(<FractionToken>(token as PercentageToken).val, options, cache) : reduceNumber(<string>(token as PercentageToken).val);
            return options.minify && perc == '0' ? '0' : (perc.includes('/') ? perc.replace('/', uni + '/') : perc + uni);

        case EnumToken.NumberTokenType:

            return (<FractionToken>(token as NumberToken).val).typ == EnumToken.FractionTokenType ? renderToken(<FractionToken>(token as NumberToken).val, options, cache) : reduceNumber(<string>(token as NumberToken).val);

        case EnumToken.CommentTokenType:

            if (options.removeComments && (!options.preserveLicense || !(token as CommentToken).val.startsWith('/*!'))) {

                return '';
            }

        case EnumToken.PseudoClassTokenType:
        case EnumToken.PseudoElementTokenType:

            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            if (token.typ == EnumToken.PseudoElementTokenType && pseudoElements.includes((token as PseudoElementToken).val.slice(1))) {

                return (token as PseudoElementToken).val.slice(1);
            }

        case EnumToken.UrlTokenTokenType:

            if (token.typ == EnumToken.UrlTokenTokenType) {

                if (options.output != null) {

                    if (!('original' in token)) {

                        // do not modify original token
                        token = {...token};
                        Object.defineProperty(token, 'original', {
                            enumerable: false,
                            writable: false,
                            value: (token as UrlToken).val
                        })
                    }

                    // @ts-ignore
                    if (!(token.original in cache)) {

                        let output: string = <string>options.output ?? '';
                        const key = output + 'abs';

                        if (!(key in cache)) {

                            // @ts-ignore
                            cache[key] = options.dirname(options.resolve(output, options.cwd).absolute);
                        }

                        // @ts-ignore
                        cache[token.original] = options.resolve(token.original, cache[key]).relative;
                    }

                    // @ts-ignore
                    token.val = cache[token.original];
                }
            }

        case EnumToken.HashTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.AtRuleTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.DashedIdenTokenType:
        case EnumToken.PseudoPageTokenType:
        case EnumToken.ClassSelectorTokenType:

            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */(token as ClassSelectorToken | StringToken | LiteralToken | AtRuleToken | HashToken | DashedIdentToken | PseudoPageToken | IdentToken).val;

        case EnumToken.NestingSelectorTokenType:

            return '&';

        case EnumToken.InvalidAttrTokenType:

            return '[' + (<InvalidAttrToken>token).chi.reduce((acc: string, curr: Token): string => acc + renderToken(curr, options, cache), '');

        case EnumToken.InvalidClassSelectorTokenType:

            return (token as InvalidClassSelectorToken).val;

        case EnumToken.DeclarationNodeType:

            return (<AstDeclaration>token).nam + ':' + (options.minify ? filterValues((<AstDeclaration>token).val) : (<AstDeclaration>token).val).reduce((acc: string, curr: Token): string => acc + renderToken(curr, options, cache), '');

        case EnumToken.MediaQueryConditionTokenType:

            return renderToken((token as MediaQueryConditionToken).l, options, cache, reducer, errors) + renderToken((token as MediaQueryConditionToken).op, options, cache, reducer, errors) + (token as MediaQueryConditionToken).r.reduce((acc: string, curr: Token): string => acc + renderToken(curr, options, cache), '');

        case EnumToken.MediaFeatureTokenType:

            return (token as MediaFeatureToken).val;

        case EnumToken.MediaFeatureNotTokenType:

            return 'not ' + renderToken((token as MediaFeatureNotToken).val, options, cache, reducer, errors);

        case EnumToken.MediaFeatureOnlyTokenType:
            return 'only ' + renderToken((token as MediaFeatureOnlyToken).val, options, cache, reducer, errors);

        case EnumToken.MediaFeatureAndTokenType:
            return 'and';

        case EnumToken.MediaFeatureOrTokenType:
            return 'or';
    }

    errors?.push({action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}`});
    return '';
}

export function filterValues(values: Token[]): Token[] {

    let i: number = 0;

    for (; i < values.length; i++) {

        if (values[i].typ == EnumToken.ImportantTokenType && values[i - 1]?.typ == EnumToken.WhitespaceTokenType) {

            values.splice(i - 1, 1);
        } else if (funcLike.includes(values[i].typ) && !['var', 'calc'].includes((values[i] as FunctionToken).val) && values[i + 1]?.typ == EnumToken.WhitespaceTokenType) {

            values.splice(i + 1, 1);
        }
    }

    return values;
}