# Snake JS

This is a 3D snake game implemented in JavaScript, HTML, and CSS. The game features a 3D cube environment, bit manipulation for efficient grid representation, and smooth animations using `requestAnimationFrame`.

## Features

* **3D Environment:** The game is played on a 3D cube, adding a unique twist to the classic snake game.
* **Efficient Grid Representation:** Uses bit manipulation with `Uint8Array` for memory-efficient grid storage.
* **Smooth Animations:** Utilizes `requestAnimationFrame` for smooth and performant animations.
* **High Score Tracking:** Stores and displays the high score using local storage.
* **Responsive Controls:** Supports keyboard controls for movement and game actions.
* **Dynamic HTML Generation:** The game grid is generated dynamically using Javascript.
* **Game Pausing:** The game can be paused and resumed.
* **3D Cube Rotation:** The 3d cube rotates when the snake changes planes.

## How to Play

1.  Open the `public/index.html` file in a web browser.
2.  Press the "Start" button to begin the game.
3.  Use the arrow keys (or W, A, S, D) to control the snake's direction.
4.  Eat the points to grow the snake.
5.  Avoid colliding with the snake's body or the edges of the grid.
6.  Press "Escape" to stop the game.
7.  Press "P" to pause/resume the game.
8.  Press "R" before starting the game to rotate the cube to a different starting face.

## Controls

* **Arrow Keys / W, A, S, D:** Move the snake.
* **Space:** Start the game (when not running).
* **Escape:** Stop the game.
* **P:** Pause/Resume the game.
* **R:** Rotate the cube before starting the game.

## Technologies Used

* JavaScript
* HTML
* CSS

## Installation

1.  Clone the repository: `git clone [repository URL]`
2.  Open `public/index.html` in your web browser.

## Future Improvements

* Add game difficulty settings.
* Optimize the `spawnPoint` function.
* Implement more advanced input handling.

---

Documentation assisted by Gemini (Google AI).
