import { beforeEach, expect, test, jest } from "@jest/globals";
import { BigNumber } from "bignumber.js";
import { SubscanService } from "./subscan.service";

let subscanService: SubscanService;

beforeEach(() => {
  process.env["SUBSCAN_API_KEY"] = "my-key";
});

test("should fetchAllStakingRewards", async () => {
  const subscanApi = {
    fetchStakingRewards: async (
      chainName: string,
      address: string,
      page: number = 0,
      isStash: boolean,
      block_min?: number,
      block_max?: number,
    ) => {
      switch (page) {
        case 0:
          return {
            list: [
              {
                event_id: "Reward",
                amount: BigNumber(1),
                block_timestamp: 12,
                block_num: 33,
                hash: "1",
              },
            ],
            hasNext: true,
          };
        case 1:
          return {
            list: [
              {
                event_id: "Reward",
                amount: BigNumber(1),
                block_timestamp: 12,
                block_num: 33,
                hash: "2",
              },
            ],
            hasNext: false,
          };
        default:
          return {
            list: [],
            hasNext: false,
          };
      }
    },
  };
  const spy = jest.spyOn(subscanApi, "fetchStakingRewards");
  subscanService = new SubscanService(subscanApi as any);
  const stakingRewards = await subscanService.fetchAllStakingRewards(
    "polkadot",
    "alice",
    100,
    200,
  );
  expect(stakingRewards.length).toBe(2);
  expect(stakingRewards[0]).toEqual({
    event_id: "Reward",
    amount: BigNumber(1),
    block_timestamp: 12,
    block_num: 33,
    hash: "1",
  });
  expect(stakingRewards[1]).toEqual({
    event_id: "Reward",
    amount: BigNumber(1),
    block_timestamp: 12,
    block_num: 33,
    hash: "2",
  });
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 0, true, 100, 200);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 1, true, 100, 200);
});

test("should fetchAllPoolStakingRewards", async () => {
  const subscanApi = {
    fetchPoolStakingRewards: async (chainName, address, poolId, page) => {
      if (page === 0) {
        return {
          list: ["a", "b"],
          hasNext: true,
        };
      } else if (page === 1) {
        return {
          list: ["c"],
          hasNext: false,
        };
      } else {
        return {
          list: [],
          hasNext: false,
        };
      }
    },
  };
  const spy = jest.spyOn(subscanApi, "fetchPoolStakingRewards");
  subscanService = new SubscanService(subscanApi as any);
  const stakingRewards = await subscanService.fetchAllPoolStakingRewards(
    "polkadot",
    "alice",
    2,
  );
  expect(stakingRewards.length).toBe(3);
  expect(stakingRewards).toEqual(["a", "b", "c"]);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 2, 0);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 2, 1);
});

test("should fetchAllTx", async () => {
  const subscanApi = {
    fetchExtrinsics: async (
      chainName: string,
      address: string,
      page: number = 0,
      block_min?: number,
      block_max?: number,
      evm = false,
    ) => {
      if (page === 0) {
        return {
          list: ["a", "d"],
          hasNext: true,
        };
      } else if (page === 1) {
        return {
          list: ["k"],
          hasNext: false,
        };
      } else {
        return {
          list: [],
          hasNext: false,
        };
      }
    },
  };
  const spy = jest.spyOn(subscanApi, "fetchExtrinsics");
  subscanService = new SubscanService(subscanApi as any);
  const tx = await subscanService.fetchAllTx(
    "polkadot",
    "alice",
    10,
    20,
    false,
  );
  expect(tx.length).toBe(3);
  expect(tx).toEqual(["a", "d", "k"]);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 0, 10, 20, false);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 1, 10, 20, false);
});

test("should fetchAllTransfers", async () => {
  const subscanApi = {
    fetchTransfers: async (
      chainName: string,
      account: string,
      page: number = 0,
      block_min?: number,
      block_max?: number,
      evm = false,
    ) => {
      if (page === 0) {
        return {
          list: [{ a: 0 }, { b: 1 }],
          hasNext: true,
        };
      } else if (page === 1) {
        return {
          list: [{ c: 3 }],
          hasNext: false,
        };
      } else {
        return {
          list: [],
          hasNext: false,
        };
      }
    },
  };
  subscanService = new SubscanService(subscanApi as any);
  const tx = await subscanService.fetchAllTransfers(
    "polkadot",
    "Ally",
    10,
    20,
    false,
  );
  expect(tx).toEqual([{ a: 0 }, { b: 1 }, { c: 3 }]);
});
