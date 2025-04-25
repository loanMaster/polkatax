import { blockExplorers } from '../const/block-explorers';

export const getTxLink = (hash: string, chainName: string) => {
  return blockExplorers[chainName] !== undefined
    ? blockExplorers[chainName] + hash
    : `https://${chainName}.subscan.io/tx/${hash}`;
};
