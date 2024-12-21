const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

const createWalletButton = new ButtonBuilder()
    .setCustomId('create_wallet')
    .setLabel('Create Wallet')
    .setStyle(ButtonStyle.Primary);

const checkBalanceButton = new ButtonBuilder()
    .setCustomId('check_balance')
    .setLabel('Check Balance')
    .setStyle(ButtonStyle.Primary);

const playGameButton = new ButtonBuilder()
    .setCustomId('play_game')
    .setLabel('Play Bingo!')
    .setStyle(ButtonStyle.Primary);

const crashRoomButton = new ButtonBuilder()
    .setCustomId('crash_room')
    .setLabel('Crash Room')
    .setStyle(ButtonStyle.Primary);

const showListButton = new ButtonBuilder()
    .setCustomId('show_list')
    .setLabel('Show Rooms')
    .setStyle(ButtonStyle.Primary)

const btnBet0_1 = new ButtonBuilder()
    .setCustomId('bet_0.1')
    .setLabel('0.1 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet0_2 = new ButtonBuilder()
    .setCustomId('bet_0.2')
    .setLabel('0.2 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet0_5 = new ButtonBuilder()
    .setCustomId('bet_0.5')
    .setLabel('0.5 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet1 = new ButtonBuilder()
    .setCustomId('bet_1')
    .setLabel('1 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet2 = new ButtonBuilder()
    .setCustomId('bet_2')
    .setLabel('2 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet5 = new ButtonBuilder()
    .setCustomId('bet_5')
    .setLabel('5 SOL')
    .setStyle(ButtonStyle.Primary);

const btnBet10 = new ButtonBuilder()
    .setCustomId('bet_10')
    .setLabel('10 SOL')
    .setStyle(ButtonStyle.Primary);

const betAmountButton_1 = new ActionRowBuilder()
    .addComponents(btnBet0_1, btnBet0_2, btnBet0_5, btnBet1);

const betAmountButton_2 = new ActionRowBuilder()
    .addComponents(btnBet2, btnBet5, btnBet10);



module.exports = {
    createWalletButton,
    checkBalanceButton,
    playGameButton,
    crashRoomButton,
    showListButton,
    betAmountButton_1,
    betAmountButton_2
}