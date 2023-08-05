import config from '../../../config.json' assert {type: 'json'};
import {PropertiesConfig} from "../../../@types";

export const getConfig = () => <PropertiesConfig>config;