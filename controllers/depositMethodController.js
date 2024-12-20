const chooseMethod = (interaction) => {
    if (!interaction) return interaction.reply("Interaction Error!");
    if (interaction.customId === "import_wallet") return importWallet(interaction);
    if (interaction.customId === "create_wallet") return createWallet(interaction);
}

const importWallet = (interaction) => {
    interaction.reply("Imported Wallet");
}

const createWallet = (interaction) => {
    interaction.reply("Created Wallet");
}

module.exports = {
    chooseMethod
}