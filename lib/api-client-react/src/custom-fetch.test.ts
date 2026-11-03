// @ts-ignore
import { describe, it, beforeEach, afterEach } from "node:test";
// @ts-ignore
import assert from "node:assert/strict";
import {
  customFetch,
  setBaseUrl,
  setAuthTokenGetter,
} from "./custom-fetch.js";

describe("custom-fetch configuration", () => {
  const originalFetch = globalThis.fetch;
  let lastFetchCall: { input: RequestInfo | URL; init?: RequestInit } | null = null;

  beforeEach(() => {
    lastFetchCall = null;
    // Reset module-level configuration state
    setBaseUrl(null);
    setAuthTokenGetter(null);

    // Mock global fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      lastFetchCall = { input, init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
  });

  afterEach(() => {
    // Restore fetch and clean state
    globalThis.fetch = originalFetch;
    setBaseUrl(null);
    setAuthTokenGetter(null);
  });

  describe("setBaseUrl", () => {
    it("prepends base URL to relative paths starting with /", async () => {
      setBaseUrl("https://api.example.com");

      await customFetch("/users");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "https://api.example.com/users");
    });

    it("strips trailing slashes from the base URL", async () => {
      setBaseUrl("https://api.example.com///");

      await customFetch("/posts");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "https://api.example.com/posts");
    });

    it("does not modify absolute URLs or non-relative URLs", async () => {
      setBaseUrl("https://api.example.com");

      await customFetch("https://external.service.com/data");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "https://external.service.com/data");
    });

    it("does not prepend base URL to relative paths that do not start with /", async () => {
      setBaseUrl("https://api.example.com");

      await customFetch("relative/endpoint");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "relative/endpoint");
    });

    it("correctly handles URL object input", async () => {
      setBaseUrl("https://api.example.com");

      const url = new URL("https://example.com/path");
      await customFetch(url);

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, url);
    });

    it("correctly handles Request object input with relative path", async () => {
      setBaseUrl("https://api.example.com");

      const req = new Request("http://localhost/items", { method: "GET" });
      await customFetch(req);

      assert.ok(lastFetchCall);
      assert.equal((lastFetchCall!.input as Request).url, "http://localhost/items");
    });

    it("clears the base URL when passed null", async () => {
      setBaseUrl("https://api.example.com");
      setBaseUrl(null);

      await customFetch("/health");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "/health");
    });
  });

  describe("setAuthTokenGetter", () => {
    it("attaches Authorization header from a synchronous token getter", async () => {
      setAuthTokenGetter(() => "sync-test-token-123");

      await customFetch("/profile");

      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.get("authorization"), "Bearer sync-test-token-123");
    });

    it("attaches Authorization header from an asynchronous token getter", async () => {
      setAuthTokenGetter(async () => {
        return "async-test-token-456";
      });

      await customFetch("/profile");

      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.get("authorization"), "Bearer async-test-token-456");
    });

    it("does not attach Authorization header if getter returns null", async () => {
      setAuthTokenGetter(() => null);

      await customFetch("/public-endpoint");

      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.has("authorization"), false);
    });

    it("does not attach Authorization header if getter returns empty string", async () => {
      setAuthTokenGetter(() => "");

      await customFetch("/public-endpoint");

      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.has("authorization"), false);
    });

    it("preserves explicitly provided Authorization header and does not invoke getter", async () => {
      let getterCalled = false;
      setAuthTokenGetter(() => {
        getterCalled = true;
        return "getter-token";
      });

      await customFetch("/secure", {
        headers: {
          authorization: "Custom existing-token",
        },
      });

      assert.equal(getterCalled, false);
      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.get("authorization"), "Custom existing-token");
    });

    it("clears auth token getter when passed null", async () => {
      setAuthTokenGetter(() => "temporary-token");
      setAuthTokenGetter(null);

      await customFetch("/info");

      assert.ok(lastFetchCall?.init?.headers);
      const headers = new Headers(lastFetchCall!.init!.headers);
      assert.equal(headers.has("authorization"), false);
    });
  });

  describe("combined behavior", () => {
    it("handles both setBaseUrl and setAuthTokenGetter simultaneously", async () => {
      setBaseUrl("https://api.myapp.com/v1/");
      setAuthTokenGetter(async () => "combined-jwt-token");

      await customFetch("/resource");

      assert.ok(lastFetchCall);
      assert.equal(lastFetchCall!.input, "https://api.myapp.com/v1/resource");

      const headers = new Headers(lastFetchCall!.init?.headers);
      assert.equal(headers.get("authorization"), "Bearer combined-jwt-token");
    });
  });
});
