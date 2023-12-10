import { Chain } from 'src/shared-module/model/chain';

export const chainList: Chain[] = [
  { chain: 'polkadot', label: 'Polkadot' },
  {
    chain: 'ethereum',
    label: 'Ethereum',
    stakingRewards: false,
    explorer: 'https://etherscan.io/tx/',
  },
  {
    chain: 'arbitrum-one',
    label: 'Arbitrum One',
    stakingRewards: false,
    explorer: 'https://arbiscan.io/tx/',
  },
  {
    chain: 'optimism',
    label: 'Optimism',
    stakingRewards: false,
    explorer: 'https://optimistic.etherscan.io/tx/',
  },
  {
    chain: 'polygon',
    label: 'Polygon',
    stakingRewards: false,
    explorer: 'https://polygonscan.com/tx/',
  },
  {
    chain: 'base',
    label: 'Base',
    stakingRewards: false,
    explorer: 'https://basescan.org/tx/',
  },
  {
    chain: 'kusama',
    label: 'Kusama',
  },
  { chain: 'moonbeam', label: 'Moonbeam', explorer: 'https://moonscan.io/tx/' },
  {
    chain: 'astar',
    label: 'Astar Substrate',
  },
  { chain: 'phala', label: 'Phala' },
  {
    chain: 'crust',
    label: 'Crust',
  },
  { chain: 'hydradx', label: 'Hydradx' },
  {
    chain: 'spiritnet',
    label: 'Spiritnet',
  },
  { chain: 'acala', label: 'Acala' },
  {
    chain: 'bifrost',
    label: 'Bifrost',
  },
  { chain: 'centrifuge', label: 'Centrifuge' },
  {
    chain: 'crust',
    label: 'Crust',
  },
  { chain: 'equilibrium', label: 'Equilibrium' },
  {
    chain: 'darwinia',
    label: 'Darwinia',
  },
  { chain: 'parallel', label: 'Parallel' },
  {
    chain: 'polkadex',
    label: 'Polkadex',
  },
  { chain: 'zeitgeist', label: 'Zeitgeist' },
  {
    chain: 'unique',
    label: 'Unique',
  },
  { chain: 'nodle', label: 'Nodle' },
  {
    chain: 'origintrail',
    label: 'Origintrail',
  },
  { chain: 'interlay', label: 'Interlay' },
  {
    chain: 'calamari',
    label: 'Calamari',
  },
  { chain: 'khala', label: 'Khala' },
  {
    chain: 'moonriver',
    label: 'Moonriver',
  },
  { chain: 'kintsugi', label: 'Kintsugi' },
  {
    chain: 'robonomics',
    label: 'Robonomics',
  },
  { chain: 'dbc', label: 'Deep brain chain' },
  {
    chain: 'edgeware',
    label: 'Edgeware',
  },
  { chain: 'sora', label: 'Sora' },
  {
    chain: 'humanode',
    label: 'Humanode',
  },
  { chain: 'alephzero', label: 'Alephzero' },
  { chain: 'picasso', label: 'Picasso' },
];
