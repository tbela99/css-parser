import config from '../../../config.json' with {type: 'json'};
import type {PropertiesConfig} from "../../../@types/index.d.ts";

Object.freeze(config);

export const getConfig = () => <PropertiesConfig>config;