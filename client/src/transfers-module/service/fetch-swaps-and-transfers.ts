import { PaymentsResponseDto } from '../model/payments-response.dto';

export const fetchSwapsAndTransfers = async (
  chain: string,
  address: string,
  currency: string,
  beginDate: number,
  endDate: number
): Promise<PaymentsResponseDto> => {
  const result = await fetch(
    `/api/payments/${chain.toLowerCase()}/${address}?startdate=${beginDate}&enddate=${endDate}&currency=${currency}`,
    {
      method: 'GET',
    }
  );
  if (!result.ok) {
    throw result;
  }
  return result.json();
};
