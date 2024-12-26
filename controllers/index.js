const { createWallet, checkBalance, replyWithdraw, replyDeposit, deposit, withdraw } = require("./depositMethodController");
const { playGame, startGame, showRoomList, joinRoom, crashRoom, tick, ready } = require('./playGameController')
const User = require('../models/User');

const chooseMethod = async(interaction) => {
    if (!await User.findOne({ userId: interaction.user.id })) {
        await createWallet(interaction);
    }
    // if (interaction.customId === "create_wallet") return createWallet(interaction);
    if (interaction.customId === "confirm_deposit") return deposit(interaction);
    if (interaction.customId === "deposit") return replyDeposit(interaction);
    if (interaction.customId === "check_balance") return checkBalance(interaction);
    if (interaction.customId === "play_game") return playGame(interaction);
    if (interaction.customId.includes("bet_")) return startGame(interaction);
    if (interaction.customId === "show_list") return showRoomList(interaction);
    if (interaction.customId.includes("__")) return joinRoom(interaction);
    if (interaction.customId === "crash_room") return crashRoomButton(interaction);
    if (interaction.customId.includes('card')) return tick(interaction);
    if (interaction.customId === "withdraw_modal") return withdraw(interaction);
    if (interaction.customId.includes("withdraw")) return replyWithdraw(interaction);
    if (interaction.customId === "ready") return ready(interaction);
}

module.exports = {
    chooseMethod,
}