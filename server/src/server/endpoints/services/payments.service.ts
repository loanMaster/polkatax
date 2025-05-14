import { TokenPriceConversionService } from "./token-price-conversion.service";
import { PaymentsRequest } from "../model/payments.request";
import { PaymentsResponse } from "../model/payments.response";
import { evmChainConfigs } from "../../blockchain/evm/constants/evm-chains.config";
import { SwapsAndTransfersService } from "../../blockchain/substrate/services/swaps-and-transfers.service";
import { EvmSwapsAndPaymentsService } from "../../blockchain/evm/service/evm-swaps-and-payments.service";
import { validateDates } from "../../../common/util/validate-dates";
import { HttpError } from "../../../common/error/HttpError";
import * as subscanChains from "../../../../res/gen/subscan-chains.json";
import { logger } from "../../logger/logger";
import { TransferDto } from "../../blockchain/substrate/model/raw-transfer";
import { addFiatValuesToTransferDtoList } from "../helper/add-fiat-values-to-transfer-dto-list";
import { addFiatValuesToTx } from "../helper/add-fiat-values-to-tx";
import { TransferClassifier } from "../helper/transfer-classifier";
import { SubscanService } from "../../blockchain/substrate/api/subscan.service";

export class PaymentsService {
  constructor(
    private swapsAndTransfersService: SwapsAndTransfersService,
    private tokenPriceConversionService: TokenPriceConversionService,
    private evmSwapsAndPaymentsService: EvmSwapsAndPaymentsService,
    private transferClassifier: TransferClassifier,
    private subscanService: SubscanService,
    private coingeckoIdLookupService: CoingeckoIdLookupService
  ) {}

  getTokens(transfer: TransferDto[]): string[] {
    const tokens = [];
    transfer.forEach(t => {
      const token = { id: t?.asset_unique_id || t?.contract, symbol: t.symbol }
      if (tokens.indexOf(token) == -1) {
        tokens.push(token)
      }
    })
    return tokens;
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
    const { transactions, transfersList } = evmChainConfig
      ? await this.evmSwapsAndPaymentsService.fetchSwapsAndPayments(
          chainName,
          address,
          startDay,
          endDay,
        )
      : await this.swapsAndTransfersService.fetchSwapsAndTransfers(
          chainName,
          address,
          startDay,
          endDay,
        );

    const nativeToken = evmChainConfig[chainName]?.nativeToken ?? subscanChains[chainName].token
    const tokens = this.getTokens(transfersList); 

    const idToCoingeckoMap: { [tokenId: string]: string } = tokens.map(t => coingeckoIdLookupService.mapTokenToCoingeckoId(t, chainName)).filter(mapping => !!mapping.coingeckoId) // TODO!

    const quotes = await this.tokenPriceConversionService.fetchQuotesForTokens(
      Object.values(idToCoingeckoMap),
      chainName,
      currency,
    );

    addFiatValuesToTransferDtoList(transfersList, idToCoingeckoMap, quotes)
    addFiatValuesToTx(transactions, quotes[nativeToken])
    
    const aliases = await this.subscanService.fetchAccounts(
      address,
      chainName,
    );
    const { payments, swaps } = this.transferClassifier.extractSwapsAndPayments(transactions, transfersList, address, aliases)

    const currentPrices = {};
    Object.keys(quotes).forEach(
      (token) => (currentPrices[token] = quotes[token].quotes.latest),
    );
    // const swapsExtended = addFiatValuesToSwaps(swaps, quotes);
    logger.info("PaymentsService: Exit processess Task");
    return { currentPrices, swaps, transfers: payments };
  }
}
