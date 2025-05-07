import * as subscanChains from "../../../../../res/gen/subscan-chains.json";

export const hasChainEvmSupport = (chainName: string): boolean =>
  (
    subscanChains.chains.find((c) => c.domain === chainName) ?? {
      evmPallet: false,
    }
  ).evmPallet;
