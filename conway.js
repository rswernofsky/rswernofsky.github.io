let cells = [];
const fps = 3;

const CELL_SIZE = 40;
let gridColors = []; // color double array
let aliveCells = []; // boolean double array

let squaresWide;
let squaresTall;

const NEIGHBOR_OFFSETS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const countAliveNeighbors = (x, y, squaresWide, squaresTall) => {
    let aliveNeighbors = 0;
    NEIGHBOR_OFFSETS.forEach((offset) => {
        neighborX = x + offset[0];
        neighborY = y + offset[1];
        const neighborInRange = (neighborX >= 0 && neighborX < squaresWide - 1) && (neighborY >= 0 && neighborY < squaresTall - 1);
        if (neighborInRange) {
            aliveNeighbors += aliveCells[neighborX][neighborY] ? 1 : 0;
        }
    }) 
    return aliveNeighbors;
}

const isSurviving = (x, y, squaresWide, squaresTall) => {
    const aliveNeighbors = countAliveNeighbors(x, y, squaresWide, squaresTall);
    if (aliveCells[x, y]) {
        return (aliveNeighbors == 2 || aliveNeighbors == 3);
    }
    else {
        return aliveNeighbors == 3;
    }
}

const generateNewAliveCells = (squaresWide, squaresTall) => {
    const result = [];
    for (x = 0; x < aliveCells.length; x++) {
        row = aliveCells[x];
        result[x] = [];
        for (y = 0; y < row.length; y++) {
            result[x][y] = isSurviving(x, y, squaresWide, squaresTall);
        }
    }
    return result;
}

class GridCell {
    constructor(alive, color) {
        this.alive = alive;
        this.color = color;
    }

}

class Cell {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}


const cellsAnimation = () => {
    context.canvas.width = window.innerWidth;
    context.canvas.height = window.innerHeight;

    aliveCells = generateNewAliveCells(squaresWide, squaresTall);

    for (let x = 0; x < squaresWide; x++) {
        for (let y = 0; y < squaresTall; y++) {
            if (aliveCells[x][y]) {
                context.strokeStyle = 'white';
                context.fillStyle = gridColors[x][y];
                context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

const colors = ["#f5fcf5", "#fcf5f5", "#f8f2fc", "#f5fafc", "#fcfbf2"]
// const colors = ["#f0fcf1", "#fcebeb", "#f5ebfc", "#def3fd", "#faf7e6"]
// const colors = ["#defde0", "#fddfdf", "#f0defd", "#def3fd", "#fcf7de"];

const getRandomNum = (upTo) => upTo * Math.random();
const getRandomArrayColor = () => colors[Math.floor( Math.random() * 5)];
const getRandomColor = () => '#' + Math.floor((1 << 24) * Math.random()).toString(16);

const makeCell = (x, y) => {
    let color = getRandomArrayColor();
    cells.push(new Cell(
        x,
        y,
        color,
    ))
    console.log('makeCell with', {x, y, color});
};

// document.onkeydown = (e) => {
//     const keyCode = e.keyCode;
//     if (keyCode == 37) { // left
//         plusSlides(-1);
//     } else if (keyCode == 39) { // right
//         plusSlides(1);
//     }
// };

const generateColors = (squaresWide, squaresTall) => {
    const result = []
    for (let x = 0; x < squaresWide; x++) {
        const row = []
        for (let y = 0; y < squaresTall; y++) {
            row[y] = getRandomArrayColor();
        }
        result[x] = row;
    }
    return result;
}

const generateAliveCells = (squaresWide, squaresTall) => {
    const result = []
    for (let x = 0; x < squaresWide; x++) {
        result[x] = [];
    }
    return result;
}


window.onload = () => { // TODO: change the squares when the window changes size
    canvas = $('#canvas')[0];
    context = canvas.getContext('2d');

    // initialize refreshIntervalId
    refreshIntervalId = setInterval(cellsAnimation, 5000 / fps);


    squaresWide = Math.floor(window.innerWidth/CELL_SIZE);
    squaresTall = Math.floor(window.innerHeight/CELL_SIZE);

    // displaySlide(slideIndex = 0);
    console.log('width', context.canvas.width);
    console.log('height', context.canvas.height);
    console.log('innerwidth', window.innerWidth);
    console.log('innerheight', window.innerHeight);

    gridColors = generateColors(squaresWide, squaresTall);
    aliveCells = generateAliveCells(squaresWide, squaresTall);
    console.log(aliveCells)


    for (let i = 0; i < squaresWide * squaresTall / 4; i++) {
        x = Math.floor(getRandomNum(squaresWide));
        y = Math.floor(getRandomNum(squaresTall));
        aliveCells[x][y] = true;
    }

    cellsAnimation();
}





