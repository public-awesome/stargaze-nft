// Transfer specific NFTs to recipient addresses using transfer.csv

// Requires transfer.csv with "recipient" and "token_id" columns
// Requires account have all the token-ids or it will error out
// Cycles through addresses and token ids to construct an array of messages to be broadcast

// Accepts cosmos, stars addresses.

import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../../helpers/utils';
import { getClient } from '../../helpers/client';
import inquirer from 'inquirer';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { toUtf8 } from '@cosmjs/encoding';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

const config = require('../../../config');
const MSG_TRANSFER_LIMIT = 250;

async function addFile() {
  interface TransferData {
    recipient: string;
    token_id: number;
  }
  const __dirname = process.cwd();
  const csvFilePath = path.resolve(__dirname, './transfer.csv');
  const headers = ['recipient', 'token_id'];
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  const addrs: Array<string> = [];
  const tokens: Array<number> = [];
  const executeContractMsgs: Array<MsgExecuteContractEncodeObject> = [];
  const client = await getClient();
  if (!config.minter) {
    throw Error(
      '"minter" must be set to a minter contract address in config.js'
    );
  }
  const funds: never[] = [];
  parse(
    fileContent,
    {
      delimiter: ',',
      columns: headers,
    },
    async (error, fileContents: TransferData[]) => {
      if (error) {
        throw error;
      }
      fileContents.map((row) => addrs.push(row.recipient));
      fileContents.map((row) => tokens.push(row.token_id));
      console.log(addrs);
      console.log(tokens);

      const validatedAddrs: Array<string> = [];
      addrs.forEach((addr) => {
        validatedAddrs.push(toStars(addr));
      });
      let uniqueValidatedAddrs = [...new Set(validatedAddrs)];
      if (uniqueValidatedAddrs.length > MSG_TRANSFER_LIMIT) {
        throw new Error(
          'Too many addrs added in a transaction. Max ' +
            MSG_TRANSFER_LIMIT +
            ' at a time.'
        );
      }
      if (uniqueValidatedAddrs.length !== tokens.length) {
        throw new Error('unique addrs length must equal token ids length');
      }
      console.log(
        'Recipient addresses validated and deduped. count: ' +
          uniqueValidatedAddrs.length
      );

      for (const idx in uniqueValidatedAddrs) {
        console.log(
          'transfer token id',
          tokens[idx],
          'to recipient address: ',
          uniqueValidatedAddrs[idx]
        );
        const msg = {
          transfer_nft: {
            recipient: uniqueValidatedAddrs[idx],
            token_id: tokens[idx],
          },
        };
        const executeContractMsg: MsgExecuteContractEncodeObject = {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: MsgExecuteContract.fromPartial({
            sender: config.account,
            contract: config.sg721,
            msg: toUtf8(JSON.stringify(msg)),
            funds,
          }),
        };

        executeContractMsgs.push(executeContractMsg);
      }
      console.log("Estimated gas price is" + await client.simulate(config.account, executeContractMsgs, 'auto') + " ustars");
      // Get confirmation before preceding
      console.log(
        'WARNING: Transfer is not reversible. Please confirm the settings for transferring tokens to addresses. THERE IS NO WAY TO UNDO THIS ONCE IT IS ON CHAIN.'
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
        'batch transfer'
      );
      assertIsDeliverTxSuccess(result);
    }
  );
}

addFile();
