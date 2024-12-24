const create5x5Table = () => {
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return Array.from({ length: 5 }, (_, i) => numbers.slice(i * 5, (i + 1) * 5));
};

const bingoCheck = (table) => {
    const checkLine = (line) => line.every(num => num === 0);

    for (let i = 0; i < 5; i++) {
        if (checkLine(table[i]) || checkLine(table.map(row => row[i]))) {
            return true;
        }
    }

    if (checkLine(table.map((row, i) => row[i])) || checkLine(table.map((row, i) => row[4 - i]))) {
        return true;
    }

    return false;
};

const generateBingoBalls = () => {
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    return numbers;
};

module.exports = {
    create5x5Table,
    bingoCheck,
    generateBingoBalls,
};