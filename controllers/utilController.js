const create5x5Table = () => {
    // Step 1: Create an array with numbers from 1 to 75
    let numbers = Array.from({ length: 75 }, (_, i) => i + 1);

    // Step 2: Shuffle the array using the Fisher-Yates (Knuth) algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap elements
    }

    // Step 3: Get the first 25 numbers and create a 5x5 matrix
    const result = [];
    for (let i = 0; i < 5; i++) {
        result.push(numbers.slice(i * 5, (i + 1) * 5));
    }

    return result;
}

const bingoCheck = (table) => {
    // Check for rows
    for (let row of table) {
        if (row.every(num => num === 0)) {
            return true; // Bingo found in a row
        }
    }

    // Check for columns
    for (let i = 0; i < 5; i++) {
        if (table.every(row => row[i] === 0)) {
            return true; // Bingo found in a column
        }
    }

    // Check the main diagonal (top-left to bottom-right)
    if (table.every((row, index) => row[index] === 0)) {
        return true; // Bingo found in the main diagonal
    }

    // Check the anti-diagonal (top-right to bottom-left)
    if (table.every((row, index) => row[4 - index] === 0)) {
        return true; // Bingo found in the anti-diagonal
    }

    return false; // No Bingo found
};

const generateBingoBalls = () => {
    // Create an array with numbers from 1 to 75
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

    // Shuffle the array using the Fisher-Yates (Durstenfeld) shuffle algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return numbers; // Return the shuffled array of 75 numbers
};

module.exports = {
    create5x5Table,
    bingoCheck,
    generateBingoBalls
}