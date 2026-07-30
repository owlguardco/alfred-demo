import { allScriptIds, loadScript } from "../../../../lib/certification";

// Both scripts are known at build time, so prerender them instead of paying a
// function invocation per load.
export function generateStaticParams() {
  return allScriptIds().map((scriptId) => ({ scriptId }));
}

export async function GET(_request, { params }) {
  try {
    const script = loadScript(params.scriptId);
    if (!script) {
      return Response.json({ error: "Script not found" }, { status: 404 });
    }
    return Response.json({ script });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
