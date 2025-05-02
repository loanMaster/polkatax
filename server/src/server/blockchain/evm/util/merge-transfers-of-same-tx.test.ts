import { mergeTransfersOfSameTx } from "../util/merge-transfers-of-same-tx";
import { EVMTransfer } from "../model/transfers";
import { expect, test, describe, jest } from "@jest/globals";

jest.mock("../util/normalize-token-name", () => ({
  normalizeTokenName: (symbol: string) => symbol.toUpperCase(), // mock normalize behavior
}));

describe("mergeTransfersOfSameTx", () => {
  const walletAddress = "0xabc";

  test("should correctly merge transfers from the same transaction", () => {
    const transfers: EVMTransfer[] = [
      {
        from: walletAddress,
        to: "0x123",
        hash: "0xhash1",
        tokenSymbol: "usdc",
        tokenDecimal: "6",
        value: "1000000", // 1 USDC
        blockNumber: "123",
        timeStamp: "1700000000",
      },
      {
        from: "0x456",
        to: walletAddress,
        hash: "0xhash1",
        tokenSymbol: "eth",
        tokenDecimal: "18",
        value: "1000000000000000000", // 1 ETH
        blockNumber: "123",
        timeStamp: "1700000000",
      },
    ] as EVMTransfer[];

    const result = mergeTransfersOfSameTx(transfers, walletAddress);

    expect(result).toEqual({
      "0xhash1": {
        from: walletAddress,
        to: "0x123",
        block: 123,
        hash: "0xhash1",
        timestamp: 1700000000,
        functionName: "",
        tokens: {
          USDC: -1,
          ETH: 1,
        },
      },
    });
  });

  test("should ignore transfers not involving the wallet", () => {
    const transfers: EVMTransfer[] = [
      {
        from: "0x111",
        to: "0x222",
        hash: "0xhash2",
        tokenSymbol: "dai",
        tokenDecimal: "18",
        value: "1000000000000000000",
        blockNumber: "321",
        timeStamp: "1700000001",
      },
    ] as EVMTransfer[];

    const result = mergeTransfersOfSameTx(transfers, walletAddress);
    expect(result["0xhash2"].tokens.DAI).toBe(0);
  });

  test("should accumulate token values of the same symbol in one transaction", () => {
    const transfers: EVMTransfer[] = [
      {
        from: "0x123",
        to: walletAddress,
        hash: "0xhash3",
        tokenSymbol: "usdt",
        tokenDecimal: "6",
        value: "1000000", // 1 USDT
        blockNumber: "456",
        timeStamp: "1700000002",
      },
      {
        from: "0x456",
        to: walletAddress,
        hash: "0xhash3",
        tokenSymbol: "usdt",
        tokenDecimal: "6",
        value: "2000000", // 2 USDT
        blockNumber: "456",
        timeStamp: "1700000002",
      },
    ] as EVMTransfer[];

    const result = mergeTransfersOfSameTx(transfers, walletAddress);
    expect(result["0xhash3"].tokens.USDT).toBe(3); // 1 + 2
  });
});
