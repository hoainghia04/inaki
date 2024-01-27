import { config } from "dotenv";
import {
  Client,
  IntentsBitField,
  ActivityType,
  REST,
  Routes,
  ApplicationCommandOptionType,
  EmbedBuilder,
  Collection,
} from "discord.js";
import cheerio from "cheerio";
import { request } from "./request.mjs";
import fakeUserAgent from "user-agents-gen";

config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

const cooldowns = new Collection();

client.on("ready", (c) => {
  console.log("Bot Online");

  // client.user.setActivity({
  //   name: "/keyhn",
  //   type: ActivityType.Listening,
  // });
});

async function bypass(userhwid) {
  const userAgent = fakeUserAgent();
  const start_url =
    "https://keysystem.fluxteam.net/android/checkpoint/start.php?HWID=" + userhwid;
  const commonheader = {
    Referer: "https://linkvertise.com/",
    "User-Agent": userAgent,
  };
  await request(start_url, {
    Referer: "https://fluxteam.net/",
    "User-Agent": userAgent,
  });
  await request(
    "https://fluxteam.net/android/checkpoint/check1.php",
    commonheader
  );
  const response = await request(
    "https://fluxteam.net/android/checkpoint/main.php",
    commonheader
  );
  const parsed = cheerio.load(response["data"]);
  const key = parsed("body > main > code").text();

  return key;
}

function extractHWIDFromURL(url) {
  const regex = /HWID=([\w\d]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

client.on("interactionCreate", async (interaction) => {
  const allowedChannelId = '1176288667891937451';

    if (interaction.channelId !== allowedChannelId) {
    const allowedChannel = interaction.guild.channels.cache.get(allowedChannelId);
    const channelLink = allowedChannel ? `<#${allowedChannel.id}>` : `channel ${allowedChannelId}`;
    const replyMessage = await interaction.reply(`Only use command on ${channelLink}.`);

    setTimeout(async () => {
      await replyMessage.delete();
    }, 3000); 
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

  const command = interaction.commandName;

  if (!cooldowns.has(command)) {
    cooldowns.set(command, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command);
  const cooldownAmount = 1 * 1000;

  if (timestamps.has(interaction.guild.id)) {
    const expirationTime = timestamps.get(interaction.guild.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return interaction.editReply(`Please Wait ${timeLeft.toFixed(1)} Seconds.`);   
    }
    setTimeout(async () => {
      await replyMessage.delete();
    }, 3000); 
  }

  timestamps.set(interaction.guild.id, now);
  setTimeout(() => timestamps.delete(interaction.guild.id), cooldownAmount);

  if (interaction.commandName === "ikey") {
    const link = interaction.options.get("link").value;
    
    if (link.startsWith('https://keysystem.fluxteam.net/android/checkpoint/start.php?HWID=cracked')) {

      const embed = new EmbedBuilder()
        .setColor("#FF69B4")
        .setTitle("Banned!")
        .setDescription("Link Fluxus has been banned!")
        .setThumbnail('https://cdn.discordapp.com/attachments/1174616840614457394/1200754043908268112/Picsart_24-01-22_00-18-21-751.jpg?ex=65c75458&is=65b4df58&hm=81c1ebeee972a013e9bd00c38c4ec4f4d4fa4b0fadc0f2002d896932ad4bfb12&')
        .setTimestamp()

      return await interaction.followUp({ embeds: [embed], ephemeral: true });
    }

    if (!link.startsWith('https://keysystem.fluxteam.net/android/checkpoint/start.php?HWID=')) {
      const embed = new EmbedBuilder()
        .setColor("#FF69B4")
        .setTitle("Error!")
        .setDescription("Wrong Link!")
        .setThumbnail('https://cdn.discordapp.com/attachments/1174616840614457394/1200754043908268112/Picsart_24-01-22_00-18-21-751.jpg?ex=65c75458&is=65b4df58&hm=81c1ebeee972a013e9bd00c38c4ec4f4d4fa4b0fadc0f2002d896932ad4bfb12&')
        .setTimestamp()

      return await interaction.followUp({ embeds: [embed], ephemeral: true });
    }

    try {
      const userhwid = extractHWIDFromURL(link);
      const key = await bypass(userhwid);
      const keyWithoutSpaces = key.replace(/\s+/g, "");

      const embed = new EmbedBuilder()
        .setColor("#FF69B4")
        .setTitle("By pass key fluxus by Inarki!")
        .setThumbnail('https://cdn.discordapp.com/attachments/1174616840614457394/1200754043908268112/Picsart_24-01-22_00-18-21-751.jpg?ex=65c75458&is=65b4df58&hm=81c1ebeee972a013e9bd00c38c4ec4f4d4fa4b0fadc0f2002d896932ad4bfb12&')
	      .setTimestamp()
        .addFields(
          {
            name: "Your Key : ",
            value: "```" + keyWithoutSpaces + "```",
          },
        );
      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      await interaction.followUp("fluxus website probably down.");
    }
  }
});

async function main() {
  const commands = [
    {
      name: "ikey",
      description: "Key bypasser for Fluxus!",
      options: [
        {
          name: "link",
          description: "enter your link",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ];

  try {
    console.log("Updating Slash...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT, process.env.GUILD),
      { body: commands }
    );
    client.login(process.env.TOKEN);
  } catch (error) {
    console.log(error);
  }
}

main();
