import { expect, it, describe, beforeEach } from "@jest/globals";

import { Swap } from "../model/swap";
import { ChainAdjustments } from "./chain-adjustments";

describe("ChainAdjustments.handleHydration", () => {
  let chainAdjustments: ChainAdjustments;

  beforeEach(() => {
    chainAdjustments = new ChainAdjustments();
  });

  it("should remove '2-pool' if it's among multiple sold tokens", () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { amount: -100, symbol: "2-pool" },
          { amount: -50, symbol: "DAI" },
          { amount: 150, symbol: "USDC" },
        ],
      } as any,
    ];

    chainAdjustments.handleHydration(swaps);

    const symbols = swaps[0].transfers.map((t) => t.symbol);
    expect(symbols).not.toContain("2-pool");
    expect(symbols).toEqual(["DAI", "USDC"]);
  });

  it("should remove '4-pool' if it's among multiple bought tokens", () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { amount: -200, symbol: "USDT" },
          { amount: 100, symbol: "DAI" },
          { amount: 100, symbol: "4-pool" },
        ],
      } as any,
    ];

    chainAdjustments.handleHydration(swaps);

    const symbols = swaps[0].transfers.map((t) => t.symbol);
    expect(symbols).not.toContain("4-pool");
    expect(symbols).toEqual(["USDT", "DAI"]);
  });

  it("should not remove pool tokens if only one is sold or bought", () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { amount: -100, symbol: "2-pool" },
          { amount: 100, symbol: "DAI" },
        ],
      } as any,
    ];

    chainAdjustments.handleHydration(swaps);

    const symbols = swaps[0].transfers.map((t) => t.symbol);
    expect(symbols).toEqual(["2-pool", "DAI"]);
  });

  it("should not alter swaps with 2 or fewer transfers", () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { amount: -50, symbol: "DAI" },
          { amount: 50, symbol: "USDC" },
        ],
      } as any,
    ];

    chainAdjustments.handleHydration(swaps);

    const symbols = swaps[0].transfers.map((t) => t.symbol);
    expect(symbols).toEqual(["DAI", "USDC"]);
  });

  it("should remove both '2-pool' and '4-pool' if applicable", () => {
    const swaps: Swap[] = [
      {
        transfers: [
          { amount: -50, symbol: "2-pool" },
          { amount: -50, symbol: "DAI" },
          { amount: 25, symbol: "4-pool" },
          { amount: 75, symbol: "USDC" },
        ],
      } as any,
    ];

    chainAdjustments.handleHydration(swaps);

    const symbols = swaps[0].transfers.map((t) => t.symbol);
    expect(symbols).toEqual(["DAI", "USDC"]);
  });
});
