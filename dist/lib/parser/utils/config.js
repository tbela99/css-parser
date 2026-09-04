import config from '../../data/properties.json.js';

Object.freeze(config);
// @ts-expect-error
const getConfig = () => config;

export { getConfig };
