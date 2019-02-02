const Discord = require('discord.js');
const client = new Discord.Client();
var express = require('express');
var app = express();
const fetch = require('node-fetch');
const tribeTokenAbi = require('./TribeTokenContract');
const keys = require('./config/keys');
const Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/' + keys.infura));

const algoliasearch = require('algoliasearch');
// const client = algoliasearch(keys.algoliaAppId, keys.algoliaAdminKey);
// const postIndex = client.initIndex('Post010819');
require('./models/Post');
const mongoose = require('mongoose');
const Post = mongoose.model('Post');

mongoose.Promise = global.Promise;
mongoose.connect(
  keys.mongoURI,
  { useNewUrlParser: true }
);

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

  const postersData = {
    username: message.author.username,
    discriminator: message.author.discriminator,
    avatar: message.author.avatar,
    id: message.author.id,
  }

  const guildData = {
    name: message.guild.name,
    id: message.guild.id,
  }

  //NOTE: For if a user uploads an image
  if ((message.attachments).array()[0]) {

    const attachment = (message.attachments).array();
    const link = attachment[0].url;
    const fetchedPost = await Post.findOne({
      linkUUID: 'b7762018'
    });
    console.log('Post ----', fetchedPost)


    const post = new Post({
      title: "Legend Of the Five Rings - Update 4",
      description: "Description thingy",
      media: "5bd7abf602d5491325aca485/0eb339c0-dc19-11e8-9b93-93df198b4ee8.png",
      author: "pancho",
      authorAddress: "",
      type: "request",
      walletAddress: "",
      linkTitle: "lesadfds_of_the_five_rings_-_update_4",
      linkUUID: "b7862018",
      free: true,
      request: false,
      tribeLink: "Fantasy_Flight_Games",
      tribeName: "Fantasy Flight Games",
      tribeId: "5bd7ca514f43101435fbe649",
      selectedSubmission: null,
      NSFW: false,
      sticky: false,
    });

    //Add tribe to Algolia
    // postIndex.addObjects(post);

    // try {
    //   let updatedPost = await post.save();
    //   // await Tribe.update({ _id: tribeId }, { $push: { posts: updatedPost._id } });
    //   console.log('IT POSTED :D ==', updatedPost);
    //   // res.send(post);
    // } catch (err) {
    //   console.log('errored saving ====', { err });
    //   // res.send(400, err);
    // }
    
  }

  //NOTE: For if a user pastes a link with an embeded image
  if (message.embeds[0]) {
    const mediaLink = message.embeds[0].url;
    console.log('media ===', mediaLink)
    //save to DB
  }




  if (message.content === 'ping') {
    message.reply('Pong!');
  }

  if (message.content === 'what is my avatar') {
    // Send the user's avatar URL
    message.reply(message.author.avatarURL);
    // message.send
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

    message.reply('contract has been set 👍🏼');
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
    tribeTokenContract = new web3.eth.Contract(tribeTokenAbi, contractAddress);

    let username = message.content.split('get coins:')[1];
    let array;
    try {
      array = await tribeTokenContract.methods.getTokenArrayFromName(username).call();
      console.log({ array });
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
