import { CreateMinterMsgForNullable_Empty } from '@stargazezone/launchpad/src/BaseMinter.types';
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

const config = require('../../config');

function clean(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export async function create_minter() {
  console.log('Collection name:', config.name);
  console.log('Account:', config.account, '\n');
  const account = toStars(config.account);
  const royaltyPaymentAddress = config.royaltyPaymentAddress
    ? toStars(config.royaltyPaymentAddress)
    : null;
  const royaltyInfo = formatRoyaltyInfo(
    royaltyPaymentAddress,
    config.royaltyShare
  );

  if (!isValidIpfsUrl(config.image) && !isValidHttpUrl(config.image)) {
    throw new Error('Image link is not valid. Must be IPFS or http(s)');
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

  const initMsg: CreateMinterMsgForNullable_Empty = {
    init_msg: {},
    collection_params: {
      code_id: config.sg721BaseCodeId,
      name: config.name,
      symbol: config.symbol,
      info: {
        creator: config.account,
        description: config.description,
        image: config.image,
        explicit_content: config.explicit_content || false,
        royalty_info: royaltyInfo,
        start_trading_time: null,
      },
    },
  };

  console.log('base factory addr: ', config.baseFactory);

  const paramsResponse = await client.queryContractSmart(config.baseFactory, {
    params: {},
  });
  console.log('params response', paramsResponse);

  const tempMsg = { create_minter: initMsg };

  const creationFee = paramsResponse.params.creation_fee.amount;

  if (
    tempMsg.create_minter?.collection_params.info?.royalty_info
      ?.payment_address === undefined &&
    tempMsg.create_minter?.collection_params.info?.royalty_info?.share ===
      undefined
  ) {
    tempMsg.create_minter.collection_params.info.royalty_info = null;
  }
  const msg = clean(tempMsg);

  // Get confirmation before preceding
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
    config.baseFactory,
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
    console.info('Add these contract addresses to config.js:');
    console.info('Minter address: ', result.logs[0].events[16].attributes[0].value);
    console.info(
      'Collection contract address: ',
      result.logs[0].events[18].attributes[0].value
    );
    return result.logs[0].events[16].attributes[0].value;
  }
}

const args = process.argv.slice(2);
if (args.length == 0) {
  create_minter();
} else {
  console.log('Invalid arguments');
}
