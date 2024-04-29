/*
 * This is the main config for your NFT sale.
 *
 * Fill this out with all your project details.
 */

module.exports = {
  //// ACCOUNT INFO ////
  // The account seed phrase to use for deployment
  mnemonic:
    'mixture daring fatigue range piano famous window ranch flock boy property city',
  // Your STARS address
  account: 'stars1...',

  //// API CONFIG ////
  // NFT.storage endpoint
  nftStorageEndpoint: 'https://api.nft.storage',
  // NFT.storage API key
  nftStorageApiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJBODk5OGI4ZkE2YTM1NzMyYmMxQTRDQzNhOUU2M0Y2NUM3ZjA1RWIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1NTE5MTcwNDQ2MiwibmFtZSI6IlRlc3QifQ.IbdV_26bkPHSdd81sxox5AoG-5a4CCEY4aCrdbCXwAE',
  // Pinata API Key (optional)
  pinataApiKey: '',
  // Pinata Secret Key (optional)
  pinataSecretKey: '',

  //// NETWORK CONFIG ////
  // The RPC endpoint for Stargaze testnet
  mainnetRpc: 'https://rpc.stargaze-apis.com/',
  // The RPC endpoint for Stargaze mainnet
  testnetRpc: 'https://rpc.elgafar-1.stargaze-apis.com/',
  // Set this to true if you are using Stargaze mainnet
  mainnet: false,
  // Names contract address for Stargaze testnet
  testnetNamesContract: 'stars1rgn9tuxnl3ju9td3mfxdl2vm4t8xuaztcdakgtyx23c4ffm97cus25fvjs',
  // Names contract address for Stargaze mainnet
  mainnetNamesContract: 'stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr',

  //// COLLECTION INFO ////
  // The name of your collection
  name: 'Collection Name',
  // The 3-7 letter ticker symbol for your collection
  symbol: 'SYM',
  // Project description
  description: 'An awesome NFT series',
  // Link to image to use as the main image for the collection.
  // Either IPFS or valid http links allowed. Gif compatible.
  // (at least 500 x 500 pixels)
  image:
    'ipfs://bafybeigi3bwpvyvsmnbj46ra4hyffcxdeaj6ntfk5jpic5mx27x6ih2qvq/images/1.png',
  // External_link is optional. Gif compatible
  //   external_link:
  // 'https://c.tenor.com/o656qFKDzeUAAAAC/rick-astley-never-gonna-give-you-up.gif',
  // The address for royalties to go to (may be the same as `account`)
  // Comment out both below if not using royalties
  // royaltyPaymentAddress: 'stars1...',
  // Royalty share: 1 = 100%, 0.1 = 10%
  // royaltyShare: '0.1',

  //// WHITELIST CONTRACT (OPTIONAL) ////
  // A list of whitelisted addresses that will be able to purchase the sale early
  // Comment out if not using a whilelist
  // whitelist: ['stars1..', 'stars1...'],
  // 'mint_count' is the number of NFTs that can be minted by the address in the flexible whitelist
  // whitelistFlex: [{address: 'stars1...', mint_count: 2}, {address: 'stars1...', mint_count: 1}],
  // The list of admin addresses that can perform actions on the whitelist after its instantiation
  // admins: ['stars1...'],
  // adminsMutable: true,
  // The date when the whitelist only purchasing period ends and everyone can buy (in ISO format)
  // whitelistStartTime: '2023-05-14T21:00:00.000Z',
  // whitelistEndTime: '2023-05-15T21:00:00.000Z',
  // The price (in STARS) for the whitelist (minimum 0 STARS)
  // whitelistPrice: 50,
  // The Per Address Limit during whitelist period this can be different than the main public limit
  // whitelistPerAddressLimit: 5,
  // The number of members in the whitelist (max 5000, each 1000 is 100 STARS)
  // whitelistMemberLimit: 100,
  // The contract address for your whitelist contract
  // Get this after running `yarn whitelist`
  // whitelistContract: 'stars1...',


  //// MINTER CONTRACT Configuration ////
  // The base URI to be used to programmatically mint tokens
  baseTokenUri: 'ipfs://...',
  // The number of tokens to mint
  numTokens: 100,
  // The price (in STARS) for your NFTs (minimum 0 STARS)
  mintPrice: 100,
  // Specify a payment address if different from the account
  paymentAddress: 'stars1...',
  // The max amount of NFTs an address can mint
  perAddressLimit: 1,
  // The date when the sale goes live
  // If whitelist is enabled, only whitelisted addresses will be able to purchase
  // startTime in ISO format
  startTime: '2022-08-11T19:00:00.000Z',
  // The date when secondary sales goes live
  // If this is not enabled a default offset will be used (usually 2 weeks)
  // That is set by governance
  // startTradingTime: '2022-08-11T19:00:00.000Z',
  // The minter contract address
  // Get this after running `yarn minter`
  minter: 'stars1...',
  // SG721 contract address
  // Get this after running `yarn minter`
  sg721: 'stars1...',

  // OPEN EDITION MINTER Configuration
  // Please make sure to fill in the related fields under Collection Info as well
  // openEditionMinterConfig: {
  //   mintPrice: 100,
  //   perAddressLimit: 3,
  //   paymentAddress: 'stars1...',
  //   startTime: '2023-06-12T17:00:00.000Z',
  //   endTime: '2023-06-13T17:00:00.000Z',
  //   startTradingTime: '2023-06-14T19:00:00.000Z',
    // The token URI to be used with the off-chain metadata option (metadata needs to be pre-uploaded to IPFS)
    // tokenUri: 'ipfs://bafy...',
    // The metadata to be used with the on-chain metadata option (metadata is stored on-chain during collection creation)
    // metadata: {
    //   image: 'ipfs://...',
    //   externalURL: 'https://...',
    //   description: 'Description of the NFT',
    //   name: 'Name of the NFT',
    //   attributes: [
    //     {
    //       trait_type: 'Trait Type',
    //       value: 'Trait Value',
    //     },
    //     {
    //       trait_type: 'Trait Type',
    //       value: 'Trait Value',
    //     }
    //   ],
    //   animationURL: 'ipfs://...',
    //   youtubeURL: 'https://www.youtube.com/watch?v=...',
    // },
  // },


  //// CONTRACT CODE IDs: Testnet ////
  // The code ID for sg721_base
  sg721BaseCodeId: 2595,
  // The code ID for sg721-updatable
  sg721UpdatableCodeId: 2596,
  // The code ID for open edition sg721-base
  sg721OpenEditionCodeId: 2595,
  // The code ID for open edition sg721-updatable
  sg721OpenEditionUpdatableCodeId: 2596,
  // The code ID for base minter
  baseMinterCodeId: 2598,
  // Address for the base factory contract
  baseFactory:
    'stars1a45hcxty3spnmm2f0papl8v4dk5ew29s4syhn4efte8u5haex99qlkrtnx',
  // The code ID for vending minter
  vendingMinterCodeId: 2600,
  // The code ID for vending flexible minter for use with whitelist flexible
  flexibleVendingMinterCodeId: 2601,
  // Addr for vending factory contract
  vendingFactory:
    'stars18h7ugh8eaug7wr0w4yjw0ls5s937z35pnkg935ucsek2y9xl3gaqqk4jtx',
  // Addr for updatable vending factory contract
  updatableVendingFactory:
    'stars1h65nms9gwg4vdktyqj84tu50gwlm34e0eczl5w2ezllxuzfxy9esa9qlt0',
  // Addr for flexible vending factory contract
  flexibleVendingFactory:
    'stars1hvu2ghqkcnvhtj2fc6wuazxt4dqcftslp2rwkkkcxy269a35a9pq60ug2q',
  // Addr for open edition factory contract  
  openEditionFactory:
    'stars13r06dn4jc6mudvvkl9rclxjctywm4nhl045jn9f8mk6vc53eylusy4zxzj',
  // Addr for open edition updatable factory contract  
  openEditionUpdatableFactory:
    'stars1n7np7wdmm4ea8tapkz00j3jtxupne0g8v9jj02j96wfn9w9ukxgs6hcsv0',
  // The code ID for open edition minter
  openEditionMinterCodeId: 2579,   
  // The code ID for the whitelist contract
  whitelistCodeId: 2602,
  // The code ID for the whitelist flexible contract
  whitelistFlexCodeId: 2603,
  // The marketplace contract address
  //   marketplace:
  //     'stars18cszlvm6pze0x9sz32qnjq4vtd45xehqs8dq7cwy8yhq35wfnn3qgzs5gu',

  // //// CONTRACT CODE IDs: Mainnet ////
  // // The code ID for sg721
  // sg721BaseCodeId: 41,
  // // The code ID for sg721-updatable
  // sg721UpdatableCodeId: 57,
  // // The code ID for open edition sg721-base
  // sg721OpenEditionCodeId: 62,
  // // The code ID for open edition sg721-updatable
  // sg721OpenEditionUpdatableCodeId: N/A,
  // // The code ID for base minter
  // baseMinterCodeId: 40,
  // // Address for the base factory contract
  // baseFactory:
  //   'stars1a9hmesdu8ckzrc0k8lp2hsf2r2j23qw7rk864e7h3my53cwtyp8s6d8hw7',
  // // The code ID for the minter contract
  // vendingMinterCodeId: 49,
  // flexibleVendingMinterCodeId: 54,
  // // Addr for vending factory contract
  // vendingFactory:
  //  'stars1cadkattm22c7mn6l844r4y0n70x9k5e5dp0ez38w29rxxc8qnuss5hk94j',
  // flexibleVendingFactory:
  //   'stars1yv0xyj44s33r6ccj2l00z336xsm9dwdqegmada37ajxaqr36t77qmcgcej',
  // Addr for open edition factory contract  
  // openEditionFactory:
  //   'stars1xsmnt6tnw4uq2rgq4dnjdjvxj08uysv5e5ukwkd9cwppydludjuskxvpkl',
  // // Addr for open edition updatable factory contract  
  // openEditionUpdatableFactory:
  //   'N/A',
  // // The code ID for open edition minter
  // openEditionMinterCodeId: 61,   
  // // The code ID for the whitelist contract
  // whitelistCodeId: 50,
  // whitelistFlexCodeId: 53,
  // The marketplace contract address
  //   marketplace:
  //       'stars1fvhcnyddukcqfnt7nlwv3thm5we22lyxyxylr9h77cvgkcn43xfsvgv0pl',

    // //// SPLITS CONTRACT (OPTIONAL) ////

  // // Mainnet Use  
  // // The code ID for the cw4-group contract
  // cw4GroupCodeId: 26,
  // // The code ID for the splits contract
  // splitsCodeId: 35,

  // // Testnet Use
  // // The code ID for the cw4-group contract
  // cw4GroupCodeId: 1904,
  // // The code ID for the splits contract
  // splitsCodeId: 1905,

  // // This admin can add/remove members from the group (optional)
  // // If not set, the group is immutable forever, so it's best to set this.
  // groupAdmin: 'stars1...',
  // // This admin can control distribution from the splits contract (optional)
  // // If not set, any member of the group can control distribution (recommended)
  // splitsAdmin: 'stars1...',
  // // Members and their weights
  // members: [
  //   { addr: 'stars1...', weight: 90 },
  //   { addr: 'stars1...', weight: 10 },
  // ],
  // groupContract: 'stars1...',
  // // The contract address of your splits contract to distribute funds 
  // splitsContract: 'stars1...',
};

