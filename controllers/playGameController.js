const { ButtonBuilder, ButtonStyle, ActionRowBuilder, TextChannel, ChannelType, PermissionsBitField, ChannelFlagsBitField } = require("discord.js")
const { betAmountButton_1, betAmountButton_2, readyButton } = require("../components/buttons")
const { create5x5Table, bingoCheck, generateBingoBalls } = require("./utilController");
const User = require('../models/User');
const Room = require('../models/Room');
const { ball } = require("./constant");

const playGame = async(interaction) => {

    const user = await User.findOne({ userId: interaction.user.id })
    if (!user) {
        await interaction.reply({
            content: "You don't have wallet. Please Create Wallet.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    await interaction.reply({
        content: `Select Bet Amount. Your balance is ${user.score} SOL.`,
        components: [betAmountButton_1, betAmountButton_2],
        ephemeral: true
    });
    setTimeout(() => { interaction.deleteReply() }, 10000);
}

const startGame = async(interaction) => {
    const user = await User.findOne({ userId: interaction.user.id });
    const betAmount = Number(interaction.customId.split('_')[1]);
    if (user.score < betAmount) {
        await interaction.reply({
            content: `Insufficient Balance! Please deposit SOL. Wallet Address: ${user.publicKey}`,
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 5000);
    }
    const room = await Room.findOne({ user_1_id: interaction.user.id, isFinished: false });
    if (room) {
        await interaction.reply({
            content: "You have already created room.",
            ephemeral: true
        });

        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    await User.findOneAndUpdate({ userId: interaction.user.id }, { score: user.score - betAmount });
    createRoom(interaction, betAmount);
}

const createRoom = async(interaction, betAmount) => {
    const roomName = `bingo_${interaction.user.id}`;

    const newGameRoom = (await interaction.guild.channels.create({
        name: roomName,
        type: ChannelType.GuildText,
        permissionOverwrites: [{
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages
                ]
            }
        ]
    }));
    console.log(newGameRoom.id);

    const newRoom = new Room({
        roomName: roomName,
        roomId: newGameRoom.id,
        betAmount: betAmount,
        user_1_id: interaction.user.id,
    });
    await newRoom.save();
    await newGameRoom.send(`Creator: ${interaction.user.displayName}, BetAmount: ${betAmount}SOL.`);
    await interaction.reply({
        content: `Please join the game channel. Click this. ${newGameRoom.url}`,
        ephemeral: true
    })
    setTimeout(() => { interaction.deleteReply() }, 5000);
}

const crashRoom = async(interaction) => {
    const room = await Room.findOne({ user_1_id: interaction.user.id, isFinished: false });
    if (!room) {
        await interaction.reply({
            content: "You don't have any room.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    await Room.findOneAndUpdate({ user_1_id: interaction.user.id }, { isFinished: true });
    const channel = interaction.guild.channels.cache.get(room.roomId);
    if (!channel) {
        return interaction.reply({
            content: "Game Room not found.",
            ephemeral: true
        });
    }
    await channel.delete();
    await interaction.reply({
        content: "Game Room deleted.",
        ephemeral: true
    });
    setTimeout(() => { interaction.deleteReply() }, 3000);
}

const joinRoom = async(interaction) => {
    const user = await User.findOne({ userId: interaction.user.id });
    const room = await Room.findOne({ roomId: interaction.customId.split('__')[0] });

    if (user.score < room.betAmount) {
        return interaction.reply({
            content: "Insufficient Balance! Please deposit SOL.",
            ephemeral: true
        });
    }

    await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { score: -room.betAmount } });
    await Room.findOneAndUpdate({ roomId: room.roomId }, { user_2_id: interaction.user.id, isAvailable: false });

    const channel = interaction.guild.channels.cache.get(room.roomId);
    if (!channel) {
        await interaction.reply({
            content: "Game Room not found.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    await channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true
    });

    await interaction.reply({
        content: `You joined the Game Room. Click this ${channel.url}`,
        ephemeral: true
    });
    setTimeout(() => { interaction.deleteReply() }, 5000);
    const row = new ActionRowBuilder().addComponents(readyButton);
    channel.send({
        content: 'Click "Ready" if you are ready.',
        components: [row]
    })
}

const ready = async(interaction) => {
    const channel = interaction.channel;
    if (!ball[channel.id]) {
        ball[channel.id] = {}; // Create an object for the channel ID
    }
    if (ball[channel.id]['isReady'] == interaction.user.id) {
        await interaction.reply({
            content: "Already been ready.",
            ephemeral: true
        });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    if (ball[channel.id]['isReady']) {
        await interaction.reply({
            content: "Both players are ready. Game will be started in a second.",
        });
        setTimeout(() => { interaction.deleteReply() }, 5000);
        return startBingo(interaction, channel)
    }
    ball[channel.id]['isReady'] = interaction.user.id;
    await interaction.reply({
        content: "You are ready.",
        ephemeral: true
    });
    setTimeout(() => { interaction.deleteReply() }, 3000);
}

const showRoomList = async(interaction) => {
    const list = await Room.aggregate([
        { $match: { isAvailable: true } },
        { $sample: { size: 5 } }
    ]);

    if (!list.length) {
        await interaction.reply({
            content: "No Bingo Room. Please Create.",
            ephemeral: true
        })
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    const rooms = await Promise.all(list.map(async(item) => {
        const user = await User.findOne({ userId: item.user_1_id });
        const button = new ButtonBuilder()
            .setCustomId(`${item.roomId.toString()}__${item.betAmount}`)
            .setLabel(`Join @${user.displayName} (${item.betAmount} SOL)`)
            .setStyle(ButtonStyle.Primary); // Use ButtonStyle.Primary, assuming that's what you intended

        return button; // Return the button to collect in the array
    }));

    console.log("Rooms =====>", rooms);

    const row = new ActionRowBuilder().addComponents(rooms);

    await interaction.reply({
        content: "Join the room.",
        components: [row],
        ephemeral: true
    })
    setTimeout(() => { interaction.deleteReply() }, 10000);
}

const startBingo = async(interaction, channel) => {
    const gameRoom = await Room.findOne({ roomId: channel.id });
    const player1 = await User.findOne({ userId: gameRoom.user_1_id });
    const player2 = await User.findOne({ userId: gameRoom.user_2_id });
    const player1Name = player1.displayName;
    const player2Name = player2.displayName;

    let player1_table = create5x5Table();
    let player2_table = create5x5Table();
    const bingoBalls = generateBingoBalls();
    const rows_1 = [];
    const rows_2 = [];
    ball[channel.id]['currentBall'] = [];

    player1_table.map((item, index_y) => {
        const row = new ActionRowBuilder();
        item.map((number, index_x) => {
            row.addComponents(
                new ButtonBuilder()
                .setCustomId(`card_1_${index_x}_${index_y}_${number}`)
                .setLabel(number.toString())
                .setStyle(ButtonStyle.Primary)
            )
        })
        rows_1.push(row);
    });

    player2_table.map((item, index_y) => {
        const row = new ActionRowBuilder();
        item.map((number, index_x) => {
            row.addComponents(
                new ButtonBuilder()
                .setCustomId(`card_2_${index_x}_${index_y}_${number}`)
                .setLabel(number.toString())
                .setStyle(ButtonStyle.Primary)
            )
        })
        rows_2.push(row);
    });
    console.log(rows_1);

    channel.send({
        content: `${player1Name}'s Table`,
        components: [rows_1[0], rows_1[1], rows_1[2], rows_1[3], rows_1[4]],
    })
    const gameMsg = await channel.send('Game will be started in a second.');

    channel.send({
        content: `${player2Name}'s Table`,
        components: [rows_2[0], rows_2[1], rows_2[2], rows_2[3], rows_2[4]],
    })

    ball[channel.id.toString()].player1 = player1_table;
    ball[channel.id].player2 = player2_table;

    setTimeout(() => {
        console.log(gameMsg);

        var currentBallIndex = 0;
        gameMsg.edit('The game has started. Balls pop out every 5 seconds.');
        const randomBall = setInterval(() => {
            if (!channel) {
                clearInterval(randomBall);
                return Room.findOneAndUpdate({ roomId: channel.id }, { isFinished: true });
            }
            if (ball[channel.id]['winner'] || currentBallIndex >= 75) {
                setTimeout(() => { channel.delete().catch(console.error) }, 3000)
                return clearInterval(randomBall);
            }
            ball[channel.id]['currentBall'].push(bingoBalls[currentBallIndex]);
            gameMsg.edit(bingoBalls[currentBallIndex].toString());
            currentBallIndex++;
        }, 5000);
    }, 5000);
}

const tick = async(interaction) => {
    if (!isGameStarted(interaction)) {
        await interaction.reply({ content: 'Game not started.', ephemeral: true });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }
    const gameRoom = await Room.findOne({ roomId: interaction.channel.id });
    const player1 = await User.findOne({ userId: gameRoom.user_1_id });
    const player2 = await User.findOne({ userId: gameRoom.user_2_id });

    const player1Name = player1.displayName;
    const player2Name = player2.displayName;

    const [action, player, x, y, number] = interaction.customId.split('_');
    const channel = interaction.channel;
    const currentBall = ball[channel.id]['currentBall'];

    const room = await Room.findOne({ roomId: channel.id });
    if (!isPlayerTurn(interaction, player, room)) {
        await interaction.reply({ content: 'You cannot click the other player\'s button.', ephemeral: true });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    if (ball[channel.id]['winner']) {
        await interaction.reply({ content: 'The game has ended.', ephemeral: true });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    if (!isCorrectNumber(number, currentBall)) {
        await interaction.reply({ content: 'Incorrect number.', ephemeral: true });
        return setTimeout(() => { interaction.deleteReply() }, 3000);
    }

    await updatePlayerTable(interaction, player, x, y);

    if (bingoCheck(ball[channel.id][`player${player}`])) {
        ball[channel.id]['winner'] = `player${player}`;
        await channel.send(`Bingo! The game has ended. Player ${player} is the winner!`);
        await User.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { score: room.betAmount * 1.8 } });
        await Room.findOneAndDelete({ roomId: channel.id });
        setTimeout(() => {
            channel.delete().catch(console.error);
        }, 3000);
    }
};

const isGameStarted = (interaction) => {
    return ball[interaction.channel.id] && ball[interaction.channel.id]['currentBall'];
};

const isPlayerTurn = (interaction, player, room) => {
    return (player === '1' && interaction.user.id === room.user_1_id) || (player === '2' && interaction.user.id === room.user_2_id);
};

const isCorrectNumber = (number, currentBall) => {
    return currentBall.includes(parseInt(number));
};

const updatePlayerTable = async(interaction, player, x, y) => {
    const channel = interaction.channel;
    const playerTable = ball[channel.id][`player${player}`];
    playerTable[x][y] = 0;

    const updatedComponents = interaction.message.components.map((actionRow, rowIndex) => {
        const newRow = new ActionRowBuilder();
        actionRow.components.forEach((button, colIndex) => {
            const updatedButton = ButtonBuilder.from(button);
            if (rowIndex === parseInt(y) && colIndex === parseInt(x)) {
                updatedButton.setLabel('X').setStyle(ButtonStyle.Danger).setDisabled(true);
            }
            newRow.addComponents(updatedButton);
        });
        return newRow;
    });

    await interaction.update({ components: updatedComponents });
};

module.exports = {
    playGame,
    startGame,
    showRoomList,
    joinRoom,
    crashRoom,
    tick,
    ready
}