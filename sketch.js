/**
 * @format
 * @description
 *  Deployments go: https://smithjl-personal.github.io/game-of-life/
 */

let canvasWidth = 500;
let canvasHeight = 500;

let cellSize = 10;
let cellsX = canvasWidth / cellSize;
let cellsY = canvasHeight / cellSize;

let fps = 1;

/** @type {Array<Array<boolean>>} */
let cells;

// P5.js functions.
function setup() {
	// Initialize the framerate.
	frameRate(fps);

	// Make the canvas, and add click listener to it.
	let canvas = createCanvas(canvasWidth, canvasHeight);
	canvas.mouseClicked(clickedCanvas);

	// Create the 2D Cell Array, then populate it with random data.
	initCells();
	setRandomCellData();
}

function draw() {
	// Start with the black background.
	background(0);

	// Draw all cells that are alive.
	for (let y = 0; y < cellsY; y++) {
		for (let x = 0; x < cellsX; x++) {
			// Only draw live cells.
			if (cells[y][x]) {
				square(x * cellSize, y * cellSize, cellSize);
			}
		}
	}

	// Update.
	// TODO: Add ability to 'freeze' time here with a boolean control.
	updateCells();
}

// Our Functions.

/**
 * Populates a 2D Array of booleans to be used to store our state.
 */
function initCells() {
	// Empty it.
	cells = [];

	// Verify cell size is valid.
	if (canvasWidth % cellSize !== 0) {
		throw Error("Invalid `cellSize`, remainder is non-zero for `canvasWidth`.");
	}
	if (canvasHeight % cellSize !== 0) {
		throw Error("Invalid `cellSize`, remainder is non-zero for `canvasHeight`.");
	}

	// Populate it.
	cellsX = canvasWidth / cellSize;
	cellsY = canvasHeight / cellSize;
	for (let y = 0; y < cellsY; y++) {
		cells[y] = [];
		for (let x = 0; x < cellsX; x++) {
			cells[y].push(false);
		}
	}
}

/**
 * Creates a new 2D array for the next step of the simulation.
 * This function follows the rules outlined by John Conway in 1970.
 */
function updateCells() {
	// TODO: Make this a global variable? So we don't need to declare a new array each time?
	let newCells = [];
	for (let y = 0; y < cellsY; y++) {
		newCells[y] = new Array(cellsX);
	}

	// For each cell...
	for (let y = 0; y < cellsY; y++) {
		for (let x = 0; x < cellsX; x++) {
			let neighborCount = countCellNeighbors(x, y);

			// Dead cell logic.
			if (!cells[y][x]) {
				// Growth by reproduction.
				if (neighborCount === 3) {
					newCells[y][x] = true;
				}
			}

			// Live cell logic.
			else {
				// Overpopulation = death.
				if (neighborCount > 3) {
					newCells[y][x] = false;
				}

				// Underpopulation = death.
				else if (neighborCount < 2) {
					newCells[y][x] = false;
				}

				// Goldilocks zone of survival.
				else {
					newCells[y][x] = true;
				}
			}
		}
	}

	// Update the cell data.
	cells = newCells;
}

/**
 * Given the x and y coordinates of the cell, returns the number
 * of live neighbors it has.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @returns {number} The number of live neigbors.
 */
function countCellNeighbors(x, y) {
	let neighborCount = 0;

	for (let neighborY = y - 1; neighborY <= y + 1; neighborY++) {
		// Do some bounds checking for y values.
		if (neighborY < 0 || neighborY >= cellsY) {
			continue;
		}

		for (let neighborX = x - 1; neighborX <= x + 1; neighborX++) {
			// We don't count ourself as the neighbor.
			if (neighborX === x && neighborY === y) {
				continue;
			}

			// Do some bounds checking for x values.
			if (neighborX < 0 || neighborX >= cellsX) {
				continue;
			}

			// Otherwise, count the data!
			if (cells[neighborY][neighborX]) {
				neighborCount++;
			}
		}
	}

	return neighborCount;
}

/**
 * Populates the grid with random data.
 */
function setRandomCellData() {
	for (let y = 0; y < cellsY; y++) {
		for (let x = 0; x < cellsX; x++) {
			if (Math.random() > 0.5) {
				cells[y][x] = true;
			} else {
				cells[y][x] = false;
			}
		}
	}
}

/**
 * TODO: Make this do something.
 */
function clickedCanvas() {}
