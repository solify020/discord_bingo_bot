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

module.exports = {
    create5x5Table
}