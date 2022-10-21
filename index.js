require("dotenv").config();
const FakeYou = require('fakeyou.js');
const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const player = createAudioPlayer();
const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs");
const { join } = require("path");
const contentPath = join(__dirname, `content`);
if (!fs.existsSync(contentPath)) {
  fs.mkdirSync(contentPath);
}
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const express = require("express");
const app = express();
app.listen(8080);
app.get("/", async (req, res) => {
  res.send("healthy");
});

const fy = new FakeYou.Client({
  usernameOrEmail: process.env["USER"],
  password: process.env["PASSWORD"]
});


let guildQueues = new Map();

class Queue {
  constructor() {
    this.items = [];
    this.playing = false;
    this.cooldowns = new Map();
  }

  dequeue() {
    return this.items.shift();
  }

  enqueue(username, channel) {
    if (this.isUsernameOffCooldown(username)) {
      this.cooldowns.set(username, new Date());
      this.items.push({ username: username, channel: channel });
    }
  }

  isUsernameOffCooldown(username) {
    return (
      !this.cooldowns.has(username) ||
      (new Date().getTime() - this.cooldowns.get(username).getTime()) / 1000 >
      60
    );
  }

  async playQueue() {
    if (!this.playing) {
      this.playing = true;
      while (this.items.length != 0) {
        let current = this.dequeue();
        let connection = joinVoiceChannel({
          channelId: current.channel.id,
          guildId: current.channel.guild.id,
          adapterCreator: current.channel.guild.voiceAdapterCreator,
        });
        let resource = createAudioResource(join(contentPath, `${current.username}.wav`));
        player.play(resource);
        connection.subscribe(player);
        await new Promise((resolve) => {
          player.once(AudioPlayerStatus.Idle, (end) => {
            resolve();
          });
        });
      }
      this.playing = false;
    }
  }
}

client.on("voiceStateUpdate", async (oldVoiceState, newVoiceState) => {
  if (
    newVoiceState.member.id != "880613137127178260" &&
    newVoiceState.channel &&
    oldVoiceState.channel?.id != newVoiceState.channel.id
  ) {
    let member = newVoiceState.member;
    let channel = newVoiceState.channel;
    let guildId = channel.guild.id;
    if (!guildQueues.has(guildId)) {
      guildQueues.set(guildId, new Queue());
    }
    let queue = guildQueues.get(guildId);
    if (!fs.existsSync(join(__dirname, `content/${member.displayName}.wav`))) {
      await fy.start(); //required
      let message = phrases[Math.floor(Math.random() * phrases.length)];
      message = message.replace('{0}', member.displayName);
      let result = await fy.makeTTS("TM:9b3paz5cq8q3", message);
      let url = result.audioURL();
      let dl = new DownloaderHelper(url, contentPath, {
        fileName: `${member.displayName}.wav`,
      });
      await dl.start();
    }
    queue.enqueue(member.displayName, channel);
    queue.playQueue();
  } else if (!newVoiceState.channel) {
    let channel = oldVoiceState.channel;
    let guildId = channel.guild.id;
    if (channel.members.size <= 1) {
      guildQueues.delete(guildId);
    }
  }
});

let phrases = [
  '{0} has spawned!',
  '{0} has reconnected.',
  'Welcome {0} to Summoners Rift.',
  '{0} is god-like!',
  '{0} has slain the dragon!',
  '{0} has slain baron nashor!',
  '{0} is dominating',
  '{0} is unstoppable!',
  '{0} is legendary!'
]

client.login(process.env["TOKEN"]);
