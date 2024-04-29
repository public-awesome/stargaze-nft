// Simple upload 500 addresses to whitelist using whitelist_addresses.csv.
// Accepts cosmos, stars addresses.
// If you run into an error with `member_limit`, run `yarn whitelist --increase-member-limit`

import { ExecuteMsg } from '@stargazezone/types/contracts/whitelist/execute_msg';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../helpers/utils';
import inquirer from 'inquirer';
import { getClient } from '../helpers/client';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { toUtf8 } from '@cosmjs/encoding';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

const config = require('../../config');
const MSG_ADD_ADDR_LIMIT = 500;

async function addFile() {
  interface Whitelist {
    address: string;
  }
  const __dirname = process.cwd();
  const csvFilePath = path.resolve(__dirname, './whitelist_addresses.csv');
  const headers = ['address'];
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  const addrs: Array<string> = [];
  const client = await getClient();
  if (!config.minter) {
    throw Error(
      '"minter" must be set to a minter contract address in config.js'
    );
  }
  await parse(
    fileContent,
    {
      delimiter: ',',
      columns: headers,
      skip_empty_lines: true,
      skip_records_with_empty_values: true,
      trim: true,
    },
    async (error: any, fileContents: Whitelist[]) => {
      if (error) {
        throw error;
      }
      fileContents.map((row) => addrs.push(row.address));
      console.log(addrs);

      const validatedAddrs: Array<string> = [];
      addrs.forEach((addr) => {
        validatedAddrs.push(toStars(addr));
      });
      let uniqueValidatedAddrs = [...new Set(validatedAddrs)].sort();
      if (uniqueValidatedAddrs.length > MSG_ADD_ADDR_LIMIT) {
        throw new Error(
          'Too many whitelist addrs added in a transaction. Max ' +
            MSG_ADD_ADDR_LIMIT +
            ' at a time.'
        );
      }
      console.log(
        'Whitelist addresses validated and deduped. member number: ' +
          uniqueValidatedAddrs.length
      );

      const msg: ExecuteMsg = {
        add_members: { to_add: uniqueValidatedAddrs },
      };
      const executeContractMsg: MsgExecuteContractEncodeObject = {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: MsgExecuteContract.fromPartial({
          sender: config.account,
          contract: config.whitelistContract,
          msg: toUtf8(JSON.stringify(msg)),
          funds: [],
        }),
      };
      
      let estimatedGas = await client.simulate(config.account,[executeContractMsg], 'auto');
      
      // Get confirmation before preceding
      console.log(
        'Please confirm the settings for adding whitelist file. THERE IS NO WAY TO UPDATE THIS ONCE IT IS ON CHAIN.'
        );
        console.log(JSON.stringify(msg, null, 2));
        console.log('Estimated gas:', estimatedGas + ' ustars');
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
        [executeContractMsg],
        'auto',
        'batch add addrs to whitelist'
      );
      assertIsDeliverTxSuccess(result);

      console.log('Tx hash: ', result.transactionHash);
      let res = await client.queryContractSmart(config.whitelistContract, {
        members: { limit: 100 },
      });
      console.log('first 100 members:', res);
    }
  );
}

addFile();
