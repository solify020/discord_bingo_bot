const { Keypair, Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const User = require('../models/User');
const bs58 = require('bs58');
const { ActionRowBuilder, ButtonBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ButtonStyle } = require('discord.js');

const connection = new Connection(clusterApiUrl(process.env.NETWORK), 'confirmed');

const createWallet = async(interaction) => {
    const user = interaction.user;
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const secretKey = wallet.secretKey;
    const privateKey = bs58.default.encode(secretKey);
    const isUser = await User.findOne({ userId: user.id });

    if (isUser) return interaction.update({
        content: 'You have your own Wallet.',
        ephemeral: true
    })
    const newUser = new User({
        userId: user.id,
        userName: user.username,
        displayName: user.globalName,
        avatar: user.avatar,
        publicKey: publicKey,
        privateKey: privateKey
    });

    await newUser.save();
    await interaction.reply({
        content: `Created Wallet. Address: ${publicKey}`,
        ephemeral: true
    });
}

const checkBalance = async(interaction) => {
    const userId = interaction.user.id;
    const user = await User.findOne({ userId: userId });
    var depositAmount = 0;
    if (!user) {
        await interaction.reply({
            content: "You don't have wallet. Please Create Wallet.",
            ephemeral: true
        })
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    const publicKey = user.publicKey;
    const balance = await connection.getBalance(new PublicKey(publicKey)) / LAMPORTS_PER_SOL;
    if (balance != user.lastBalance) {
        depositAmount = balance - user.lastBalance;
    }
    User.findOneAndUpdate({ userId: userId }, { $inc: { score: Number(depositAmount) }, $set: { lastBalance: balance } }, { new: true }).then((updatedUser) => {
        interaction.reply({
            content: `${updatedUser.score.toString()} SOL. Your Wallet Address: ${publicKey}`,
            ephemeral: true
        })
        setTimeout(() => { interaction.deleteReply() }, 5000);
    }).catch(() => {
        interaction.reply({
            content: `Failed to check balance! Your wallet address: ${user.publicKey}`,
            ephemeral: true
        })
        setTimeout(() => { interaction.deleteReply() }, 3000);
    })
}

const replyWithdraw = async(interaction) => {
    const user = await User.findOne({ userId: interaction.user.id });

    if (!user) {
        await interaction.reply({
            content: "You don't have a wallet. Please create a wallet first.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    const balance = await connection.getBalance(new PublicKey(user.publicKey)) / LAMPORTS_PER_SOL;

    const modal = new ModalBuilder()
        .setCustomId('withdraw_modal')
        .setTitle('Withdraw SOL');

    const amountInput = new TextInputBuilder()
        .setCustomId('withdraw_amount')
        .setLabel('Amount')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter amount to withdraw')
        .setRequired(true);

    const addressInput = new TextInputBuilder()
        .setCustomId('withdraw_address')
        .setLabel('Withdrawal Address')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter withdrawal address')
        .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(amountInput);
    const row2 = new ActionRowBuilder().addComponents(addressInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);

    const filter = i => i.customId === 'withdraw_modal';
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
        if (i.customId === 'withdraw_modal') {
            const amount = i.fields.getTextInputValue('withdraw_amount');
            const address = i.fields.getTextInputValue('withdraw_address');
            // Implement the withdraw logic here using the amount and address
            await i.update({ content: `Withdrawal process initiated for ${amount} SOL to address ${address}.`, components: [] });
        }
    });
    setTimeout(() => { interaction.deleteReply() }, 15000);
}

const realtimeBalance = async() => {
    const users = await User.find();
    users.forEach(async(user) => {
        const publicKey = user.publicKey;
        const balance = await connection.getBalance(new PublicKey(publicKey)) / LAMPORTS_PER_SOL;
        if (balance != user.lastBalance) {
            const depositAmount = balance - user.lastBalance;
            User.findOneAndUpdate({ userId: user.userId }, { $inc: { score: Number(depositAmount) }, $set: { lastBalance: balance } }).then(() => {
                console.log('Updated');
            }).catch((e) => {
                console.log(e);
            })
        }
    })
}

module.exports = {
    createWallet,
    checkBalance,
    realtimeBalance,
    replyWithdraw
}