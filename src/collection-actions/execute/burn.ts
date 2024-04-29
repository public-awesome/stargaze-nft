import { getClient } from '../../helpers/client';
import { toStars } from '../../helpers/utils';
import inquirer from 'inquirer';
import { mintTo } from './mint';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

const config = require('../../../config');
const BATCH_BURN_LIMIT = 50;

async function burn(client: SigningCosmWasmClient, msg: any) {
  const account = toStars(config.account);
  const minter = toStars(config.minter);
  const minterConfigResponse = await client.queryContractSmart(minter, {
    config: {},
  });
  const sg721 = minterConfigResponse.sg721_address;
  const result = await client.execute(account, sg721, msg, 'auto', 'burn');
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

async function burnToken(tokenId: number) {
  if (isNaN(tokenId)) {
    throw new Error('tokenId must be a number');
  }
  const client = await getClient();
  const minter = toStars(config.minter);
  const minterConfigResponse = await client.queryContractSmart(minter, {
    config: {},
  });
  console.log('minter configResponse: ', minterConfigResponse);
  const sg721 = minterConfigResponse.sg721_address;

  console.log('SG721: ', sg721);
  console.log('Burning Token: ', tokenId);
  const msg = { burn: { token_id: tokenId.toString() } };
  console.log(JSON.stringify(msg, null, 2));
  console.log(
    'Please confirm that you would like to burn this token? This cannot be undone. Also note that this script can only burn tokens from your own wallet.'
  );
  const answer = await inquirer.prompt([
    {
      message: 'Ready to burn this token?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  await burn(client, msg);
}

// Burn a range of tokens you already own.
// meant to be used to burn the supply of a broken collection
// sequentially burns from 1 to 10 inclusive
// fails if you are not the token owner
async function burnRange(tokenIdRange: string) {
  // Parse string from "1,10" -> "1" and "10"
  const [start, end] = tokenIdRange.split(',').map(Number);
  const client = await getClient();
  for (let tokenId = start; tokenId <= end; tokenId++) {
    console.log('Burning token:', tokenId);
    const msg = { burn: { token_id: tokenId.toString() } };
    await burn(client, msg);
  }
}

// Burn a list of tokens you already own.
// meant to be used to burn the supply of a broken collection
// fails if you are not the token owner
async function burnList(tokenIds: string) {
  // Parse string from "4,5,10,45,12" -> [4,5,10,45,12]
  const tokens = tokenIds.split(',').map(Number);
  const client = await getClient();
  for (let i = 0; i < tokens.length; i++) {
    console.log('Burning token:', tokens[i]);
    const msg = { burn: { token_id: tokens[i].toString() } };
    await burn(client, msg);
  }
}

// Airdrop to yourself and burn excess in batches
// Makes several assumptions:
// - config address is the creator of the collection
// - config minter address is the collection
// - collection is not fully sold out
// - burn several tokens at a time
async function batchAirdropAndBurn() {
  const client = await getClient();
  const minter = toStars(config.minter);
  const account = toStars(config.account);

  const minterConfigResponse = await client.queryContractSmart(minter, {
    config: {},
  });
  console.log('minter configResponse: ', minterConfigResponse);

  const sg721 = minterConfigResponse.sg721_address;
  const totalSupply = minterConfigResponse.num_tokens;

  const sg721ConfigResponse = await client.queryContractSmart(sg721, {
    num_tokens: {},
  });
  const numMintedTokens = sg721ConfigResponse.count;
  console.log('total supply', totalSupply, 'num minted', numMintedTokens);

  const burnCount =
    totalSupply - numMintedTokens > BATCH_BURN_LIMIT
      ? BATCH_BURN_LIMIT
      : totalSupply - numMintedTokens;
  console.log('burning', burnCount);

  // Get confirmation before proceeding
  console.log(
    'WARNING: Burning excess supply. THERE IS NO WAY TO UNDO THIS ONCE IT IS ON CHAIN.'
  );
  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  //   airdrop and burn 10 at a time
  for (let i = 0; i < burnCount; i++) {
    const tokenId = await mintTo(account);
    console.log('Burning token:', tokenId);
    const msg = { burn: { token_id: tokenId } };
    await burn(client, msg);
  }
}

const args = process.argv.slice(2);
if (args.length == 0) {
  console.log('No arguments provided, need token to burn');
} else if (args.length == 1 && args[0] == '--batchAirdropAndBurn') {
  batchAirdropAndBurn();
} else if (args.length == 1 && args[0]) {
  burnToken(Number(args[0]));
} else if (args.length == 2 && args[0] == '--range') {
  burnRange(args[1]);
} else if (args.length == 2 && args[0] == '--list') {
  burnList(args[1]);
}  else {
  console.log('Invalid arguments');
}
