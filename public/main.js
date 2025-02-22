const GRID_SIZE = 32;
const UINT_ARRAY_SIZE = (GRID_SIZE * GRID_SIZE) / 8;
const TICK_TIMEOUT = 200;

const MaxPointIncreaseThreshold = new Set([5, 10, 20, 30, 50, 75]);

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
Game.inputBlockTimeoutId = -1;
Game.frameTimeoutId = -1;
Game.frameId = -1;
Game.direction = TOP;
Game.pointCount = 0;
Game.maxPointCount = 1;

/** @type {[x: number, y: number][]} */
Game.snakePositions = [];

/** @type {[x: number, y: number]} */
Game.snakePreviousPosition = [0, 0];

/**
 * @returns {void}
 */
function Game() {
	console.info("Starting the game...");
	clear();

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
	clearTimeout(Game.inputBlockTimeoutId);

	Game.frameId = -1;
	Game.frameTimeoutId = -1;
	Game.inputBlockTimeoutId = -1;
}

/**
 * @returns {void}
 */
function tick() {
	update();
	render();

	if (Game.isOver) {
		cancelFrame();
		clear();

		const score = Game.snakePositions.length.toString();

		localStorage.setItem("last-score", score);

		gameScore.textContent = score;
		lastScore.textContent = score;

		gameOverDialog.showModal();
		return;
	}

	if (!Game.isRunning) {
		console.info("Stopping the game...");

		cancelFrame();
		clear();
		render();

		return;
	}

	Game.frameTimeoutId = setTimeout(() => {
		Game.frameId = requestAnimationFrame(tick);
	}, TICK_TIMEOUT);
}

/**
 * @returns {void}
 */
function update() {
	const headPosition = Game.snakePositions[0];

	if (headPosition[0] === 0) {

		rotate(LEFT_SIDE);
		headPosition[0] = GRID_SIZE - 1;

	} else if (headPosition[0] === GRID_SIZE - 1) {

		rotate(RIGHT_SIDE);
		headPosition[0] = 0;

	} else if (headPosition[1] === 0) {

		rotate(TOP_SIDE);
		headPosition[1] = GRID_SIZE - 1;

	} else if (headPosition[1] === GRID_SIZE - 1) {

		rotate(BOTTOM_SIDE);
		headPosition[1] = 0;

	}

	move();

	if (Game.isOver) {
		return;
	}

	spawnPoint();
}

/**
 * @returns {void}
 */
function move() {
	const pointPosition = moveHead();

	for (let i = 1; i < Game.snakePositions.length; i++) {
		moveBody(i);
	}

	if (pointPosition) {
		Game.snakePositions.push([...Game.snakePreviousPosition]);

		if (MaxPointIncreaseThreshold.has(Game.snakePositions.length)) {
			Game.maxPointCount++;
		}

		set(point, ...Game.snakePositions[0], false);
		Game.pointCount--;
	}
}

/**
 * @returns {boolean} whether got a point.
 */
function moveHead() {
	const position = Game.snakePositions[0];

	set(snake, ...position, false);

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

	set(snake, ...position, true);

	return get(point, ...position);
}

/**
 * @param {number} index
 * @returns {void}
 */
function moveBody(index) {
	const current = Game.snakePositions[index];

	const currentCopy = [...current];

	set(snake, ...current, false);

	current[0] = Game.snakePreviousPosition[0];
	current[1] = Game.snakePreviousPosition[1];

	set(snake, ...current, true);

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

			set(point, x, y, true);
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
	cube.style.transition = "transform ease-in 1s";

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

	setTimeout(() => {
		cube.style.transformOrigin = "center"
		cube.style.transition = "none";
		cube.style.transform = "";
	}, 1_150);
}

/**
 * @returns {void}
 */
function render() {
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			for (let z = 0; z < BACK_SIDE + 1; z++) {
				const cell = /** @type {HTMLElement} */ (document.getElementById(`cell-${z}-${y * GRID_SIZE + x}`));

				if (get(snake, x, y)) {
					cell.className = "snake";
					cell.dataset.snake = Game.snakePositions[0][0] === x && Game.snakePositions[0][1] === y ? "head" : "body";
					cell.dataset.direction = Game.direction === TOP ? "top" : Game.direction === RIGHT ? "right" : Game.direction === BOTTOM ? "bottom" : "left";
				} else if (get(point, x, y)) {
					cell.className = "point";
				} else {
					cell.className = "";
				}
			}
		}
	}
}

/**
 * @returns {void}
 */
function clear() {
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			set(snake, x, y, false);
			set(point, x, y, false);
		}
	}
}

/**
 * @returns {void}
 */
function blockInput() {
	Game.inputBlockTimeoutId = setTimeout(() => {
		Game.inputBlockTimeoutId = -1;
	}, TICK_TIMEOUT * 0.5);
}

/**
 * @param {Uint8Array} state
 * @param {number} x
 * @param {number} y
 * @param {boolean} toggle
 * @returns {void}
 */
function set(state, x, y, toggle) {
	const [index, bit] = getCellBitIndex(x, y);

	if (toggle) {
		state[index] |= 1 << bit; // Set the bit
	} else {
		state[index] &= ~(1 << bit); // Clear the bit
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

const gameOverDialog = /** @type {HTMLDialogElement} */ (document.getElementById("game-over-dialog"));
const lastScore = /** @type {HTMLElement} */ (document.getElementById("last-score"));
const gameScore = /** @type {HTMLElement} */ (document.getElementById("game-score"));
const startButton = /** @type {HTMLButtonElement} */ (document.getElementById("start-button"));
const cube = /** @type {HTMLDivElement} */ (document.getElementById("cube"));

const localScore = localStorage.getItem("last-score");

if (localScore) {
	lastScore.textContent = localScore;
}

gameOverDialog.addEventListener("close", () => {
	render();
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
				side = (side + 1) % 6;
				rotate(side);
				break;
		}

		return;
	}

	if (Game.inputBlockTimeoutId > 0) {
		return;
	}

	switch (event.code) {
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

	blockInput();
});
