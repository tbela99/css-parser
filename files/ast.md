---
title: Ast
group: Documents
category: Guides
children:
    - ./ast-traversal.md   
    - ./ast-utilities.md
---

## Ast node types

The ast root node returned by the parser is always a [AstStyleSheet](../docs/interfaces/node.AstStyleSheet.html) node.
The other node types
are [AstRule](../docs/interfaces/node.AstRule.html), [AstAtRule](../docs/interfaces/node.AstAtRule.html), [AstKeyframesAtRule](../docs/interfaces/node.AstKeyframesAtRule.html), [AstKeyframesRule](../docs/interfaces/node.AstKeyframesRule.html), [AstDeclaration](../docs/interfaces/node.AstDeclaration.html), [AstComment](../docs/interfaces/node.AstComment.html), [AstInvalidRule](../docs/interfaces/node.AstInvalidRule.html), [AstInvalidAtRule](../docs/interfaces/node.AstInvalidAtRule.html), [AstInvalidDeclaration](../docs/interfaces/node.AstInvalidDeclaration.html)

The full list of tokens is available [here](../interfaces/node.BaseToken.html).

## Ast node values

Nodes values are parsed as an array of tokens.

### Ast rule value

[Ast rule](../docs/interfaces/node.AstRule.html) value is the selector parsed as the  _tokens_ pwhich is an array of [Token](../docs/types/node.Token.html) .
The _sel_ attribute is the string representation of the node selector.
Modifying the sel attribute does not affect the tokens attribute, and similarly, changes to the tokens attribute do not
update the sel attribute.

```ts

import {AstRule, parseDeclarations, ParserOptions, transform, parseDeclarations} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        async Rule(node: AstRule): AstRule {

            node.sel = '.foo,.bar,.fubar';

            node.chi.push(...await parseDeclarations('width: 3px'));
            return node;
        }
    }
};

const css = `

    .foo {

            height: calc(100px * 2/ 15);    
    } 
`;

const result = await transform(css, options);
console.debug(result.code);

// .foo,.bar,.fubar{height:calc(40px/3);width:3px}
```

### Ast at-rule value

[Ast at-rule](../docs/interfaces/node.AstAtRule.html) _tokens_ is either null or an array
of [Token](../docs/types/node.Token.html) representing the node's prelude.
The _val_ attribute is the string representation of the node's value.

Modifying the _val_ attribute does not affect the _tokens_ attribute, and similarly, changes to the _tokens_ attribute do not
update the _val_ attribute.

```ts
import {ParserOptions, transform, AstAtRule} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        AtRule: {

            media: (node: AstAtRule): AstAtRule => {

                node.val = 'all';
                return node
            }
        }
    }
};

const css = `

@media screen {
       
    .foo {

            height: calc(100px * 2/ 15);    
    } 
}
`;

const result = await transform(css, options);
console.debug(result.code);

// .foo{height:calc(40px/3)}
```

### Ast declaration value

[Ast declaration](../docs/interfaces/node.AstDeclaration.html) _nam_ attribute is the declaration name. the _val_
attribute is an array of [Token](../docs/types/node.Token.html) representing the declaration's value.

```ts

import {AstDeclaration, EnumToken, LengthToken, ParserOptions, transform} from '@tbela99/css-parser';

const options: ParserOptions = {

    visitor: {

        Declaration: {

            // called only for height declaration
            height: (node: AstDeclaration): AstDeclaration[] => {


                return [
                    node,
                    {

                        typ: EnumToken.DeclarationNodeType,
                        nam: 'width',
                        val: [
                            <LengthToken>{
                                typ: EnumToken.LengthTokenType,
                                val: 3,
                                unit: 'px'
                            }
                        ]
                    }
                ];
            }
        }
    }
};

const css = `

.foo {
    height: calc(100px * 2/ 15);
}
.selector {
color: lch(from peru calc(l * 0.8) calc(c * 0.7) calc(h + 180)) 
}
`;

const result = await transform(css, options);
console.debug(result.code);

// .foo{height:calc(40px/3);width:3px}.selector{color:#0880b0}
```

------
[← Custom Transform](./transform.md) | [Search Api →](./find.md)