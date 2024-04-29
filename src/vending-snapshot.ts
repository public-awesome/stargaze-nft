import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { appendFileSync } from 'fs';

const config = require('../config');

class TokenInfo {
  tokenId: string;
  owner: string;
  constructor(tokenId = '', owner = '') {
    this.tokenId = tokenId;
    this.owner = owner;
  }

  saveAsCSV() {
    const csv = `${this.tokenId},${this.owner}\n`;
    try {
      appendFileSync('./snapshot.csv', csv);
    } catch (err) {
      console.error(err);
    }
  }
}
const rpcEndpoint = config.mainnet === true ? config.mainnetRpc : config.testnetRpc;

async function snapshot(collection: string, expectedNumTokens: number) {
  console.log('Querying items from collection:', collection);

  const client = await CosmWasmClient.connect(rpcEndpoint);

  const row = new TokenInfo('token_id', 'address');
  row.saveAsCSV();

  for (let id = 1; id <= expectedNumTokens; id++) {
    try {
      const tokenInfo = await client.queryContractSmart(collection, {
        all_nft_info: { token_id: id.toString() },
      });
      console.log(`${id}, ${tokenInfo.access.owner}`);
      const row = new TokenInfo(id.toString(), tokenInfo.access.owner);
      row.saveAsCSV();
    } catch (error) {
      console.log(`${id}, 'burned'`);
      const row = new TokenInfo(id.toString(), 'burned');
      row.saveAsCSV();
    }
  }

  const numTokens = await client.queryContractSmart(collection, {
    num_tokens: {},
  });
  console.log('num tokens (excluding burned):', numTokens);

  const collectionInfo = await client.queryContractSmart(collection, {
    collection_info: {},
  });
  console.log('collection info:', collectionInfo);
}

const args = process.argv.slice(2);
snapshot(args[0], parseInt(args[1] || '10000'));
