const { ButtonBuilder, ButtonStyle } = require('discord.js')

const createWalletButton = new ButtonBuilder()
    .setCustomId('create_wallet')
    .setLabel('Create Wallet')
    .setStyle(ButtonStyle.Primary);

const importWalletButton = new ButtonBuilder()
    .setCustomId('import_wallet')
    .setLabel('Import Wallet')
    .setStyle(ButtonStyle.Primary);

module.exports = {
    createWalletButton,
    importWalletButton
}