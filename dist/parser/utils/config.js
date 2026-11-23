/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.2.1
	License: MIT
 */
import config from '../../data/properties.json.js';

Object.freeze(config);
// @ts-expect-error
const getConfig = () => config;

export { getConfig };
