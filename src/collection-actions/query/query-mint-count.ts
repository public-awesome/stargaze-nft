import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../../helpers/utils';

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

const config = require('../../../config');

interface Address {
  address: string;
}

async function queryMintCount() {
  const client = await CosmWasmClient.connect(config.rpcEndpoint);
  const account = toStars(config.account);
  const minter = toStars(config.minter);

  const __dirname = process.cwd();
  const csvFilePath = path.resolve(__dirname, './mint_count_addresses.csv');
  const headers = ['address'];
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  let addrs: Array<string> = [];

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
    },
    async (error, fileContents: Address[]) => {
      if (error) {
        throw error;
      }
      fileContents.map((row) => addrs.push(row.address));
      for (let i in addrs) {
        let address = addrs[i];
        const result = await client.queryContractSmart(minter, {
          mint_count: { address },
        });
        console.log(`${result.address},${result.count}`);
      }
    }
  );
}

queryMintCount();
