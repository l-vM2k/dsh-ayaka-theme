import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
//#region lib/types/index.js
/**
* Node-half entry for the Ayaka theme plugin.
*
* Registers a webserver prefix route at `/ayaka-assets/` that serves the
* static images and audio files bundled inside this package, so the plugin
* is self-contained and does not depend on the frontend dist's `public/`
* directory (which only exists in the monorepo, not in an installed dsh).
*
* The browser half (`./client`) references these assets via `/ayaka-assets/`
* URLs instead of `/images/` and `/voices/`.
*/
/** Absolute path of the assets directory (sibling of lib/). */
const ASSETS_DIR = resolve(fileURLToPath(new URL("../assets/", import.meta.url)));
/** MIME types for the bundled asset extensions. */
const MIME = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".wav": "audio/wav",
	".mp3": "audio/mpeg"
};
/** Required services: the webServer to register the asset route. */
const inject = ["webServer"];
/**
* Register the `/ayaka-assets` prefix route serving static files from the
* package's `assets/` directory.
* @param ctx - cordis context with ctx.webServer injected.
*/
function apply(ctx) {
	ctx.webServer.register({
		kind: "prefix",
		path: "/ayaka-assets",
		handler: async (req, res) => {
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return;
			}
			const rawPath = new URL(req.url ?? "/", "http://x").pathname;
			const relPath = decodeURIComponent(rawPath).replace(/^\/ayaka-assets\/?/, "");
			if (relPath === "" || relPath.includes("..")) {
				res.writeHead(404);
				res.end();
				return;
			}
			const target = resolve(normalize(join(ASSETS_DIR, relPath)));
			if (target !== ASSETS_DIR && !target.startsWith(ASSETS_DIR + sep)) {
				res.writeHead(403);
				res.end();
				return;
			}
			try {
				const body = await readFile(target);
				res.writeHead(200, {
					"content-type": MIME[extname(target)] ?? "application/octet-stream",
					"cache-control": "public, max-age=86400"
				});
				res.end(body);
			} catch {
				res.writeHead(404);
				res.end();
			}
		}
	});
}
//#endregion
export { apply, inject };
