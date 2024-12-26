const { Keypair, Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } = require('@solana/web3.js');
const User = require('../models/User');
const bs58 = require('bs58');
const { confirmDepositButton } = require('../components/buttons');
const { ActionRowBuilder, ButtonBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, ButtonStyle } = require('discord.js');

const connection = new Connection(clusterApiUrl(process.env.NETWORK), 'confirmed');

const createWallet = async(interaction) => {
    const user = interaction.user;
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const secretKey = wallet.secretKey;
    const privateKey = bs58.default.encode(secretKey);
    const isUser = await User.findOne({ userId: user.id });

    if (isUser) {
        await interaction.reply({
            content: 'You have your own Wallet.',
            ephemeral: true
        })
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    const newUser = new User({
        userId: user.id,
        userName: user.username,
        displayName: user.globalName,
        avatar: user.avatar,
        publicKey: publicKey,
        privateKey: privateKey
    });

    await newUser.save();
    // await interaction.reply({
    //     content: `Created Wallet. Address: ${publicKey}`,
    //     ephemeral: true
    // });
    // setTimeout(() => { interaction.deleteReply() }, 3000);
}

const checkBalance = async(interaction) => {
    const userId = interaction.user.id;
    const user = await User.findOne({ userId: userId });

    interaction.reply({
        content: `Your balance is ${user.score} SOL`,
        ephemeral: true
    });
    setTimeout(() => { interaction.deleteReply() }, 5000);
}

const deposit = async(interaction) => {
    const user = await User.findOne({ userId: interaction.user.id });

    if (!user) {
        await interaction.reply({
            content: "You don't have a wallet. Please create a wallet first.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    const botCentralWallet = process.env.ADMIN_ADDRESS;

    try {
        // Decode the private key from Base58
        const senderPrivateKey = bs58.default.decode(user.privateKey);

        // Create sender keypair from public and private keys
        const senderKeypair = Keypair.fromSecretKey(senderPrivateKey);

        // Check sender wallet balance
        const balance = await connection.getBalance(new PublicKey(user.publicKey));
        console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        // Check if balance is greater than 0.01 SOL
        if (balance > 0.01 * LAMPORTS_PER_SOL) {
            console.log("Balance is sufficient. Preparing transaction...");

            // Calculate transfer amount (entire balance minus a small fee for transaction)
            const transferAmount = balance - 0.001 * LAMPORTS_PER_SOL; // Reserve 0.001 SOL for transaction fees

            if (transferAmount <= 0) {
                console.error("Insufficient balance after accounting for transaction fees.");
                return;
            }
            user.score += balance / LAMPORTS_PER_SOL;
            interaction.reply({
                content: `Deposited ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL. Balance: ${user.score} SOL`,
                ephemeral: true
            });
            setTimeout(() => { interaction.deleteReply() }, 10000);

            // Create a transaction instruction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(user.publicKey),
                    toPubkey: new PublicKey(process.env.ADMIN_ADDRESS),
                    lamports: transferAmount,
                })
            );

            // Sign and send the transaction
            const signature = await connection.sendTransaction(transaction, [senderKeypair]);
            console.log(`Transaction submitted with signature: ${signature}`);

            // Confirm the transaction
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            console.log("Transaction confirmed", confirmation);
            console.log("balance =====>", user.score);
            await user.save();

        } else {
            console.log("Balance is less than 0.01 SOL. No action taken.");
            interaction.reply({
                content: "No deposit or deposit amount is less than 0.01 SOL.",
                ephemeral: true
            });
            setTimeout(() => { interaction.deleteReply() }, 3000);
        }
    } catch (error) {
        console.error("Error during the process:", error);
        interaction.reply({
            content: "Failed to deposit. Please try again.",
            ephemeral: true
        });
        setTimeout(() => { interaction.deleteReply() }, 3000);
    }
}

// async function monitorDeposits(connection, userWallet, botCentralWallet, onDeposit, interaction) {
//     try {
//         const signatures = await connection.getConfirmedSignaturesForAddress2(
//             new PublicKey(userWallet), // Unique deposit address for the user
//         );

//         for (const signatureInfo of signatures) {
//             const transaction = await connection.getTransaction(signatureInfo.signature);
//             const amount = extractAmountFromTransaction(transaction, userWallet);

//             if (amount > 0.01) {
//                 console.log(`User deposited ${amount} SOL`);
//                 onDeposit(amount); // Update user score in the game
//             } else {
//                 interaction.reply({
//                     content: "No deposit or deposit amount is less than 0.01 SOL.",
//                     ephemeral: true
//                 })
//             }
//         }
//     } catch (error) {
//         console.error('Error monitoring deposits:', error);
//         interaction.reply({
//             content: "No deposit or deposit amount is less than 0.01 SOL.",
//             ephemeral: true
//         });
//         setTimeout(() => { interaction.deleteReply() }, 3000);
//         1
//     }
// }

function extractAmountFromTransaction(transaction, wallet) {
    if (!transaction || !transaction.meta || !transaction.meta.postBalances) {
        return 0;
    }

    const preBalance = transaction.meta.preBalances[0];
    const postBalance = transaction.meta.postBalances[0];
    return (preBalance - postBalance) / 1e9; // Convert lamports to SOL
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
}

const withdraw = async(interaction) => {
    const userId = interaction.user.id;
    const user = await User.findOne({ userId: userId });

    const amount = parseFloat(interaction.fields.getTextInputValue('withdraw_amount'));
    const address = interaction.fields.getTextInputValue('withdraw_address');

    if (isNaN(amount) || amount < 0.1) {
        await interaction.reply({
            content: "Must withdraw at least 0.1 SOL.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    if (amount > user.score) {
        await interaction.reply({
            content: "Insufficient balance.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    // Implement the actual withdrawal logic here using the amount and address
    try {
        const senderPrivateKey = bs58.default.decode(process.env.ADMIN_PRIVATE_KEY);
        const senderKeypair = Keypair.fromSecretKey(senderPrivateKey);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(process.env.ADMIN_ADDRESS),
                toPubkey: new PublicKey(address),
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        await interaction.reply({
            content: `Withdrawal of ${amount} SOL success. Your current balance is ${user.score - amount} SOL.`,
            ephemeral: true
        });

        const signature = await connection.sendTransaction(transaction, [senderKeypair]);
        console.log(`Transaction submitted with signature: ${signature}`);

        setTimeout(() => { interaction.deleteReply() }, 5000);

        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log("Transaction confirmed", confirmation);
    } catch (error) {
        console.error("Error during withdrawal:", error);
        await interaction.reply({
            content: "Failed to withdraw. Please try again.",
            ephemeral: true
        });
        setTimeout(() => { interaction.deleteReply() }, 3000);
        return;
    }
    // Assuming the withdrawal is successful, update the user's score
    user.score -= amount;
    await user.save();

}

const replyDeposit = async(interaction) => {
    const row = new ActionRowBuilder().addComponents(confirmDepositButton);
    const user = await User.findOne({ userId: interaction.user.id });
    const address = user.publicKey;

    interaction.reply({
        content: `Deposit Address: ${address}`,
        components: [row],
        ephemeral: true
    })
}


module.exports = {
    createWallet,
    checkBalance,
    replyWithdraw,
    replyDeposit,
    deposit,
    withdraw
}