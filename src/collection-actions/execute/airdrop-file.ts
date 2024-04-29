// Airdrop 1 token per address for a batch of addresses using airdrop_addresses.csv

// WARNING: Airdrop order is not maintained! [addr1, addr2, addr3, addr4, addr5]
// will not 100% translate to [token_id1, token_id2, token_id3, token_id4, token_id5]
// ex: it could produce [token_id3, token_id4, token_id1, token_id5, token_id2]
// To guarantee token_id: 100 gets airdropped to addr1, use mint_for(100, addr1)

// Accepts cosmos, stars addresses.

import { ExecuteMsg } from '@stargazezone/types/contracts/minter/execute_msg';
import { coin } from '@cosmjs/amino';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../../helpers/utils';
import inquirer from 'inquirer';
import { getClient } from '../../helpers/client';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { toUtf8 } from '@cosmjs/encoding';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

const config = require('../../../config');
// airdrop fee will cost a low fee in the next minter upgrade
const AIRDROP_FEE = coin(5000, 'ustars');
const MSG_AIRDROP_LIMIT = 50;

async function addFile(uniqueOnly: boolean) {
  interface Airdrop {
    address: string;
  }
  const __dirname = process.cwd();
  const csvFilePath = path.resolve(__dirname, './airdrop_addresses.csv');
  const headers = ['address'];
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  const addrs: Array<string> = [];
  const executeContractMsgs: Array<MsgExecuteContractEncodeObject> = [];
  const client = await getClient();
  if (!config.minter) {
    throw Error(
      '"minter" must be set to a minter contract address in config.js'
    );
  }
  const funds = parseInt(AIRDROP_FEE.amount) == 0 ? [] : [AIRDROP_FEE];
  await parse(
    fileContent,
    {
      delimiter: ',',
      columns: headers,
    },
    async (error, fileContents: Airdrop[]) => {
      if (error) {
        throw error;
      }
      fileContents.map((row) => addrs.push(row.address));
      console.log(addrs);

      const validatedAddrs: Array<string> = [];
      addrs.forEach((addr) => {
        validatedAddrs.push(toStars(addr));
      });

      let finalAddrs: Array<string>;

      if (uniqueOnly) {
        finalAddrs = [...new Set(validatedAddrs)].sort();
      } else {
        finalAddrs = validatedAddrs;
      }

      if (finalAddrs.length > MSG_AIRDROP_LIMIT) {
        throw new Error(
          'Too many addrs added in a transaction. Max ' +
            MSG_AIRDROP_LIMIT +
            ' at a time.'
        );
      }
      console.log(
        'Airdrop addresses validated and deduped. count: ' + finalAddrs.length
      );

      for (const idx in finalAddrs) {
        console.log('airdropping to address: ', finalAddrs[idx]);
        const msg: ExecuteMsg = {
          mint_to: { recipient: finalAddrs[idx] },
        };
        const executeContractMsg: MsgExecuteContractEncodeObject = {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: MsgExecuteContract.fromPartial({
            sender: config.account,
            contract: config.minter,
            msg: toUtf8(JSON.stringify(msg)),
            funds,
          }),
        };
        
        executeContractMsgs.push(executeContractMsg);
      }
      
      let simulate = await client.simulate(config.account, executeContractMsgs, undefined);
      console.log('Estimated gas fee to be paid', simulate + " ustars");
      // Get confirmation before preceding
      console.log(
        'WARNING: Airdrop order is not maintained! Please confirm the settings for airdropping to addresses. THERE IS NO WAY TO UNDO THIS ONCE IT IS ON CHAIN.'
      );
      console.log(JSON.stringify(executeContractMsgs, null, 2));
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
        'batch mint_to'
      );
      assertIsDeliverTxSuccess(result);

      console.log('Tx hash: ', result.transactionHash);
      let res = await client.queryContractSmart(config.minter, {
        mintable_num_tokens: {},
      });
      console.log('mintable num tokens:', res);
    }
  );
}

const args = process.argv.slice(2);
if (args.length == 0) {
  addFile(true);
} else if (args.length == 1 && args[0] == '--keep-duplicates') {
  addFile(false);
} else {
  console.log('Invalid arguments.');
}
