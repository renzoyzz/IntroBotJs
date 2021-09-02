require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs");
require("@discordjs/opus");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let guildQueues = new Map();

class Queue {
  constructor() {
    this.items = [];
    this.playing = false;
  }

  dequeue() {
    return this.items.shift();
  }

  enqueue(username, channel) {
    this.items.push({ username: username, channel: channel });
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
