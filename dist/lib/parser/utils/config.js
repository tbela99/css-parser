import config from '../../../config.json.js';

Object.freeze(config);
const getConfig = () => config;

export { getConfig };
