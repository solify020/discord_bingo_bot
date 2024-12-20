// Import the discord.js library
const { Client, GatewayIntentBits, ActionRowBuilder } = require('discord.js');
const { importWalletButton, createWalletButton } = require('./components/depositMethodButton');
const { chooseMethod } = require('./controllers/depositMethodController');
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
});

// Message event - triggered when a message is sent in a guild
client.on('messageCreate', (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    // Simple command

    const channel = client.channels.cache.get(process.env.CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(createWalletButton).addComponents(importWalletButton);

    if (message.content === '!ping') {
        channel.send({
            content: 'Choose Deposit Method',
            components: [row],
        })
    }
});

client.on('interactionCreate', async(interaction) => {
    if (!interaction.isButton()) return;
    chooseMethod(interaction)
});

// Login to Discord with your bot token
client.login(process.env.BOT_TOKEN);