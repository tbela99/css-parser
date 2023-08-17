const funcList = ['clamp', 'calc'];
function matchType(val, properties) {
    if (val.typ == 'Iden' && properties.keywords.includes(val.val) ||
        (properties.types.includes(val.typ))) {
        return true;
    }
    if (val.typ == 'Number' && val.val == '0') {
        return properties.types.some(type => type == 'Length' || type == 'Angle');
    }
    if (val.typ == 'Func' && funcList.includes(val.val)) {
        return val.chi.every((t => ['Literal', 'Comma', 'Whitespace', 'Start-parens', 'End-parens'].includes(t.typ) || matchType(t, properties)));
    }
    return false;
}

export { funcList, matchType };
