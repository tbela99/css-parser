import {
    Position,
    AstNode,
    AstRuleList,
    NodeTraversalDirection,
    AstAtRule,
    AstRule,
    AstInvalidAtRule,
    AstInvalidRule,
    ParsedBlock,
    AstDeclaration,
    AstInvalidDeclaration
} from "../@types";
import {parse_comment, update} from "./utils";
import {match_pair} from "./utils/match_pair";
import {getType, parseBlock, parseAtRule, parseDeclaration} from "./utils/block";
import {isIdent, isWhiteSpace} from "./utils/syntax";
import {find} from "./utils/find";
import {ltrim} from "./utils/ltrim";

export class Tokenizer {
    #root: AstRuleList;

    constructor(root: AstRuleList) {

        this.#root = root;
    }

    *parse(str: string[]): Generator<{ node?: AstNode, direction?: NodeTraversalDirection, error?: Error }> {

        if (str.length == 0) {

            return;
        }

        let value: string[];
        let name: string;
        let body: string;
        let node: AstNode;
        let index: number | null;
        let info: ParsedBlock;
        let src: string = this.#root.location.src || '';
        let tokenizer: Tokenizer;

        let i: number = 0;
        let chr: string;
        const children = this.#root.children;
        // const css: string[] = Array.isArray(str) ? <string[]>str : [...str];

        const j: number = str.length - 1;
        const position: Position = this.#root.location.end;

        while (i <= j) {

            chr = str[i];

            if (chr === '') {

                break;
            }

            if (isWhiteSpace(chr)) {

                let k: number = i + 1;

                while (k <= j && isWhiteSpace(str[k])) {

                    k++;
                }

                update(position, str.slice(i, k));

                i = k;
                chr = str[k];
            }

            if (i > j) {

                break;
            }

            // parse comment
            if (chr == '/' && str[i + 1] == '*') {

                index = parse_comment(str, i);

                if (index == null) {

                    value = str.slice(i);

                    node = {
                        location: {
                            start: update({...position}, value.slice(0, 1)),
                            end: {...update(position, value)}
                        },
                        type: 'InvalidComment',
                        value: value.join('')
                    }

                    Object.assign(position, node.location.end);

                    yield {node, direction: 'enter'};
                    break;
                }

                value = str.slice(i, index + 1);
                node = {
                    location: {
                        start: update({...position}, value.slice(0, 1)),
                        end: {...update({...position}, value)}
                    },
                    type: 'Comment',
                    value: value.join('')
                }

                Object.assign(position, node.location.end);

                if (node.location.end.column == 0) {

                    node.location.end.column = 1;
                }

                yield {node, direction: 'enter'};

                i += value.length;
                continue;

            } else {

                index = find(str, i + 1, ';{}');

                // console.log({index, chr: str.charAt(i + 1)})

                if (index == null) {

                    // console.debug({'i+1': i + 1, index, str: str.slice(i)}, new Error(`missing chars`));

                    value = str.slice(i);

                    console.error(`Declaration or AtRule block? - "${value}`);

                    update(position, value);
                    break;
                } else if (str[index]== '{') {

                    // parse block
                    info = parseBlock(str, i, index);

                    if (info.type == 'AtRule') {

                        yield* this.#parseAtRule(position, info);
                    } else {

                        yield* this.#parseRule(position, info);
                    }

                } else {

                    const match: string[] = str.slice(i, index + 1);

                    info = parseBlock(str, i, index);

                    if (match[0] == '@') {

                        yield* this.#parseAtRule(position, info)
                    } else {

                        yield* this.#parseDeclaration(position, info);
                    }
                }

                i += info.block.length;

                if (j <= info.block.length) {

                    break;
                }
            }
        }

        //
        if (this.#root.type == 'StyleSheet' && position.column == 0) {

            position.column = 1;
        }
    }

    *#parseAtRule(position: Position, info: ParsedBlock): Generator<{
        node: AstAtRule | AstInvalidAtRule,
        direction: NodeTraversalDirection
    }> {

        let node: AstAtRule | AstInvalidAtRule;
        // @ts-ignore
        const {body, selector, block, type} = info;

        if (!('selector' in info)) {

            const {name, value} = info;

            node = <AstInvalidAtRule | AstAtRule>{
                location: {
                    start: update({...position}, [name[0]]),
                    end: update({...position}, block)
                },
                type,
                value,
                name
            }

            node.location.end.column = Math.max(1, node.location.end.column - 1);

            yield {node, direction: 'enter'};

            return;
        } else {

            const [name, value] = parseAtRule(selector);

            if (!isIdent(name)) {

                node = <AstInvalidAtRule>(body == null ? {
                    location: {
                        start: update({...position}, [name[0]]),
                        end: update({...position}, block)
                    },
                    type: 'InvalidAtRule',
                    value,
                    name
                } : {
                    location: {
                        start: update({...position}, [name[0]]),
                        end: update({...position}, block)
                    },
                    type: 'InvalidAtRule',
                    value: value,
                    name,
                    body
                });

                // node.location.end.column = Math.max(1, node.location.end.column - 1);

                Object.assign(position, node.location.end);

                if (node.location.end.column == 0) {

                    node.location.end.column = 1;
                }

                yield {node, direction: 'enter'};

                return;

            } else {

                // @ts-ignore
                const {type}: 'AtRule' | 'InvalidAtRule' = info

                node = body == null ? {
                    location: {
                        start: update({...position}, [name[0]]),
                        end: update({...position}, block)
                    },
                    type,
                    value: value,
                    name
                } : {
                    location: {
                        start: update({...position}, [name[0]]),
                        end: update({...position}, selector.concat('{'))
                    },
                    type,
                    value,
                    name,
                    children: []
                }

                yield {node, direction: 'enter'};

                if (body.length > 0) {

                    // @ts-ignore
                    const tokenizer: Tokenizer = new Tokenizer(node);

                    // @ts-ignore
                    yield* tokenizer.parse(body);
                }
            }
        }

        const str: string[] = block.slice(selector.length + 1 + (body != null ? body.length : 0));

        if (str.length > 0) {

            update(node.location.end, str);
        }

        Object.assign(position, node.location.end);

        if (node.location.end.column == 0) {

            node.location.end.column = 1;
        }

        if ('children' in node) {

            yield {node, direction: 'exit'};
        }
    }

    * #parseRule(position: Position, info: ParsedBlock): Generator<{
        node?: AstNode,
        direction?: NodeTraversalDirection,
        error?: Error
    }> {

        let node: AstRule;

        // @ts-ignore
        const {body, selector, block} = info;

        // @ts-ignore
        node = {
            location: {
                start: update({...position}, selector[0]),
                end: update({...position}, selector.concat('{'))
            },
            type: 'Rule',
            selector: selector.join('').trimEnd(),
            children: []
        }

        // @ts-ignore
        yield {node, direction: 'enter'};

        if (body != null) {

            // node.location.end.column = Math.max(1, node.location.end.column - 1);

            // @ts-ignore
            const tokenizer: Tokenizer = new Tokenizer(node);
            // @ts-ignore
            yield* tokenizer.parse(body);
        }

        const str: string[] = block.slice(selector.length + 1 + (body != null ? body.length : 0));

        if (str.length > 0) {

            update(node.location.end, str);
        }

        // if (node.location.end.column == 0) {

        // node.location.end.column = Math.max(1, node.location.end.column - 1);
        // }

        Object.assign(position, node.location.end);

        if (node.location.end.column == 0) {

            node.location.end.column = 1;
        }

        if ('children' in node) {

            yield {node, direction: 'exit'};
        }
    }

    * #parseDeclaration(position: Position, info: ParsedBlock): Generator<{
        node: AstDeclaration | AstInvalidDeclaration,
        direction: NodeTraversalDirection
    }> {

        // @ts-ignore
        // const [name, value] = parseDeclaration(info.body);
        // console.debug({info, name, value});

        const {name, value} = info;

        // console.log({info});

        const node: AstDeclaration = {

            type: 'Declaration',
            location: {
                start: update({...position}, name.charAt(0)),
                end: update({...position}, info.body),
                // src
            },
            name,
            value
        }

        Object.assign(position, node.location.end);

        const str: string[] = info.block.slice(info.body.length);

        if (str.length > 0) {

            update(position, str);
        }

        // node.location.start.column = Math.max(1, node.location.start.column - 1);
        // node.location.end.column = Math.max(1, node.location.end.column - 1);

        yield {node, direction: 'enter'};
    }
}