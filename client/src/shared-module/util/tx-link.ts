import { Chain } from '../../shared-module/model/chain';
import { chainList } from '../../shared-module/const/chainList';

export const getTxLink = (hash: string, chainName: string) => {
  return chainList.find((c: Chain) => c.domain === chainName).explorer
    ? chainList.find((c: Chain) => c.domain === chainName).explorer + hash
    : `https://${chainName}.subscan.io/tx/${hash}`;
};
