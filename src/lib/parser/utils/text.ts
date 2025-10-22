

export function dasherize(value: string) {

    return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
}

export function camelize(value: string) {

    return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}