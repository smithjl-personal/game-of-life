# The Game of Life

This is a simulation based on a game [John Conway came up with in 1970](https://en.wikipedia.org/wiki/Conway's_Game_of_Life).
There are only four rules that govern the simulation:

1. Any live cell with fewer than two live neighbours dies, as if by underpopulation.
1. Any live cell with two or three live neighbours lives on to the next generation.
1. Any live cell with more than three live neighbours dies, as if by overpopulation.
1. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

# Live Demo

This is deployed to the web and can be played with live [here](https://smithjl-personal.github.io/game-of-life/).
Use the controls on screen to:

-   Draw, erase, and place preset shapes on the grid.
-   Speed up, slow down, or stop the simulation.
-   Step one generation at a time through the simulation.
-   Remove all cells from the grid, or randomly populate them again.
