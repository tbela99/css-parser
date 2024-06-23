
import config from './config.json'
import {ValidationConfiguration} from "../../@types/validation";

export function getConfig(): ValidationConfiguration {
    return config;
}