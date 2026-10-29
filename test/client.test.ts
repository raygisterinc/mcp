import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, RaygisterApiError } from "../src/client.js";
import { loadEnv } from "../src/env.js";

const env = loadEnv({
	RAYGISTER_API_KEY: "dk_test",
	RAYGISTER_API_URL: "http://localhost:3000/api/",
});

function answer(status: number, body: unknown) {
	const fetch = vi
		.fn()
		.mockResolvedValue(
			new Response(JSON.stringify(body), { headers: { "content-type": "application/json" }, status })
		);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

async function refusal(promise: Promise<unknown>): Promise<RaygisterApiError> {
	const error = await promise.catch((cause: unknown) => cause);
	if (!(error instanceof RaygisterApiError)) {
		throw new Error("expected a RaygisterApiError");
	}
	return error;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("createClient", () => {
	it("sends the key and builds the URL, leaving empty parameters out", async () => {
		const fetch = answer(200, { data: [] });

		await createClient(env).get("/v1/projects", { page: 2, per_page: undefined });

		const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
		expect(url).toBe("http://localhost:3000/api/v1/projects?page=2");
		expect(init.headers).toMatchObject({ Authorization: "Bearer dk_test" });
	});

	it("reads the API's stable error code and explains it", async () => {
		answer(403, { error: { code: "moe_access_ended", message: "The organization's access..." } });

		const error = await refusal(createClient(env).get("/v1/projects"));

		expect(error.code).toBe("moe_access_ended");
		expect(error.status).toBe(403);
		expect(error.message).toContain("Renewing the subscription restores access");
	});

	it("tells the assistant where to get a key on a 401", async () => {
		answer(401, { error: { code: "unauthorized", message: "Missing, invalid or revoked API key." } });

		const error = await refusal(createClient(env).get("/v1/projects"));

		expect(error.message).toContain("Settings > API keys");
	});

	it("falls back on the status when the body carries no code", async () => {
		answer(404, "<html>Not Found</html>");

		const error = await refusal(createClient(env).get("/v1/nowhere"));

		expect(error.code).toBe("not_found");
	});

	it("names the API it could not reach", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

		const error = await refusal(createClient(env).get("/v1/projects"));

		expect(error.code).toBe("network_error");
		expect(error.message).toContain("http://localhost:3000/api/");
	});
});

describe("loadEnv", () => {
	it("defaults to the production API", () => {
		expect(loadEnv({ RAYGISTER_API_KEY: " dk_abc " })).toEqual({
			RAYGISTER_API_KEY: "dk_abc",
			RAYGISTER_API_URL: "https://app.raygister.com/api",
		});
	});

	it("says where to create a key when none is set", () => {
		expect(() => loadEnv({})).toThrow("Settings > API keys");
		expect(() => loadEnv({ RAYGISTER_API_KEY: "sk_abc" })).toThrow("must start with 'dk_'");
	});
});
