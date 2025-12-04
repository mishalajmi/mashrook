
import type { AppLoadContext } from "react-router";
import { createRequestHandler } from "react-router";

interface CloudflareLoadContext extends AppLoadContext {
	cloudflare: {
		env: Env;
		ctx: ExecutionContext;
	};
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const loadContext: CloudflareLoadContext = {
			cloudflare: { env, ctx },
		};
		return requestHandler(request, loadContext);
	},
} satisfies ExportedHandler<Env>;
