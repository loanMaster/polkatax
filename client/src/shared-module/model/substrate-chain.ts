export interface SubstrateChain {
  domain: string;
  label: string;
  stakingPallets: string[];
  evm: boolean;
  token: string;
}

export interface SubstrateChains {
  chains: SubstrateChain[];
}
