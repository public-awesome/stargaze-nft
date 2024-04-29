// Update metadata for token ids using metadata.csv
// Requires the collection is sg721-updatable contract

import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { toUtf8 } from '@cosmjs/encoding';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import inquirer from 'inquirer';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { toStars } from '../../helpers/utils';
import { getClient } from '../../helpers/client';

// TODO custom type for update_token_metadata until sg721-updatable types added
export type ExecuteMsg = {
  update_token_metadata: {
    token_id: string;
    token_uri: string;
    [k: string]: unknown;
  };
};

const config = require('../../../config');
const MSG_UPDATE_LIMIT = 50;

async function addFile() {
  // custom data type for csv
  interface Metadata {
    token_id: number;
    metadata: string;
  }
  const __dirname = process.cwd();
  const csvFilePath = path.resolve(__dirname, './metadata.csv');
  const headers = ['token_id', 'metadata'];
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  const tokenIds: Array<number> = [];
  const metadata: Array<string> = [];
  const executeContractMsgs: Array<MsgExecuteContractEncodeObject> = [];
  const client = await getClient();
  if (!config.minter) {
    throw Error(
      '"minter" must be set to a minter contract address in config.js'
    );
  }
  const minter = toStars(config.minter);
  const configResponse = await client.queryContractSmart(minter, {
    config: {},
  });
  const sg721 = configResponse.sg721_address;

  await parse(
    fileContent,
    {
      delimiter: ',',
      columns: headers,
    },
    async (error, fileContents: Metadata[]) => {
      if (error) {
        throw error;
      }
      fileContents.map((row) => {
        tokenIds.push(row.token_id);
        metadata.push(row.metadata);
      });
      if (tokenIds.length > MSG_UPDATE_LIMIT) {
        throw new Error(
          'Too many addrs added in a transaction. Max ' +
            MSG_UPDATE_LIMIT +
            ' at a time.'
        );
      }

      // construct update msgs
      tokenIds.forEach((token_id, id) => {
        console.log('changing ', token_id, 'metadata to ', metadata[id]);
        const msg: ExecuteMsg = {
          update_token_metadata: {
            token_id: token_id.toString(),
            token_uri: metadata[id],
          },
        };
        const executeContractMsg: MsgExecuteContractEncodeObject = {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: MsgExecuteContract.fromPartial({
            sender: config.account,
            contract: sg721,
            msg: toUtf8(JSON.stringify(msg)),
            funds: [],
          }),
        };

        executeContractMsgs.push(executeContractMsg);
      });

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
        'batch update metadata'
      );
      assertIsDeliverTxSuccess(result);
    }
  );
}

async function updateTokenUri(token_id: number, token_uri: string) {
  const client = await getClient();
  if (!config.minter) {
    throw Error(
      '"minter" must be set to a minter contract address in config.js'
    );
  }
  const minter = toStars(config.minter);
  const configResponse = await client.queryContractSmart(minter, {
    config: {},
  });
  const sg721 = configResponse.sg721_address;

  const msg: ExecuteMsg = {
    update_token_metadata: {
      token_id: token_id.toString(),
      token_uri,
    },
  };

  // Get confirmation before preceding
  console.log('WARNING: Please confirm update token metadata.');
  console.log(JSON.stringify(msg, null, 2));
  const answer = await inquirer.prompt([
    {
      message: 'Ready to submit the transaction?',
      name: 'confirmation',
      type: 'confirm',
    },
  ]);
  if (!answer.confirmation) return;

  let result = await client.execute(
    config.account,
    sg721,
    msg,
    'auto',
    'update-metadata'
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm-update_update_token_metadata');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

const args = process.argv.slice(2);
if (args.length == 0) {
  addFile();
} else if (args.length == 2) {
  updateTokenUri(parseInt(args[0]), args[1]);
} else {
  console.log('Invalid arguments.');
}
