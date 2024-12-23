// Global variables to manage game state
let direction = null;
let gameStarted = false;
let score = 0;
let totalPoints = 0;
let emptySpaces = [];
let lives = 3; // Added lives counter
let pointsPositions = []; // Track positions of all points
let isGameEnding = false;

// DOM elements
const main = document.querySelector('main');  // Main grid container
const startButton = document.querySelector('.startDiv'); //start button
const scoreElement = document.querySelector('.score p'); // Score player display element
const livesElement = document.querySelector('.lives'); // Added lives display element
const leaderboardElement = document.querySelector('.leaderboard ol'); //Leasdboard display element

// Maze layout (1 - Wall, 2 - Player, 3 - Enemy, 0 - Point)
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

// Calculate total points available in the maze
for (let row of maze) {
    for (let cell of row) {
        if (cell === 0) totalPoints++;
    }
}


// Initializes the game, resets variables, and renders maze
function initGame() {
    gameStarted = true;
    isGameEnding = false;
    score = 0;
    emptySpaces = [];
    totalPoints = 0;

    // Count initial points in the maze
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                totalPoints++;
            }
        }
    }

    console.log("Initial total points:", totalPoints); // Debug console

    startButton.style.display = 'none'; //hide the start button
    main.style.display = 'grid';//show the maze grid
    document.querySelector('.leaderboard').style.display = 'none'; //hide leaderboard initially after the game starts
    updateLivesDisplay(); // Update lives display
    populateMaze();  // Render the populated  maze
    scoreElement.textContent = '0'; // Reset score 
}

// Updates the visual display of lives using heart emojis
function updateLivesDisplay() {
        livesElement.textContent = '❤️'.repeat(lives); // Use heart emoji to display lives
}

// Populates the maze grid based on the maze array
function populateMaze() {
    main.innerHTML = '';  // Clear the main grid container
    pointsPositions = [];  // Reset points positions
    enemyPositions = [];  // Reset enemy positions

    // Loop through the maze array and create div elements for each cell
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let block = document.createElement('div'); // Create a new div element called block
            block.classList.add('block'); // Add the block class to the div element
            block.dataset.x = x; // Set the x coordinate as a data attribute
            block.dataset.y = y; // Set the y coordinate as a data attribute

            const isEmpty = emptySpaces.some(pos => pos.x === x && pos.y === y); // Check if the cell is empty

            // Assign appropriate class and attributes based on cell value
            switch (maze[y][x]) {
                case 1: // Wall
                    block.classList.add('wall');
                    break;
                case 2: // Player
                    block.id = 'player';
                    let mouth = document.createElement('div');
                    mouth.classList.add('mouth', direction || 'right');
                    block.appendChild(mouth);
                    break;
                case 3: // Enemy
                    block.classList.add('enemy');
                    enemyPositions.push({ x, y });
                    break;
                case 0: // Point
                    if (!isEmpty) {
                        block.classList.add('point');
                        block.style.backgroundColor = 'white'; // Make points visible
                        block.style.borderRadius = '50%';
                        block.style.height = '1vh';
                        block.style.width = '1vh';
                        block.style.margin = 'auto';
                        pointsPositions.push({ x, y }); //store the position of the point to track it
                    }
                    break;
            }

            main.appendChild(block); // Append the block to the main grid container
        }
    }
}

// Add this helper function to accurately count remaining points
function getPlayerPosition() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 2) return { x, y };
        }
    }
}
// Add this helper function to reset player position when a collision occurs
function resetPlayerPosition() {
    const currentPlayer = getPlayerPosition();
    if (currentPlayer) {
        maze[currentPlayer.y][currentPlayer.x] = 0; // Reset current position to empty
    }
    maze[1][1] = 2; // Reset to initial position
    populateMaze(); //updats the maze with the new player position
}

// Randomly moves enemies and checks for collisions
function moveEnemiesRandomly() {
    if (enemyPositions.length === 0) return;

    const occupiedPositions = new Set(enemyPositions.map(enemy => `${enemy.x},${enemy.y}`));

    enemyPositions.forEach(enemy => {
        const { x, y } = enemy;
        const possibleMoves = [];
        
      // check if the enemy can move in each direction
        if (y > 0 && maze[y - 1][x] !== 1) possibleMoves.push({ x, y: y - 1 }); // Check if the enemy can move up
        if (y < maze.length - 1 && maze[y + 1][x] !== 1) possibleMoves.push({ x, y: y + 1 }); // Check if the enemy can move down
        if (x > 0 && maze[y][x - 1] !== 1) possibleMoves.push({ x: x - 1, y }); // Check if the enemy can move left
        if (x < maze[y].length - 1 && maze[y][x + 1] !== 1) possibleMoves.push({ x: x + 1, y }); // Check if the enemy can move right

        // Filter out moves that are not occupied
        const safeMoves = possibleMoves.filter(
            move => !occupiedPositions.has(`${move.x},${move.y}`)
        );
// Randomly select a move from the safe moves
        if (safeMoves.length > 0) {
            const randomMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            const playerPosition = getPlayerPosition();

            // Check collision with player
            if (randomMove.x === playerPosition.x && randomMove.y === playerPosition.y) {
                lives--; // Reduce only one life and update display
                updateLivesDisplay(); 

                // Check if the player has no lives left
                if (lives <= 0) {
                    handleGameOver();
                } else {
                    resetPlayerPosition(); // Reset position but continue game
                }
                return;
            }
// Update the maze and enemy position
            maze[enemy.y][enemy.x] = 0; //Reset the current position of the enemy
            maze[randomMove.y][randomMove.x] = 3; // Update the new position of the enemy
            occupiedPositions.delete(`${enemy.x},${enemy.y}`); // Remove the old position from the occupied positions
            occupiedPositions.add(`${randomMove.x},${randomMove.y}`); // Add the new position to the occupied positions
            enemy.x = randomMove.x; // Update the x coordinate of the enemy
            enemy.y = randomMove.y; // Update the y coordinate of the enemy
        }
    });

    populateMaze(); //update the maze with the new enemy positions
    checkCollisionWithEnemies(); // Check for collision with the player
}

// Move enemies every 600ms
setInterval(moveEnemiesRandomly, 600);
 
// Add this helper function to check for collisions with enemies
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
    // loop through the maze to count remaining points
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            // Check if the cell is a point and has not been collected
            if (maze[y][x] === 0 && !emptySpaces.some(pos => pos.x === x && pos.y === y)) { 
                remaining++; // Increment the count of remaining points
            }
        }
    }
    // Return the total count of remaining points
    return remaining;
}
// movePlayer function to handle player movement
function movePlayer(newX, newY) {
    // Check if the game has not started or is ending
    if (!gameStarted || isGameEnding) return;
 
    // Check if the new position is a wall
    if (maze[newY][newX] === 1) return;

    // Check if the new position is a point
    if (maze[newY][newX] === 0) {
        // Only count the point if it hasn't been collected yet
        if (!emptySpaces.some(pos => pos.x === newX && pos.y === newY)) {
            score++;
            scoreElement.textContent = score;
            totalPoints--;
            emptySpaces.push({x: newX, y: newY});

            // Count remaining points to verify win condition
            const remainingPoints = countRemainingPoints();

            console.log("Remaining points:", remainingPoints); // Debug log

            // Check if all points have been collected
            if (remainingPoints === 0) {
                handleGameWin();
                return;
            }
        }
    }

// Check if the new position is an enemy
    if (maze[newY][newX] === 3) { 
        lives--; // Reduce only one life
        updateLivesDisplay(); // Update lives display
        if (lives <= 0) {
            handleGameOver();
            return;
        } else {
            resetPlayerPosition();
        }
        return;
    }

// Update the player position in the maze if the new position is empty
    let { x, y } = getPlayerPosition(); // Get the current player position
    maze[y][x] = -1; // Reset the current position to empty
    maze[newY][newX] = 2; // Update the new position as the player position
    populateMaze(); // Update the maze with the new player position
}

// Add this helper function to handle player movement
function handleMovement() {
    let { x, y } = getPlayerPosition();
    switch (direction) {
        case 'up':
            movePlayer(x, y - 1); // Move the player up
            break;
        case 'down':
            movePlayer(x, y + 1); // Move the player down
            break;
        case 'left':
            movePlayer(x - 1, y); // Move the player left
            break;
        case 'right':
            movePlayer(x + 1, y);   // Move the player right
            break;
    }
}

// Add event listener to handle keyboard input
document.addEventListener('keydown', (event) => {
    if (!gameStarted) return;

    // Update the direction based on the key pressed
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
 
// Move the player every 300ms
setInterval(handleMovement, 300);

//after clicking the start button, the game will start
startButton.addEventListener('click', initGame);

// win condition
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

// Game over condition
function handleGameOver() {
    if (isGameEnding) return;
    isGameEnding = true;
    
    alert('Game Over! Better luck next time.');
    setTimeout(() => {
        location.reload();
    }, 500);
}

// update leaderboard with the new score if it is a high score
function updateLeaderboardDisplay(leaderboard) {
    leaderboardElement.innerHTML = leaderboard.map(entry => `<li>${entry.name}........${entry.score}</li>`).join('');
}

// check and update leaderboard with the new score
function checkAndUpdateLeaderboard(score, name = 'Player') {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || []; // Get the leaderboard from local storage
    leaderboard.push({ name, score }); // Add the new score to the leaderboard
    leaderboard.sort((a, b) => b.score - a.score); // Sort the leaderboard in descending order
    leaderboard = leaderboard.slice(0, 6); // Keep only the top 5 scores
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard)); // Save the updated leaderboard to local storage
    updateLeaderboardDisplay(leaderboard); // Update the leaderboard display
}

// Load leaderboard from local storage
function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || []; // Get the leaderboard from local storage
    updateLeaderboardDisplay(leaderboard); // Update the leaderboard display
}
// Load leaderboard when the page loads
loadLeaderboard();
