const { createWallet, checkBalance, realtimeBalance, replyWithdraw } = require("./depositMethodController");
const { playGame, startGame, showRoomList, joinRoom, crashRoom, tick } = require('./playGameController')

const chooseMethod = (interaction) => {
    if (!interaction) return interaction.reply("Interaction Error!");
    if (interaction.customId === "create_wallet") return createWallet(interaction);
    if (interaction.customId === "check_balance") return checkBalance(interaction);
    if (interaction.customId === "play_game") return playGame(interaction);
    if (interaction.customId.includes("bet_")) return startGame(interaction);
    if (interaction.customId === "show_list") return showRoomList(interaction);
    if (interaction.customId.includes("__")) return joinRoom(interaction);
    if (interaction.customId === "crash_room") return crashRoomButton(interaction);
    if (interaction.customId.includes('card')) return tick(interaction);
    if (interaction.customId.includes("withdraw")) return replyWithdraw(interaction);
}

module.exports = {
    chooseMethod,
    realtimeBalance
}