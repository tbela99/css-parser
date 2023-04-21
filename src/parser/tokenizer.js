import { parse_comment, update } from "./utils";
import { parseBlock, parseAtRule, parseDeclaration } from "./utils/block";
import { isIdent, isWhiteSpace } from "./utils/syntax";
import { find } from "./utils/find";
export class Tokenizer {
    #root;
    constructor(root) {
        this.#root = root;
    }
    *parse(str) {
        if (str === '') {
            return;
        }
        let value;
        let name;
        let body;
        let node;
        let index;
        let info;
        let src = this.#root.location.src || '';
        let tokenizer;
        let i = 0;
        const css = Array.isArray(str) ? str : [...str];
        const j = css.length - 1;
        const position = this.#root.location.end;
        while (i <= j) {
            if (isWhiteSpace(css[i])) {
                let whitespace = '';
                do {
                    whitespace += css[i++];
                } while (i <= j && isWhiteSpace(css[i]));
                update(position, whitespace);
            }
            if (i > j) {
                break;
            }
            // parse comment
            if (css[i] == '/' && css[i + 1] == '*') {
                index = parse_comment(css, i);
                if (index == null) {
                    value = css.slice(i);
                    node = {
                        location: {
                            start: update({ ...position }, value[0]),
                            end: { ...update(position, value) }
                        },
                        type: 'InvalidComment',
                        value: value.join('')
                    };
                    Object.assign(position, node.location.end);
                    yield { node, direction: 'enter' };
                    return;
                }
                value = css.slice(i, index + 1);
                node = {
                    location: {
                        start: update({ ...position }, value[0]),
                        end: { ...update({ ...position }, value) }
                    },
                    type: 'Comment',
                    value: value.join('')
                };
                Object.assign(position, node.location.end);
                yield { node, direction: 'enter' };
                i += value.length;
                continue;
            }
            else {
                index = find(css, i + 1, ';{}');
                if (index == null) {
                    value = css.slice(i);
                    console.log(`Declaration or AtRule block? - "${value.join('')}`);
                    update(position, value);
                    break;
                }
                else if (css[index] == '{') {
                    // parse block
                    info = parseBlock(css, i, index);
                    if (info.type == 'AtRule' || info.type == 'InvalidAtRule') {
                        yield* this.#parseAtRule(position, info);
                    }
                    else {
                        yield* this.#parseRule(position, info);
                    }
                }
                else {
                    const match = css.slice(i, index + 1);
                    info = parseBlock(css, i, index);
                    if (match[0] == '@') {
                        yield* this.#parseAtRule(position, info);
                    }
                    else {
                        yield* this.#parseDeclaration(position, info);
                    }
                }
                i += info.block.length;
                if (i == info.block.length) {
                    break;
                }
            }
        }
        if (this.#root.type == 'StyleSheet') {
            position.column = Math.max(1, position.column - 1);
        }
    }
    *#parseAtRule(position, info) {
        let node;
        // @ts-ignore
        const { body, selector, block } = info;
        if (!('selector' in info)) {
            const { name, value } = info;
            node = {
                location: {
                    start: update({ ...position }, name[0]),
                    end: update({ ...position }, block)
                },
                type: !isIdent(name) ? 'InvalidAtRule' : 'AtRule',
                value: value.join(''),
                name: name.join('')
            };
            yield { node, direction: 'enter' };
        }
        else {
            const [name, value] = parseAtRule(selector);
            if (!isIdent(name)) {
                node = body == null ? {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type: 'InvalidAtRule',
                    value,
                    name
                } : {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type: 'InvalidAtRule',
                    value: value,
                    name,
                    body: body.join('')
                };
                Object.assign(position, node.location.end);
                yield { node, direction: 'enter' };
            }
            else {
                node = body == null ? {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, block)
                    },
                    type: 'AtRule',
                    value: value,
                    name
                } : {
                    location: {
                        start: update({ ...position }, name[0]),
                        end: update({ ...position }, selector.concat('{'))
                    },
                    type: 'AtRule',
                    value,
                    name,
                    children: []
                };
                yield { node, direction: 'enter' };
                // node.location.end = pos;
                if (body.length > 0) {
                    // @ts-ignore
                    const tokenizer = new Tokenizer(node);
                    // @ts-ignore
                    yield* tokenizer.parse(body);
                }
            }
        }
        const str = block.slice(selector.length + 1 + (body != null ? body.length : 0));
        if (str.length > 0) {
            update(node.location.end, str);
        }
        Object.assign(position, node.location.end);
        if ('children' in node) {
            yield { node, direction: 'exit' };
        }
    }
    *#parseRule(position, info) {
        let node;
        // @ts-ignore
        const { body, selector, block } = info;
        // @ts-ignore
        node = {
            location: {
                start: update({ ...position }, selector[0]),
                end: update({ ...position }, selector.concat('{'))
            },
            type: 'Rule',
            selector: selector.join('').trimEnd(),
            children: []
        };
        // @ts-ignore
        yield { node, direction: 'enter' };
        if (body != null) {
            // @ts-ignore
            const tokenizer = new Tokenizer(node);
            // @ts-ignore
            yield* tokenizer.parse(body);
        }
        const str = block.slice(selector.length + 1 + (body != null ? body.length : 0));
        if (str.length > 0) {
            update(node.location.end, str);
        }
        Object.assign(position, node.location.end);
        if ('children' in node) {
            yield { node, direction: 'exit' };
        }
    }
    *#parseDeclaration(position, info) {
        // @ts-ignore
        const [name, value] = parseDeclaration(info.body);
        const node = {
            type: 'Declaration',
            location: {
                start: update({ ...position }, name[0]),
                end: update({ ...position }, info.body),
                // src
            },
            name,
            value
        };
        Object.assign(position, node.location.end);
        const str = info.block.slice(info.body.length);
        if (str.length > 0) {
            update(position, str);
        }
        yield { node, direction: 'enter' };
    }
}
