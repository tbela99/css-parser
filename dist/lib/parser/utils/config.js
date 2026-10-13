/* Version: 1.6.7 - October 13, 2026 17:01:28 */
import config from '../../../data/properties.json.js';

Object.freeze(config);
// @ts-expect-error
const getConfig = () => config;

export { getConfig };
