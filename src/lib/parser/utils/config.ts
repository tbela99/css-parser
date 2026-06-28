import config from '../../../config.json' with {type: 'json'};
import type {PropertiesConfig} from "../../../@types/index.d.ts";

Object.freeze(config);
// @ts-expect-error
export const getConfig = () => <PropertiesConfig>config;