import { TransferDto } from "../../blockchain/substrate/model/raw-transfer";

export interface MergedTransfers {
  [hash: string]: { [token: string]: { label?: string, amount: number, to: string, from: string, block: number, timestamp: number } }
}

export class TransferMerger {
  mergeTranferListToObject(
    list: TransferDto[],
    address: string,
    aliases: string[],
  ): MergedTransfers {
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
      if (!transfers[entry.hash][entry.symbol]) {
        transfers[entry.hash][entry.symbol] = { amount: 0 };
      }
      transfers[entry.hash][entry.symbol].label = entry.label;
      if (isMyAccount(entry.to)) {
        transfers[entry.hash][entry.symbol].amount += Number(
          entry.amount,
        );
      } else if (isMyAccount(entry.from)) {
        transfers[entry.hash][entry.symbol].amount -= Number(
          entry.amount,
        );
      } else {
        console.warn("no match for transfer!");
      }
      if (transfers[entry.hash][entry.symbol].amount > 0) {
        transfers[entry.hash][entry.symbol].to = address;
        transfers[entry.hash][entry.symbol].from = otherAddress;
      } else {
        transfers[entry.hash][entry.symbol].from = address;
        transfers[entry.hash][entry.symbol].to = otherAddress;
      }
      transfers[entry.hash][entry.symbol].block = entry.block;
      transfers[entry.hash][entry.symbol].timestamp =
        entry.timestamp;
      transfers[entry.hash][entry.symbol].hash = entry.hash;
    });
    return transfers;
  }
}
