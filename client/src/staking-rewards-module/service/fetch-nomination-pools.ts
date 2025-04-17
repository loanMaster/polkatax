import { NominationPool } from '../model/nomination-pool';

export const fetchNominationPools = async (
  chain: string
): Promise<NominationPool[]> => {
  if (chain !== 'polkadot' && chain !== 'kusama') {
    // nomination pools are only supported for kusama and polkadot.
    return [];
  }
  const result = await fetch(
    `https://${chain}.api.subscan.io/api/scan/nomination_pool/pools`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
  if (!result.ok) {
    throw result;
  }
  return (await result.json()).data.list;
};
