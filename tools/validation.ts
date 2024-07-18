import {
    parseAllSyntaxes,
    parseDeclarationsSyntax,
    parseFunctionsSyntax
} from "../src/lib/validation/parser";


console.debug(JSON.stringify({

        declarations: await parseDeclarationsSyntax(),
        functions: await parseFunctionsSyntax(),
        syntaxes: await parseAllSyntaxes()
    })
);

// console.debug(
//     JSON.stringify(parseSyntax('<display-outside>? && [ flow | flow-root ]? && list-item'), null, 1)
// );

