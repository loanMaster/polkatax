import { SubstrateChains } from '../model/substrate-chain';

export const fetchSubscanChains = async (): Promise<SubstrateChains> => {
  const response = await fetch('/api/res/subscan-chains');
  if (!response.ok) {
    throw response;
  }
  return await response.json();
};
