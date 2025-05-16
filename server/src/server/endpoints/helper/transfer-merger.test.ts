import { TransferMerger } from "./transfer-merger";
import { Transfers } from "../model/transfer";
import { test, expect, describe, beforeEach } from "@jest/globals";

describe("TransferMerger", () => {
  let merger: TransferMerger;

  beforeEach(() => {
    merger = new TransferMerger();
  });

  describe("merge two transfer objects", () => {
    test("should merge two Transfers correctly", () => {
      const target: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 100,
            block: 1,
            timestamp: 1000,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;

      const source: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 50,
            block: 1,
            timestamp: 1000,
            functionName: "transfer",
          },
          KSM: {
            from: "carol",
            to: "dave",
            amount: 25,
            block: 2,
            timestamp: 2000,
            functionName: "transfer",
          },
        },
        tx2: {
          DOT: {
            from: "eve",
            to: "frank",
            amount: 75,
            block: 3,
            timestamp: 3000,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;

      const result = merger.merge(target, source);

      expect(result).toEqual({
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 150,
            block: 1,
            timestamp: 1000,
            functionName: "transfer",
          },
          KSM: {
            from: "carol",
            to: "dave",
            amount: 25,
            block: 2,
            timestamp: 2000,
            functionName: "transfer",
          },
        },
        tx2: {
          DOT: {
            from: "eve",
            to: "frank",
            amount: 75,
            block: 3,
            timestamp: 3000,
            functionName: "transfer",
          },
        },
      });
    });

    test("should handle empty target gracefully", () => {
      const target: Transfers = {};

      const source: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 100,
            block: 1,
            timestamp: 1000,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;

      const result = merger.merge(target, source);

      expect(result).toEqual(source);
    });

    test("should create missing token entries with amount 0 before adding", () => {
      const target: Transfers = {
        tx1: {},
      };

      const source: Transfers = {
        tx1: {
          DOT: {
            from: "alice",
            to: "bob",
            amount: 50,
            block: 1,
            timestamp: 1000,
            functionName: "transfer",
          },
        },
      } as unknown as Transfers;

      const result = merger.merge(target, source);

      expect(result["tx1"]["DOT"].amount).toBe(50);
    });
  });

  describe("mergeTranferListToObject", () => {
    const mockIsMyAccount = (addr: string) => addr === "myAddress";

    test("should merge substrate transfers correctly", () => {
      const input = [
        {
          from: "someoneElse",
          to: "myAddress",
          amount: "100",
          hash: "0xabc",
          asset_symbol: "DOT",
          module: "balances",
          block_num: 123,
          block_timestamp: 456789,
        },
      ];

      const result = merger.mergeTranferListToObject(
        input as any,
        "myAddress",
        mockIsMyAccount,
      );

      expect(result).toEqual({
        "0xabc": {
          DOT: {
            amount: 100,
            from: "someoneElse",
            to: "myAddress",
            functionName: "balances",
            block: 123,
            timestamp: 456789,
            hash: "0xabc",
          },
        },
      });
    });

    test("should merge evm transfers correctly after mapping", () => {
      const input = [
        {
          from: "myAddress",
          to: "0xReceiver",
          value: "1000000000000000000",
          hash: "0xdef",
          symbol: "ETH",
          decimals: 18,
          create_at: 987654,
          block_num: 321,
          to_display: {
            evm_contract: {
              contract_name: "Transfer",
            },
          },
        },
      ];

      const result = merger.mergeTranferListToObject(
        input,
        "myAddress",
        mockIsMyAccount,
      );

      expect(result).toEqual({
        "0xdef": {
          ETH: {
            amount: -1,
            from: "myAddress",
            to: "0xReceiver",
            functionName: "Transfer",
            block: 321,
            timestamp: 987654,
            hash: "0xdef",
          },
        },
      });
    });

    test("should skip entries without hash", () => {
      const input = [
        {
          from: "a",
          to: "b",
          amount: "10",
          hash: "",
          asset_symbol: "ABC",
          module: "test",
          block_num: 10,
          block_timestamp: 999,
        },
      ];

      const result = merger.mergeTranferListToObject(
        input as any,
        "myAddress",
        mockIsMyAccount,
      );

      expect(result).toEqual({});
    });
  });
});
