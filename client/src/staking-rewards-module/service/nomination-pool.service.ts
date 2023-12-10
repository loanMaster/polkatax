export interface NominationPool {
  metadata: string;
  pool_id: number;
}

export class NominationPoolService {
  async fetchNominationPools(chain: string): Promise<NominationPool[]> {
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
  }
}
