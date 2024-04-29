// Add rarity frequencies
// Frequencies displayed in NFT detail page
// Via how rare api, other rarity calculators can be added later
// https://doc.howrare.world

// ex: yarn devops-rarity

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
const fetch = require('node-fetch');
const config = require('../config');
require('dotenv').config();

async function fetchRarity(sg721Addr: string) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' +
        btoa(
          process.env.HOWRARE_API_KEY + ':' + process.env.HOWRARE_API_SECRET_KEY
        ),
    },
  };
  const res = await fetch(
    'https://api.howrare.world/v1/contracts/' + sg721Addr,
    requestOptions
  )
    .then((res: { status: number; json: () => any }) => {
      if (!(res.status == 200 || res.status == 201)) {
        throw new Error('Bad response from server');
      }
      return res.json();
    })
    .catch((err: any) => {
      console.error(err);
    });
  console.log(res);
  res;
}

async function rarity() {
  const howrare_key = process.env.HOWRARE_API_KEY;
  const howrare_secret_key = process.env.HOWRARE_API_SECRET_KEY;

  if (howrare_key == undefined) {
    throw new Error('HOWRARE_API_KEY required in .env');
  }
  if (howrare_secret_key == undefined) {
    throw new Error('HOWRARE_API_SECRET_KEY required in .env');
  }

  // get minters
  const client = await CosmWasmClient.connect(config.rpcEndpoint);
  const sg721s = await client.getContracts(config.sg721CodeId);

  // cycle through sg721s
  for (let i in sg721s) {
    console.log(sg721s[i]);
    await fetchRarity(sg721s[i]);
    await new Promise((f) => setTimeout(f, 1000));
  }
}

const args = process.argv.slice(2);
if (args.length == 0) {
  rarity();
} else {
  console.log('Invalid arguments');
}
