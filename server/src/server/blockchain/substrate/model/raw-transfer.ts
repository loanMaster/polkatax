export interface RawTransferDto {
  transfer_id: number;
  from: string;
  from_account_display: {
    address: string;
    display: string;
  };
  to: string;
  to_account_display: {
    address: string;
  };
  extrinsic_index: string;
  success: true;
  hash: string;
  block_num: number;
  block_timestamp: number;
  module: string;
  amount: string;
  amount_v2: string;
  current_currency_amount: string;
  currency_amount: string;
  fee: string;
  nonce: number;
  asset_symbol: string;
  asset_unique_id: string;
  asset_type: string;
  item_id: string;
  event_idx: number;
  is_lock: boolean;
}

export interface RawEvmTransferDto {
  decimals: number;
  create_at: number;
  to_display: {
    evm_contract: {
      contract_name: string;
    };
  };
  value: string;
  hash: string;
  symbol: string;
}
