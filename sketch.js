/**
 * @format
 * @description
 *      Deployments go: https://smithjl-personal.github.io/game-of-life/
 *
 *      Known Issues:
 *      - Docs are lacking on this page in some areas. Fix it.
 *
 * @ideas
 *      Make a tool that allows exports of the game state to this string encoded format?
 *      Make tool that allows selection of area on the board for copy/export (like a selection rectangle).
 *      Let users control size of cells (small, normal, large)
 *      Let users control speed of animation (slow, normal, fast)
 *      Use localStorage to save user-created shapes.
 *      Let users import/export shape JSON.
 *      Create a "Favorites" section backed by localStorage.
 *      Use .txt or .rle files to support importing from LifeWiki or Golly formats.
 *
 * @typedef {Array<Array<boolean>>} GameOfLifeBoard
 *
 * @typedef {"draw" | "erase" | "place"} selectedMouseState
 *
 * @typedef ShapeChoice
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} data The encoded data for this shape.
 */

let currentWindowWidthState = "loading";
let canvasWidth = 1400;
let canvasHeight = 700;

let cellSize = 10;
let cellsX = canvasWidth / cellSize;
let cellsY = canvasHeight / cellSize;

let fps = 8;

let isFrozen = false;

// Loaded later.
/** @type {[ShapeChoice]} */
let SHAPE_CHOICES = [];
let SHAPE_TYPE_TO_DESCRIPTIONS = {};

let selectedShapeData = {
	index: -1,
	width: 0,
	height: 0,
	cursorX: -1,
	cursorY: -1,
};

/** @type {selectedMouseState} */
let selectedMouseState = "draw";

/** @type {GameOfLifeBoard} */
let cells;

// P5.js functions.
function setup() {
	// Start by async loading shape data.
	loadShapes();

	// See if user needs to see instructions.
	const hasVisited = localStorage.getItem("hasVisited");
	if (!hasVisited) {
		// Show the modal
		const myModal = new bootstrap.Modal("#instructions-modal");
		myModal.show();

		// Set the flag so we don't show it again on load.
		localStorage.setItem("hasVisited", "true");
	}

	// Initialize the framerate.
	frameRate(fps);

	// Make the canvas, and add click listener to it.
	let canvas = createCanvas(canvasWidth, canvasHeight);
	canvas.addClass("border border-white");
	canvas.parent("canvas-container");

	updateWindowWidthVariables();

	// Create the 2D Cell Array, then populate it with random data.
	initCells();

	// Random seed.
	setRandomCellData();

	// Generic setup.
	setEventListeners();
	setDefaultFormState();
}

function draw() {
	// Start with the black background.
	background("black");

	// Style for cells on the grid.
	fill("white");
	stroke("black");
	strokeWeight(1);

	// Draw all cells that are alive.
	for (let y = 0; y < cellsY; y++) {
		for (let x = 0; x < cellsX; x++) {
			// We use safe navigation in case the window is resizing while this loop is running.
			if (cells?.[y]?.[x]) {
				square(x * cellSize, y * cellSize, cellSize);
			}
		}
	}

	// New code added to draw rectangle at cursor position.
	if (
		selectedMouseState === "place" &&
		selectedShapeData.cursorX > 0 &&
		selectedShapeData.cursorY > 0
	) {
		const rectWidth = selectedShapeData.width * cellSize;
		const rectHeight = selectedShapeData.height * cellSize;

		// If they place illegal shape location, color accordingly.
		let strokeColor = "white";
		if (selectedShapeData.cursorX + rectWidth > canvasWidth) {
			strokeColor = "red";
		} else if (selectedShapeData.cursorY + rectHeight > canvasHeight) {
			strokeColor = "red";
		}

		stroke(strokeColor);
		strokeWeight(3);
		noFill();
		rect(selectedShapeData.cursorX, selectedShapeData.cursorY, rectWidth, rectHeight);
	}

	if (!isFrozen) {
		updateCells();
	}
}

// Our Functions.
async function loadShapes() {
	try {
		const response = await fetch("./db/shapes.json");
		if (!response.ok) {
			throw Error("Failed to load ./db/shapes.json");
		}

		// Get the JSON data.
		const json = await response.json();

		// Update our copies.
		SHAPE_CHOICES = json.shapes;
		SHAPE_TYPE_TO_DESCRIPTIONS = json.descriptions;

		// Poplulate the select.
		populateShapeChoiceSelectOptions();
	} catch (err) {
		console.error("Error loading shape data:", err);
	}
}
function setEventListeners() {
	const errors = [];

	const canvas = document.querySelector("canvas");
	if (canvas === null) {
		errors.push("Could not find `canvas` on page to add event listeners.");
	} else {
		// Desktop events.
		canvas.addEventListener("mousedown", canvasMouseEvent);
		canvas.addEventListener("mouseup", canvasMouseEvent);
		canvas.addEventListener("mousemove", canvasMouseEvent);

		// Mobile events.
		canvas.addEventListener("touchstart", canvasMouseEvent);
		canvas.addEventListener("touchend", canvasMouseEvent);
		canvas.addEventListener("touchmove", canvasMouseEvent);
	}

	const pausePlayButton = document.querySelector("button#pause-play");
	if (pausePlayButton === null) {
		errors.push("Could not find element with selector `button#pause-play`.");
	} else {
		pausePlayButton.addEventListener("click", clickedPausePlay);
	}

	const stepButton = document.querySelector("button#step");
	if (stepButton === null) {
		errors.push("Could not find element with selector `button#step`.");
	} else {
		stepButton.addEventListener("click", updateCells);
	}

	const clearButton = document.querySelector("button#clear");
	if (clearButton === null) {
		errors.push("Could not find element with selector `button#clear`.");
	} else {
		clearButton.addEventListener("click", initCells);
	}

	const randomSeedButton = document.querySelector("button#fill-random");
	if (randomSeedButton === null) {
		errors.push("Could not find element with selector `button#fill-random`.");
	} else {
		randomSeedButton.addEventListener("click", setRandomCellData);
	}

	const mouseStateRadios = document.querySelectorAll("input[name='mouseStateRadioOption']");
	if (!mouseStateRadios.length) {
		errors.push(
			"Could not find any radio elements with selector `input[name='mouseStateRadioOption']`."
		);
	} else {
		for (const radio of mouseStateRadios) {
			radio.addEventListener("change", mouseStateChanged);
		}
	}

	const shapeChoiceSelect = document.querySelector("select#shape-select");
	if (shapeChoiceSelect === null) {
		errors.push("Could not find element with selector `select#shape-select`.");
	} else {
		shapeChoiceSelect.addEventListener("change", selectedShapeChanged);
	}

	if (errors.length) {
		console.error(errors.join("\n"));
	}
}
function setDefaultFormState() {
	const selectedMouseStateRadio = document.querySelector(
		"input[name='mouseStateRadioOption']:checked"
	);
	if (selectedMouseStateRadio !== null) {
		selectedMouseState = selectedMouseStateRadio.value;
	}

	if (selectedMouseState !== "place") {
		const shapeSelectContainer = document.querySelector("#shape-select-container");
		if (shapeSelectContainer === null) {
			console.error("Could not find shape choice container...");
		} else {
			shapeSelectContainer.style.display = "none";
		}
	}
}

function populateShapeChoiceSelectOptions() {
	let select = document.getElementById("shape-select");
	if (select === null) {
		console.error("Could not find select");
	} else {
		for (let i = 0; i < SHAPE_CHOICES.length; i++) {
			const choice = SHAPE_CHOICES[i];
			const newOption = document.createElement("option");
			newOption.value = i;
			newOption.innerText = choice.name;
			select.appendChild(newOption);
		}
	}
}

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
			if (!cells?.[y]?.[x]) {
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
			if (cells?.[neighborY]?.[neighborX]) {
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

	/**
	 * Verify shape can fit where it is placed.
	 * If it can't early exit. The UI indicates to the user why placement fails.
	 */
	if (y + decodedShapeResult.decodedShapeHeight > cellsY) {
		return false;
	} else if (x + decodedShapeResult.decodedShapeWidth > cellsX) {
		return false;
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
                We expected a stop at '${result.decodedShapeWidth}', but got '${cursorX}'.\n
                This happened at Y Value '${cursorY}'.
            `;
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
 * @param {MouseEvent | TouchEvent} e
 */
function canvasMouseEvent(e) {
	e.preventDefault();

	// If the mouse is moving over the canvas with no buttons clicked, ignore it.
	if (e.type === "mousemove" && !e.buttons) {
		return;
	}

	if (selectedMouseState === "draw" || selectedMouseState === "erase") {
		let cellState;
		if (selectedMouseState === "draw") {
			cellState = true;
		} else {
			cellState = false;
		}

		// Get the tile they clicked on, and draw the data accordingly.
		const result = getStructuredClickData(e);
		cells[result.cellY][result.cellX] = cellState;
	}

	if (selectedMouseState === "place" && selectedShapeData.index !== -1) {
		if (["mousemove", "mousedown", "touchmove", "touchstart"].includes(e.type)) {
			const result = getStructuredClickData(e);
			selectedShapeData.cursorX = result.x;
			selectedShapeData.cursorY = result.y;
		} else if (["mouseup", "touchend"].includes(e.type)) {
			// Clear selected cursor position.
			selectedShapeData.cursorX = -1;
			selectedShapeData.cursorY = -1;

			// Get the shape data.
			const data = SHAPE_CHOICES[selectedShapeData.index];

			// Attempt to place it at cursor position.
			const result = getStructuredClickData(e);
			setEncodedCells(data, result.cellX, result.cellY);
		}
	}
}

/**
 * Given a mouse/touch event, returns some useful data to us. It normalizes the client X and Y to where that would be on the canvas.
 * It also determines which cell they clicked on. We do not support multiple finger touches at this time.
 * @param {MouseEvent | TouchEvent} e
 */
function getStructuredClickData(e) {
	const result = {
		x: -1,
		y: -1,
		cellX: -1,
		cellY: -1,
	};

	/** @type {HTMLElement} */
	const canvas = e.target;
	const rect = canvas.getBoundingClientRect();

	let clientX, clientY;

	// Old browsers and some environments won't have this constructor.
	if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
		// Use the first touch point, even if multiple fingers are used. We aren't that fancy.
		const touch = e.touches[0] || e.changedTouches[0];
		clientX = touch.clientX;
		clientY = touch.clientY;
	} else {
		clientX = e.clientX;
		clientY = e.clientY;
	}

	result.x = clientX - rect.left;
	result.y = clientY - rect.top;

	result.cellX = Math.floor(result.x / cellSize);
	result.cellY = Math.floor(result.y / cellSize);

	return result;
}

function clickedPausePlay() {
	isFrozen = !isFrozen;
}

/** @param {Event} e */
function selectedShapeChanged(e) {
	/** @type {HTMLInputElement} */
	const el = e.target;
	const newValue = el.value;
	selectedShapeData.index = parseInt(newValue);

	// Update the display text under the shape.
	const descriptionContainer = document.getElementById("shape-description");
	if (descriptionContainer === null) {
		console.error("Can't find description container. No description change.");
	}

	// Parse the shape, if we can find it.
	const selectedShape = SHAPE_CHOICES[selectedShapeData.index];
	if (selectedShape === undefined) {
		selectedShapeData.width = 0;
		selectedShapeData.height = 0;

		if (descriptionContainer) {
			descriptionContainer.innerHTML = "";
		}
	} else {
		const parsedShape = parseEncodedShapeString(selectedShape.data);
		selectedShapeData.width = parsedShape.decodedShapeWidth;
		selectedShapeData.height = parsedShape.decodedShapeHeight;

		if (descriptionContainer && SHAPE_TYPE_TO_DESCRIPTIONS[selectedShape.type]) {
			descriptionContainer.innerHTML = `
                <b>${selectedShape.type}</b>
                ${SHAPE_TYPE_TO_DESCRIPTIONS[selectedShape.type]}
            `;
		}
	}
}

/** @param {Event} e */
function mouseStateChanged(e) {
	/** @type {HTMLInputElement} */
	const el = e.target;
	const newValue = el.value;
	selectedMouseState = newValue;

	const newShapeContainerDisplay = selectedMouseState === "place" ? "block" : "none";

	const shapeSelectContainer = document.querySelector("#shape-select-container");
	if (shapeSelectContainer === null) {
		console.error("Could not find shape choice container...");
	} else {
		shapeSelectContainer.style.display = newShapeContainerDisplay;
	}
}

/** @param {UIEvent} e */
function updateWindowWidthVariables(e) {
	// Find out what the width is...
	let newWindowWidthState;
	let newCanvasWidth;
	let newCanvasHeight;
	if (window.innerWidth > 1400) {
		newWindowWidthState = "large";
		newCanvasWidth = 1400;
		newCanvasHeight = 700;
	} else if (window.innerWidth > 800) {
		newWindowWidthState = "medium";
		newCanvasWidth = 800;
		newCanvasHeight = 500;
	} else {
		newWindowWidthState = "small";
		newCanvasWidth = 300;
		newCanvasHeight = 500;
	}

	// If it's the same, do nothing.
	if (newWindowWidthState === currentWindowWidthState) {
		return;
	}

	// Update the state, and all variables.
	currentWindowWidthState = newWindowWidthState;
	canvasWidth = newCanvasWidth;
	canvasHeight = newCanvasHeight;
	cellsX = canvasWidth / cellSize;
	cellsY = canvasHeight / cellSize;
	resizeCanvas(canvasWidth, canvasHeight);

	// Make the control container the same width as the canvas.
	let controlContainer = document.getElementById("control-container");
	if (controlContainer) {
		controlContainer.style.maxWidth = `${canvasWidth}px`;
	}
}

// Prevent the context menu from popping up when clicking on the canvas.
window.addEventListener("contextmenu", function (e) {
	/** @type {HTMLElement} */
	const target = e.target;
	if (target.tagName === "CANVAS") {
		e.preventDefault();
	}
});

window.addEventListener("resize", updateWindowWidthVariables);
