// Display marketplace collection floor price
// First gets all Sg721 contract addresses
// Queries AsksSortedByPrice
// Outputs to console as csv

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../helpers/utils';
const config = require('../../config');
const fetch = require('node-fetch');
require('dotenv').config();

async function collection_floor_prices() {
  const sg721Addrs = await fetchContractsByCodeId(config.sg721CodeId);
  console.log('found', sg721Addrs.length, 'sg721 addresses');
  const marketplaceAddr = toStars(config.marketplace);
  console.log('marketplace addr:', marketplaceAddr);
  const client = await CosmWasmClient.connect(config.rpcEndpoint);

  for (const sg721Addr of sg721Addrs) {
    const configResponse = await client.queryContractSmart(marketplaceAddr, {
      asks_sorted_by_price: { collection: sg721Addr },
    });
    if (configResponse.asks.length > 0) {
      console.log(sg721Addr + ',' + configResponse.asks[0].price);
    } else {
      console.log(sg721Addr + ',' + 'no-asks');
    }
  }
}

async function fetchContractsByCodeId(codeId: string) {
  const restApi = process.env.REST_API;
  if (restApi == undefined) {
    throw new Error('REST_API required in .env');
  }
  const contractsUrl =
    restApi +
    'cosmwasm/wasm/v1/code/' +
    codeId +
    '/contracts?pagination.limit=300';
  const res = await fetch(contractsUrl)
    .then((res: { status: number; json: () => any }) => {
      if (!(res.status == 200 || res.status == 201)) {
        throw new Error('Bad response from server');
      }
      return res.json();
    })
    .catch((err: any) => {
      console.error(err);
    });
  return res['contracts'];
}

const args = process.argv.slice(2);
if (args.length == 0) {
  collection_floor_prices();
} else {
  console.log('Invalid arguments');
}
