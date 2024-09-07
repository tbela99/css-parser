import config from './config.json.js';

Object.freeze(config);
function getConfig() {
    // @ts-ignore
    return config;
}

export { getConfig };
