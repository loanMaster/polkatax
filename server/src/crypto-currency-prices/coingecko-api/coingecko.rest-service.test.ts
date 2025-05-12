import { logger } from "../logger/logger";
import { HttpError } from "../../common/error/HttpError";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { CoingeckoRestService } from "./coingecko.rest-service";

// Mock external modules
jest.mock("../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

global.fetch = jest.fn() as any;

const mockHtmlWithExportLink = `
  <div data-coin-historical-data-target="exportDropdownMenu">
    <div data-view-component>
      <span></span><span data-url="/coins/bitcoin/historical_data/usd.csv">Export</span>
    </div>
  </div>
`;

const mockCsv = `snapped_at,price
2025-01-03 00:00:00 UTC,42000.12
2025-01-02 00:00:00 UTC,41500.75
`;

describe("CoingeckoRestService", () => {
  const service = new CoingeckoRestService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchPrices should return simple price data", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 42000 },
      }),
    } as never);

    const result = await service.fetchPrices(["bitcoin"], "usd");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("simple/price"),
      expect.any(Object),
    );
    expect(result).toEqual({ bitcoin: { usd: 42000 } });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("CoingeckoRestService.fetchPrices"),
    );
  });

  test("fetchPrices should throw HttpError on failure", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as never);

    await expect(service.fetchPrices(["bitcoin"], "usd")).rejects.toThrow(
      HttpError,
    );
  });

  test("fetchHistoricalData should return Quotes object", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtmlWithExportLink,
      } as never) // getExportDataUrl HTML
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockCsv,
      } as never); // fetch CSV

    const result = await service.fetchHistoricalData("bitcoin", "usd");

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(Object.keys(result)).toContain("2025-01-02");
    expect(Object.keys(result)).toContain("2025-01-01");
    expect(result["2025-01-02"]).toBeCloseTo(42000.12);
    expect(result["2025-01-01"]).toBeCloseTo(41500.75);
    expect(result.timestamp).toBeGreaterThan(0);
  });
});
