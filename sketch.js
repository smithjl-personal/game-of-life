/**
 * @format
 * @description
 *      Deployments go: https://smithjl-personal.github.io/game-of-life/
 *
 * @ideas
 *      Make a tool that allows exports of the game state to this string encoded format?
 *
 * @typedef {Array<Array<boolean>>} GameOfLifeBoard
 *
 * @typedef ShapeChoice
 * @property {string} name
 * @property {string} type
 * @property {string} data The encoded data for this shape.
 */

let canvasWidth = 1000;
let canvasHeight = 750;

let cellSize = 10;
let cellsX = canvasWidth / cellSize;
let cellsY = canvasHeight / cellSize;

let fps = 8;

let isFrozen = false;

const SHAPE_CHOICES = [
	{
		id: "glider",
		name: "Glider",
		type: "Spaceship",
		data: "D5\nD2L1D2\nD3L1D1\nD1L3D1\nD5",
	},
	{
		id: "brick_layer_a",
		name: "Brick Layer A",
		type: "Brick Layer",
		data: "D10\nD7L1D2\nD5L1D1L2D1\nD5L1D1L1D2\nD5L1D4\nD3L1D6\nD1L1D1L1D6\nD10",
	},
	{
		id: "brick_layer_b",
		name: "Brick Layer B",
		type: "Brick Layer",
		data: "D7\nD1L3D1L1D1\nD1L1D5\nD4L2D1\nD2L2D1L1D1\nD1L1D1L1D1L1D1\nD7",
	},
	{
		id: "brick_layer_thin",
		name: "Brick Layer Thin",
		type: "Brick Layer",
		data: "D41\nD1L8D1L5D3L3D6L7D1L5D1\nD41",
	},
];

/** @type {GameOfLifeBoard} */
let cells;

// P5.js functions.
function setup() {
	// Initialize the framerate.
	frameRate(fps);

	// Make the canvas, and add click listener to it.
	let canvas = createCanvas(canvasWidth, canvasHeight);
	canvas.mouseClicked(clickedCanvas);

	let pausePlayButton = createButton("Pause Animation");
	pausePlayButton.mouseClicked(clickedPausePlay);

	let stepButton = createButton("Step");
	stepButton.mouseClicked(updateCells);

	let randomSeedButton = createButton("Set Random State");
	randomSeedButton.mouseClicked(setRandomCellData);

	// Create the 2D Cell Array, then populate it with random data.
	initCells();

	// Random seed.
	//setRandomCellData();

	// Places a glider in the top left.
	//setEncodedCells(SHAPE_CHOICES[0], 5, 5);

	// Places a brick layer thin.
	//setEncodedCells(SHAPE_CHOICES[3], 30, 35);

	// Places a brick layer a.
	// setEncodedCells(SHAPE_CHOICES[1], 30, 35);

	// Places a brick layer b.
	setEncodedCells(SHAPE_CHOICES[2], 30, 35);
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
	if (!isFrozen) {
		updateCells();
	}
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
	cells = getDead2DArray(cellsX, cellsY);
}

/**
 * Creates a new 2D array for the next step of the simulation.
 * This function follows the rules outlined by John Conway in 1970.
 */
function updateCells() {
	/** @type {GameOfLifeBoard} */
	let newCells = getDead2DArray(cellsX, cellsY);

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
 * Attempts to place chosen shape on the grid. May throw errors
 * if something goes wrong parsing the shape, or if the shape cannot
 * fit at the location.
 * @param {ShapeChoice} shape
 * @param {number} x
 * @param {number} y
 */
function setEncodedCells(shape, x, y) {
	const decodedShapeResult = parseEncodedShapeString(shape.data);
	if (!decodedShapeResult.success) {
		throw Error(decodedShapeResult.message);
	}

	// Verify shape can fit where it is placed.
	if (y + decodedShapeResult.decodedShapeHeight > cellsY) {
		throw Error("This shape is too tall to be placed here.");
	}
	if (x + decodedShapeResult.decodedShapeWidth > cellsX) {
		throw Error("This shape is too wide to be placed here.");
	}

	// Place the shape.
	for (let decodedY = 0; decodedY < decodedShapeResult.decodedShapeHeight; decodedY++) {
		for (let decodedX = 0; decodedX < decodedShapeResult.decodedShapeWidth; decodedX++) {
			cells[y + decodedY][x + decodedX] =
				decodedShapeResult.decodedShapeArray[decodedY][decodedX];
		}
	}
}

/**
 * Does the heavy lifting for decoding the shape string.
 * This function is very picky, and expects the string
 * to be formatted correctly!
 * @param {string} str The encoded string for the shape.
 */
function parseEncodedShapeString(str) {
	const result = {
		message: "",
		success: false,
		decodedShapeArray: [],
		decodedShapeWidth: 0,
		decodedShapeHeight: 0,
	};

	const encodedShapeLines = str.split("\n");
	if (encodedShapeLines.length === 0) {
		result.message = "Encoded shape provided seems to have no lines.";
		return result;
	}

	// Get the height of the shape.
	result.decodedShapeHeight = encodedShapeLines.length + 1;

	// Get the width of the shape.
	const firstLine = encodedShapeLines[0];
	const firstLineOnlyNumbersAndSpaces = firstLine.replace(/\D/g, " ");
	const digitArray = firstLineOnlyNumbersAndSpaces.split(" ");
	for (const number of digitArray) {
		const parsedChar = parseInt(number);
		if (!isNaN(parsedChar)) {
			result.decodedShapeWidth += parsedChar;
		}
	}

	// Populate the array as empty.
	result.decodedShapeArray = getDead2DArray(result.decodedShapeWidth, result.decodedShapeHeight);

	// Then put the data in there.
	let xStrWalker = 0;
	let cursorX = 0;
	let cursorY = 0;
	for (const encodedLine of encodedShapeLines) {
		// Initialize the x-walker.
		xStrWalker = 0;
		cursorX = 0;
		while (xStrWalker < encodedLine.length) {
			// Get the cell state.
			let cellState = false;
			if (encodedLine[xStrWalker] === "D") {
				cellState = false;
			} else if (encodedLine[xStrWalker] === "L") {
				cellState = true;
			} else {
				result.message = `Unexpected value provided for cell state. We expect 'D' or 'L', but got '${encodedLine[xStrWalker]}'.`;
				return result;
			}

			// Move the walker forward.
			xStrWalker++;

			// Build the number digit by digit until we reach the end of the string, or a non-numeric character.
			let repetitionStr = "";
			while (xStrWalker < encodedLine.length && !isNaN(parseInt(encodedLine[xStrWalker]))) {
				repetitionStr += encodedLine[xStrWalker];
				xStrWalker++;
			}

			let repetition = parseInt(repetitionStr);
			if (isNaN(repetition)) {
				result.message = `
                    Unexpected value provided for cell repetition.
                    We expect an integer, but got '${repetitionStr}'.`;
				return result;
			}

			// If the cell state is dead, just increment the x cursor. Default state is dead.
			if (!cellState) {
				cursorX += repetition;
			} else {
				for (let cellCounter = 0; cellCounter < repetition; cursorX++, cellCounter++) {
					result.decodedShapeArray[cursorY][cursorX] = true;
				}
			}
		}

		// Verify x cursor position is correct.
		if (cursorX !== result.decodedShapeWidth) {
			result.message = `
                Width of parsed string stopped unexpectedly.
                We expected a stop at '${result.decodedShapeWidth}', but got '${cursorX}'.`;
			return result;
		}

		// Increment y position.
		cursorY++;
	}

	/**
	 * Verify y cursor position is correct.
	 * We do a pre-increment on the y value because we only increment y once per line.
	 * Meaning we end up one short of the 'height' in this context.
	 */
	if (++cursorY !== result.decodedShapeHeight) {
		result.message = `
            Height of parsed string stopped unexpectedly.
            We expected a stop at '${result.decodedShapeHeight}', but got '${cursorY}'.`;
		return result;
	}

	result.success = true;
	return result;
}

/**
 * Helper function that given a width and height, returns a 2D array filled with dead cells.
 * @param {number} width
 * @param {number} height
 * @returns {Array<Array<boolean>>}
 */
function getDead2DArray(width, height) {
	const arr = [];

	for (let y = 0; y < height; y++) {
		arr[y] = [];
		for (let x = 0; x < width; x++) {
			arr[y].push(false);
		}
	}

	return arr;
}

// User input events.

/**
 * TODO: Make this do something.
 */
function clickedCanvas() {}

/**
 * @param {MouseEvent} e
 */
function clickedPausePlay(e) {
	isFrozen = !isFrozen;

	/** @type {HTMLButtonElement} */
	let button = e.target;
	button.innerText = isFrozen ? "Play Animation" : "Pause Animation";
}

// Prevent the context menu from popping up when clicking on the canvas.
window.addEventListener("contextmenu", function (e) {
	/** @type {HTMLElement} */
	const target = e.target;
	if (target.tagName === "CANVAS") {
		e.preventDefault();
	}
});
