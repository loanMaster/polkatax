import { expect, test, describe, jest, beforeEach } from "@jest/globals";
import { extractPayments } from "../util/extract-payments";
import { EVMTransfer, EVMTx } from "../model/transfers";
import { mergeTransfersOfSameTx } from "../util/merge-transfers-of-same-tx";
import { isSwap } from "./is-swap";
import { processFunctionName } from "../../../../common/util/process-function-name";
import { TokenTransfers } from "../../../../model/token-transfer";

jest.mock("../util/merge-transfers-of-same-tx");
jest.mock("../util/is-swap");
jest.mock("../../../../common/util/process-function-name");

describe("extractPayments", () => {
  const walletAddress = "0xabc";
  const nativeToken = "GLMR";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return structured token transfers from EVM transfers and transactions", () => {
    const transfers: EVMTransfer[] = [
      {
        hash: "0x123",
        from: "0xabc",
        to: "0xdef",
        tokenSymbol: "USDC",
        tokenDecimal: "6",
        value: "1000000",
        block: "1000",
        timestamp: "1670000000",
      } as any,
    ];

    const transactions: EVMTx[] = [
      {
        hash: "0x123",
        from: "0xabc",
        to: "0xdef",
        value: "1000000000000000000", // 1 GLMR
        blockNumber: "1000",
        timeStamp: "1670000000",
        functionName: "transfer(address,uint256)",
      },
    ] as EVMTx[];

    // Mocked merged result
    (mergeTransfersOfSameTx as jest.Mock).mockReturnValue({
      "0x123": {
        from: "0xabc",
        to: "0xdef",
        block: "1000",
        timestamp: "1670000000",
        tokens: { USDC: 1 },
      },
    });

    (isSwap as jest.Mock).mockReturnValue(false);
    (processFunctionName as jest.Mock).mockReturnValue("transfer");

    const result: TokenTransfers = extractPayments(
      transactions,
      transfers,
      walletAddress,
      nativeToken,
    );

    expect(mergeTransfersOfSameTx).toHaveBeenCalledWith(
      transfers,
      walletAddress,
    );
    expect(isSwap).toHaveBeenCalled();
    expect(processFunctionName).toHaveBeenCalledWith(
      "transfer(address,uint256)",
    );

    expect(result).toEqual({
      USDC: [
        {
          block: 1000,
          date: 1670000000,
          hash: "0x123",
          from: "0xabc",
          to: "0xdef",
          functionName: "transfer",
          amount: 1,
        },
      ],
      GLMR: [
        {
          block: 1000,
          date: 1670000000,
          hash: "0x123",
          from: "0xabc",
          to: "0xdef",
          functionName: "transfer",
          amount: -1,
        },
      ],
    });
  });

  test("should add native transfers when no matching transfer exists", () => {
    const transfers: EVMTransfer[] = [];
    const transactions: EVMTx[] = [
      {
        hash: "0x456",
        from: "0xabc",
        to: "0xdef",
        value: "2000000000000000000", // 2 GLMR
        blockNumber: "1234",
        timeStamp: "1680000000",
        functionName: "mint()",
      },
    ] as EVMTx[];

    (mergeTransfersOfSameTx as jest.Mock).mockReturnValue({});
    (processFunctionName as jest.Mock).mockReturnValue("mint");

    const result = extractPayments(
      transactions,
      transfers,
      walletAddress,
      nativeToken,
    );

    expect(result).toEqual({
      GLMR: [
        {
          block: 1234,
          date: 1680000000,
          hash: "0x456",
          from: "0xabc",
          to: "0xdef",
          functionName: "mint",
          amount: -2,
        },
      ],
    });
  });
});
