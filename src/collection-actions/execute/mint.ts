import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { coins, Coin } from '@cosmjs/amino';
import { toUtf8 } from '@cosmjs/encoding';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { getClient } from '../../helpers/client';
import { isValidIpfsUrl, toStars } from '../../helpers/utils';
import inquirer from 'inquirer';

const config = require('../../../config');

const AIRDROP_FEE = coins('0', 'ustars');

async function test_whitelist() {
  const client = await getClient();

  const starsRecipient = toStars(config.account);
  console.log('whitelist mint: ', starsRecipient);

  const mintFee = coins((config.whitelistPrice * 1000000).toString(), 'ustars');
  const msg = { mint: {} };
  console.log(JSON.stringify(msg, null, 2));

  const result = await client.execute(
    config.account,
    config.minter,
    msg,
    'auto',
    'mint',
    mintFee
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

// For base (1/1) minter only
export async function baseMint(tokenUri: string) {
  const client = await getClient();
  console.log('Minter contract: ', config.minter);
  console.log('Minting to: ', config.account);

  if (!isValidIpfsUrl(tokenUri)) {
    throw new Error('Invalid token URI');
  }

  const msg = { mint: { token_uri: tokenUri } };
  console.log(JSON.stringify(msg, null, 2));

  const mintFee = coins('5000000', 'ustars');

  let result = await client.execute(
    config.account,
    config.minter,
    msg,
    'auto',
    '1/1 mint',
    mintFee
  );

  console.log('result: ', result);

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info('Wasm event:', wasmEvent);
}

export async function mintTo(recipient: string) {
  const client = await getClient();
  const starsRecipient = toStars(recipient);
  console.log('Minter contract: ', config.minter);
  console.log('Minting to: ', starsRecipient);

  const msg = { mint_to: { recipient: starsRecipient } };
  console.log(JSON.stringify(msg, null, 2));

  // handle 0ustars airdrop fee
  let result = null;
  if (AIRDROP_FEE[0].amount == '0') {
    result = await client.execute(
      config.account,
      config.minter,
      msg,
      'auto',
      'mint to'
    );
  } else {
    result = await client.execute(
      config.account,
      config.minter,
      msg,
      'auto',
      'mint to',
      AIRDROP_FEE
    );
  }
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
  if (wasmEvent != undefined) {
    console.info('token_id:', wasmEvent!.attributes[4].value);
    return wasmEvent!.attributes[4]['value'];
  }
}

export async function batchMint(recipient: string, num: number) {
  const client = await getClient();
  const starsRecipient = toStars(recipient);
  const msg = { mint_to: { recipient: starsRecipient } };

  const executeContractMsg: MsgExecuteContractEncodeObject = {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
      sender: config.account,
      contract: config.minter,
      msg: toUtf8(JSON.stringify(msg)),
      funds: [],
    }),
  };

    const fee = await client.simulate(
      config.account,
      Array(num).fill(executeContractMsg),
      'auto'
    );
  console.log('Estimated gas fee: ', fee + ' ustars');
  console.log('Minter contract: ', config.minter);
  console.log('Minting ' + num + ' tokens to:', starsRecipient);

  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  if ((await format_funds(AIRDROP_FEE[0])) == true) {
    executeContractMsg.value.funds = AIRDROP_FEE;
  }

  const result = await client.signAndBroadcast(
    config.account,
    Array(num).fill(executeContractMsg),
    'auto',
    'batch mint'
  );

  console.log('Tx hash: ', result.transactionHash);
}

export async function mintFor(tokenId: string, recipient: string) {
  const client = await getClient();

  const starsRecipient = toStars(recipient);
  console.log('Minter contract: ', config.minter);
  console.log('Minting token ' + tokenId + ' for', starsRecipient);

  const msg = {
    mint_for: { token_id: Number(tokenId), recipient: starsRecipient },
  };
  console.log(JSON.stringify(msg, null, 2));

  // handle 0ustars airdrop fee
  let result = null;
  if (AIRDROP_FEE[0].amount == '0') {
    result = await client.execute(
      config.account,
      config.minter,
      msg,
      'auto',
      'mint to'
    );
  } else {
    result = await client.execute(
      config.account,
      config.minter,
      msg,
      'auto',
      'mint to',
      AIRDROP_FEE
    );
  }
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

async function mintForRange(tokenIdRange: string, recipient: string) {
  const starsRecipient = toStars(recipient);

  // Parse string from "1,10" -> "1" and "10"
  const [start, end] = tokenIdRange.split(',').map(Number);

  const client = await getClient();
  const configResponse = await client.queryContractSmart(config.minter, {
    config: {},
  });

  // Verify proper range
  if (isNaN(start) || isNaN(end) || start > end)
    throw new Error('Invalid range');
  if (start < 1) throw new Error('Start ID out of bounds');
  if (end > configResponse.num_tokens) throw new Error('End ID out of bounds');

  console.log('Minting tokens', start + '-' + end, 'for', starsRecipient);

  // Loop through range and generate contract messages.
  let msgArray = new Array();
  for (let i = start; i <= end; i++) {
    let msg = {
      mint_for: { token_id: i, recipient: starsRecipient },
    };
    let executeContractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: config.account,
        contract: config.minter,
        msg: toUtf8(JSON.stringify(msg)),
      }),
    };
    if ((await format_funds(AIRDROP_FEE[0])) == true) {
      executeContractMsg.value.funds = AIRDROP_FEE;
    }
    msgArray.push(executeContractMsg);
  }

  // Execute all messages.
  const result = await client.signAndBroadcast(
    config.account,
    msgArray,
    'auto',
    'batch mint for'
  );
  console.log('Tx hash: ', result.transactionHash);
}

async function format_funds(funds: Coin) {
  if (Number(funds.amount) > 0) {
    return true;
  } else {
    return false;
  }
}

const args = process.argv.slice(2);
if (args.length == 0) {
  console.log('No arguments provided, need --to, --for or --token-uri');
} else if (args.length == 1 && args[0] == '--test-whitelist') {
  test_whitelist();
} else if (args.length == 2 && args[0] == '--to') {
  mintTo(args[1]);
} else if (args.length == 2 && args[0] == '--token-uri') {
  baseMint(args[1]);
} else if (args.length == 4 && args[0] == '--to') {
  if (args[2] == '--batch') {
    batchMint(args[1], +args[3]);
  } else {
    console.log('Invalid arguments');
  }
} else if (args.length == 3 && args[0] == '--for') {
  mintFor(args[1], args[2]);
} else if (args.length == 3 && args[0] == '--range') {
  mintForRange(args[1], args[2]);
} else {
  console.log('Invalid arguments');
}
