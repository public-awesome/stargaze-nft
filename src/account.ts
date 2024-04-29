import { Bip39, Random } from '@cosmjs/crypto';
import { Secp256k1HdWallet, encodeSecp256k1Pubkey } from '@cosmjs/amino';

async function createAccount() {
  const mnemonic = Bip39.encode(Random.getBytes(16)).toString();
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'stars',
  });
  const [{ address, pubkey }] = await wallet.getAccounts();

  console.info('mnemonic:', mnemonic);
  console.info('pubkey:', encodeSecp256k1Pubkey(pubkey));
  console.info('address:', address);
}

createAccount();
