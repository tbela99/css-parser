
import config from './config.json' assert {type: 'json'};
import {ValidationConfiguration} from "../../@types/validation.d";

export function getConfig(): ValidationConfiguration {
    return config;
}