import { SubscanService } from "./subscan.service"; // Adjust path
import { SubscanApi } from "./subscan.api";
import { Transaction } from "../model/transaction";
import { RawStakingReward } from "../model/staking-reward";
import { beforeEach, expect, it, jest, describe } from "@jest/globals";

// Mock logger to silence logs
jest.mock("../../../logger/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("SubscanService", () => {
  let service: SubscanService;
  let mockSubscanApi: jest.Mocked<SubscanApi>;

  beforeEach(() => {
    mockSubscanApi = {
      mapToSubstrateAccount: jest.fn<any>(),
      fetchNativeToken: jest.fn<any>(),
      searchEvents: jest.fn<any>(),
      searchExtrinsics: jest.fn<any>(),
      fetchPoolStakingRewards: jest.fn<any>(),
      fetchStakingRewards: jest.fn<any>(),
      fetchExtrinsics: jest.fn<any>(),
      fetchTransfers: jest.fn<any>(),
      fetchAccounts: jest.fn<any>(),
    } as any;

    service = new SubscanService(mockSubscanApi);
    jest.clearAllMocks();
  });

  it("maps to substrate account", async () => {
    mockSubscanApi.mapToSubstrateAccount.mockResolvedValue("substrate-address");

    const result = await service.mapToSubstrateAccount("polkadot", "0xabc");

    expect(result).toBe("substrate-address");
    expect(mockSubscanApi.mapToSubstrateAccount).toHaveBeenCalledWith(
      "polkadot",
      "0xabc",
    );
  });

  it("fetches native token", async () => {
    const fakeToken = { symbol: "DOT" };
    mockSubscanApi.fetchNativeToken.mockResolvedValue(fakeToken as any);

    const result = await service.fetchNativeToken("polkadot");
    expect(result).toBe(fakeToken);
    expect(mockSubscanApi.fetchNativeToken).toHaveBeenCalledWith("polkadot");
  });

  it("fetches all staking rewards", async () => {
    mockSubscanApi.fetchStakingRewards
      .mockResolvedValueOnce({
        list: [{ amount: "100" }] as unknown as RawStakingReward[],
        hasNext: false,
      })
      .mockResolvedValue({
        list: [],
        hasNext: false,
      });

    const result = await service.fetchAllStakingRewards("kusama", "address");
    expect(result).toEqual([{ amount: "100" }]);
    expect(mockSubscanApi.fetchStakingRewards).toHaveBeenCalled();
  });

  it("fetches all transactions, iterate over pages", async () => {
    mockSubscanApi.fetchExtrinsics.mockImplementation(
      async (
        chainName: string,
        address: string,
        page: number,
        block_min: number,
        block_max: number,
        evm?: boolean,
      ): Promise<any> => {
        if (page < 7) {
          return {
            list: [{ hash: "tx" + page }] as Transaction[],
            hasNext: true,
          };
        } else {
          return {
            list: [],
            hasNext: false,
          };
        }
      },
    );

    const result = await service.fetchAllTx("moonbeam", "address");
    expect(result.length).toBe(7);
    for (let i = 0; i < 7; i++) {
      expect(result.find((t) => t.hash === "tx5")).not.toBeUndefined();
    }
  });

  it("fetches all transfers and maps them", async () => {
    mockSubscanApi.fetchTransfers
      .mockResolvedValueOnce({
        list: [
          {
            symbol: "KSM",
            amount: "123",
            from: "A",
            to: "B",
            module: "balances",
            block_num: 100,
            block_timestamp: 1600000000,
            hash: "0xhash",
            asset_unique_id: "token-id",
            extrinsic_index: "1-1",
          },
        ],
        hasNext: false,
      } as any)
      .mockResolvedValue({
        list: [],
        hasNext: false,
      });

    const result = await service.fetchAllTransfers("kusama", "address");

    expect(result).toEqual([
      {
        symbol: "KSM",
        amount: 123,
        from: "A",
        to: "B",
        label: "balances",
        block: 100,
        timestamp: 1600000000,
        hash: "0xhash",
        tokenId: "token-id",
        extrinsic_index: "1-1",
      },
    ]);
    expect(mockSubscanApi.fetchTransfers).toHaveBeenCalled();
  });

  it("fetches all accounts", async () => {
    mockSubscanApi.fetchAccounts.mockResolvedValue(["acc1", "acc2"]);

    const result = await service.fetchAccounts("0xabc", "polkadot");
    expect(result).toEqual(["acc1", "acc2"]);
    expect(mockSubscanApi.fetchAccounts).toHaveBeenCalledWith(
      "0xabc",
      "polkadot",
    );
  });
});
