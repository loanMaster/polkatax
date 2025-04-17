import { formatDate } from "app/client/src/shared-module/util/date-utils";
import { RewardDto } from "../../model/rewards";

export const addIsoDateAndCurrentValue = (values: RewardDto[], currentPrice: number) => {
    return values.map((v) => ({
      ...v,
      isoDate: formatDate(v.date * 1000),
      valueNow: v.amount * currentPrice,
    }));
  }