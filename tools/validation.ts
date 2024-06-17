import {parseAllSyntaxes, parseDeclarationsSyntax, parseFunctionsSyntax} from "../src/lib/validation/parser";


console.debug(JSON.stringify({

        declarations: await parseDeclarationsSyntax(),
        functions: await parseFunctionsSyntax(),
        syntaxes: await parseAllSyntaxes()
    }, null, 1)
);


