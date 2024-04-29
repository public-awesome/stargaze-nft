// Sweeps the floor of a nft collection
// Buying the cheapest nfts regardless of attributes
// Queries AsksSortedByPrice for N nft's and returns total price
// --execute tries to purchase N nft's all-or-none
import { toStars } from '../helpers/utils';
const config = require('../../config');
import inquirer from 'inquirer';
import { getClient } from '../helpers/client';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { coin } from '@cosmjs/amino';
import { toUtf8 } from '@cosmjs/encoding';

import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

const MAX_SWEEP_COUNT = 10;

/// calculate total price of sweep
/// prep messages for execute
async function prepFloorSweep(numTokens: number) {
  if (numTokens > MAX_SWEEP_COUNT) {
    throw new Error('Too many tokens to sweep');
  }

  // query AsksSortedByPrice for numTokens nft's and return total price
  const sg721Addr = toStars(config.sg721);
  const account = toStars(config.account);
  const client = await getClient();
  const marketplaceAddr = toStars(config.marketplace);
  const configResponse = await client.queryContractSmart(marketplaceAddr, {
    asks_sorted_by_price: { collection: sg721Addr },
  });
  const executeContractMsgs: Array<MsgExecuteContractEncodeObject> = [];
  let floorSweepPrice = BigInt(0);
  const asks = configResponse.asks;
  for (let i = 0; i < numTokens; i++) {
    if (asks[i] == undefined) {
      console.log('not enough asks in collection', i + 1);
      break;
    }
    console.log('ask', i, asks[i].price);
    //stackoverflow.com/questions/14667713/how-to-convert-a-string-to-number-in-typescript
    floorSweepPrice += BigInt(asks[i].price);
    const now = new Date();
    now.setDate(now.getDate() + 14);
    const expires = (now.getTime() * 1_000_000).toString();
    const setBidMsg = {
      set_bid: {
        collection: sg721Addr,
        token_id: asks[i].token_id,
        expires,
      },
    };
    const funds = [coin(asks[i].price, 'ustars')];
    const executeContractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: account,
        contract: marketplaceAddr,
        msg: toUtf8(JSON.stringify(setBidMsg)),
        funds,
      }),
    };
    executeContractMsgs.push(executeContractMsg);
    console.log(JSON.stringify(setBidMsg, null, 2));
  }

  console.log(JSON.stringify(executeContractMsgs, null, 2));
  console.log('floorSweepPrice', floorSweepPrice);

  const balance = await client.getBalance(account, 'ustars');
  if (+balance.amount < floorSweepPrice) {
    throw new Error(
      'Not enough balance to sweep ' + balance.amount + ' ' + floorSweepPrice
    );
  }
  return executeContractMsgs;
}

// runs prepFloorSweep and then executes the sweep
async function runFloorSweep(numTokens: number) {
  const executeContractMsgs = await prepFloorSweep(numTokens);
  const client = await getClient();

  // Get confirmation before proceeding
  console.log(
    'WARNING: Please confirm the settings for running the floor sweep purchase. THERE IS NO WAY TO UNDO THIS ONCE IT IS ON CHAIN.'
  );
  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.signAndBroadcast(
    config.account,
    executeContractMsgs,
    'auto',
    'batch-sweep-floor'
  );
  assertIsDeliverTxSuccess(result);
}

const args = process.argv.slice(2);
if (args.length == 1) {
  prepFloorSweep(parseInt(args[0]));
} else if (args.length == 2 && args[1] == '--execute') {
  runFloorSweep(parseInt(args[0]));
} else {
  console.log('Invalid arguments. include number of tokens to sweep');
}
