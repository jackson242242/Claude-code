import { ApiError, apiFetch } from "../client";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: "http://test.local" } } },
}));

describe("apiFetch", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns parsed JSON on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ticker: "NVDA" }),
    }) as unknown as typeof fetch;

    const result = await apiFetch<{ ticker: string }>("/api/quotes/NVDA");
    expect(result).toEqual({ ticker: "NVDA" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://test.local/api/quotes/NVDA",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) }),
    );
  });

  it("maps a backend {error:{message,type}} body to ApiError", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "Unknown ticker: NOPE", type: "not_found" } }),
    }) as unknown as typeof fetch;

    await expect(apiFetch("/api/quotes/NOPE")).rejects.toMatchObject({
      message: "Unknown ticker: NOPE",
      type: "not_found",
      status: 404,
    });
  });

  it("wraps network failures as ApiError", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const err = await apiFetch("/api/quotes/NVDA").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).type).toBe("network_error");
  });
});
