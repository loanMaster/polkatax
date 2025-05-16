import { TokenPriceConversionService } from "./token-price-conversion.service";
import { PaymentsRequest } from "../model/payments.request";
import { PaymentsResponse } from "../model/payments.response";
import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";
import { SwapsAndTransfersService } from "../../blockchain/substrate/services/swaps-and-transfers.service";
import { EvmSwapsAndPaymentsService } from "../../blockchain/evm/service/evm-swaps-and-payments.service";
import { validateDates } from "../../../common/util/validate-dates";
import { HttpError } from "../../../common/error/HttpError";
import * as subscanChains from "../../../../res/gen/subscan-chains.json";
import * as substrateTokenToCoingeckoId from "../../../../res/substrate-token-to-coingecko-id.json";
import { logger } from "../../logger/logger";
import { addFiatValuesToTransferDtoList } from "../helper/add-fiat-values-to-transfer-dto-list";
import { addFiatValuesToTx } from "../helper/add-fiat-values-to-tx";
import { TransferClassifier } from "../helper/transfer-classifier";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";
import { CoingeckoIdLookupService } from "./coingecko-id-lookup.service";
import { TransferDto } from "src/server/blockchain/substrate/model/raw-transfer";
import { Transaction } from "src/server/blockchain/substrate/model/transaction";
import { TransferWithFiatValue } from "../model/priced-transfer";

export class PaymentsService {
  constructor(
    private swapsAndTransfersService: SwapsAndTransfersService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private evmSwapsAndPaymentsService: EvmSwapsAndPaymentsService,
    private transferClassifier: TransferClassifier,
    private subscanService: SubscanService,
    private coingeckoIdLookupService: CoingeckoIdLookupService
  ) {}

  private findCoingeckoIdForNativeToken(chainName: string): string | undefined  {
    if (evmChainConfigs[chainName]) {
      return evmChainConfigs[chainName]?.nativeTokenCoingeckoId
    } else {
      substrateTokenToCoingeckoId.tokens.find(t => t.token === subscanChains[chainName].token.toUpperCase())?.coingeckoId
    }
  }

  async processTask(
    paymentsRequest: PaymentsRequest,
  ): Promise<PaymentsResponse> {
    logger.info("PaymentsService: Enter processess Task");
    let { startDay, endDay, chainName, address, currency } = paymentsRequest;

    validateDates(startDay, endDay);
    endDay = endDay && endDay < new Date() ? endDay : new Date();
    if (
      !evmChainConfigs[chainName.toLocaleLowerCase()] &&
      !subscanChains.chains.find((p) => p.domain === chainName)
    ) {
      throw new HttpError(400, "Chain " + chainName + " not found");
    }

    const evmChainConfig = evmChainConfigs[chainName.toLocaleLowerCase()];
    const { transactions, transfersList }: { transactions: Transaction[], transfersList: TransferWithFiatValue[] } = evmChainConfig
      ? await this.evmSwapsAndPaymentsService.fetchSwapsAndPayments(paymentsRequest)
      : await this.swapsAndTransfersService.fetchSwapsAndTransfers(paymentsRequest);

    const nativeTokenCoingeckoId = this.findCoingeckoIdForNativeToken(chainName)

    const coingeckoIds = this.coingeckoIdLookupService.addCoingeckoIds(transfersList)

    const quotes = await this.tokenPriceConversionService.fetchQuotesForTokens(
      nativeTokenCoingeckoId ? [...coingeckoIds, nativeTokenCoingeckoId] : coingeckoIds,
      chainName,
      currency,
    );

    addFiatValuesToTransferDtoList(transfersList, quotes)
    addFiatValuesToTx(transactions, quotes[nativeTokenCoingeckoId])
    
    const aliases = await this.subscanService.fetchAccounts(
      address,
      chainName,
    );
    const { payments, swaps } = this.transferClassifier.extractSwapsAndPayments(transactions, transfersList, address, aliases)

    const currentPrices = {};
    Object.keys(quotes).forEach(
      (token) => (currentPrices[token] = quotes[token].quotes.latest),
    );
    logger.info("PaymentsService: Exit processess Task");
    return { currentPrices, swaps, transfers: payments };
  }
}
