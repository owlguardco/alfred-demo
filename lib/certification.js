/** Certification script registry.
 *
 *  The scripts are bound at BUILD time via static imports rather than read at
 *  request time with fs.readdirSync(process.cwd() + '/data/certification').
 *  Next's output file tracing decides what to bundle into each Vercel
 *  serverless function by statically analysing the code; it cannot see
 *  through a dynamic directory read, so the JSON risks being left out of the
 *  deployed function — the classic "works locally, 500s in production"
 *  failure. A static import is a real module dependency, so the data is
 *  always there.
 *
 *  Tradeoff: adding a certification means adding an import line here as well
 *  as the JSON file. If drop-in files ever matter more than this guarantee,
 *  the alternative is fs reads plus an explicit
 *  `experimental.outputFileTracingIncludes` entry in next.config.js.
 */

import mediregs from "../data/certification/mediregs.json";
import vitallaw from "../data/certification/vitallaw.json";

const SCRIPTS = [mediregs, vitallaw];

/** Picker-list entries — everything except the steps themselves. */
export function listScripts() {
  return SCRIPTS.map((s) => ({
    id: s.id,
    title: s.title,
    estimated_minutes: s.estimated_minutes,
    step_count: s.steps.length,
  }));
}

export function loadScript(scriptId) {
  if (!scriptId) return null;
  return SCRIPTS.find((s) => s.id === scriptId) || null;
}

export function allScriptIds() {
  return SCRIPTS.map((s) => s.id);
}
