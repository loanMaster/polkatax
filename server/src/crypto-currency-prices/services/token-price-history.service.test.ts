import {
  test,
  expect,
  describe,
  beforeEach,
  jest,
  afterEach,
} from "@jest/globals";
import { CoingeckoRestService } from "../coingecko-api/coingecko.rest-service";
import { logger } from "../logger/logger";
import * as findCoingeckoToken from "../../common/util/find-coingecko-token-id";
import { TokenPriceHistoryService } from "./token-price-history.service";

jest.mock("../logger/logger");
jest.mock("../coingecko-api/coingecko.rest-service");
jest.mock("../../common/util/find-coingecko-token-id");
jest.mock("../../common/util/date-utils", () => ({
  formatDate: jest.fn().mockReturnValue("2024-05-02"),
}));

describe("TokenPriceHistoryService", () => {
  let service: TokenPriceHistoryService;
  let mockCoingeckoRestService: jest.Mocked<CoingeckoRestService>;
  let mockFindCoingeckoToken: jest.Mock;

  beforeEach(() => {
    mockCoingeckoRestService = {
      fetchHistoricalData: jest.fn(),
    } as unknown as jest.Mocked<CoingeckoRestService>;

    mockFindCoingeckoToken = findCoingeckoToken.findCoingeckoToken as jest.Mock;

    service = new TokenPriceHistoryService(mockCoingeckoRestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (service["timer"]) {
      clearInterval(service["timer"]);
    }
  });

  test("should initialize and start syncing every 3 minutes", () => {
    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const syncSpy = jest.spyOn(service as any, "sync");
    service.init();

    // Check that the sync method was called immediately
    expect(syncSpy).toHaveBeenCalledTimes(1);

    // Check that the interval is set correctly
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      3 * 60 * 1000,
    );
  });

  test("should fetch historic prices and add token to sync list", async () => {
    const symbol = "glmr";
    const currency = "usd";
    const fakeQuotes = { timestamp: Date.now(), data: [] };
    mockCoingeckoRestService.fetchHistoricalData.mockResolvedValue(
      fakeQuotes as any,
    );
    mockFindCoingeckoToken.mockReturnValue({ id: "glmr-token-id" });

    const result = await service.getHistoricPrices(symbol, currency);

    expect(mockCoingeckoRestService.fetchHistoricalData).toHaveBeenCalledWith(
      "glmr-token-id",
      currency,
    );
    expect(result.quotes).toBe(fakeQuotes);
    expect(service["tokensToSync"]).toContain(symbol);
  });

  test("should handle synonyms for tokens", async () => {
    const symbol = "wglmr";
    const currency = "usd";
    const fakeQuotes = { timestamp: Date.now(), data: [] };
    mockCoingeckoRestService.fetchHistoricalData.mockResolvedValue(
      fakeQuotes as any,
    );
    mockFindCoingeckoToken.mockReturnValue({ id: "glmr-token-id" });

    const result = await service.getHistoricPrices(symbol, currency);

    expect(mockCoingeckoRestService.fetchHistoricalData).toHaveBeenCalledWith(
      "glmr-token-id",
      currency,
    );
    expect(result.quotes).toBe(fakeQuotes);
  });

  test("should not fetch quotes if they are already up to date", async () => {
    const symbol = "glmr";
    const currency = "usd";
    const existingQuotes = { timestamp: Date.now(), data: [] };
    service["cachedPrices"]["glmr_usd"] = existingQuotes as any;

    const result = await service.getHistoricPrices(symbol, currency);

    expect(mockCoingeckoRestService.fetchHistoricalData).not.toHaveBeenCalled();
    expect(result.quotes).toBe(existingQuotes);
  });

  test("should sync tokens and remove failed tokens from sync list", async () => {
    const tokenSymbol = "glmr";
    const currency = "usd";

    // Simulate an error in fetching quotes
    mockCoingeckoRestService.fetchHistoricalData.mockRejectedValue(
      new Error("API error"),
    );

    const syncSpy = jest.spyOn(service as any, "sync");
    await service["sync"]();

    // Check that the token was removed from the sync list
    expect(service["tokensToSync"]).not.toContain(tokenSymbol);
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  test("should correctly combine symbol and currency", () => {
    const combined = (service as any).combine("glmr", "usd");
    expect(combined).toBe("glmr_usd");
  });

  test("should correctly check if information is up to date", () => {
    const symbol = "glmr";
    const currency = "usd";
    const combinedIdx = "glmr_usd";

    // Simulate that we have cached prices for the symbol and currency
    service["cachedPrices"][combinedIdx] = {
      timestamp: Date.now(),
      "2024-05-01": [] as any,
    };

    const isUpToDate = (service as any).informationUpToDate(symbol, currency);
    expect(isUpToDate).toBe(true);
  });

  test("should fetch quotes for a symbol if they are outdated", async () => {
    const symbol = "glmr";
    const currency = "usd";
    const fakeQuotes = { timestamp: Date.now(), data: [] };
    mockCoingeckoRestService.fetchHistoricalData.mockResolvedValue(
      fakeQuotes as any,
    );
    mockFindCoingeckoToken.mockReturnValue({ id: "glmr-token-id" });

    // Simulate outdated cache
    const MAX_AGE = 4 * 60 * 60 * 1000;
    service["cachedPrices"]["glmr_usd"] = {
      timestamp: Date.now() - MAX_AGE - 1,
      data: [] as any,
    };

    const result = await service["fetchQuotesForSymbol"](symbol, currency);

    expect(mockCoingeckoRestService.fetchHistoricalData).toHaveBeenCalled();
    expect(result).toBe(fakeQuotes);
  });

  test("should throw an error if token is not found in Coingecko list", async () => {
    const symbol = "unknown-token";
    const currency = "usd";
    mockFindCoingeckoToken.mockReturnValue(undefined); // Simulate token not found

    await expect(
      service["fetchQuotesForSymbol"](symbol, currency),
    ).rejects.toThrowError("Token unknown-token not found in coingecko list.");
  });
});
