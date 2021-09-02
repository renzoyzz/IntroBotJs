require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
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
        let connection = await current.channel.join();
        connection.setMaxListeners(0);
        let dispatcher = connection.play(`./content/${current.username}.wav`);
        await new Promise((resolve) => {
          dispatcher.once("finish", (end) => {
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

    if (!fs.existsSync(`./content/${member.displayName}.wav`)) {
      let url = `https://tetyys.com/SAPI4/SAPI4?text=Welcome%20${encodeURI(
        member.displayName
      )}%20to%20the%20big%20dick%20club&voice=Mike%20in%20Hall&pitch=100&speed=140`;
      let dl = new DownloaderHelper(url, "content", {
        fileName: `${member.displayName}.wav`,
      });
      await dl.start();
    }
    queue.enqueue(member.displayName, channel);
    queue.playQueue();
  }
});

client.login(process.env["TOKEN"]);
