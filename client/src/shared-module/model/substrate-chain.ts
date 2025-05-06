export interface SubstrateChain {
  domain: string;
  stakingPallets: string[];
  evm: boolean;
}

export interface SubstrateChains {
  chains: SubstrateChain[];
}
