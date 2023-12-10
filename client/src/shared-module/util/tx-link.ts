import { Chain } from 'src/shared-module/model/chain';
import { chainList } from 'src/shared-module/const/chainList';

export const getTxLink = (hash: string, chainName: string) => {
  return chainList.find((c: Chain) => c.chain === chainName).explorer
    ? chainList.find((c: Chain) => c.chain === chainName).explorer + hash
    : `https://${chainName}.subscan.io/tx/${hash}`;
};
