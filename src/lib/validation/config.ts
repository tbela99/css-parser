
import config from './config.json' with {type: 'json'};
import type {ValidationConfiguration} from "../../@types/validation";

Object.freeze(config);

export function getConfig(): ValidationConfiguration {
    // @ts-ignore
    return config as ValidationConfiguration;
}