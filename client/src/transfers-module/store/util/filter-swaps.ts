import { SwapList, Swap } from '../../../swap-module/model/swaps';
import { DataRequest } from '../../../shared-module/model/data-request';

export const filterSwaps = ([swapsRequest, visibleSwapTokens, swapTypeFilter]: [
  DataRequest<SwapList>,
  { value: boolean; name: string }[],
  { twoAssets: boolean; multipleAssets: boolean }
]) => {
  const swaps = swapsRequest.data;
  const supportedTokens = visibleSwapTokens
    .filter((t) => t.value === true)
    .map((t) => t.name);
  const filtered = (swaps?.swaps || [])
    .filter(
      (swap: Swap) =>
        (swapTypeFilter.twoAssets && Object.keys(swap.tokens).length <= 2) ||
        (swapTypeFilter.multipleAssets && Object.keys(swap.tokens).length > 2)
    )
    .filter((swap: Swap) =>
      Object.keys(swap.tokens).some(
        (token) => supportedTokens.indexOf(token) > -1
      )
    );
  return filtered;
};
