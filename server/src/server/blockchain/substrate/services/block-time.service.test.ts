import { expect, test } from "@jest/globals";
import { BlockTimeService } from "./block-time.service";

let blockTimeService: BlockTimeService;

const blocks = [];
const fistBlockStartTimestamp = Math.round(
  new Date("2024-01-01T00:00:00").getTime() / 1000,
);
for (let blockNum = 200000; blockNum > 0; blockNum--) {
  blocks.push({
    block_num: blockNum,
    block_timestamp: fistBlockStartTimestamp + 300 * blockNum,
    hash: String(Math.random()),
  });
}

const subscanApi = {
  fetchMetadata: () => {
    return { avgBlockTime: 300 };
  },
  fetchBlockList: () => {
    return blocks;
  },
  fetchBlock: (chainName, block_num) => {
    return blocks[blocks.length - block_num];
  },
};

test("should find block", async () => {
  blockTimeService = new BlockTimeService(subscanApi as any);
  const minDate = new Date("2024-06-01T00:00:00").getTime();
  const maxDate = new Date("2024-09-01T00:00:00").getTime();
  const { blockMin, blockMax } = await blockTimeService.getMinMaxBlock(
    "polkadot",
    minDate,
    maxDate,
  );
  const minBlock = blocks[blocks.length - blockMin];
  const maxBlock = blocks[blocks.length - blockMax];
  expect(
    Math.abs(minBlock.block_timestamp - minDate / 1000),
  ).toBeLessThanOrEqual(3 * 3 * 24 * 60 * 60 + 600);
  expect(
    Math.abs(maxBlock.block_timestamp - maxDate / 1000),
  ).toBeLessThanOrEqual(3 * 3 * 24 * 60 * 60 + 600);
  expect(maxBlock.block_timestamp).toBeGreaterThan(maxDate / 1000);
  expect(minBlock.block_timestamp).toBeLessThan(minDate / 1000);
});

test("should find block no latest date", async () => {
  blockTimeService = new BlockTimeService(subscanApi as any);
  const minDate = new Date("2024-06-01T00:00:00").getTime();
  const { blockMax } = await blockTimeService.getMinMaxBlock(
    "polkadot",
    minDate,
  );
  const maxBlock = blocks[blocks.length - blockMax];
  expect(
    Math.abs(maxBlock.block_timestamp - Date.now() / 1000),
  ).toBeLessThanOrEqual(3 * 3 * 24 * 60 * 60 + blocks[0].block_timestamp);
});

test("should return first block if start date lies very far in past", async () => {
  blockTimeService = new BlockTimeService(subscanApi as any);
  const minDate = new Date("2020-06-01T00:00:00").getTime();
  const { blockMin } = await blockTimeService.getMinMaxBlock(
    "polkadot",
    minDate,
  );
  expect(blockMin).toBe(1);
});
