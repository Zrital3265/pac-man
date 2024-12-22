let direction = null;
let gameStarted = false;
let score = 0;
let totalPoints = 0;
let emptySpaces = [];
let lives = 3; // Added lives counter
let pointsPositions = []; // Track positions of all points
let isGameEnding = false;

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


// Update initGame to properly reset point counting
function initGame() {
    gameStarted = true;
    isGameEnding = false;
    score = 0;
    emptySpaces = [];
    totalPoints = 0;

    // Count initial points
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                totalPoints++;
            }
        }
    }

    console.log("Initial total points:", totalPoints); // Debug log

    startButton.style.display = 'none';
    main.style.display = 'grid';
    document.querySelector('.leaderboard').style.display = 'none';
    updateLivesDisplay();
    populateMaze();
    scoreElement.textContent = '0';
}


function updateLivesDisplay() {
        livesElement.textContent = '❤️'.repeat(lives); // Use heart emoji to display lives
}

function populateMaze() {
    main.innerHTML = ''; 
    pointsPositions = []; 
    enemyPositions = []; 

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let block = document.createElement('div');
            block.classList.add('block');
            block.dataset.x = x;
            block.dataset.y = y;

            const isEmpty = emptySpaces.some(pos => pos.x === x && pos.y === y);

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
                    enemyPositions.push({ x, y });
                    break;
                case 0:
                    if (!isEmpty) {
                        block.classList.add('point');
                        block.style.backgroundColor = 'white'; // Make points visible
                        block.style.borderRadius = '50%';
                        block.style.height = '1vh';
                        block.style.width = '1vh';
                        block.style.margin = 'auto';
                        pointsPositions.push({ x, y });
                    }
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

function resetPlayerPosition() {
    const currentPlayer = getPlayerPosition();
    if (currentPlayer) {
        maze[currentPlayer.y][currentPlayer.x] = 0; // Reset current position to empty
    }
    maze[1][1] = 2; // Reset to initial position
    populateMaze();
}

// Also update the enemy movement collision check
function moveEnemiesRandomly() {
    if (enemyPositions.length === 0) return;

    const occupiedPositions = new Set(enemyPositions.map(enemy => `${enemy.x},${enemy.y}`));

    enemyPositions.forEach(enemy => {
        const { x, y } = enemy;
        const possibleMoves = [];
        
        if (y > 0 && maze[y - 1][x] !== 1) possibleMoves.push({ x, y: y - 1 });
        if (y < maze.length - 1 && maze[y + 1][x] !== 1) possibleMoves.push({ x, y: y + 1 });
        if (x > 0 && maze[y][x - 1] !== 1) possibleMoves.push({ x: x - 1, y });
        if (x < maze[y].length - 1 && maze[y][x + 1] !== 1) possibleMoves.push({ x: x + 1, y });

        const safeMoves = possibleMoves.filter(
            move => !occupiedPositions.has(`${move.x},${move.y}`)
        );

        if (safeMoves.length > 0) {
            const randomMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            const playerPosition = getPlayerPosition();

            // Check collision with player
            if (randomMove.x === playerPosition.x && randomMove.y === playerPosition.y) {
                lives--; // Reduce only one life
                updateLivesDisplay();
                
                if (lives <= 0) {
                    handleGameOver();
                } else {
                    resetPlayerPosition(); // Reset position but continue game
                }
                return;
            }

            maze[enemy.y][enemy.x] = 0;
            maze[randomMove.y][randomMove.x] = 3;
            occupiedPositions.delete(`${enemy.x},${enemy.y}`);
            occupiedPositions.add(`${randomMove.x},${randomMove.y}`);
            enemy.x = randomMove.x;
            enemy.y = randomMove.y;
        }
    });

    populateMaze();
    checkCollisionWithEnemies();
}

// Move enemies every 2 seconds
setInterval(moveEnemiesRandomly, 600);

function checkCollisionWithEnemies() {
    const playerPosition = getPlayerPosition();

    // Check if any enemy is in the same position as the player
    for (let enemy of enemyPositions) {
        if (enemy.x === playerPosition.x && enemy.y === playerPosition.y) {
            lives--; // Reduce only one life
            updateLivesDisplay();
            console.log(`Lives left: ${lives}`);

            if (lives <= 0) {
                handleGameOver();
            } else {
                resetPlayerPosition(); // Reset position but continue game
            }
            return; // Exit after handling one collision
        }
    }
}
//  Add this helper function to accurately count remaining points
function countRemainingPoints() {
    let remaining = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0 && !emptySpaces.some(pos => pos.x === x && pos.y === y)) {
                remaining++;
            }
        }
    }
    return remaining;
}
// Modify the movePlayer function to properly check remaining points
function movePlayer(newX, newY) {
    if (!gameStarted || isGameEnding) return;

    if (maze[newY][newX] === 1) return;

    if (maze[newY][newX] === 0) {
        // Only count the point if it hasn't been collected yet
        if (!emptySpaces.some(pos => pos.x === newX && pos.y === newY)) {
            score++;
            scoreElement.textContent = score;
            totalPoints--;
            emptySpaces.push({x: newX, y: newY});

            // Count remaining points to verify win condition
            let remainingPoints = 0;
            for (let y = 0; y < maze.length; y++) {
                for (let x = 0; x < maze[y].length; x++) {
                    if (maze[y][x] === 0 && !emptySpaces.some(pos => pos.x === x && pos.y === y)) {
                        remainingPoints++;
                    }
                }
            }

            console.log("Remaining points:", remainingPoints); // Debug log

            if (remainingPoints === 0) {
                handleGameWin();
                return;
            }
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
    maze[y][x] = -1;
    maze[newY][newX] = 2;
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

setInterval(handleMovement, 300);

startButton.addEventListener('click', initGame);

function handleGameWin() {
    if (isGameEnding) return;
    isGameEnding = true;
    console.log("Game Win triggered!"); // Debug log

    let name = prompt('Congratulations! Enter your name:');
    if (name) {
        checkAndUpdateLeaderboard(score, name);
    }
    setTimeout(() => {
        location.reload();
    }, 500);
}

function handleGameOver() {
    if (isGameEnding) return;
    isGameEnding = true;
    
    alert('Game Over! Better luck next time.');
    setTimeout(() => {
        location.reload();
    }, 500);
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
