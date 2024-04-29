import { toBech32, fromBech32 } from '@cosmjs/encoding';
const config = require('../../config');

export const toStars = (addr: string) => {
  try {
    const { prefix, data } = fromBech32(addr);
    // limit to prefixes coin type 118, known to work with keplr
    // https://medium.com/chainapsis/keplr-explained-coin-type-118-9781d26b2c4e
    const compatiblePrefixes = ['osmo', 'cosmos', 'stars', 'regen'];
    if (!compatiblePrefixes.includes(prefix)) {
      throw new Error('Address not compatible with Keplr: ' + addr);
    }
    const starsAddr = toBech32('stars', data);
    // wallet address length 20, contract address length 32
    if (![20, 32].includes(data.length)) {
      throw new Error('Invalid address: ' + addr + ' ' + starsAddr);
    }
    addr = starsAddr;
    return addr;
  } catch (e) {
    throw new Error('Invalid address: ' + addr + ',' + e);
  }
};

export const isValidHttpUrl = (uri: string) => {
  let url;

  try {
    url = new URL(uri);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

export const isValidIpfsUrl = (uri: string) => {
  let url;

  try {
    url = new URL(uri);
  } catch (_) {
    return false;
  }

  return url.protocol === 'ipfs:';
};

export const formatRoyaltyInfo = (
  royaltyPaymentAddress: null | string,
  royaltyShare: string
) => {
  if (royaltyPaymentAddress === null) {
    return null;
  } else {
    if (royaltyShare === undefined || royaltyShare == '') {
      throw new Error('royaltyPaymentAddress present, but no royaltyShare');
    }
    return { payment_address: royaltyPaymentAddress, share: royaltyShare };
  }
};

export const nameToAddress = async (name: string) =>  {
  try {
    let RPC_ENDPOINT = config.testnetRpc;
    let NAMES_CONTRACT = config.testnetNameServiceContract;
    if (config.mainnet === true) {
      RPC_ENDPOINT = config.mainnetRpc;
      NAMES_CONTRACT = config.mainnetNameServiceContract;
    }
    
    if (!name) {
      throw new Error('Name is empty');
    }
    
    const query = {
      associated_address: {
        name,
      },
    };
    const encodedQuery = Buffer.from(JSON.stringify(query)).toString('base64');
    const url = `${RPC_ENDPOINT}/cosmwasm/wasm/v1/contract/${NAMES_CONTRACT}/smart/${encodedQuery}`;

    const response = await fetch(url);
    const json = await response.json();
    if (!json.data) {
      throw new Error('No data key in json response');
    }
    return json.data;

  } catch (err) {
    throw new Error('Error fetching address from name service: ' + err);
  }
};