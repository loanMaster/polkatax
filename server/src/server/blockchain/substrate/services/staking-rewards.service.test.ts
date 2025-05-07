import { StakingRewardsService } from "./staking-rewards.service";
import { BlockTimeService } from "./block-time.service";
import { SubscanService } from "../api/subscan.service";
import { HttpError } from "../../../../common/error/HttpError";
import { expect, test, jest, describe, beforeEach } from "@jest/globals";
import { Token } from "../model/token";
import { BigNumber } from "bignumber.js";

jest.mock("../../../logger/logger", () => ({
  logger: { info: jest.fn() },
}));

describe("StakingRewardsService", () => {
  let service: StakingRewardsService;
  let blockTimeService: jest.Mocked<BlockTimeService>;
  let subscanService: jest.Mocked<SubscanService>;

  beforeEach(() => {
    blockTimeService = {
      getMinMaxBlock: jest.fn(),
    } as any;

    subscanService = {
      fetchAllStakingRewards: jest.fn(),
      fetchAllPoolStakingRewards: jest.fn(),
      fetchNativeToken: jest.fn(),
    } as any;

    service = new StakingRewardsService(blockTimeService, subscanService);
  });

  describe("fetchStakingRewards", () => {
    test("should fetch and filter rewards properly", async () => {
      blockTimeService.getMinMaxBlock.mockResolvedValue({
        blockMin: 100,
        blockMax: 200,
      });
      subscanService.fetchAllStakingRewards.mockResolvedValue([
        {
          event_id: "Reward",
          block_timestamp: 1700000000,
          block_num: 150,
          amount: new BigNumber("1000000000000"),
          hash: "abc",
        },
      ]);
      subscanService.fetchNativeToken.mockResolvedValue({
        token_decimals: 12,
      } as Token);

      const result = await service.fetchStakingRewards(
        "polkadot",
        "address1",
        1699999999000,
      );

      expect(result).toEqual([
        {
          block: 150,
          date: 1700000000,
          amount: 1,
          hash: "abc",
        },
      ]);
    });

    test("should handle Slash event", async () => {
      blockTimeService.getMinMaxBlock.mockResolvedValue({
        blockMin: 100,
        blockMax: 200,
      });
      subscanService.fetchAllStakingRewards.mockResolvedValue([
        {
          event_id: "Slash",
          block_timestamp: 1700000000,
          block_num: 150,
          amount: new BigNumber("1000000000000"),
          hash: "abc",
        },
      ]);
      subscanService.fetchNativeToken.mockResolvedValue({
        token_decimals: 12,
      } as Token);

      const result = await service.fetchStakingRewards(
        "kusama",
        "addr2",
        1699999999000,
      );

      expect(result).toEqual([
        {
          block: 150,
          date: 1700000000,
          amount: -1,
          hash: "abc",
        },
      ]);
    });
  });

  describe("fetchNominationPoolRewards", () => {
    test("should fetch and filter pool rewards", async () => {
      subscanService.fetchAllPoolStakingRewards.mockResolvedValue([
        {
          event_id: "Reward",
          block_timestamp: 1700000001,
          block_num: 160,
          amount: new BigNumber("500000000000"),
          hash: "def",
        },
      ]);
      subscanService.fetchNativeToken.mockResolvedValue({
        token_decimals: 12,
      } as Token);

      const result = await service.fetchNominationPoolRewards(
        "moonbeam",
        "addr3",
        5,
        1699999999000,
      );

      expect(result).toEqual([
        {
          block: 160,
          date: 1700000001,
          amount: 0.5,
          hash: "def",
        },
      ]);
    });
  });
});
