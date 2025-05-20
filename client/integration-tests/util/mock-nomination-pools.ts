import { Page } from '@playwright/test';

export const mockNominationPools = async (page: Page) => {
  await page.route(
    'https://*.api.subscan.io/api/scan/nomination_pool/pools',
    async (route) => {
      const json: any = {
        code: 0,
        message: 'Success',
        generated_at: 1747750709,
        data: {
          count: 319,
          list: [
            {
              pool_id: 1,
              metadata:
                'ParaNodes.io 🚀 | 0% Pool Com | Auto Compound \u003e 0.075 DOT Rewards | Supporting Community Validators',
              state: 'Open',
              pool_account: {
                address: '13UVJyLnbVp8c4FQeiGCovEJbQuhsZKmtH4JmFwDA7oh7dSD',
                display: 'Pool#1(Stash)',
              },
              nominator_account: {
                address: '15vthWssisuTdYrYzvhvaCp7t27PLQJ8fVAZ8XfJH3atK2oh',
                people: {},
              },
              pool_reward_account: {
                address: '13UVJyLnbVp8c4FQeiGUYwmthuauL7RecwzpKCd3cwgRPCPp',
                display: 'Pool#1(Reward)',
              },
              nominate_count: 1,
              member_count: 934,
              total_bonded: '3312439821567546',
              claimable: '157900933282874',
              bounis: '0',
            },
            {
              pool_id: 2,
              metadata: 'Turboflakes Pool + Top Decentralized Nodes',
              state: 'Open',
              pool_account: {
                address: '13UVJyLnbVp8c4FQeiGCsV63YihAstUrqj3AGcK7gaj8eubS',
                display: 'Pool#2(Stash)',
              },
              nominator_account: {
                address: '14iVXGLMtNdSL6mCozJgNEhzP9X8snU5BoPLRh54vZaj72Qn',
                people: {
                  parent: {
                    address: '14Sqrs7dk6gmSiuPK7VWGbPmGr4EfESzZBcpT6U15W4ajJRf',
                    display: 'turboflakes.io',
                    sub_symbol: 'ONE-T',
                    identity: true,
                  },
                },
              },
              pool_reward_account: {
                address: '13UVJyLnbVp8c4FQeiGUcWddfDNNLSajaPyfpYzx9QbrvLfR',
                display: 'Pool#2(Reward)',
              },
              nominate_count: 1,
              member_count: 280,
              total_bonded: '704164820649299',
              claimable: '33863149783047',
              bounis: '0',
            },
          ],
        },
      };
      await route.fulfill({ json });
    }
  );
};
