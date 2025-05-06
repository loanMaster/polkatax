import { BlockTimeService } from "./block-time.service";
import { SubscanService } from "../api/subscan.service";
import { TransferMerger } from "../util/transfer-merger";
import { TransferClassifier } from "../util/transfer-classifier";
import { ChainAdjustments } from "../util/chain-adjustments";
import { expect, jest, describe, beforeEach, test } from "@jest/globals";
import { SwapsAndTransfersService } from "./swaps-and-transfers.service";
import { Swap } from "../../../../model/swap";
import { Transaction } from "../model/transaction";
import { Transfers } from "../model/transfer";

jest.mock("../../../logger/logger", () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe("SwapsAndTransfersService", () => {
  let service: SwapsAndTransfersService;
  let mockBlockTimeService: jest.Mocked<BlockTimeService>;
  let mockSubscanService: jest.Mocked<SubscanService>;
  let mockTransferMerger: jest.Mocked<TransferMerger>;
  let mockTransferClassifier: jest.Mocked<TransferClassifier>;
  let mockChainAdjustments: jest.Mocked<ChainAdjustments>;

  beforeEach(() => {
    mockBlockTimeService = {
      getMinMaxBlock: jest.fn(),
    } as any;

    mockSubscanService = {
      fetchAllTx: jest.fn(),
      fetchAllTransfers: jest.fn(),
      mapToSubstrateAccount: jest.fn(),
    } as any;

    mockTransferMerger = {
      merge: jest.fn(),
    } as any;

    mockTransferClassifier = {
      extractPayments: jest.fn(),
      extractSwaps: jest.fn(),
    } as any;

    mockChainAdjustments = {
      handleHydration: jest.fn(),
    } as any;

    service = new SwapsAndTransfersService(
      mockBlockTimeService,
      mockSubscanService,
      mockTransferClassifier,
      mockTransferMerger,
      mockChainAdjustments,
    );
  });

  test("should fetch swaps and payments and apply filtering", async () => {
    const fakeTxs = [
      { hash: "0x1", block_timestamp: 1700000000, block_num: 100 },
    ];
    const fakeTransfers = {
      "0x1": {
        DOT: {
          amount: 1,
          timestamp: 1700000000,
          block: 100,
          from: "A",
          to: "B",
          functionName: "transfer",
        },
      },
    };

    const swaps = [{ hash: "0x1", date: 1700000000 }] as any;
    const payments = {
      dot: [
        {
          date: 1700000000,
          amount: 1,
          hash: "0x1",
          from: "A",
          to: "B",
          block: 100,
          functionName: "transfer",
        },
      ],
    };

    mockSubscanService.mapToSubstrateAccount.mockResolvedValue(
      "substrate-addr",
    );
    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 10,
      blockMax: 999,
    });
    mockSubscanService.fetchAllTx.mockResolvedValue(fakeTxs as Transaction[]);
    mockSubscanService.fetchAllTransfers.mockResolvedValue(
      fakeTransfers as unknown as Transfers,
    );
    mockTransferClassifier.extractSwaps.mockReturnValue(swaps);
    mockTransferClassifier.extractPayments.mockReturnValue(payments);

    const result = await service.fetchSwapsAndTransfers(
      "polkadot",
      "0xabc",
      new Date("2023-11-10T00:00:00Z"),
    );

    expect(mockSubscanService.mapToSubstrateAccount).toHaveBeenCalledWith(
      "polkadot",
      "0xabc",
    );
    expect(mockBlockTimeService.getMinMaxBlock).toHaveBeenCalled();
    expect(mockTransferClassifier.extractSwaps).toHaveBeenCalled();
    expect(mockTransferClassifier.extractPayments).toHaveBeenCalled();
    expect(result.swaps.length).toBe(1);
    expect(result.payments.dot.length).toBe(1);
  });

  test("should call hydration adjustment only for hydration chain", async () => {
    mockSubscanService.mapToSubstrateAccount.mockResolvedValue(
      "substrate-addr",
    );
    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 10,
      blockMax: 999,
    });
    mockSubscanService.fetchAllTx.mockResolvedValue([
      { hash: "x", block_timestamp: 1700000000, block_num: 99 },
    ] as Transaction[]);
    mockSubscanService.fetchAllTransfers.mockResolvedValue({});
    mockTransferClassifier.extractSwaps.mockReturnValue([
      { hash: "x", date: 1700000000 },
    ] as Swap[]);
    mockTransferClassifier.extractPayments.mockReturnValue({});

    await service.fetchSwapsAndTransfers(
      "hydration",
      "0xabc",
      new Date("2023-11-10"),
    );

    expect(mockChainAdjustments.handleHydration).toHaveBeenCalled();
  });

  test("should return empty arrays when no data available", async () => {
    mockSubscanService.mapToSubstrateAccount.mockResolvedValue(
      "substrate-addr",
    );
    mockBlockTimeService.getMinMaxBlock.mockResolvedValue({
      blockMin: 10,
      blockMax: 999,
    });
    mockSubscanService.fetchAllTx.mockResolvedValue([]);
    mockSubscanService.fetchAllTransfers.mockResolvedValue({});
    mockTransferClassifier.extractSwaps.mockReturnValue([]);
    mockTransferClassifier.extractPayments.mockReturnValue({});

    const result = await service.fetchSwapsAndTransfers(
      "kusama",
      "substrate-addr",
      new Date("2023-01-01"),
    );

    expect(result.swaps).toEqual([]);
    expect(result.payments).toEqual({});
  });
});
