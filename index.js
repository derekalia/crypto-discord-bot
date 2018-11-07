const Discord = require('discord.js');
const client = new Discord.Client();
var express = require('express');
var app = express();
const fetch = require('node-fetch');
const tribeTokenAbi = require('./TribeTokenContract');
const keys = require('./config/keys');
const Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/' + keys.infura));

app.get('/', function(req, res) {
  res.send('hello world');
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

let contractAddress;
let tribeTokenContract = '0x';
let tierArray = [];

async function addChannel(message, args, eventName) {
  var server = message.guild;
  var permsName = eventName + '-' + 'access';
  let role = await message.guild.createRole({
    //data: {
    name: permsName,
    permissions: []
    //},
    //reason: 'new Event'
  });
  await message.member.addRole(role, permsName);

  let channel = await server.createChannel(eventName, 'text'); // Create the actual channel.
  // await channel.setParent('427382662240534535'); // Move the channel to the current message's parent category.
  await channel.overwritePermissions(message.guild.roles.find('name', '@everyone'), {
    // Disallow Everyone to see, join, invite, or speak
    CREATE_INSTANT_INVITE: false,
    VIEW_CHANNEL: false,
    CONNECT: false,
    SPEAK: false,
    ADD_REACTIONS: false,
    READ_MESSAGES: false,
    SEND_MESSAGES: false,
    SEND_TTS_MESSAGES: false,
    MANAGE_MESSAGES: false,
    EMBED_LINKS: false,
    ATTACH_FILES: false,
    READ_MESSAGE_HISTORY: false
  });

  await channel.overwritePermissions(message.guild.roles.find('name', permsName), {
    //Explicitely allow the role to see, join and speak
    VIEW_CHANNEL: true,
    CONNECT: true,
    SPEAK: true,
    READ_MESSAGES: true,
    SEND_MESSAGES: true,
    VIEW_CHANNEL: true,
    ADD_REACTIONS: true,
    SEND_TTS_MESSAGES: true,
    READ_MESSAGE_HISTORY: true
  });

  return channel;
}

client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.find(ch => ch.name === 'member-log');
  // Do nothing if the channel wasn't found on this server
  if (!channel) return;
  // Send the message, mentioning the member
  channel.send(`Welcome to the server, ${member}`);
});

client.on('message', async message => {
  if (message.content === 'ping') {
    message.reply('Pong!');
  }

  if (message.content === 'what is my avatar') {
    // Send the user's avatar URL
    message.reply(message.author.avatarURL);
  }

  if (message.content.includes('set contract:')) {
    let msg = message.content;
    contractAddress = msg.split('set contract:')[1];

    tribeTokenContract = new web3.eth.Contract(tribeTokenAbi, contractAddress);

    let tierCount = await tribeTokenContract.methods.getTierCount().call();
    let Tiers = [];
    for (var i = 0; i < tierCount; i++) {
      let Tier = await tribeTokenContract.methods.getTier(i).call();
      Tiers.push(Tier[0]);
    }

    tierArray = Tiers;

    Tiers.map(t => {
      addChannel(message, [], t);
    });

    message.reply('contract has been');
  }

  if (message.content == 'show contract address') {
    message.reply(contractAddress);
  }

  if (message.content.includes('add member to channel:')) {
    let usernameBad = message.content.split('add member to channel:')[1].split(' ')[0];
    console.log(usernameBad);
    let username = usernameBad.split('@')[1];
    username = username.substring(0, username.length - 1);

    let channel = message.content.split('add member to channel:')[1].split(' ')[1];
    let member = message.guild.members.get(username);
    await member.addRole(message.guild.roles.find(r => r.name == channel));
  }

  if (message.content.includes('get coins:')) {
    tribeTokenContract = new web3.eth.Contract(tribeTokenAbi, tribeTokenContract);

    let username = message.content.split('get coins:')[1];
    let array;
    try {
      array = await tribeTokenContract.methods.getTokenArrayFromName(username).call();
    } catch (err) {
      console.log('bad', err);
    }
    let coinInfo = array.map(async coin => {
      item = await tribeTokenContract.methods.tokenURI(coin).call();
      return item;
    });
    coinInfo = await Promise.all(coinInfo);
    // console.log(coinInfo);

    let tierCount = await tribeTokenContract.methods.getTierCount().call();
    let Tiers = [];
    for (var i = 0; i < tierCount; i++) {
      let Tier = await tribeTokenContract.methods.getTier(i).call();
      Tiers.push(Tier[0]);
    }

    let tier = coinInfo[0].split('/')[3];

    //subscribe
    let subbedTier = Tiers[tier];

    subbedTier += '-access';

    await message.member.addRole(message.guild.roles.find(r => r.name == subbedTier));

    message.reply(coinInfo);
  }
});

client.login(keys.discordSec);
