const { Keypair, Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const User = require('../models/User');
const bs58 = require('bs58');

const connection = new Connection(clusterApiUrl(process.env.NETWORK), 'confirmed');

const createWallet = async(interaction) => {
    const user = interaction.user;
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const secretKey = wallet.secretKey;
    const privateKey = bs58.default.encode(secretKey);
    const isUser = await User.findOne({ userId: user.id });

    if (isUser) return interaction.reply({
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

    if (!user) return interaction.reply({
        content: "You don't have wallet. Please Create Wallet.",
        ephemeral: true
    })
    const publicKey = user.publicKey;
    const balance = await connection.getBalance(new PublicKey(publicKey)) / LAMPORTS_PER_SOL;
    User.findOneAndUpdate({ userId: userId }, { score: balance }).then(() => {
        interaction.reply({
            content: `${balance.toString()} SOL. Your Wallet Address: ${publicKey}`,
            ephemeral: true
        })
    }).catch(() => {
        interaction.reply({
            content: "Failed to check balance!",
            ephemeral: true
        })
    })
}

module.exports = {
    createWallet,
    checkBalance
}