import config, { restrictAiImports } from "@cel/config/eslint";

// The rule engine must stay deterministic: severity is computed, never
// generated. Ban all LLM SDK imports inside src/. See CLAUDE.md.
export default [...config, { files: ["src/**/*.ts"], ...restrictAiImports }];
