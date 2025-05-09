import BigNumber from "bignumber.js";
import { RawEvmTransferDto, RawTransferDto } from "../model/raw-transfer";
import { Transfers } from "../model/transfer";

export class TransferMerger {
  merge(target: Transfers, source: Transfers): Transfers {
    Object.entries(source).forEach(([hash, transfer]) => {
      target[hash] ??= {};
      Object.entries(transfer).forEach(([token, data]) => {
        target[hash][token] ??= { ...data, amount: 0 };
        target[hash][token].amount += data.amount;
      });
    });
    return target;
  }

  mergeTranferListToObject(
    list: (RawTransferDto | RawEvmTransferDto)[],
    address: string,
    isMyAccount: (string) => boolean,
  ): Transfers {
    const transfers = {};
    list.forEach((entry) => {
      if (!entry.hash) {
        return;
      }
      entry = (entry as RawEvmTransferDto).symbol
        ? this.mapEvmTransferToSubstrateTransferDto(entry as RawEvmTransferDto)
        : (entry as RawTransferDto);
      const otherAddress = isMyAccount(entry.from) ? entry.to : entry.from;
      if (!transfers[entry.hash]) {
        transfers[entry.hash] = {};
      }
      if (!transfers[entry.hash][entry.asset_symbol]) {
        transfers[entry.hash][entry.asset_symbol] = { amount: 0 };
      }
      transfers[entry.hash][entry.asset_symbol].functionName = entry.module;
      if (isMyAccount(entry.to)) {
        transfers[entry.hash][entry.asset_symbol].amount += Number(
          entry.amount,
        );
      } else if (isMyAccount(entry.from)) {
        transfers[entry.hash][entry.asset_symbol].amount -= Number(
          entry.amount,
        );
      } else {
        console.warn("no match for transfer!");
      }
      if (transfers[entry.hash][entry.asset_symbol].amount > 0) {
        transfers[entry.hash][entry.asset_symbol].to = address;
        transfers[entry.hash][entry.asset_symbol].from = otherAddress;
      } else {
        transfers[entry.hash][entry.asset_symbol].from = address;
        transfers[entry.hash][entry.asset_symbol].to = otherAddress;
      }
      transfers[entry.hash][entry.asset_symbol].block = entry.block_num;
      transfers[entry.hash][entry.asset_symbol].timestamp =
        entry.block_timestamp;
      transfers[entry.hash][entry.asset_symbol].hash = entry.hash;
    });
    return transfers;
  }

  private mapEvmTransferToSubstrateTransferDto(
    entry: RawEvmTransferDto,
  ): RawTransferDto {
    return {
      ...entry,
      asset_symbol: entry.symbol,
      module: entry.to_display?.evm_contract?.contract_name,
      amount: BigNumber(entry.value)
        .dividedBy(BigNumber(10).pow(entry.decimals))
        .toNumber(),
      block_timestamp: entry.create_at,
    } as unknown as RawTransferDto;
  }
}
