import {
    AstAtRule,
    AstNode,
    AstRuleList,
    AstRuleStyleSheet,
    AtRuleToken,
    ErrorDescription,
    Location,
    Token
} from "../@types";

export function validate(node: AstNode | Token, location: Location, parent: AstRuleList, root: AstRuleStyleSheet): ErrorDescription {

    if (node.typ == 'At-rule') {

        if (node.val == 'charset' && location.sta.ind > 0) {

            return {action: 'drop', message: 'invalid @charset', location: {src: location.src, ...location.sta}};
        }


        if ((<AtRuleToken>node).val == 'import') {

            let i: number = parent.chi.length;

            while (i--) {

                const type: string = parent.chi[i].typ;

                if (type == 'Comment') {

                    continue;
                }

                if (type != 'AtRule') {

                    return {action: 'drop', message: 'invalid @import', location: {src: location.src, ...location.sta}};
                }

                const name: string = (<AstAtRule>parent.chi[i]).nam;

                if (name != 'charset' && name != 'import' && name != 'layer') {

                    return {action: 'drop', message: 'invalid @import', location: {src: location.src, ...location.sta}};
                }

                // @ts-ignore
                return null;
            }
        }
    }

    // @ts-ignore
    return null;
}