require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const spotify = require("./spotify");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

async function getToken(userId) {
  const res = await axios.get(`http://127.0.0.1:3000/token/${userId}`);
  return res.data;
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  try {
    // 🔐 LOGIN
    if (interaction.commandName === "login") {
      const url = `http://127.0.0.1:3000/login?userId=${userId}`;
      return interaction.reply(`🔐 Login here: ${url}`);
    }

    // 🔑 GET TOKEN
    const userData = await getToken(userId);
    console.log("USER DATA:", userData);

    if (!userData || !userData.access_token) {
      return interaction.reply("❌ Login first using /login");
    }

    const token = userData.access_token;

    // ⏸️ PAUSE
    if (interaction.commandName === "pause") {
      await spotify.pause(token);
      return interaction.reply("⏸️ Paused");
    }

    // ▶️ RESUME
    if (interaction.commandName === "resume") {
      await spotify.resume(token);
      return interaction.reply("▶️ Resumed");
    }

    // ⏭️ NEXT
    if (interaction.commandName === "next") {
      await spotify.next(token);
      return interaction.reply("⏭️ Next track");
    }

    // ⏮️ PREV
    if (interaction.commandName === "prev") {
      await spotify.prev(token);
      return interaction.reply("⏮️ Previous track");
    }

    // ▶️ PLAY
    if (interaction.commandName === "play") {
      const query = interaction.options.getString("song");

      // Resume if no query
      if (!query) {
        await spotify.resume(token);
        return interaction.reply("▶️ Resumed");
      }

      const track = await spotify.searchTrack(token, query);

      if (!track) {
        return interaction.reply("❌ Song not found");
      }

      await spotify.play(token, { uris: [track.uri] });

      return interaction.reply(
        `▶️ Playing: ${track.name} - ${track.artists.map(a => a.name).join(", ")}`
      );
    }

    // ➕ QUEUE
    if (interaction.commandName === "queue") {
      const uri = interaction.options.getString("uri");

      if (!uri) {
        return interaction.reply("❌ Provide track URI");
      }

      await spotify.queue(token, uri);
      return interaction.reply("➕ Added to queue");
    }

  } catch (e) {
    console.error("ERROR:", e.response?.data || e.message);
    interaction.reply(`❌ ${JSON.stringify(e.response?.data || e.message)}`);
  }
});

client.login(process.env.DISCORD_TOKEN);