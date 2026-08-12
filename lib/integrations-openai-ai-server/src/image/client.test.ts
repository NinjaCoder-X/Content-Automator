import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("OpenAI Image Client Environment Variables", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules(); // Clears module cache so the file is re-evaluated
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should throw an error if AI_INTEGRATIONS_OPENAI_BASE_URL is missing", async () => {
    delete process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-api-key";

    await expect(async () => {
      await import("./client");
    }).rejects.toThrow(
      "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?"
    );
  });

  it("should throw an error if AI_INTEGRATIONS_OPENAI_API_KEY is missing", async () => {
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "https://test-url.com";
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    await expect(async () => {
      await import("./client");
    }).rejects.toThrow(
      "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?"
    );
  });

  it("should successfully initialize if both environment variables are present", async () => {
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "https://test-url.com";
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-api-key";

    // Importing the module should not throw any error
    const module = await import("./client");

    // We can also verify that the exported openai instance is correctly created
    expect(module.openai).toBeDefined();
  });
});
