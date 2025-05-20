import { beforeEach, expect, it, jest, describe } from "@jest/globals";
import { SubscanApi } from "./subscan.api";
import { RequestHelper } from "../../../../common/util/request.helper";

// Mock environment variable
process.env.SUBSCAN_API_KEY = "fake-api-key";

// Mock RequestHelper class
jest.mock("../../../../common/util/request.helper");
const mockReq = jest.fn() as any;

(RequestHelper as jest.Mock).mockImplementation(() => {
  return {
    req: mockReq,
    defaultHeader: {},
  };
});

describe("SubscanApi", () => {
  let subscanApi: SubscanApi;

  beforeEach(() => {
    subscanApi = new SubscanApi();
    mockReq.mockReset();
  });

  it("should throw an error if SUBSCAN_API_KEY is not set", () => {
    delete process.env.SUBSCAN_API_KEY;
    expect(() => new SubscanApi()).toThrow("Subscan api key not found");
    process.env.SUBSCAN_API_KEY = "fake-api-key";
  });

  it("mapToSubstrateAccount returns substrate address", async () => {
    mockReq.mockResolvedValue({
      data: { account: { substrate_account: { address: "substrate-addr" } } },
    });
    const result = await subscanApi.mapToSubstrateAccount("kusama", "addr");
    expect(result).toBe("substrate-addr");
    expect(mockReq).toHaveBeenCalledWith(
      "https://kusama.api.subscan.io/api/v2/scan/search",
      "post",
      { key: "addr" },
    );
  });

  it("fetchMetadata returns proper MetaData", async () => {
    mockReq.mockResolvedValue({
      data: { avgBlockTime: "6", blockNum: "123456" },
    });
    const result = await subscanApi.fetchMetadata("kusama");
    expect(result).toEqual({ avgBlockTime: 6, blockNum: 123456 });
  });

  it("fetchNativeToken returns native token info", async () => {
    mockReq.mockResolvedValue({
      data: {
        detail: {
          KSM: {
            asset_type: "native",
            symbol: "KSM",
            decimals: 12,
          },
          USDT: {
            asset_type: "token",
            symbol: "USDT",
          },
        },
      },
    });
    const result = await subscanApi.fetchNativeToken("kusama");
    expect(result).toEqual({
      asset_type: "native",
      symbol: "KSM",
      decimals: 12,
    });
  });

  it("fetchTransfers returns list and hasNext", async () => {
    mockReq.mockResolvedValue({
      data: {
        list: [{ to: "to1", from: "from1", value: "1000" }],
      },
    });
    const result = await subscanApi.fetchTransfers("kusama", "addr", 0);
    expect(result.list.length).toBe(1);
    expect(result.hasNext).toBe(false);
  });
});
