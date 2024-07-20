import config from '../../../config.json' assert {type: 'json'};
import {PropertiesConfig} from "../../../@types/index.d.ts";

export const getConfig = () => <PropertiesConfig>config;