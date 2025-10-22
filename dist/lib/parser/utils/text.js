function dasherize(value) {
    return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
}
function camelize(value) {
    return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}

export { camelize, dasherize };
