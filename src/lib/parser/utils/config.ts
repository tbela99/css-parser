import config from '../../../config.json' with {type: 'json'};
import type {PropertiesConfig} from "../../../@types";

Object.freeze(config);

export const getConfig = () => <PropertiesConfig>config;