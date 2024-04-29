import { Timestamp } from '@stargazezone/launchpad/src/VendingMinter.types';
import { coins } from '@cosmjs/amino';
import { Decimal } from '@cosmjs/math';
import inquirer from 'inquirer';
import { getClient } from '../helpers/client';
import {
  isValidHttpUrl,
  toStars,
  isValidIpfsUrl,
  formatRoyaltyInfo,
} from '../helpers/utils';
import { toUtf8 } from '@cosmjs/encoding';

const config = require('../../config');

function clean(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export type OpenEditionMinterParams =
  | {
      sg721CodeId: number;
      openEditionMinterCodeId: number;
      openEditionFactory: string;
      [k: string]: unknown;
    }
  | undefined;

export async function create_minter(params: OpenEditionMinterParams) {
  if (params !== undefined) {
    const { sg721CodeId, openEditionMinterCodeId, openEditionFactory } = params;
    config.sg721OpenEditionCodeId = sg721CodeId;
    config.openEditionMinterCodeId = openEditionMinterCodeId;
    config.openEditionFactory = openEditionFactory;
  }
  console.log('Collection name:', config.name);
  console.log('Account:', config.account, '\n');
  const account = toStars(config.account);
  const paymentAddress = config.openEditionMinterConfig.paymentAddress
    ? toStars(config.openEditionMinterConfig.paymentAddress)
    : config.account;
  const royaltyPaymentAddress = config.royaltyPaymentAddress
    ? toStars(config.royaltyPaymentAddress)
    : null;
  const royaltyInfo = formatRoyaltyInfo(
    royaltyPaymentAddress,
    config.royaltyShare
  );

  const storageType = await inquirer.prompt([
    {
      message: 'Where should the metadata be stored?',
      name: 'type',
      type: 'list',
      choices: ['off-chain (IPFS)', 'on-chain'],
    },
  ]);

  console.log('Storage type:', storageType.type, '\n');

  if (storageType.type === 'off-chain (IPFS)' && !isValidIpfsUrl(config.openEditionMinterConfig.tokenUri)) {
    throw new Error('Invalid token URI, please check config.js > openEditionMinterConfig > tokenUri');
  }

  if (storageType.type === 'on-chain' && !config.openEditionMinterConfig.metadata) {
    throw new Error('No metadata found, please check config.js > openEditionMinterConfig > metadata');
  }

  if (!isValidIpfsUrl(config.image) && !isValidHttpUrl(config.image)) {
    throw new Error('Image link is not valid. Must be IPFS or http(s)');
  }
  
  if (!config.openEditionMinterConfig.perAddressLimit || config.openEditionMinterConfig.perAddressLimit === 0) {
    throw new Error('perAddressLimit must be defined and greater than 0');
  }
  
  if (
    royaltyInfo &&
    Decimal.fromUserInput(royaltyInfo?.share, 3).isGreaterThan(
      Decimal.fromUserInput('0.100', 3)
      )
      ) {
        throw new Error("Royalty share must be lower than or equal to '0.100'");
      }
      
      const client = await getClient();
      
      // time expressed in nanoseconds (1 millionth of a millisecond)
      const startTime: Timestamp = (
        new Date(config.openEditionMinterConfig.startTime).getTime() * 1_000_000
        ).toString();
        
        const endTime: Timestamp = (
          new Date(config.openEditionMinterConfig.endTime).getTime() * 1_000_000
          ).toString();
          
          // time expressed in nanoseconds (1 millionth of a millisecond)
          const startTradingTime: Timestamp | null = config.openEditionMinterConfig.startTradingTime
          ? (new Date(config.openEditionMinterConfig.startTradingTime).getTime() * 1_000_000).toString()
          : null;
          
  const initMsg = {
    init_msg: {
      nft_data: {
        nft_data_type: storageType.type === 'off-chain (IPFS)' ? "off_chain_metadata" : "on_chain_metadata",
        token_uri: storageType.type === 'off-chain (IPFS)' ? config.openEditionMinterConfig.tokenUri : null,
        extension:  storageType.type === 'on-chain' ? {
          image: config.openEditionMinterConfig.metadata.image,
          name: config.openEditionMinterConfig.metadata.name,
          description: config.openEditionMinterConfig.metadata.description,
          attributes: config.openEditionMinterConfig.metadata.attributes,
          external_url: config.openEditionMinterConfig.metadata.external_url,
          animation_url: config.openEditionMinterConfig.metadata.animation_url,
          youtube_url: config.openEditionMinterConfig.metadata.youtube_url,
        }: null,
      },
      start_time: startTime,
      end_time: endTime,
      mint_price: {
        amount: (config.openEditionMinterConfig.mintPrice * 1000000).toString(),
        denom: 'ustars',
      },
      per_address_limit: config.openEditionMinterConfig.perAddressLimit,
      payment_address: paymentAddress,
    },
    collection_params: {
      code_id: config.sg721OpenEditionCodeId,
      name: config.name,
      symbol: config.symbol,
      info: {
        creator: config.account,
        description: config.description,
        image: config.image,
        explicit_content: config.explicit_content || false,
        royalty_info: royaltyInfo,
        start_trading_time: startTradingTime || null,
      },
    },
  };

  console.log('Open Edition Factory address: ', config.openEditionFactory);

  const paramsResponse = await client.queryContractSmart(
    config.openEditionFactory,
    {
      params: {},
    }
  );
  console.log('Open Edition Factory parameters: ', paramsResponse);

  const tempMsg = { create_minter: initMsg };

  const creationFee = paramsResponse.params.creation_fee.amount;

  // TODO use recursive cleanup of undefined and null values
  if (
    tempMsg.create_minter?.collection_params.info?.royalty_info
      ?.payment_address === undefined &&
    tempMsg.create_minter?.collection_params.info?.royalty_info?.share ===
      undefined
  ) {
    tempMsg.create_minter.collection_params.info.royalty_info = null;
  }
  const msg = clean(tempMsg);
  // encode msg is needed for simulate function
  const encodeMsgcreator= (obj: any)=> {
    const msg = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: {
        sender: account,
        contract: config.openEditionFactory,
        msg: toUtf8(
          JSON.stringify(obj)
        ),
        funds:coins(creationFee, 'ustars')
      },
    };
  
  return msg;
  }
  const encodeMsg = encodeMsgcreator(msg);

  // Get confirmation before proceeding
  console.log(
    'Please confirm the settings for your minter and collection. THERE IS NO WAY TO UPDATE THIS ONCE IT IS ON CHAIN.'
  );
  console.log(JSON.stringify(msg, null, 2));
  console.log(
    'Cost of minter instantiation: ' +
      creationFee +
      ' ' +
      'ustars'
  );
  console.log("Total gas fee to be paid: ",await client.simulate(account, [encodeMsg],undefined)+" ustars");
  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(
    account,
    config.openEditionFactory,
    msg,
    'auto',
    config.name,
    coins(creationFee, 'ustars')
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
  console.info('Tx Hash: ', result.transactionHash);
  if (wasmEvent != undefined) {
    console.info('You may add these contract addresses to config.js to perform actions for the collection:');
    console.info('Open Edition Minter address: ', result.logs[0].events[16].attributes[0].value);
    console.info('Collection contract address: ', result.logs[0].events[18].attributes[0].value);
    return result.logs[0].events[16].attributes[0].value;
  }
}

async function create_updatable_open_edition_minter() {
  console.log('Creating updatable open edition minter...');
  let params = {
    sg721CodeId: config.sg721OpenEditionUpdatableCodeId,
    openEditionMinterCodeId: config.openEditionMinterCodeId,
    openEditionFactory: config.openEditionUpdatableFactory,
  };
  create_minter(params);
}

async function updatePerAddressLimit() {
  const client = await getClient();
  const account = toStars(config.account);
  const minter = toStars(config.minter);
  const limit: number = config.openEditionMinterConfig.perAddressLimit;

  if (!minter) {
    throw Error(
      '"minter" must be set to an open edition minter contract address in config.js'
    );
  }
  console.log('Minter contract: ', config.minter);

  if (limit <= 0 || limit > 50) {
    throw new Error('invalid perAddressLimit in config.js');
  }

  const msg = { update_per_address_limit: { per_address_limit: limit } };
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message: 'Ready to update per address limit to ' + limit + '?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(account, minter, msg, 'auto');
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

// Takes config.minter address and config.openEditionMinterConfig.startTradingTime
// and tries to update existing trading start time.
// Can not update if it's beyond the max offset
async function updateStartTradingTime() {
  const client = await getClient();
  const account = toStars(config.account);
  const minter = toStars(config.minter);

  // time expressed in nanoseconds (1 millionth of a millisecond)
  const startTradingTime: Timestamp = (
    new Date(config.openEditionMinterConfig.startTradingTime).getTime() * 1_000_000
  ).toString();
  const msg = { update_start_trading_time: startTradingTime };
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message:
        'Are you sure your want to change start trading time to ' +
        config.startTradingTime +
        ' ?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(account, minter, msg, 'auto');

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

const args = process.argv.slice(2);
if (args.length == 0) {
  create_minter(undefined);
} else if (args.length == 1 && args[0] == '--updatable') {
  create_updatable_open_edition_minter();
} else if (args.length == 1 && args[0] == '--update-start-trading-time') {
  updateStartTradingTime();
} else if (args.length == 1 && args[0] == '--update-per-address-limit') {
  updatePerAddressLimit();
} else {
  console.log('Invalid arguments');
}
