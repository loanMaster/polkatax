export interface SubscanEvent {
  id: number;
  block_timestamp: number;
  event_index: string;
  extrinsic_index: string;
  phase: number;
  module_id: string;
  event_id: string;
  extrinsic_hash: string;
  finalized: boolean;
}
