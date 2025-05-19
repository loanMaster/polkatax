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
        (swapTypeFilter.twoAssets && swap.transfers.length <= 2) ||
        (swapTypeFilter.multipleAssets && swap.transfers.length > 2)
    )
    .filter((swap: Swap) =>
      swap.transfers.some(
        (transfer) => supportedTokens.indexOf(transfer.symbol) > -1
      )
    );
  return filtered;
};
