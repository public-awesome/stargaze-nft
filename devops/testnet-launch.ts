// Launch a set of constant working collections on testnet
// Front end can point to this set of known contracts and profiles knowing that it will work
// in between blockchain upgrades, code id changes, smart contract changes, etc
// also provides concrete test examples for creators

// comment minter.ts code block that starts with
// `const args = process.argv.slice(2);`
// if it is uncommented, smart contracts are launched two times

// This script will grow and change as the network tests more front end edge cases.

//----------------------------------------------------------------
// 1. show profile when more than 30 nfts
// 2. show resized gifs in profile
// 3. show audio nfts in profile
// 4. show transferred nft
//----------------------------------------------------------------

// collection #1 - large collection
// collection #2 - nft gifs
// collection #3 - audio files
// creator1 mints 50 to buyer
// creator2 public mints 5 to buyer
// buyer transfers to recipient

// addresses
// const creator = {
//     mnemonic:
//       'enough toddler bargain faint track vendor supreme diesel myself vibrant chase cargo',
//     addr: 'stars1wh3wjjgprxeww4cgqyaw8k75uslzh3sd3s2yfk',
//   };
//   const creator2 = {
//     mnemonic:
//       'still degree drive submit clean entire shrug purse cruel record hollow strategy',
//     addr: 'stars1ppqvdpdql35vg3fppshr2k297a69le33ssl5h0',
//   };
//   const buyer = {
//     mnemonic:
//       'during genius fiscal calm host toast cruel citizen crane skate vessel source',
//     addr: 'stars1kzhnfvqda4e44qvwpdgnswkrgvlqf9vlkw5esh',
//   };
//   const recipient = {
//     mnemonic:
//       'giraffe kitten problem ramp before switch else eye example slide since beauty',
//     addr: 'stars1m22rfkezkkrsmd8nmqd30zhmg2gz9r9xfvt55d',
//   };

// must use config.js since getClient uses config.js
const config = require('../config');
import { getClient } from '../src/helpers/client';
const configKeys = ['rpcEndpoint', 'minterCodeId', 'sg721CodeId'];
const collection1 = require('./collection1');
const collection2 = require('./collection2');
const collection3 = require('./collection3');
import { create_minter as create_minter } from '../src/create-collection/minter';
import { batchMint } from '../src/collection-actions/execute/mint';
import { toStars } from '../src/helpers/utils';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { naturalCompare } from '../src/helpers/sort';

// Define constants to use for launch. overrides config.js
// minter code id already locked in the factory addr contract
const FACTORY_ADDR =
  'stars15yucl9lt49n5d4v64q0tvzynqagryz2mrgq690aexeptehcfl7uq8wcn4h';
const SG721_BASE_CODE_ID = 161;

async function testnet_init() {
  if (config.rpcEndpoint == 'https://rpc.stargaze-apis.com/') {
    throw new Error('RPC pointed to mainnet. Change rpcEndpoint in config.js');
  }
  const buyer = {
    mnemonic:
      'during genius fiscal calm host toast cruel citizen crane skate vessel source',
    addr: 'stars1kzhnfvqda4e44qvwpdgnswkrgvlqf9vlkw5esh',
  };
  const recipient = { addr: 'stars1m22rfkezkkrsmd8nmqd30zhmg2gz9r9xfvt55d' };

  // save code ids from config
  // inherit from collection1
  // setup collection1
  await updateConfig(collection1);

  console.log('in testnet-launch config.account ', config.account);
  console.log(
    'in testnet-launch config.vendingFactory ',
    config.vendingFactory
  );
  const minterAddr = await create_minter(undefined);
  if (minterAddr == undefined) {
    throw new Error('addr undefined');
  }
  config.minter = minterAddr;
  console.log('collection 1 minter addr: ', minterAddr);

  // 50x mint as buyer from collection #1
  await batchMint(buyer.addr, 50);
  // transfer nft to recipient
  const client = await CosmWasmClient.connect(config.rpcEndpoint);
  let configResponse = await client.queryContractSmart(minterAddr, {
    config: {},
  });
  let sg721 = configResponse.sg721_address;
  let nfts = await client.queryContractSmart(sg721, {
    tokens: { owner: buyer.addr, limit: 30 },
  });
  let token_id = nfts.tokens.sort(naturalCompare).pop();
  await transferNft(buyer, minterAddr, token_id, recipient);

  // save code ids from config
  // inherit from collection2
  // set up collection2
  await updateConfig(collection2);
  const minterAddr2 = await create_minter(undefined);
  if (minterAddr2 == undefined) {
    throw new Error('addr undefined');
  }
  config.minter = minterAddr2;
  console.log('collection 2 minter addr: ', minterAddr2);

  // 5x mint as buyer from collection #2
  await batchMint(buyer.addr, 5);
  // transfer nft to recipient
  configResponse = await client.queryContractSmart(minterAddr2, {
    config: {},
  });
  sg721 = configResponse.sg721_address;
  nfts = await client.queryContractSmart(sg721, {
    tokens: { owner: buyer.addr, limit: 30 },
  });
  token_id = nfts.tokens.sort(naturalCompare).pop();
  await transferNft(buyer, minterAddr2, token_id, recipient);

  // save code ids from config
  // inherit from collection2
  // set up collection2
  await updateConfig(collection3);
  const minterAddr3 = await create_minter(undefined);
  if (minterAddr3 == undefined) {
    throw new Error('addr undefined');
  }
  config.minter = minterAddr3;
  console.log('collection 3 minter addr: ', minterAddr3);

  // 10x mint as buyer from collection #3
  await batchMint(buyer.addr, 10);
}

async function updateConfig(collectionConfig: any) {
  Object.keys(config).forEach((key) => {
    configKeys.includes(key) || delete config[key];
  });
  Object.keys(collectionConfig).forEach((key) => {
    config[key] = collectionConfig[key];
  });
  config.startTime = new Date(Date.now() + 10_000);
  config.tradingStartTime = new Date(Date.now() + 100_000);
  // add common vending factory address and sg721 base code id for collections
  config.vendingFactory = FACTORY_ADDR;
  config.sg721BaseCodeId = SG721_BASE_CODE_ID;
}

async function transferNft(
  buyer: any,
  minter: string,
  token_id: string,
  recipient: any
) {
  const sender = toStars(buyer.addr);
  const starsRecipient = toStars(recipient.addr);
  config.mnemonic = buyer.mnemonic;
  config.account = sender;
  const client = await getClient();

  const configResponse = await client.queryContractSmart(minter, {
    config: {},
  });

  const sg721 = configResponse.sg721_address;

  const msg = { transfer_nft: { recipient: starsRecipient, token_id } };
  console.log(sender);
  console.log(sg721);
  console.log(msg);
  const result = await client.execute(sender, sg721, msg, 'auto', 'transfer');
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

testnet_init();
