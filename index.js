require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs");
require("@discordjs/opus");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
let guildConnections = new Map();

client.on("voiceStateUpdate", async (oldVoiceState, newVoiceState) => {
  if (
    newVoiceState.member.id != "880613137127178260" &&
    newVoiceState.channel &&
    oldVoiceState.channel?.id != newVoiceState.channel.id
  ) {
    let member = newVoiceState.member;
    let channel = newVoiceState.channel;
    let guildId = channel.guild.id;
    let connection = await channel.join();
    guildConnections.set(guildId, connection);
    if (!fs.existsSync(`./content/${member.displayName}.wav`)) {
      let url = `https://tetyys.com/SAPI4/SAPI4?text=Welcome%20${encodeURI(
        member.displayName
      )}%20to%20the%20big%20dick%20club&voice=Mike%20in%20Hall&pitch=100&speed=140`;
      let dl = new DownloaderHelper(url, "content", {
        fileName: `${member.displayName}.wav`,
      });
      await dl.start();
    }
    connection.play(`./content/${member.displayName}.wav`);
  }
});

client.login(process.env["TOKEN"]);
