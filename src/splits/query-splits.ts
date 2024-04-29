import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { toStars } from '../helpers/utils';

const config = require('../../config');
let splitsAddress= config.splitsContract;

async function querySplitsAdmin() {
  const client = await CosmWasmClient.connect(config.rpcEndpoint);
    const admin = await client.queryContractSmart(splitsAddress, {
        admin: {},
    });
    console.log('admin:', admin);
  }

async function querySplitsGroup() {
    const client = await CosmWasmClient.connect(config.rpcEndpoint);
    const group = await client.queryContractSmart(splitsAddress, {
        group: {},
    });
    console.log('group:', group);
}

async function querySplitsMember(address: string) {
    const client = await CosmWasmClient.connect(config.rpcEndpoint);
    const member = await client.queryContractSmart(splitsAddress, {
        member: {
            address: toStars(address),
        },
    });
    console.log('member:', member);
}

async function querySplitsListMembers() {
    const client = await CosmWasmClient.connect(config.rpcEndpoint);
    const members = await client.queryContractSmart(splitsAddress, {
        list_members: {
        },
    });
    console.log('members:', members);
}

if(!process.argv[3]){
    console.log('No query type specified');
    console.log('Query types: admin, group, member <member-address>, list-members');
    process.exit(1);
}
else if(process.argv[3] === 'admin'){
    querySplitsAdmin();
}   
else if(process.argv[3] === 'group'){
    querySplitsGroup();
}
else if(process.argv[3] === 'member'){
    if(!process.argv[4]){
        console.log('No address is specified');
        process.exit(1);
    }
    querySplitsMember(process.argv[4]);
}
else if(process.argv[3] === 'list-members'){
    querySplitsListMembers();
}
else{
    console.log('Invalid query type');
    process.exit(1);
}




