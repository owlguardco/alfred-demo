import { listScripts } from "../../../../lib/certification";

// No force-dynamic: the scripts are bundled at build time (see
// lib/certification.js), so this route is a pure function of static data and
// Next can prerender it.
export async function GET() {
  try {
    return Response.json({ scripts: listScripts() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
