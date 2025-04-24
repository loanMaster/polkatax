import { expect, test, describe, jest, beforeEach } from '@jest/globals';
import { extractSwaps } from '../util/extract-swaps';
import { extractPayments } from '../util/extract-payments';
import { logger } from '../../../common/logger/logger';
import { EvmTxService } from './evm-tx.service';
import { EvmSwapsAndPaymentsService } from './evm-swaps-and-payments.service';

jest.mock('../util/extract-swaps');
jest.mock('../util/extract-payments');
jest.mock('../../../common/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));
jest.mock('../constants/evm-chains.config', () => ({
  evmChainConfigs: {
    moonbeam: {
      nativeToken: 'GLMR',
      endpoint: 'https://fake-endpoint',
      apiKey: 'fake-api-key'
    }
  }
}));

describe('EvmSwapsAndPaymentsService', () => {
  const mockTxService: Partial<EvmTxService> = {
    fetchTxAndTransfers: jest.fn() as any
  };

  const service = new EvmSwapsAndPaymentsService(mockTxService as EvmTxService);

  const fakeTx = [{ hash: '0xabc', timeStamp: `${Math.floor(Date.now() / 1000)}` }];
  const fakeTransfers = [{ tokenSymbol: 'USDC', value: '1000' }];
  const mockSwaps = [{ type: 'swap', amount: '100' }];
  const mockPayments = [{ type: 'payment', amount: '50' }];

  beforeEach(() => {
    jest.clearAllMocks();
    (mockTxService.fetchTxAndTransfers as any).mockResolvedValue({
      tx: fakeTx,
      transfers: fakeTransfers
    });
    (extractSwaps as jest.Mock).mockReturnValue(mockSwaps);
    (extractPayments as jest.Mock).mockReturnValue(mockPayments);
  });

  test('should fetch swaps and payments correctly', async () => {
    const startDate = new Date(Date.now() - 10000);
    const endDate = new Date();

    const result = await service.fetchSwapsAndPayments('moonbeam', '0xTestAddress', startDate, endDate);

    expect(mockTxService.fetchTxAndTransfers).toHaveBeenCalledWith('moonbeam', '0xTestAddress', startDate, endDate);
    expect(extractSwaps).toHaveBeenCalledWith(fakeTx, fakeTransfers, '0xtestaddress', 'GLMR');
    expect(extractPayments).toHaveBeenCalledWith(fakeTx, fakeTransfers, '0xtestaddress', 'GLMR');
    expect(result).toEqual({ swaps: mockSwaps, payments: mockPayments });
  });

  test('should lowercase the address before using it', async () => {
    await service.fetchSwapsAndPayments('moonbeam', '0xABCDEF', new Date(), new Date());
    expect(extractSwaps).toHaveBeenCalledWith(expect.anything(), expect.anything(), '0xabcdef', expect.anything());
  });

  test('should log entry and exit', async () => {
    const start = new Date();
    const end = new Date();
    await service.fetchSwapsAndPayments('moonbeam', '0xTest', start, end);
    expect(logger.info).toHaveBeenCalledWith('Enter fetchSwapsAndPayments for moonbeam');
    expect(logger.info).toHaveBeenCalledWith('Exit fetchSwapsAndPayments for moonbeam');
  });
});