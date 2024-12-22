let direction = null;
let gameStarted = false;
let score = 0;
let totalPoints = 0;
let emptySpaces = [];
let lives = 3; // Added lives counter

const main = document.querySelector('main');
const startButton = document.querySelector('.startDiv');
const scoreElement = document.querySelector('.score p');
const livesElement = document.querySelector('.lives'); // Added lives display element
const leaderboardElement = document.querySelector('.leaderboard ol');

let maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 0, 0, 0, 0, 3, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 3, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 3, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

for (let row of maze) {
    for (let cell of row) {
        if (cell === 0) totalPoints++;
    }
}

function initGame() {
    gameStarted = true;
    startButton.style.display = 'none';
    main.style.display = 'grid';
    updateLivesDisplay();
    populateMaze();
}

function updateLivesDisplay() {
    livesElement.innerHTML = ''.repeat(lives); // Fixed lives display
}

function populateMaze() {
    main.innerHTML = ''; 
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let block = document.createElement('div');
            block.classList.add('block');
            block.dataset.x = x;
            block.dataset.y = y;

            const isEmpty = emptySpaces.some(pos => pos.x === x && pos.y === y) && maze[y][x] !== 2;

            switch (maze[y][x]) {
                case 1:
                    block.classList.add('wall');
                    break;
                case 2:
                    block.id = 'player';
                    let mouth = document.createElement('div');
                    mouth.classList.add('mouth', direction || 'right');
                    block.appendChild(mouth);
                    break;
                case 3:
                    block.classList.add('enemy');
                    break;
                case 0:
                    if (!isEmpty) {
                        block.classList.add('point');
                        block.style.height = '1vh';
                        block.style.width = '1vh';
                    }
                    break;
                case -1:
                    break;
            }

            main.appendChild(block);
        }
    }
}

function getPlayerPosition() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 2) return { x, y };
        }
    }
}

function movePlayer(newX, newY) {
    if (!gameStarted) return;

    if (maze[newY][newX] === 1) return;

    if (maze[newY][newX] === 0) {
        score++;
        scoreElement.textContent = score;
        totalPoints--;
        emptySpaces.push({x: newX, y: newY});
        if (totalPoints === 0) {
            handleGameWin();
            return;
        }
    }

    if (maze[newY][newX] === 3) {
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
        handleGameOver();
            return;
        } else {
            resetPlayerPosition();
        }
        return;
    }

    let { x, y } = getPlayerPosition();
    emptySpaces.push({x, y}); 
    maze[y][x] = -1; 
    maze[newY][newX] = 2; 
    populateMaze();
}

function resetPlayerPosition() {
    maze = maze.map(row => row.map(cell => cell === 2 ? 0 : cell));
    maze[1][1] = 2;
    populateMaze();
}

function handleMovement() {
    let { x, y } = getPlayerPosition();

    switch (direction) {
        case 'up':
            movePlayer(x, y - 1);
            break;
        case 'down':
            movePlayer(x, y + 1);
            break;
        case 'left':
            movePlayer(x - 1, y);
            break;
        case 'right':
            movePlayer(x + 1, y);
            break;
    }
}

document.addEventListener('keydown', (event) => {
    if (!gameStarted) return;

    switch (event.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
    }
});

setInterval(handleMovement, 200);
startButton.addEventListener('click', initGame);

function handleGameWin() {
    let name = prompt('Congratulations! Enter your name:');
    checkAndUpdateLeaderboard(score, name);
    location.reload();
}

function handleGameOver() {
    alert('Game Over! Better luck next time.');
    location.reload(); // Reloads the page to reset the game
}

function updateLeaderboardDisplay(leaderboard) {
    leaderboardElement.innerHTML = leaderboard.map(entry => `<li>${entry.name}........${entry.score}</li>`).join('');
}

function checkAndUpdateLeaderboard(score, name = 'Player') {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 6);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    updateLeaderboardDisplay(leaderboard);
}

function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    updateLeaderboardDisplay(leaderboard);
}

loadLeaderboard();
