import { PaymentsListDto } from 'src/transfers-module/model/payments';
import { endpoint } from '../../shared-module/const/endpoint';

export class PaymentsService {
  async fetchTokenRewards(
    chain: string,
    address: string,
    currency: string,
    beginDate: number,
    endDate: number
  ): Promise<PaymentsListDto> {
    const result = await fetch(
      `${endpoint}/api/payments/${chain.toLowerCase()}/${address}?startdate=${beginDate}&enddate=${endDate}&currency=${currency}`,
      {
        method: 'GET',
      }
    );
    if (!result.ok) {
      throw result;
    }
    return result.json();
  }
}
