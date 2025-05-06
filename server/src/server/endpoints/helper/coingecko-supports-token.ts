import { findCoingeckoToken } from "../../../common/util/find-coingecko-token-id";
import { logger } from "../../logger/logger";

export const coingeckoSupportsToken = (symbol: string, chainName) =>
  !!findCoingeckoToken(symbol, chainName, logger);
