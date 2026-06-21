import base from "@cel/config/vitest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(base, defineConfig({}));
