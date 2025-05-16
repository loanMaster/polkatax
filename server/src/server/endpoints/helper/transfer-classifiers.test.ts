import { TransferClassifier } from "./transfer-classifier";
import { Transfers } from "../model/transfer";
import { Transaction } from "../../blockchain/substrate/model/transaction";
import { test, expect, describe, beforeEach, jest } from "@jest/globals";

jest.mock("../../../../common/util/process-function-name", () => ({
  processFunctionName: (fn: string) => fn?.toUpperCase() || "",
}));

describe("TransferClassifier", () => {
  let classifier: TransferClassifier;

  beforeEach(() => {
    classifier = new TransferClassifier();
  });

  describe("extractPayments", () => {
    test("should extract payments when transfers are one-directional", () => {
      const transfers: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 100,
            block: 1,
            timestamp: 123456,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;

      const transactions: Transaction[] = [
        {
          hash: "tx1",
          functionName: "transfer",
          block_num: 1,
          block_timestamp: 123456,
          callModule: "balances",
        },
      ] as Transaction[];

      const result = classifier.extractPayments(transactions, transfers);

      expect(result).toEqual({
        dot: [
          {
            hash: "tx1",
            from: "alice",
            to: "bob",
            block: 1,
            date: 123456,
            amount: 100,
            functionName: "TRANSFER",
          },
        ],
      });
    });

    test("should skip if both sent and received exist (swap)", () => {
      const transfers: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 100,
            block: 1,
            timestamp: 123,
            functionName: "transfer",
          },
          KSM: {
            from: "bob",
            to: "alice",
            amount: -50,
            block: 1,
            timestamp: 123,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;
      const result = classifier.extractPayments([], transfers);
      expect(result).toEqual({});
    });
  });

  describe("extractSwaps", () => {
    test("should extract swaps when transfers are bi-directional", () => {
      const transfers: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "dex",
            amount: -100,
            block: 2,
            timestamp: 1111,
            functionName: "swap",
          },
          KSM: {
            from: "dex",
            to: "alice",
            amount: 50,
            block: 2,
            timestamp: 1111,
            functionName: "swap",
          },
        },
      } as unknown as Transfers;

      const transactions: Transaction[] = [
        {
          hash: "tx1",
          functionName: "swap",
          block_num: 2,
          block_timestamp: 1111,
          callModule: "dex",
        },
      ] as Transaction[];

      const result = classifier.extractSwaps(transactions, transfers);

      expect(result).toEqual([
        {
          hash: "tx1",
          block: 2,
          date: 1111,
          functionName: "SWAP",
          contract: "dex",
          tokens: {
            dot: { amount: 100, type: "sell" },
            ksm: { amount: 50, type: "buy" },
          },
        },
      ]);
    });

    test("should fill in block/date from transfer if transaction missing", () => {
      const transfers: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: -10,
            block: 5,
            timestamp: 9999,
            functionName: "swap",
          },
          KSM: {
            from: "bob",
            to: "alice",
            amount: 10,
            block: 5,
            timestamp: 9999,
            functionName: "swap",
          },
        },
      } as unknown as Transfers;

      const result = classifier.extractSwaps([], transfers);

      expect(result[0].block).toBe(5);
      expect(result[0].date).toBe(9999);
      expect(result[0].functionName).toBe("SWAP");
    });
  });
});
