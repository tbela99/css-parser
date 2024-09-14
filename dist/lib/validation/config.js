import config from './config.json.js';

Object.freeze(config);
function getSyntaxConfig() {
    // @ts-ignore
    return config;
}

export { getSyntaxConfig };
