const GRID_SIZE = 24;
const UINT_ARRAY_SIZE = (GRID_SIZE * GRID_SIZE) / 8;
const ROTATION_DURATION = 500;
const MAX_INPUT_QUEUE_SIZE = 5;
const SWIPE_THRESHOLD = 4;

const MaxPointIncreaseThreshold = new Set([7, 20, 42, 80, 120, 200]);

const TOP = 0;
const RIGHT = 1;
const BOTTOM = 2;
const LEFT = 3;

const FRONT_SIDE = 0;
const RIGHT_SIDE = 1;
const TOP_SIDE = 2;
const LEFT_SIDE = 3;
const BOTTOM_SIDE = 4;
const BACK_SIDE = 5;

const snake = new Uint8Array(UINT_ARRAY_SIZE);
const point = new Uint8Array(UINT_ARRAY_SIZE);

Game.isRunning = false;
Game.isPaused = false;
Game.isOver = false;
Game.frameTimeoutId = -1;
Game.frameId = -1;
Game.rotationTimeoutId = -1;
Game.direction = TOP;
Game.pointCount = 0;
Game.maxPointCount = 1;
Game.tickRate = 200;

/** @type {string[]} */
Game.inputQueue = [];

/** @type {[x: number, y: number][]} */
Game.snakePositions = [];

/** @type {[x: number, y: number]} */
Game.snakePreviousPosition = [0, 0];

/** @type {[x: number, y: number]} */
Game.touchStart= [0, 0];

/** @type {[x: number, y: number]} */
Game.touchEnd = [0, 0];

/**
 * @returns {void}
 */
function Game() {
	clear();

	Game.inputQueue = [];
	Game.tickRate = 200;
	Game.isOver = false;
	Game.direction = TOP;
	Game.pointCount = 0;
	Game.maxPointCount = 1;
	Game.snakePositions = [
		[GRID_SIZE / 2 - 1, GRID_SIZE / 2 - 1],
		[GRID_SIZE / 2 - 1, GRID_SIZE / 2],
		[GRID_SIZE / 2 - 1, GRID_SIZE / 2 + 1],
	];

	cancelFrame();
	Game.frameId = requestAnimationFrame(tick);
}

/**
 * @returns {void}
 */
function cancelFrame() {
	cancelAnimationFrame(Game.frameId);

	clearTimeout(Game.frameTimeoutId);

	Game.frameId = -1;
	Game.frameTimeoutId = -1;
}

/**
 * @returns {void}
 */
function tick() {
	processInput();
	update();

	if (Game.isOver) {
		cancelFrame();

		const score = Game.snakePositions.length;
		const formattedScore = score.toString();

		if (Number.parseInt(localScore ?? "0") < score) {
			localStorage.setItem("high-score", formattedScore);
			highScore.textContent = formattedScore;
		}

		gameScore.textContent = formattedScore;
		gameOverDialog.showModal();

		return;
	}

	if (!Game.isRunning) {
		cancelFrame();
		clear();

		return;
	}

	Game.frameTimeoutId = setTimeout(() => {
		Game.frameId = requestAnimationFrame(tick);
	}, Game.tickRate);
}

/**
 * @returns {void}
 */
function processInput() {
	const input = Game.inputQueue.shift();

	switch (input) {
		case "Escape":
			toggleGame(false);
			break;
		case "ArrowUp":
		case "KeyW":
			if (Game.direction !== BOTTOM) {
				Game.direction = TOP;
			}
			break;
		case "ArrowRight":
		case "KeyD":
			if (Game.direction !== LEFT) {
				Game.direction = RIGHT;
			}
			break;
		case "ArrowDown":
		case "KeyS":
			if (Game.direction !== TOP) {
				Game.direction = BOTTOM;
			}
			break;
		case "ArrowLeft":
		case "KeyA":
			if (Game.direction !== RIGHT) {
				Game.direction = LEFT;
			}
			break;
		case "KeyP":
			if (Game.isPaused) {
				Game.frameId = requestAnimationFrame(tick);
				Game.isPaused = false;
			} else {
				cancelFrame();
				Game.isPaused = true;
			}
			break;
	}
}

/**
 * @returns {void}
 */
function update() {
	move();

	if (!Game.isOver) {
		spawnPoint();
	}
}

/**
 * @returns {void}
 */
function move() {
	const atePoint = moveHead();

	for (let i = 1; i < Game.snakePositions.length; i++) {
		moveBody(i);
	}

	if (atePoint) {
		Game.snakePositions.push([...Game.snakePreviousPosition]);

		if (MaxPointIncreaseThreshold.has(Game.snakePositions.length)) {
			Game.maxPointCount++;
		}

		Game.pointCount--;
		Game.tickRate = Math.max(60, Game.tickRate - 10);
	}
}

/**
 * @returns {boolean} whether got a point.
 */
function moveHead() {
	const position = Game.snakePositions[0];

	set(snake, ...position, false, "snake");

	if (position[0] === 0 && Game.direction === LEFT) {

		rotate(LEFT_SIDE);
		position[0] = GRID_SIZE - 1;

	} else if (position[0] === GRID_SIZE - 1 && Game.direction === RIGHT) {

		rotate(RIGHT_SIDE);
		position[0] = 0;

	} else if (position[1] === 0 && Game.direction === TOP) {

		rotate(TOP_SIDE);
		position[1] = GRID_SIZE - 1;

	} else if (position[1] === GRID_SIZE - 1 && Game.direction === BOTTOM) {

		rotate(BOTTOM_SIDE);
		position[1] = 0;
	}

	Game.snakePreviousPosition[0] = position[0];
	Game.snakePreviousPosition[1] = position[1];

	switch (Game.direction) {
		case TOP:
			position[1] -= 1;
			break;
		case RIGHT:
			position[0] += 1;
			break;
		case BOTTOM:
			position[1] += 1;
			break;
		case LEFT:
			position[0] -= 1;
			break;
	}

	if (get(snake, ...position)) {
		Game.isOver = true;
	}

	set(snake, ...position, true, "snake");

	const atePoint = get(point, ...position);

	if (atePoint) {
		set(point, ...position, false, "snake");
	}

	return atePoint;
}

/**
 * @param {number} index
 * @returns {void}
 */
function moveBody(index) {
	const current = Game.snakePositions[index];

	const currentCopy = [...current];

	set(snake, ...current, false, "snake");

	current[0] = Game.snakePreviousPosition[0];
	current[1] = Game.snakePreviousPosition[1];

	set(snake, ...current, true, "snake");

	Game.snakePreviousPosition[0] = currentCopy[0];
	Game.snakePreviousPosition[1] = currentCopy[1];
}

/**
 * @returns {void}
 */
function spawnPoint() {
	if (Game.pointCount === Game.maxPointCount) {
		return;
	}

	const pointChances = crypto.getRandomValues(new Int8Array(UINT_ARRAY_SIZE));
	const [startX, startY] = crypto.getRandomValues(new Uint8Array(2));

	for (let x = Math.floor(startX / 8); x < GRID_SIZE; x++) {
		for (let y = Math.floor(startY / 8); y < GRID_SIZE; y++) {
			if (
				!get(pointChances, x, y) ||
				get(point, x, y - 1) ||
				get(point, x + 1, y) ||
				get(point, x, y + 1) ||
				get(point, x - 1, y) ||
				get(point, x - 1, y + 1) ||
				get(point, x - 1, y - 1) ||
				get(point, x + 1, y + 1) ||
				get(point, x + 1, y - 1) ||
				get(snake, x, y) ||
				get(snake, x, y - 1) ||
				get(snake, x + 1, y) ||
				get(snake, x, y + 1) ||
				get(snake, x - 1, y) ||
				get(snake, x - 1, y + 1) ||
				get(snake, x - 1, y - 1) ||
				get(snake, x + 1, y + 1) ||
				get(snake, x + 1, y - 1)
			) {
				continue;
			}

			set(point, x, y, true, "point");
			Game.pointCount++;

			return;
		}
	}
}

/**
 * @param {number} side
 * @returns {void}
 */
function rotate(side) {
	if (Game.rotationTimeoutId > 0) {
		return;
	}

	cube.style.transition = `transform ease-in ${ROTATION_DURATION}ms`;

	switch (side) {
		case FRONT_SIDE:
			cube.style.transformOrigin = "center";
			cube.style.transform = "";
			break;
		case RIGHT_SIDE:
			cube.style.transformOrigin = "left";
			cube.style.transform = "rotateY(-90deg) translateX(var(--z-offset-reversed))";
			break;
		case TOP_SIDE:
			cube.style.transformOrigin = "bottom";
			cube.style.transform = "rotateX(-90deg) translateY(var(--z-offset))";
			break;
		case LEFT_SIDE:
			cube.style.transformOrigin = "right";
			cube.style.transform = "rotateY(90deg) translateX(var(--z-offset))";
			break;
		case BOTTOM_SIDE:
			cube.style.transformOrigin = "top";
			cube.style.transform = "rotateX(90deg) translateY(var(--z-offset-reversed))";
			break;
		case BACK_SIDE:
			cube.style.transformOrigin = "center";
			cube.style.transform = "rotateY(-180deg) translateZ(var(--z-offset))";
			break;
	}

	Game.rotationTimeoutId = setTimeout(() => {
		cube.style.transformOrigin = "center"
		cube.style.transition = "";
		cube.style.transform = "";

		Game.rotationTimeoutId = -1;
	}, ROTATION_DURATION * 1.15);
}

/**
 * @returns {void}
 */
function clear() {
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			set(snake, x, y, false, "snake");
			set(point, x, y, false, "point");
		}
	}
}

/**
 * @param {Uint8Array} state
 * @param {number} x
 * @param {number} y
 * @param {boolean} toggle
 * @param {string} className
 * @returns {void}
 */
function set(state, x, y, toggle, className) {
	const [index, bit] = getCellBitIndex(x, y);

	if (toggle) {
		state[index] |= 1 << bit; // Set the bit
	} else {
		state[index] &= ~(1 << bit); // Clear the bit
	}

	for (let z = 0; z < BACK_SIDE + 1; z++) {
		const cell = /** @type {HTMLElement} */ (document.getElementById(`cell-${z}-${y * GRID_SIZE + x}`));

		cell.className = toggle ? className : "";
		cell.dataset.direction = Game.direction === TOP ? "top" : Game.direction === RIGHT ? "right" : Game.direction === BOTTOM ? "bottom" : "left";

		if (className === "snake" && Game.snakePositions[0]) {
			cell.dataset.snake = toggle ? Game.snakePositions[0][0] === x && Game.snakePositions[0][1] === y ? "head" : "body" : "none";
		}
	}
}

/**
 * @param {Int8Array | Uint8Array} state
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function get(state, x, y) {
	const [index, bit] = getCellBitIndex(x, y);
	return (state[index] & (1 << bit)) !== 0; // Check the bit
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {[index: number, bit: number]}
 */
function getCellBitIndex(x, y) {
	const index = Math.floor((y * GRID_SIZE + x) / 8);
	const bit = (y * GRID_SIZE + x) % 8;

	return [index, bit];
}

/**
 * @param {boolean} toggle
 * @returns {void}
 */
function toggleGame(toggle) {
	startButton.hidden = toggle;
	Game.isRunning = toggle;

	if (toggle) {
		Game();
	}
}

/**
 * @returns {string | null}
 */
function processSwipe() {
	const [startX, startY] = Game.touchStart;
	const [endX, endY] = Game.touchEnd;

	const deltaX = endX - startX;
	const deltaY = endY - startY;

	if (Math.abs(deltaX) <= SWIPE_THRESHOLD && Math.abs(deltaY) <= SWIPE_THRESHOLD) {
		return null;
	}

	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		return deltaX > 0 ? "ArrowRight" : "ArrowLeft";
	}

	return deltaY > 0 ? "ArrowDown" : "ArrowUp";
}

/**
 * Setup HTML & listeners
 */
const gameOverDialog = /** @type {HTMLDialogElement} */ (document.getElementById("game-over-dialog"));
const highScore = /** @type {HTMLElement} */ (document.getElementById("high-score"));
const gameScore = /** @type {HTMLElement} */ (document.getElementById("game-score"));

const cube = /** @type {HTMLDivElement} */ (document.getElementById("cube"));
const startButton = document.createElement("button");

startButton.id = "start-button";
startButton.type = "button";
startButton.textContent = "Start";

cube.innerHTML = "";
cube.style.setProperty("--grid-size", GRID_SIZE.toString());
cube.style.setProperty("--cell-size", "1.25rem");

for (let i = 0; i <= BACK_SIDE; i++) {
	const grid = document.createElement("ol");

	grid.id = `grid-${i}`;
	grid.className = "game-grid";

	for (let j = 0; j < GRID_SIZE * GRID_SIZE; j++) {
		const cell = document.createElement("li");

		cell.id = `cell-${i}-${j}`;
		grid.append(cell);
	}

	if (i === 0) {
		grid.append(startButton);
	}

	cube.append(grid);
}

const localScore = localStorage.getItem("high-score");

if (localScore) {
	highScore.textContent = localScore;
}

gameOverDialog.addEventListener("close", () => {
	clear();
	toggleGame(false);
});

startButton.addEventListener("click", () => {
	toggleGame(true);
});

let side = FRONT_SIDE;
document.addEventListener("keydown", (event) => {
	if (!Game.isRunning) {
		switch (event.code) {
			case "Space":
				toggleGame(true);
				break;
			case "KeyR":
				if (Game.rotationTimeoutId < 0) {
					side = Math.max((side + 1) % 3, 1);
					rotate(side);
				}

				break;
		}

		return;
	}

	Game.inputQueue.unshift(event.code);
});

document.addEventListener("touchstart", (event) => {
	Game.touchStart = [event.touches[0].clientX, event.touches[0].clientY];
});

document.addEventListener("touchmove", (event) => {
	if (!Game.isRunning) {
		return;
	}

	Game.touchEnd = [event.touches[0].clientX, event.touches[0].clientY];
	const input = processSwipe();

	if (input) {
		Game.inputQueue = [input];
	}
});
