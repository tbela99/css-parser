import {
    AngleToken,
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstRuleStyleSheet,
    AttrToken,
    BinaryExpressionToken,
    ColorToken,
    ErrorDescription,
    Location,
    Position,
    RenderOptions,
    RenderResult,
    Token
} from "../../@types";
import {cmyk2hex, COLORS_NAMES, getAngle, hsl2Hex, hwb2hex, NAMES_COLORS, rgb2Hex} from "./utils";
import {EnumToken, expand, NodeType} from "../ast";
import {SourceMap} from "./sourcemap";
import {isNewLine} from "../parser";

export const colorsFunc: string[] = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'];

export function reduceNumber(val: string | number) {

    val = (+val).toString();

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

    let i = 0;

    for (; i < str.length; i++) {

        if (isNewLine(str[i].charCodeAt(0))) {

            position.lin++;
            position.col = 0;
        } else {

            position.col++
        }
    }
}

export function doRender(data: AstNode, options: RenderOptions = {}): RenderResult {

    options = {
        ...(options.minify ?? true ? {
            indent: '',
            newLine: '',
            removeComments: true
        } : {
            indent: ' ',
            newLine: '\n',
            compress: false,
            removeComments: false,

        }), sourcemap: false, colorConvert: true, expandNestingRules: false, preserveLicense: false, ...options
    };

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

                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {

                    return acc;
                }

                return acc + curr.val;
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

        result.map = sourcemap.toJSON();
        // @ts-ignore
        // result.map.sources = result.map.sources?.map(s => <string>options?.resolve(s, <string>options?.cwd)?.relative)
    }

    return result;
}

function updateSourceMap(node: AstRuleList | AstComment, options: RenderOptions, cache: {
    [p: string]: any
}, sourcemap: SourceMap, position: Position, str: string) {
    if ([NodeType.RuleNodeType, NodeType.AtRuleNodeType].includes(node.typ)) {

        let src: string = (<Location>node.loc)?.src ?? '';
        let output: string = <string>options.output ?? '';

        if (src !== '') {

            if (!(src in cache)) {

                // @ts-ignore
                cache[src] = options.resolve(src, options.cwd ?? '').relative;
            }
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

// @ts-ignore
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

        case NodeType.DeclarationNodeType:

            return `${(<AstDeclaration>data).nam}:${options.indent}${(<AstDeclaration>data).val.reduce(reducer, '')}`;

        case NodeType.CommentNodeType:
        case NodeType.CDOCOMMNodeType:

            return !options.removeComments || (options.preserveLicense && (<AstComment>data).val.startsWith('/*!')) ? (<AstComment>data).val : '';

        case NodeType.StyleSheetNodeType:

            return (<AstRuleStyleSheet>data).chi.reduce((css: string, node) => {

                const str: string = renderAstNode(node, options, sourcemap, {...position}, errors, reducer, cache, level, indents);

                if (str === '') {

                    return css;
                }

                if (css === '') {

                    if (sourcemap != null) {

                        updateSourceMap(node, options, cache, sourcemap, position, str);
                    }

                    return str;
                }

                if (sourcemap != null) {

                    update(position, <string>options.newLine);
                    updateSourceMap(node, options, cache, sourcemap, position, str);
                }

                return `${css}${options.newLine}${str}`;

            }, '');

        case NodeType.AtRuleNodeType:
        case NodeType.RuleNodeType:

            if (data.typ == NodeType.AtRuleNodeType && !('chi' in data)) {

                return `${indent}@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === '' ? '' : options.indent || ' '}${(<AstAtRule>data).val};`;
            }

            // @ts-ignore
            let children: string = (<AstRule>data).chi.reduce((css: string, node: AstNode) => {

                let str: string;

                if (node.typ == NodeType.CommentNodeType) {

                    str = options.removeComments && (!options.preserveLicense || !(<AstComment>node).val.startsWith('/*!')) ? '' : (<AstComment>node).val;
                } else if (node.typ == NodeType.DeclarationNodeType) {

                    if ((<AstDeclaration>node).val.length == 0) {

                        // @ts-ignore
                        errors.push(<ErrorDescription>{
                            action: 'ignore',
                            message: `render: invalid declaration ${JSON.stringify(node)}`,
                            location: node.loc
                        });
                        return '';
                    }

                    str = `${(<AstDeclaration>node).nam}:${options.indent}${(<AstDeclaration>node).val.reduce(reducer, '').trimEnd()};`;
                } else if (node.typ == NodeType.AtRuleNodeType && !('chi' in node)) {

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

            if (children.endsWith(';')) {

                children = children.slice(0, -1);
            }

            if (data.typ == NodeType.AtRuleNodeType) {

                return `@${(<AstAtRule>data).nam}${(<AstAtRule>data).val === '' ? '' : options.indent || ' '}${(<AstAtRule>data).val}${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`
            }

            return (<AstRule>data).sel + `${options.indent}{${options.newLine}` + (children === '' ? '' : indentSub + children + options.newLine) + indent + `}`
    }

    return '';
}

export function renderToken(token: Token, options: RenderOptions = {}, cache: {
    [key: string]: any
} = Object.create(null), reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string {

    if (reducer == null) {
        reducer = function (acc: string, curr: Token): string {

            if (curr.typ == EnumToken.CommentTokenType && options.removeComments) {

                if (!options.preserveLicense || !curr.val.startsWith('/*!')) {

                    return acc;
                }

                return acc + curr.val;
            }

            return acc + renderToken(curr, options, cache, reducer, errors);
        }
    }

    switch (token.typ) {

        case EnumToken.BinaryExpressionTokenType:

            return renderToken(token.l, options, cache) + (token.op == EnumToken.Add ? ' + ' : (token.op == EnumToken.Sub ? ' - ' : (token.op == EnumToken.Mul ? '*' : '/'))) + renderToken(token.r, options, cache);

        case EnumToken.Add:

            return ' + ';

        case EnumToken.Sub:
            return ' - ';

        case EnumToken.Mul:
            return '*';

        case EnumToken.Div:
            return '/';

        case EnumToken.ColorTokenType:

            if (options.colorConvert) {

                if (token.kin == 'lit' && token.val.toLowerCase() == 'currentcolor') {

                    return 'currentcolor';
                }

                let value: string = token.kin == 'hex' ? token.val.toLowerCase() : (token.kin == 'lit' ? COLORS_NAMES[token.val.toLowerCase()] : '');

                if (token.val == 'rgb' || token.val == 'rgba') {

                    value = rgb2Hex(token);
                } else if (token.val == 'hsl' || token.val == 'hsla') {

                    value = hsl2Hex(token);
                } else if (token.val == 'hwb') {

                    value = hwb2hex(token);
                } else if (token.val == 'device-cmyk') {

                    value = cmyk2hex(token);
                }

                const named_color: string = NAMES_COLORS[value];

                if (value !== '') {

                    if (value.length == 7) {

                        if (value[1] == value[2] &&
                            value[3] == value[4] &&
                            value[5] == value[6]) {

                            value = `#${value[1]}${value[3]}${value[5]}`;
                        }
                    } else if (value.length == 9) {

                        if (value[1] == value[2] &&
                            value[3] == value[4] &&
                            value[5] == value[6] &&
                            value[7] == value[8]) {

                            value = `#${value[1]}${value[3]}${value[5]}${value[7]}`;
                        }
                    }

                    return named_color != null && named_color.length <= value.length ? named_color : value;
                }
            }

            if ((<ColorToken>token).kin == 'hex' || (<ColorToken>token).kin == 'lit') {

                return token.val;
            }

        case EnumToken.ParensTokenType:
        case EnumToken.FunctionTokenType:
        case EnumToken.UrlFunctionTokenType:
        case EnumToken.PseudoClassFuncTokenType:

            // @ts-ignore
            return (/* options.minify && 'Pseudo-class-func' == token.typ && token.val.slice(0, 2) == '::' ? token.val.slice(1) :*/ token.val ?? '') + '(' + token.chi.reduce(reducer, '') + ')';

        case EnumToken.StartParensTokenType:

            return '(';

        case EnumToken.IncludesTokenType:
            return '~=';

        case EnumToken.DashMatchTokenType:
            return '|=';

        case EnumToken.LtTokenType:
            return '<';

        case EnumToken.LteTokenType:
            return '<=';

        case EnumToken.GtTokenType:
            return '>';

        case EnumToken.GteTokenType:
            return '>=';

        case EnumToken.EndParensTokenType:
            return ')';

        case EnumToken.AttrStartTokenType:
            return '[';

        case EnumToken.AttrEndTokenType:
            return ']';

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

            return '[' + (<AttrToken>token).chi.reduce(reducer, '') + ']';

        case EnumToken.TimeTokenType:
        case EnumToken.AngleTokenType:
        case EnumToken.LengthTokenType:
        case EnumToken.DimensionTokenType:
        case EnumToken.FrequencyTokenType:
        case EnumToken.ResolutionTokenType:

            if ((<BinaryExpressionToken>token.val).typ == EnumToken.BinaryExpressionTokenType) {

                const result: string = renderToken(<BinaryExpressionToken>token.val, options, cache);

                if (!('unit' in token)) {

                    return result;
                }

                if (!result.includes(' ')) {

                    return result + token.unit;
                }

                return `(${result})*1${token.unit}`;
            }

            let val: string = reduceNumber(<string | number>token.val);
            let unit: string = token.unit;

            if (token.typ == EnumToken.AngleTokenType) {

                const angle: number = getAngle(<AngleToken>token);

                let v: string;
                let value = val + unit;

                for (const u of ['turn', 'deg', 'rad', 'grad']) {

                    if (token.unit == u) {

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

            return val + unit;

        case EnumToken.PercentageTokenType:

            const perc: string = reduceNumber(token.val);
            return options.minify && perc == '0' ? '0' : perc + '%';

        case EnumToken.NumberTokenType:

            return reduceNumber(token.val);

        case EnumToken.CommentTokenType:

            if (options.removeComments && (!options.preserveLicense || !token.val.startsWith('/*!'))) {

                return '';
            }

        case EnumToken.UrlTokenTokenType:

            if (token.typ == EnumToken.UrlTokenTokenType) {

                if (options.output != null) {

                    if (!('original' in token)) {

                        // do not modify original token
                        token = {...token};
                        Object.defineProperty(token, 'original', {enumerable: false, writable: false, value: token.val})
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

        case EnumToken.AtRuleTokenType:

        case EnumToken.HashTokenType:
        case EnumToken.PseudoClassTokenType:
        case EnumToken.LiteralTokenType:
        case EnumToken.StringTokenType:
        case EnumToken.IdenTokenType:
        case EnumToken.DelimTokenType:
            return /* options.minify && 'Pseudo-class' == token.typ && '::' == token.val.slice(0, 2) ? token.val.slice(1) :  */token.val;
    }

    errors?.push({action: 'ignore', message: `render: unexpected token ${JSON.stringify(token, null, 1)}`});

    return '';
}