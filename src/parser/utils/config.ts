import config from "../../data/properties.json" with { type: "json" };
import type { PropertiesConfig } from "../../@types/config.d.ts";

Object.freeze(config);
// @ts-expect-error
export const getConfig = () => <PropertiesConfig>config;
