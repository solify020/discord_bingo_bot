const { ButtonBuilder, ButtonStyle, ActionRowBuilder, TextChannel, ChannelType, PermissionsBitField, ChannelFlagsBitField } = require("discord.js")
const { betAmountButton_1, betAmountButton_2 } = require("../components/buttons")
const { create5x5Table, bingoCheck, generateBingoBalls } = require("./utilController");
const User = require('../models/User');
const Room = require('../models/Room');
const { ball } = require("./constant");

const playGame = async(interaction) => {

    const user = await User.findOne({ userId: interaction.user.id })

    interaction.reply({
        content: `Select Bet Amount. Your balance is ${user.score} SOL.`,
        components: [betAmountButton_1, betAmountButton_2],
        ephemeral: true
    });
}

const startGame = async(interaction) => {
    const user = await User.findOne({ userId: interaction.user.id });
    const betAmount = Number(interaction.customId.split('_')[1]);
    if (user.score < betAmount) return interaction.reply({
        content: "Insufficient Balance! Please deposit SOL.",
        ephemeral: true
    });
    const room = await Room.findOne({ user_1_id: interaction.user.id, isAvailable: true });
    if (room) return interaction.reply({
        content: "You have already created room.",
        ephemeral: true
    });

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
}

const crashRoom = async(interaction) => {

}

const joinRoom = async(interaction) => {
    console.log(interaction);
    const roomId = interaction.customId.split('__')[0];
    const betAmount = interaction.customId.split('__')[1];
    await User.findOneAndUpdate({ userId: interaction.user.id }, {
        $inc: { score: -betAmount }
    }, { new: true });

    await Room.findOneAndUpdate({
        roomId: roomId
    }, {
        user_2_id: interaction.user.id,
        isAvailable: false,
    });

    const channel = interaction.guild.channels.cache.get(roomId);
    if (!channel) return interaction.reply({
        content: "Game Room not found.",
        ephemeral: true
    });

    await channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        SendMessages: true
    });

    await interaction.reply({
        content: `You joined the Game Room. Click this ${channel.url}`,
        ephemeral: true
    });

    startBingo(interaction, channel);
}

const showRoomList = async(interaction) => {
    const list = await Room.aggregate([
        { $match: { isAvailable: true } },
        { $sample: { size: 5 } }
    ]);

    if (!list.length) return interaction.reply({
        content: "No Bingo Room. Please Create.",
        ephemeral: true
    })

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
}

const startBingo = async(interaction, channel) => {
    let player1_table = create5x5Table();
    let player2_table = create5x5Table();
    const bingoBalls = generateBingoBalls();
    const rows_1 = [];
    const rows_2 = [];
    if (!ball[channel.id]) {
        ball[channel.id] = {}; // Create an object for the channel ID
    }
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
        content: "Player 1's Table",
        components: [rows_1[0], rows_1[1], rows_1[2], rows_1[3], rows_1[4]],
    })
    const gameMsg = await channel.send('Game will be started in a second.');

    channel.send({
        content: "Player 2's Table",
        components: [rows_2[0], rows_2[1], rows_2[2], rows_2[3], rows_2[4]],
    })

    ball[channel.id.toString()].player1 = player1_table;
    ball[channel.id].player2 = player2_table;

    setTimeout(() => {
        console.log(gameMsg);

        var currentBallIndex = 0;
        gameMsg.edit('The game has started. Balls pop out every 5 seconds.');
        const randomBall = setInterval(() => {
            if (ball[channel.id]['winner']) return clearInterval(randomBall);
            ball[channel.id]['currentBall'] = bingoBalls[currentBallIndex];
            gameMsg.edit(bingoBalls[currentBallIndex].toString());
            currentBallIndex++;
        }, 5000);
    }, 5000);
}

const tick = async(interaction) => {
    console.log(interaction.customId);
    const channel = interaction.channel;
    const data = interaction.customId;
    const index_x = data.split('_')[2];
    const index_y = data.split('_')[3];
    const number = data.split('_')[4];
    if (data.split('_')[1] == '1') {
        if (number == ball[interaction.channel.id]['currentBall']) {
            ball[interaction.channel.id]['player1'][index_x][index_y] = 0;
            const updatedComponents = interaction.message.components.map((actionRow, rowIndex) => {
                const newRow = new ActionRowBuilder();
                actionRow.components.forEach((button, colIndex) => {
                    const updatedButton = ButtonBuilder.from(button);

                    if (rowIndex === parseInt(index_y) && colIndex === parseInt(index_x)) {
                        // Update the clicked button: set label to "X", disable it
                        updatedButton.setLabel('X').setStyle(ButtonStyle.Danger).setDisabled(true);
                    }
                    newRow.addComponents(updatedButton);
                });
                return newRow;
            });

            // Update the message with the modified components
            await interaction.update({ components: updatedComponents });
            if (bingoCheck(ball[interaction.channel.id]['player1'])) {
                ball[interaction.channel.id]['winner'] = 'player1';
                channel.send('Bingo! The game has ended. Player 1 is winner!');
            }
        }
    } else {
        console.log("Player2");

        if (number == ball[interaction.channel.id]['currentBall']) {
            ball[interaction.channel.id]['player2'][index_x][index_y] = 0;
            const updatedComponents = interaction.message.components.map((actionRow, rowIndex) => {
                const newRow = new ActionRowBuilder();
                actionRow.components.forEach((button, colIndex) => {
                    const updatedButton = ButtonBuilder.from(button);

                    if (rowIndex === parseInt(index_y) && colIndex === parseInt(index_x)) {
                        // Update the clicked button: set label to "X", disable it
                        updatedButton.setLabel('X').setStyle(ButtonStyle.Danger).setDisabled(true);
                    }
                    newRow.addComponents(updatedButton);
                });
                return newRow;
            });

            // Update the message with the modified components
            await interaction.update({ components: updatedComponents });
            if (bingoCheck(ball[interaction.channel.id]['player2'])) {
                ball[interaction.channel.id]['winner'] = 'player2';
                channel.send('Bingo! The game has ended. Player 2 is winner!');
                console.log("Components", interaction.message.components);

            }
        }
    }
    channelId = interaction.channel.id;
}

const finishBingo = async() => {

}

module.exports = {
    playGame,
    startGame,
    showRoomList,
    joinRoom,
    crashRoom,
    tick
}