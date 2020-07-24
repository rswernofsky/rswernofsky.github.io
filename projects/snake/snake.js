// javascript canvas imports
let canvas, context, frames;

// size constants
const size = 20;
const gridSize = 15;

// represents a coordinate in terms of grid coordinates, not pixel coordinates
class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // is the given coordinate the same as this one?
    equals(square) {
        return (square.x === this.x && square.y === this.y);
    }

    // draws this coordinate (with the context's current color) using the game's
    // constant square size
    draw() {
        context.fillRect(this.x * size, this.y * size, size, size);
    }

    // generates a new coordinate in a random location
    static random() { // lowercase is good notation 
        return new Coord(getRandomInt(gridSize),
            getRandomInt(gridSize));
    }
}

// generates a random integer between 0 and the given integer
const getRandomInt = (upTo) => Math.floor(upTo * Math.random());

// generates a random color
const getRandomColor = () => '#' + Math.floor((1 << 24) * Math.random()).toString(16);

// the snake is an array, and it's initialized with just one segment
let snake = [Coord.random()];
let fruit = new Coord(1, 1); // initialize the fruit to be at grid coordinates (1, 1)
let gameover = false; // initialize the game to be in play

// ticks the game
const loop = () => {
    // window.requestAnimationFrame(loop); //runs every animation frame

    // draws the background, snake, and fruit
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#ff0000';
    fruit.draw();

    context.fillStyle = '#ffffff';
    snake[0].draw();
    context.fillStyle = '#d3d3d3';
    for (let i = 1; i < snake.length; i++) {
        snake[i].draw();
    }

    let head = new Coord(snake[0].x, snake[0].y);
    lastDir = direction;

    // changes the next head according to the direction
    // if direction is undefined, nothing happens
    switch (direction) {
        case 1: head.y--; break; // up
        case 3: head.y++; break; // down
        case 0: head.x--; break; // left
        case 2: head.x++; break; // right
    }

    // warp the head onto the other side if it goes off the grid
    if (head.x >= gridSize) head.x = 0;
    if (head.x < 0) head.x = gridSize;
    if (head.y >= gridSize) head.y = 0;
    if (head.y < 0) head.y = gridSize;

    // checks whether the snake is running into itself
    for (i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameover = true;
            clearInterval(refreshIntervalId);
        }
    }

    // move the whole snake 1 grid square
    shiftUp();
    snake[0] = head;

    // when the head runs into fruit
    if (head.equals(fruit)) {
        snake[snake.length] = snake[snake.length - 1];
        // will return true if any of the pieces of the snake are the same as the fruit
        while (snake.some((piece) => piece.equals(fruit))) {
            fruit = Coord.random();
        }
    }
};

// replace every segment's coordinate in the snake (except for the head) with the coordinate
// before it
const shiftUp = () => {
    for (let i = snake.length - 2; i >= 0; i--) {
        snake[i + 1] = snake[i];
    }
};

// a strategic mapping of keys
const keyMap = {
    38: 1,  // up
    40: 3,  // down
    37: 0,  // left
    39: 2   // right
};

let direction = undefined; // don't start with any particular direction
let lastDir = direction;

document.onkeydown = (e) => {
    if (e.keyCode === 32) toggleAnimation(); // press space to pause the game
    const newDir = keyMap[e.keyCode]; // keyMap of a key that's not an arrow key will be undefined
    // if the new direction is directly opposite the current one, or a non-arrow key was pressed
    // don't update the direction
    if (isOppositeDir(lastDir, newDir) ||
        newDir === undefined) return;
    direction = newDir;
};

// are the two given directions direct opposites of each other?
const isOppositeDir = (dir1, dir2) => (dir1 + dir2) % 2 === 0;

// toggle whether the game is being played
const toggleAnimation = () => {
    if (animating || gameover) clearInterval(refreshIntervalId);
    else refreshIntervalId = setInterval(loop, 1000 / fps);
    animating = !animating;
};

let refreshIntervalId = 0;
let animating = true;
const fps = 5;

// canvas setup
window.onload = () => {
    canvas = $('#canvas')[0];
    context = canvas.getContext('2d');
    frames = $('#frames')[0];
    loop();
    refreshIntervalId = setInterval(loop, 1000 / fps);
};