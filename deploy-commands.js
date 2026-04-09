require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "login",
    description: "Login to Spotify"
  },
  {
    name: "play",
    description: "Play a song",
    options: [
      {
        name: "song",
        type: 3, // STRING
        description: "Song name",
        required: false
      }
    ]
  },
  {
    name: "pause",
    description: "Pause music"
  },
  {
    name: "resume",
    description: "Resume music"
  },
  {
    name: "next",
    description: "Next track"
  },
  {
    name: "prev",
    description: "Previous track"
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("Slash commands registered!");
  } catch (error) {
    console.error(error);
  }
})();