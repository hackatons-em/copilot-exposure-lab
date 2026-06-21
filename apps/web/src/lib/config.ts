/** Runtime config read from public env, with safe demo defaults. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "ws-demo";
