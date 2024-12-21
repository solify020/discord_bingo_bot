const { ButtonBuilder, ButtonStyle, ActionRowBuilder, TextChannel, ChannelType, PermissionsBitField } = require("discord.js")
const { betAmountButton_1, betAmountButton_2 } = require("../components/buttons")
const { create5x5Table } = require("./utilController");
const User = require('../models/User');
const Room = require('../models/Room');

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
    const roomName = `Bingo_${interaction.guild.id}`;

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

    const newRoom = new Room({
        roomName: roomName,
        betAmount: betAmount,
        user_1_id: interaction.user.id,
    });
    await newRoom.save();
    await newGameRoom.send(`You have created ${betAmount} SOL room. Please wait for other player.`);
    await interaction.reply({
        content: 'Please join the game channel',
        ephemeral: true
    })
}

const crashRoom = async(interaction) => {

}

const joinRoom = async(interaction) => {
    console.log(interaction);

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
            .setCustomId(`${item._id.toString()}__${item.betAmount}`)
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

const startBingo = async(interaction) => {

}

const checkBingo = async(board) => {

}

const finishBingo = async() => {

}

module.exports = {
    playGame,
    startGame,
    showRoomList,
    joinRoom,
    crashRoom
}