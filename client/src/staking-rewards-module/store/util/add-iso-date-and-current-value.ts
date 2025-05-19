import { formatDate } from '../../../shared-module/util/date-utils';
import { Reward, RewardDto } from '../../model/rewards';

export const addIsoDateAndCurrentValue = (
  values: RewardDto[],
  currentPrice: number | undefined
): Reward[] => {
  return values.map((v) => ({
    ...v,
    isoDate: formatDate(v.timestamp * 1000),
    valueNow: currentPrice !== undefined ? v.amount * currentPrice : undefined,
  }));
};
