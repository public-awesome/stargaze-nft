import { InstantiateMsg } from '@stargazezone/types/contracts/whitelist/instantiate_msg';
import { ExecuteMsg } from '@stargazezone/types/contracts/whitelist/execute_msg';
import { Timestamp } from '@stargazezone/types/contracts/minter/shared-types';
import { coins } from '@cosmjs/amino';
import inquirer from 'inquirer';
import { toStars } from '../helpers/utils';
import { getClient } from '../helpers/client';

const config = require('../../config');

const WHITELIST_CREATION_FEE = coins('100000000', 'ustars');

interface Member {
  address: string;
  mint_count: number;
}

async function init() {
  // `members`, `start_time`, `end_time`, `mint_price`, `member_limit`, `admins`, `admins_mutable`, `whale_cap`
  if (!config.whitelistStartTime || config.whitelistStartTime == '') {
    throw new Error('invalid whitelistStartTime');
  }
  if (!config.whitelistEndTime || config.whitelistEndTime == '') {
    throw new Error('invalid whitelistEndTime');
  }
  if (!config.whitelistMemberLimit) {
    throw new Error('whitelistMemberLimit required');
  }

  const client = await getClient();

  // Whitelist can start with empty values and added later
  let whitelist = config.whitelistFlex || [];
  whitelist =
    whitelist.length > 0
      ? whitelist.map((item: any) => {
          return {
            address: toStars(item.address),
            mint_count: item.mint_count,
          };
        })
      : [];

  // time expressed in nanoseconds (1 millionth of a millisecond)
  const whitelistStartTime: Timestamp = (
    new Date(config.whitelistStartTime).getTime() * 1_000_000
  ).toString();

  const whitelistEndTime: Timestamp = (
    new Date(config.whitelistEndTime).getTime() * 1_000_000
  ).toString();

  // @ts-ignore
  const msg: InstantiateMsg = {
    members: whitelist,
    start_time: whitelistStartTime,
    end_time: whitelistEndTime,
    mint_price: {
      amount: (config.whitelistPrice * 1000000).toString(),
      denom: 'ustars',
    },
    member_limit: config.whitelistMemberLimit,
    admins: [config.account],
    admins_mutable: config.adminsMutable,
  };
  if (config.whaleCap != undefined) {
    msg.whale_cap = config.whaleCap;
  }
  msg.admins_mutable =
    config.adminsMutable == undefined ? false : config.adminsMutable;

  // Get confirmation before preceding
  console.log(
    'Please confirm the settings for your whitelist-flexible. THERE IS NO WAY TO UPDATE THIS ONCE IT IS ON CHAIN.'
  );
  console.log(JSON.stringify(msg, null, 2));
  console.log(
    'Cost of whitelist instantiation: ' +
      WHITELIST_CREATION_FEE[0].amount +
      ' ' +
      WHITELIST_CREATION_FEE[0].denom
  );
  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  console.log('Instantiating flexible whitelist...');

  const result = await client.instantiate(
    config.account,
    config.whitelistFlexCodeId,
    msg,
    'whitelist',
    'auto',
    { funds: WHITELIST_CREATION_FEE, admin: config.account }
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

// {
//     "members": [{
//             "address": "stars10w5eulj60qp3cfqa0hkmke78qdy2feq6x9xdmd",
//             "mint_count": 2
//     }]
// }
async function add(data: string) {
  const client = await getClient();
  const account = toStars(config.account);
  const whitelistContract = toStars(config.whitelistContract);
  const addMembers: Array<Member> = JSON.parse(data).members;
  if (addMembers.length != 0) {
    addMembers.forEach(function (member: Member, index) {
      addMembers[index].address = toStars(member.address);
      console.log('member: ', member.address, ',', member.mint_count);
    });
  }

  const msg = {
    add_members: {
      to_add: addMembers,
    },
  };
  console.log(JSON.stringify(msg, null, 2));

  const result = await client.execute(
    account,
    whitelistContract,
    msg,
    'auto',
    'update whitelist'
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );

  let res = await client.queryContractSmart(config.whitelistContract, {
    members: {},
  });
  console.log(res);
}

async function increaseMemberLimit(newMemberLimit: string) {
  const memberLimit: number = parseInt(newMemberLimit);
  const account = toStars(config.account);
  const whitelistContract = toStars(config.whitelistContract);
  const client = await getClient();

  const msg = {
    increase_member_limit: memberLimit,
  };
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message:
        'Are you sure your want to increase member limit for whitelist to ' +
        memberLimit +
        ' ?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(account, whitelistContract, msg, 'auto');

  // execute this version if you get IncorrectCreationFee
  //   const result = await client.execute(
  //     account,
  //     whitelistContract,
  //     {
  //       increase_member_limit: memberLimit,
  //     },
  //     'auto',
  //     undefined,
  //     WHITELIST_CREATION_FEE
  //   );
}

// Takes config.whitelistContract address and config.whitelistStartTime
// and tries to update existing whitelist start time.
// Can not change if whitelist already started. Need to create a new whitelist
async function updateStartTime() {
  const client = await getClient();
  const account = toStars(config.account);
  const whitelistContract = toStars(config.whitelistContract);

  // time expressed in nanoseconds (1 millionth of a millisecond)
  const whitelistStartTime: Timestamp = (
    new Date(config.whitelistStartTime).getTime() * 1_000_000
  ).toString();
  const msg = { update_start_time: whitelistStartTime };
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message:
        'Are you sure your want to change whitelist start time to ' +
        config.whitelistStartTime +
        ' ?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(
    account,
    whitelistContract,
    { update_start_time: whitelistStartTime },
    'auto',
    'update whitelist start time'
  );

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

async function updateEndTime() {
  const client = await getClient();
  const account = toStars(config.account);
  const whitelistContract = toStars(config.whitelistContract);

  // time expressed in nanoseconds (1 millionth of a millisecond)
  const whitelistEndTime: Timestamp = (
    new Date(config.whitelistEndTime).getTime() * 1_000_000
  ).toString();
  const msg = { update_end_time: whitelistEndTime };
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message:
        'Are you sure your want to change whitelist end time to ' +
        config.whitelistEndTime +
        ' ?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  const result = await client.execute(
    account,
    whitelistContract,
    { update_end_time: whitelistEndTime },
    'auto',
    'update whitelist end time'
  );

  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

async function showConfig() {
  const client = await getClient();
  const whitelistContract = toStars(config.whitelistContract);

  let res = await client.queryContractSmart(whitelistContract, {
    config: {},
  });
  console.log(res);
}

const args = process.argv.slice(2);
if (args.length == 0) {
  init();
} else if (args.length == 2 && args[0] == '--add') {
  add(args[1]);
} else if (args.length == 2 && args[0] == '--increase-member-limit') {
  increaseMemberLimit(args[1]);
} else if (args.length == 1 && args[0] == '--update-start-time') {
  updateStartTime();
} else if (args.length == 1 && args[0] == '--update-end-time') {
  updateEndTime();
} else if (args.length == 1 && args[0] == '--show-config') {
  showConfig();
} else {
  console.log('Invalid arguments');
}
