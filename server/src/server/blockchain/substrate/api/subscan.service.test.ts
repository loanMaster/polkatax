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
      row: number = 100,
      page: number = 0,
      isStash: boolean,
      block_min?: number,
      block_max?: number,
    ) => {
      if (page === 0) {
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
      } else {
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
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 100, 0, true, 100, 200);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 100, 1, true, 100, 200);
});

test("should fetchAllPoolStakingRewards", async () => {
  const subscanApi = {
    fetchPoolStakingRewards: async (
      chainName,
      address,
      poolId,
      count,
      page,
    ) => {
      if (page === 0) {
        return {
          list: ["a", "b"],
          hasNext: true,
        };
      } else {
        return {
          list: ["c"],
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
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 2, 100, 0);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 2, 100, 1);
});

test("should fetchAllTx", async () => {
  const subscanApi = {
    fetchExtrinsics: async (
      chainName: string,
      address: string,
      row: number = 100,
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
      } else {
        return {
          list: ["k"],
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
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 100, 0, 10, 20, false);
  expect(spy).toHaveBeenCalledWith("polkadot", "alice", 100, 1, 10, 20, false);
});

test("should fetchAllTransfers", async () => {
  const subscanApi = {
    fetchAccounts: async () => {
      return ["alice", "alise"];
    },
    fetchTransfers: async (
      chainName: string,
      account: string,
      isMyAccount: (string) => boolean,
      row: number = 100,
      page: number = 0,
      block_min?: number,
      block_max?: number,
      evm = false,
    ) => {
      expect(isMyAccount("bob")).toBeFalsy();
      expect(isMyAccount("alice")).toBeTruthy();
      expect(isMyAccount("Alise")).toBeTruthy();
      expect(isMyAccount("Ally")).toBeTruthy();
      if (page === 0) {
        return {
          list: [{ a: 0, b: 1 }],
          hasNext: true,
        };
      } else {
        return {
          list: [{ c: 3 }],
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
  expect(tx).toEqual({
    a: 0,
    b: 1,
    c: 3,
  });
});
