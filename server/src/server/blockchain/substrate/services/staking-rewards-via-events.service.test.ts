import { SubscanService } from "../api/subscan.service";
import BigNumber from "bignumber.js";
import { expect, test, jest, describe, beforeEach } from "@jest/globals";
import { StakingRewardsViaEventsService } from "./staking-rewards-via-events.service";

jest.mock("../api/subscan.service");

describe("StakingRewardsViaEventsService", () => {
  let subscanServiceMock: jest.Mocked<SubscanService>;
  let rewardsService: StakingRewardsViaEventsService;

  beforeEach(() => {
    subscanServiceMock = {
      searchAllEvents: jest.fn(),
      fetchAllTransfers: jest.fn(),
    } as unknown as jest.Mocked<SubscanService>;

    rewardsService = new StakingRewardsViaEventsService(subscanServiceMock);
  });

  test("should return filtered and mapped staking rewards", async () => {
    const address = "5abc...";
    const blockMin = 100;
    const blockMax = 200;

    // Mocked event and transfer data
    const events = [{ extrinsic_hash: "0x123" }, { extrinsic_hash: "0x456" }];

    const transfers = [
      {
        hash: "0x123",
        amount: 1000,
        timestamp: 12345678,
        extrinsic_index: "150-1",
      },
      {
        hash: "0x456",
        amount: -500,
        timestamp: 12345679,
        extrinsic_index: "151-2",
      },
      {
        hash: "0x789",
        amount: 300,
        timestamp: 12345680,
        extrinsic_index: "152-0",
      },
    ];

    subscanServiceMock.searchAllEvents.mockResolvedValue(events as any);
    subscanServiceMock.fetchAllTransfers.mockResolvedValue(transfers as any);

    const rewards = await rewardsService.fetchStakingRewards(
      "mythos",
      address,
      "collatorstaking",
      "StakingRewardReceived",
      blockMin,
      blockMax,
    );

    expect(rewards).toEqual([
      {
        event_id: "Reward",
        amount: 1000,
        timestamp: 12345678,
        block: 150,
        hash: "0x123",
      },
      {
        event_id: "Slash",
        amount: -500,
        timestamp: 12345679,
        block: 151,
        hash: "0x456",
      },
    ]);

    expect(subscanServiceMock.searchAllEvents).toHaveBeenCalledWith(
      "mythos",
      address,
      "collatorstaking",
      "StakingRewardReceived",
      blockMin,
      blockMax,
    );

    expect(subscanServiceMock.fetchAllTransfers).toHaveBeenCalledWith(
      "mythos",
      address,
      blockMin,
      blockMax,
    );
  });
});
