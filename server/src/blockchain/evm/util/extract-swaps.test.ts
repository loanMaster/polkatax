import { extractSwaps } from "../util/extract-swaps";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { mergeTransfersOfSameTx } from "../util/merge-transfers-of-same-tx";
import { isSwap } from "./is-swap";
import { processFunctionName } from "../../../common/util/process-function-name";
import { normalizeTokenName } from "../util/normalize-token-name";
import { expect, test, describe, jest, beforeEach } from '@jest/globals';

// Mocks
jest.mock("../util/merge-transfers-of-same-tx");
jest.mock("../util/is-swap");
jest.mock("../../../common/util/process-function-name");
jest.mock("../util/normalize-token-name");

describe("extractSwaps", () => {
  const walletAddress = "0xabc";
  const nativeToken = "GLMR";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return swaps", () => {
    const transfers: EVMTransfer[] = [
      {
        hash: "0x1",
        from: "0xabc",
        to: "0xdef",
        tokenSymbol: "USDC",
        tokenDecimal: "6",
        value: "1000000", // 1 GLMR
        block: "1234",
        timestamp: "1700000000"
      } as any
    ];

    const transactions: EVMTx[] = [
      {
        hash: "0x1",
        from: "0xabc",
        to: "0xcontract",
        value: "1000000000000000000",
        blockNumber: "1234",
        timeStamp: "1700000000",
        functionName: "swapExactTokensForTokens"
      }
    ] as EVMTx[];

    (mergeTransfersOfSameTx as jest.Mock).mockReturnValue({
      "0x1": {
        from: "0xabc",
        to: "0xdef",
        block: "1234",
        timestamp: "1700000000",
        tokens: { USDC: 10 }
      }
    });

    (isSwap as jest.Mock).mockReturnValue(true);
    (processFunctionName as jest.Mock).mockReturnValue("swapExactTokensForTokens");
    (normalizeTokenName as jest.Mock).mockImplementation((token: string) => token); // no-op

    const result = extractSwaps(transactions, transfers, walletAddress, nativeToken);

    expect(result).toEqual([
      {
        block: 1234,
        date: 1700000000,
        hash: "0x1",
        contract: "0xcontract",
        functionName: "swapExactTokensForTokens",
        tokens: {
          USDC: {
            amount: 10,
            type: "buy"
          },
          [nativeToken]: {
            amount: 1,
            type: "sell"
          }
        }
      }
    ]);
  });

  test("should ignore reward or payment transfers", () => {
    (mergeTransfersOfSameTx as jest.Mock).mockReturnValue({
      "0x3": {
        from: "0xabc",
        to: "0xdef",
        block: "7777",
        timestamp: "1707000000",
        tokens: { DAI: 5 }
      }
    });

    (isSwap as jest.Mock).mockReturnValue(false); // Should be ignored

    const result = extractSwaps(
      [
        {
          hash: "0x3",
          from: "0xabc",
          to: "0xcontract",
          value: "0",
          blockNumber: "7777",
          timeStamp: "1707000000",
          functionName: "unknown"
        }
      ] as EVMTx[],
      [],
      walletAddress,
      nativeToken
    );

    expect(result).toEqual([]);
  });
});