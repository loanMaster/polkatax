import { TransferDto } from "../../blockchain/substrate/model/raw-transfer";
import { Transfers } from "../../blockchain/substrate/model/transfer";

export class TransferMerger {
  mergeTranferListToObject(
    list: TransferDto[],
    address: string,
    aliases: string[],
  ): Transfers {
    const isMyAccount = (addressToTest: string) =>
      address.toLowerCase() === addressToTest.toLowerCase() ||
      aliases.indexOf(addressToTest.toLowerCase()) > -1;

    const transfers = {};
    list.forEach((entry) => {
      if (!entry.hash) {
        return;
      }
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
}
