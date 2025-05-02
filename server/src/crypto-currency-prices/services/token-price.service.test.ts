import { test, expect, describe, beforeEach, jest } from "@jest/globals";
import { CoingeckoRestService } from "../coingecko-api/coingecko.rest-service";
import * as tokenUtil from "../../common/util/find-coingecko-token-id";
import { TokenPriceService } from "./token-price.service";

jest.mock("../../common/util/find-coingecko-token-id");

describe("TokenPriceService", () => {
  let service: TokenPriceService;
  let mockCoingeckoRestService: jest.Mocked<CoingeckoRestService>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:00:00Z"));
    mockCoingeckoRestService = {
      fetchPrices: jest.fn(),
    } as any;
    service = new TokenPriceService(mockCoingeckoRestService);
    (TokenPriceService as any).quotes = {};
  });

  test("fetches prices from API when cache is empty", async () => {
    (tokenUtil.findCoingeckoToken as jest.Mock).mockImplementation(
      (symbol: string, _chain: string) => ({
        id: `${symbol.toLowerCase()}-id`,
        symbol,
      }),
    );

    mockCoingeckoRestService.fetchPrices.mockResolvedValue({
      "eth-id": { usd: 2500 },
      "btc-id": { usd: 40000 },
    });

    const prices = await service.fetchCurrentPrices(
      ["ETH", "BTC"],
      "ethereum",
      "USD",
    );

    expect(mockCoingeckoRestService.fetchPrices).toHaveBeenCalledWith(
      ["eth-id", "btc-id"],
      "usd",
    );
    expect(prices).toEqual({
      ETH: 2500,
      BTC: 40000,
    });
  });

  test("uses cached prices if still valid", async () => {
    const now = new Date().getTime();
    (TokenPriceService as any).quotes = {
      "eth-id": {
        usd: { price: 2999, timestamp: now },
      },
    };

    (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue({
      id: "eth-id",
      symbol: "ETH",
    });

    const prices = await service.fetchCurrentPrices(["ETH"], "ethereum", "USD");

    expect(mockCoingeckoRestService.fetchPrices).not.toHaveBeenCalled();
    expect(prices).toEqual({ ETH: 2999 });
  });

  test("refreshes cache if data is stale", async () => {
    const oldTimestamp = new Date().getTime() - 7 * 60 * 60 * 1000; // older than MAX_AGE
    (TokenPriceService as any).quotes = {
      "eth-id": {
        usd: { price: 2000, timestamp: oldTimestamp },
      },
    };

    (tokenUtil.findCoingeckoToken as jest.Mock).mockReturnValue({
      id: "eth-id",
      symbol: "ETH",
    });

    mockCoingeckoRestService.fetchPrices.mockResolvedValue({
      "eth-id": { usd: 2700 },
    });

    const prices = await service.fetchCurrentPrices(["ETH"], "ethereum", "USD");

    expect(mockCoingeckoRestService.fetchPrices).toHaveBeenCalled();
    expect(prices).toEqual({ ETH: 2700 });
  });
});
