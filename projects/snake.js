// javascript canvas imports
let canvas, context, frames;

// size constants
const size = 20;
const gridSize = 15;

// represents a single grid square
class GridSquare {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    // is the given grid square at the same coordinate as this one?
    equals(square) {
        return (square.x === this.x && square.y === this.y);
    }

    // draws this grid square
    draw() {
        context.fillRect(this.x * size, this.y * size, size, size);
    }

    // 
    static random() { // lowercase is good notation 
        return new GridSquare(getRandomInt(gridSize),
            getRandomInt(gridSize));
    }
}
// each grid square will make a square that has a width and height of 20

const getRandomInt = (upTo) => Math.floor(upTo * Math.random());
const getRandomColor = () => '#' + Math.floor((1 << 24) * Math.random()).toString(16);

let snake = [GridSquare.random()];
// list of the "coordinates" of the squares which will make up the snake shape. Will get multiplied to find the x and y locations
let fruit = new GridSquare(1, 1);
let gameover = false;

const loop = () => {
    // window.requestAnimationFrame(loop); //runs every animation frame

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
    // draws the snake and the fruit

    let head = new GridSquare(snake[0].x, snake[0].y);
    lastDir = direction;

    switch (direction) {
        case 1: head.y--; break; // up
        case 3: head.y++; break; // down
        case 0: head.x--; break; // left
        case 2: head.x++; break; // right
    }
    // changes the next head according to the direction

    if (head.x >= gridSize) head.x = 0;
    if (head.x < 0) head.x = gridSize;
    if (head.y >= gridSize) head.y = 0;
    if (head.y < 0) head.y = gridSize;
    // loop onto the other side if head goes off the grid

    for (i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameover = true;
            clearInterval(refreshIntervalId);
        }
    }
    // checks if the snake is running into itself

    shiftUp();
    snake[0] = head;

    if (head.equals(fruit)) {
        snake[snake.length] = snake[snake.length - 1];
        // will return true if any of the pieces of the snake are the same as the fruit
        while (snake.some((piece) => piece.equals(fruit))) {
            fruit = GridSquare.random();
        }
    }
    // when the head runs into fruit

};

const shiftUp = () => {
    for (let i = snake.length - 2; i >= 0; i--) {
        snake[i + 1] = snake[i];
    }
};

const keyMap = {
    38: 1,  // up
    40: 3,  // down
    37: 0,  // left
    39: 2   // right
};

let direction = undefined; // not a real direction
let lastDir = direction;

document.onkeydown = (e) => {
    if (e.keyCode === 32) stopAnimation();
    const newDir = keyMap[e.keyCode];
    if (isOppositeDir(lastDir, newDir) ||
        newDir === undefined) return;
    direction = newDir;
    // if the keyMap is defined, it will return it without looking at direction
};

const isOppositeDir = (dir1, dir2) => (dir1 + dir2) % 2 === 0;

const stopAnimation = () => {
    if (animating || gameover) clearInterval(refreshIntervalId);
    else refreshIntervalId = setInterval(loop, 1000 / fps);
    animating = !animating;
};

let refreshIntervalId = 0;
let animating = true;
const fps = 5;

window.onload = () => {
    canvas = $('#canvas')[0];
    context = canvas.getContext('2d');
    frames = $('#frames')[0];
    loop();
    refreshIntervalId = setInterval(loop, 1000 / fps);
};