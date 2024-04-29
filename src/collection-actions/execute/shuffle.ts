// Shuffle() is a publically accessible function to introduce randomness to the token id mint order.
// Shuffle fee is required because of the gas expense from loading and saving many objects from storage.
// Current benchmarks show shuffle takes 35M gas.
// Shuffling can act as a countermeasure against rarity snipers.
// Shuffle Fee is meant to be controlled by governance proposal. It is currently hardcoded to 500 stars.

import { coins } from '@cosmjs/amino';
import { toStars } from '../../helpers/utils';
import { getClient } from '../../helpers/client';

const config = require('../../../config');

async function shuffle() {
  const client = await getClient();

  const shuffler = toStars(config.account);
  const minter = toStars(config.minter);
  console.log('shuffler address: ', shuffler);

  const shuffleFee = coins((500 * 1000000).toString(), 'ustars');
  const msg = { shuffle: {} };
  console.log(JSON.stringify(msg, null, 2));

  const response = await client.queryContractSmart(minter, {
    mintable_num_tokens: {},
  });
  console.log('mintable num tokens: ', response);

  const result = await client.execute(
    shuffler,
    minter,
    msg,
    'auto',
    'shuffle',
    shuffleFee
  );
  const wasmEvent = result.logs[0].events.find((e) => e.type === 'wasm');
  console.info(
    'The `wasm` event emitted by the contract execution:',
    wasmEvent
  );
}

shuffle();
