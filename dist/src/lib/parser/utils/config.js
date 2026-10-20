/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.9
	License: MIT
 */
import config from '../../../data/properties.json.js';

Object.freeze(config);
// @ts-expect-error
const getConfig = () => config;

export { getConfig };
