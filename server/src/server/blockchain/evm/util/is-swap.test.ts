import { expect, test, describe, jest, beforeEach } from "@jest/globals";

import { isSwap } from "../util/is-swap";
import { TransferObject } from "../model/transfers";

describe("isSwap", () => {
  test("should return true when both received and sent tokens exist", () => {
    const transfer: TransferObject = {
      from: "0xabc",
      to: "0xdef",
      block: "1000",
      timestamp: "1700000000",
      tokens: {
        USDC: -50,
        DAI: 50,
      },
    } as unknown as TransferObject;
    expect(isSwap(transfer)).toBe(true);
  });

  test("should return false when only received tokens exist", () => {
    const transfer: TransferObject = {
      from: "0xabc",
      to: "0xdef",
      block: "1001",
      timestamp: "1700000001",
      tokens: {
        USDT: 30,
        BTC: 10,
      },
    } as unknown as TransferObject;
    expect(isSwap(transfer)).toBe(false);
  });

  test("should return false when only sent tokens exist", () => {
    const transfer: TransferObject = {
      from: "0xabc",
      to: "0xdef",
      block: "1002",
      timestamp: "1700000002",
      tokens: {
        ETH: -0.1,
      },
    } as unknown as TransferObject;
    expect(isSwap(transfer)).toBe(false);
  });

  test("should return false when no token transfer values exist", () => {
    const transfer: TransferObject = {
      from: "0xabc",
      to: "0xdef",
      block: "1003",
      timestamp: "1700000003",
      tokens: {
        USDC: 0,
        DAI: 0,
      },
    } as unknown as TransferObject;
    expect(isSwap(transfer)).toBe(false);
  });
});
