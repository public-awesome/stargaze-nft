import inquirer from 'inquirer';
import { toStars } from '../helpers/utils';
import { getClient } from '../helpers/client';
import { toBase64 } from '@cosmjs/encoding';
import { toUtf8 } from '@cosmjs/encoding';
import { InstantiateMsg as SplitsInstantiateMsg } from '@stargazezone/launchpad/src/Splits.types';

const config = require('../../config');

async function initGroup() {
  const client = await getClient();
  
  // @ts-ignore
  const msg: InstantiateMsg = {
    members: config.members,
  };
  
  if (config.groupAdmin != undefined) {
    msg.admin = toStars(config.groupAdmin);
  }

  console.log('Instantiating cw4-group contract...');

  const result = await client.instantiate(
    config.account,
    config.cw4GroupCodeId,
    msg,
    'cw4-group',
    'auto',
    { admin: config.account }
  );

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'instantiate');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );

  const addr = wasmEvent?.attributes.find((a) => a.key === '_contract_address');
  console.log('Group contract:', addr?.value);
}

async function initSplit(groupAddr: string) {
  const client = await getClient();
  // @ts-ignore
  const msg: InstantiateMsg = {
    group: {
      cw4_address: toStars(groupAddr),
    },
  };

  // FIXME: this causes `client.instantiate` to fail
  // const msg: SplitsInstantiateMsg = {
  //   group: {
  //     cw4_address: toStars(groupAddr),
  //   },
  // };

  if (config.splitsAdmin != undefined) {
    msg.admin = toStars(config.splitsAdmin);
  }

  console.log('Instantiating splits contract...');

  const result = await client.instantiate(
    config.account,
    config.splitsCodeId,
    msg,
    'splits',
    'auto',
    { admin: config.account }
  );

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'instantiate');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

async function initCombo() {
  const client = await getClient();

  // @ts-ignore
  const groupMsg: any = {
    members: config.members,
  };

  if (config.groupAdmin != undefined) {
    groupMsg.admin = toStars(config.groupAdmin);
  }

  // base64 encode groupMsg
  // @ts-ignore
  const groupMsgBase64 = toBase64(toUtf8(JSON.stringify(groupMsg)));

  // @ts-ignore
  const msg: InstantiateMsg = {
    group: {
      cw4_instantiate: {
        code_id: config.cw4GroupCodeId,
        label: 'cw4-group',
        msg: groupMsgBase64,
      },
    },
  };

  if (config.splitsAdmin != undefined) {
    msg.admin = toStars(config.splitsAdmin);
  }

  console.log('Instantiating combined splits contract...');

  const result = await client.instantiate(
    config.account,
    config.splitsCodeId,
    msg,
    'splits',
    'auto',
    { admin: config.account }
  );

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'instantiate');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

const args = process.argv.slice(2);

if (args.length == 0) {
   initGroup();
} else if (args[0] == 'splits' && args.length == 2) {
  initSplit(args[1]);
} else if (args[0] == 'combo') {
  initCombo();
} else {
  console.log('Invalid arguments');
}
