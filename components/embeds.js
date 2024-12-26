const { EmbedBuilder } = require('discord.js');

const welcomeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎉 Welcome to Bingo Mania! 🎉')
    .setDescription(
        "We're thrilled to have you here! Ready to test your luck and skills in our exciting Bingo game? Here's everything you need to know to get started:"
    )
    .setThumbnail('https://media.istockphoto.com/id/1289211223/vector/bingo-lottery-blue-vector-banner-lottery-game-background-in-comic-pop-art-style.jpg?s=612x612&w=0&k=20&c=XaR77iti1q4Fte1hykLdxyJApPbXh6ant0zoFOzJR6k=')
    .addFields({
        name: '📜 How to play?',
        value: '1. Create Bingo room with clicking "Play Bingo!" and wait for other player. (or join the Bingo room with clicking "Show Rooms")\n' +
            '2. Each player gets a Bingo card with random numbers.\n' +
            '3. Numbers will be called out one by one.\n' +
            '4. Mark the numbers on your card as they are called.\n' +
            '5. The first player to complete a **row, column, or diagonal** shouts **BINGO!** and wins.',
    }, {
        name: '💰 Rewards',
        value: '- You can earn 1.8x of bet amount. \n' +
            '- The more games you win, the more rewards you earn.\n'
    }, {
        name: '💵 Payment',
        value: '- Create your own wallet and deposit to the address (appears when you create or check balance) \n - Each game costs 💎0.1 ~ 10 SOL💎 to play.',
    }, {
        name: '📝 Notes',
        value: 'This game is for fun and earn money.',
    })
    .setImage('https://media.istockphoto.com/id/1487068767/vector/bingo-lottery-balls-and-tickets-background.jpg?s=612x612&w=0&k=20&c=teWqm9arf4w-iOwClpjwj1tfj28IhmsVI8yQxK3vkeQ=')
    // .setTimestamp()
    .setFooter({ text: 'Have fun and good luck!', iconURL: 'https://www.svgrepo.com/show/315910/billiard-ball.svg' });

module.exports = { welcomeEmbed };