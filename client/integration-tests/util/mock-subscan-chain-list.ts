import { Page } from '@playwright/test';

const chains = {
  chains: [
    {
      domain: 'peaq',
      label: 'peaq',
      token: 'PEAQ',
      stakingPallets: ['ParachainStaking'],
      evmPallet: true,
      standardStaking: false,
      parachainStaking: true,
      delegatedStaking: false,
    },
    {
      domain: 'polkadot',
      label: 'Polkadot',
      token: 'DOT',
      stakingPallets: ['Staking'],
      evmPallet: false,
      standardStaking: true,
      parachainStaking: false,
      delegatedStaking: false,
    },
    {
      domain: 'mythos',
      label: 'Mythos',
      token: 'MYTH',
      stakingPallets: ['CollatorStaking'],
      evmPallet: false,
      standardStaking: false,
      parachainStaking: false,
      delegatedStaking: false,
    },
    {
      domain: 'moonbeam',
      label: 'Moonbeam',
      token: 'GLMR',
      stakingPallets: ['ParachainStaking'],
      evmPallet: true,
      standardStaking: false,
      parachainStaking: true,
      delegatedStaking: false,
    },
    {
      domain: 'kusama',
      label: 'Kusama',
      token: 'KSM',
      stakingPallets: ['Staking', 'DelegatedStaking'],
      evmPallet: false,
      standardStaking: true,
      parachainStaking: false,
      delegatedStaking: true,
    },
  ],
};

export const mockSubscanChainList = async (page: Page) => {
  await page.route('*/**/api/res/subscan-chains', async (route) => {
    await route.fulfill({ json: chains });
  });
};
