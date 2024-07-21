import config from '../../../config.json' assert {type: 'json'};
import type {PropertiesConfig} from "../../../@types/index.d.ts";

export const getConfig = () => <PropertiesConfig>config;