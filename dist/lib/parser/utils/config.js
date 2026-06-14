import config from '../../../config.json.js';

Object.freeze(config);
// @ts-expect-error
const getConfig = () => config;

export { getConfig };
