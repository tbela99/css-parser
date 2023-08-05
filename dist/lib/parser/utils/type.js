function matchType(val, properties) {
    if (val.typ == 'Iden' && properties.keywords.includes(val.val) ||
        (properties.types.includes(val.typ))) {
        return true;
    }
    if (val.typ == 'Number' && val.val == '0') {
        return properties.types.some(type => type == 'Length' || type == 'Angle');
    }
    return false;
}

export { matchType };
