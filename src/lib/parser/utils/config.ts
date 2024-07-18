import config from '../../../config.json' assert {type: 'json'};
import {PropertiesConfig} from "../../../@types/index.d";

export const getConfig = () => <PropertiesConfig>config;