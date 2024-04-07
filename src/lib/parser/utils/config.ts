import config from '../../../config.json' assert {type: 'json'};
import {PropertiesConfig} from "../../../@types";

// @ts-ignore
export const getConfig = () => <PropertiesConfig>config;