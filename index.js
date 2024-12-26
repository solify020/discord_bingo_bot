// Import the discord.js library
const { Client, GatewayIntentBits, ActionRowBuilder } = require('discord.js');
const { depositButton, checkBalanceButton, playGameButton, showListButton, withdrawButton } = require('./components/buttons');
const { chooseMethod } = require('./controllers/index');
const { welcomeEmbed } = require('./components/embeds');

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => { console.log('DB Connected'); });

// Create a new client instance with intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});


// Ready event - triggered when the bot successfully logs in
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(depositButton).addComponents(checkBalanceButton).addComponents(withdrawButton).addComponents(playGameButton).addComponents(showListButton);
    channel.send({ embeds: [welcomeEmbed] });
    channel.send({
        components: [row],
    })
});

// Message event - triggered when a message is sent in a guild
client.on('messageCreate', async(message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    // Simple command

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);

    // const row = new ActionRowBuilder().addComponents(createWalletButton);

    if (message.content === '!ping') {
        await channel.send({
            content: 'Choose Deposit Method',
            components: [row],
        })
    }
});

client.on('interactionCreate', async(interaction) => {
    chooseMethod(interaction);
});

// Login to Discord with your bot token
client.login(process.env.BOT_TOKEN);