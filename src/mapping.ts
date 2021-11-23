import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";
import { Viral, Transfer } from "../generated/Viral/Viral";
import { ViralSwapRouter } from "../generated/Viral/ViralSwapRouter";
import { Token, Account } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
  let pathAddress = new Array<Address>();
  pathAddress.push(
    Address.fromString("0x2FbC33DB923d9B4B6678e55d13e587a2CCb804bC")
  );
  pathAddress.push(
    Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
  );

  let token = Token.load(event.address.toHexString());
  let fromAccount = Account.load(event.params.from.toHexString());
  let toAccount = Account.load(event.params.to.toHexString());
  let contract = Viral.bind(event.address);
  let viralSwapRouter = ViralSwapRouter.bind(
    Address.fromString("0xE5C7565B45C5109515b4dEE70330Be40d2D198fB")
  );

  if (!token) {
    token = new Token(event.address.toHexString());
  }

  if (!fromAccount) {
    fromAccount = new Account(event.params.from.toHexString());
  }
  if (!toAccount) {
    toAccount = new Account(event.params.to.toHexString());
  }

  let senderBalanceCall = contract.try_balanceOf(event.params.from as Address);
  if (!senderBalanceCall.reverted) {
    fromAccount.balance = senderBalanceCall.value;
  } else {
    log.warning("SenderBalanceCall reverted", []);
  }

  let receiverBalanceCall = contract.try_balanceOf(event.params.to as Address);
  if (!receiverBalanceCall.reverted) {
    toAccount.balance = receiverBalanceCall.value;
  } else {
    log.warning("ReceiverBalanceCall reverted", []);
  }

  let totalSupplyCall = contract.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    token.totalSupply = totalSupplyCall.value;
  } else {
    log.warning("TotalSupplyCall reverted", []);
  }

  let referrerOfSenderCall = contract.try_referrerOf(
    event.params.to as Address
  );
  if (!referrerOfSenderCall.reverted) {
    toAccount.refferer = referrerOfSenderCall.value.toHexString();
    let reffererOfSenderBalanceCall = contract.try_balanceOf(
      referrerOfSenderCall.value
    );
    if (!reffererOfSenderBalanceCall.reverted) {
      toAccount.reffererBalance = reffererOfSenderBalanceCall.value;
    } else {
      log.warning("ReffererOfSenderBalanceCall reverted", []);
    }
  } else {
    log.warning("reffererCall reverted", []);
  }

  let referralOfReceiverCall = contract.try_referrerOf(
    event.params.from as Address
  );
  if (!referralOfReceiverCall.reverted) {
    fromAccount.refferer = referralOfReceiverCall.value.toHexString();
    let referrerOfReceiverBalanceCall = contract.try_balanceOf(
      referralOfReceiverCall.value
    );
    if (!referrerOfReceiverBalanceCall.reverted) {
      fromAccount.reffererBalance = referrerOfReceiverBalanceCall.value;
    } else {
      log.warning("ReferrerOfReceiverBalanceCall reverted", []);
    }
  } else {
    log.warning("rfCall reverted", []);
  }

  let amountCallReferredTo = viralSwapRouter.try_getAmountsOut(
    toAccount.reffererBalance,
    pathAddress
  );
  if (!amountCallReferredTo.reverted) {
    toAccount.reffererUsdcBalance = amountCallReferredTo.value;
  } else {
    log.warning("amountCallRefferedTo reverted", []);
  }

  let amountCallReferredFrom = viralSwapRouter.try_getAmountsOut(
    fromAccount.reffererBalance,
    pathAddress
  );
  if (!amountCallReferredFrom.reverted) {
    fromAccount.reffererUsdcBalance = amountCallReferredFrom.value;
  } else {
    log.warning("amountCallRefferedFrom reverted", []);
  }

  let senderAmountCall = viralSwapRouter.try_getAmountsOut(
    toAccount.balance,
    pathAddress
  );
  if (!senderAmountCall.reverted) {
    toAccount.usdcValue = senderAmountCall.value;
  } else {
    log.warning("SenderAmountCall reverted", []);
  }

  let receiverAmountCall = viralSwapRouter.try_getAmountsOut(
    fromAccount.balance,
    pathAddress
  );
  if (!receiverAmountCall.reverted) {
    fromAccount.usdcValue = receiverAmountCall.value;
  } else {
    log.warning("ReceiverAmountCall reverted", []);
  }

  token.sender = fromAccount.id;
  token.receiver = toAccount.id;
  token.blockNumber = event.block.number;
  token.timestamp = event.block.timestamp;

  fromAccount.blockNumber = event.block.number;
  fromAccount.timestamp = event.block.timestamp;

  toAccount.blockNumber = event.block.number;
  toAccount.timestamp = event.block.timestamp;

  fromAccount.save();
  toAccount.save();
  token.save();
}
