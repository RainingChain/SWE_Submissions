//TODO make a class that models the puzzle (+ configs in constructor)

const LOG: boolean = true;

type TileSize = {
  tileIconSize: number;
  playAreaSize: number;
};

type ColorCount = {
  0: number;
  1: number;
  2: number;
};

export type TileSizeOptions = {
  tileIconSize?: number;
  playAreaSize?: number;
};

export type Tile = {
  x: number;
  y: number;
  value: number;
};

export type Move = Tile[];

export enum ELineOrientation {
  ROW,
  COL
}

export class PuzzleModel {
  private _grid: number[][];
  private _initialGrid: number[][];
  private _gridSize: number;
  private _tileSize: TileSize;

  /**
   *
   * @param size Size of the puzzle grid
   * @param tileSize Object that contains the size of the tiles.
   * `tileIconSize` is the size of the icon.
   * `playAreaSize` is the size of the play area (in in game units).
   * You can calculate it by counting the number of terrain tiles the grid needs to take and multiplying it by 32.
   */
  constructor(size: 4 | 6 | 8 | 10 | 12 = 8, tileSize?: TileSizeOptions) {
    let defaultTileSize: TileSize = {tileIconSize: 48, playAreaSize: 20 * 32};
    this._gridSize = size;

    this._tileSize = {...defaultTileSize, ...tileSize};

    // Create a new puzzle
    //TODO make the search for the nex solution more efficient
    this._initialGrid = this.newPuzzle();
    this._grid = PuzzleModel.copyGrid(this._initialGrid);
  }

  /* --------------------------------- Getters -------------------------------- */
  get width() {
    return this._gridSize;
  }

  get height() {
    return this._gridSize;
  }

  get size() {
    return this._gridSize;
  }

  /**
   * Get the size of a puzzle tile
   */
  get tileSize() {
    return this._tileSize.playAreaSize / this.size;
  }

  /**
   * Get the scale of a puzzle tile
   */
  get tileScale() {
    return this.tileSize / this._tileSize.tileIconSize;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Public methods                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Reset the grid to the initial grid
   */
  public resetGrid() {
    this._grid = PuzzleModel.copyGrid(this._initialGrid);
  }

  /**
   * Flip the tile to the next tile type.
   * @param x
   * @param y
   * @param reverse Change the direction (previous tile type instead of next)
   * @returns
   */
  public flipTile(x: number, y: number, reverse?: boolean): number {
    let type = this.getCell(x, y);
    let newType = reverse
      ? this.getPreviousTileType(type)
      : this.getNextTileType(type);
    this.setCell(x, y, newType);
    return newType;
  }

  /**
   * Verify if the current grid is the right solution.
   */
  public verifySolution() {
    // Makes sure the grid contains the initial grid
    for (let i = 0; i < this._grid.length; i++) {
      for (let j = 0; j < this._grid[i].length; j++) {
        if (
          this._initialGrid[i][j] != 0 &&
          this._initialGrid[i][j] != this._grid[i][j]
        ) {
          return false;
        }
      }
    }

    // Check the grid is a solution
    return this.verifyGrid(this._grid);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Tile utils                                 */
  /* -------------------------------------------------------------------------- */
  // Utils functions for tiles

  private getNextTileType(currentType: number): number {
    return (currentType + 1) % 3;
  }

  private getPreviousTileType(currentType: number): number {
    return (currentType - 1 + 3) % 3;
  }

  private static invertTileType(currentType: number): number {
    switch (currentType) {
      case 0:
        return 0;
      case 1:
        return 2;
      case 2:
        return 1;
      default:
        return 0;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Grid generation                              */
  /* -------------------------------------------------------------------------- */
  // util functions used to generate grids

  /**
   * Creates a new grid filled with empty tiles.
   */
  private createGrid(): number[][] {
    let grid: number[][] = [];
    for (let i = 0; i < this._gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < this._gridSize; j++) grid[i][j] = 0;
    }
    return grid;
  }

  /**
   * Copy the given grid
   * @param grid
   * @returns
   */
  private static copyGrid(grid: number[][]): number[][] {
    let newGrid: number[][] = [];
    for (let i = 0; i < grid.length; i++) {
      newGrid[i] = [];
      for (let j = 0; j < grid[i].length; j++) newGrid[i][j] = grid[i][j];
    }
    return newGrid;
  }

  /**
   * Create a new grid that has a solution.
   */
  private newPuzzle(): number[][] {
    let grid: number[][];
    // Create a random grid and make sure the grid can be completed
    do {
      grid = this.createGrid();

      // generate less than size * 2? 2.5? 3? tiles at the start
      // TODO fine tune the amount of tiles to create for each size
      let nbRandomTiles =
        Math.floor(this.size * 1.5) + Math.floor(Math.random() * this.size * 2);
      let randomCoords = this.getRandomCells(nbRandomTiles);

      // Change the rando tiles into a color
      randomCoords.forEach((coords) => {
        grid[coords[1]][coords[0]] = 1 + Math.floor(Math.random() * 2);
      });
    } while (!this.hasSolution(grid));

    return grid;
  }

  /**
   * Returns the x and y coords of a number of random cell
   */
  private getRandomCells(nbRandomCells: number): [number, number][] {
    let randomCells: [number, number][] = [];
    while (randomCells.length < nbRandomCells) {
      const newCell: [number, number] = [
        Math.floor(Math.random() * this.size),
        Math.floor(Math.random() * this.size),
      ];

      const isUnique = randomCells.every(
        (cell) => cell[0] !== newCell[0] || cell[1] !== newCell[1]
      );

      if (isUnique) {
        randomCells.push(newCell);
      }
    }
    return randomCells;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Grid operations                              */
  /* -------------------------------------------------------------------------- */
  // Util functions that do operations on grids

  /**
   * Invert the rows and columns of the grid
   * @param grid
   */
  private static invertGrid(grid: number[][]): number[][] {
    let newGrid: number[][] = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        newGrid[j] ? (newGrid[j][i] = grid[i][j]) : (newGrid[j] = [grid[i][j]]);
      }
    }
    return newGrid;
  }

  /**
   * Get a cell of the current grid, or a specified grid
   * @param x X coord
   * @param y Y coord
   * @param grid Optional grid that will be used instead of the internal grid.
   * @returns
   */
  public getCell(x: number, y: number, grid?: number[][]) {
    return (grid ?? this._grid)[y][x];
  }

  /**
   * Set a cell of the current grid, or a specified grid
   * @param x X coord
   * @param y Y coord
   * @param value Value to set the grid cell to.
   * @param grid Optional grid that will be used instead of the internal grid.
   */
  private setCell(x: number, y: number, value: number, grid?: number[][]) {
    (grid ?? this._grid)[y][x] = value;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Grid verification                             */
  /* -------------------------------------------------------------------------- */
  // Util functions that are used to verify that a grid is a valid solution

  /**
   * TODO could be worth it to optimize
   * TODO test
   * Verify if the grid is a valid solution to the problem.
   * @param grid Grid to check
   */
  private verifyGrid(grid: number[][]) {
    // rules
    // all cells needs to be filled
    // three cells with the same color next to each other in a row or column isn't allowed
    // Each colors appears the same numbers of times in rows and columns.
    // each row/column is unique

    // console.log(grid);

    // Check if all cells in the row are filled
    if (grid.some((row) => row.some((cell) => cell === 0))) {
      console.log("grid not filled");
      return false;
    }

    return this.checkRules(grid);

    /**
     * TODO old
     * Checks the rules for one orientation (rows or columns).
     * If you want to check the rows, the grid needs to be a list of rows. If you want to check columns, invert the grid to have a list of columns
     * @param grid List of lines (rows or columns)
     * @returns
     */
    function checkRulesOrientation(grid: number[][]): boolean {
      const numLines = grid.length;
      const lineSet = new Set();

      for (let line = 0; line < numLines; line++) {
        let consecutiveCount = 0;
        let color1Count = 0;
        let color2Count = 0;
        for (let i = 0; i < grid[line].length; i++) {
          // Check if we have max 2 consecutive colors
          if (i == 0) {
            consecutiveCount = 1;
          } else if (grid[line][i] === grid[line][i - 1]) {
            consecutiveCount++;
            if (consecutiveCount > 2) {
              console.log("consecutive colors");
              return false;
            }
          } else {
            consecutiveCount = 1;
          }

          // Count the occurrences of each color
          if (grid[line][i] === 1) {
            color1Count++;
          } else {
            color2Count++;
          }
        }

        // Check if we have the same number of occurrences for the 2 colors
        if (color1Count !== color2Count) {
          console.log("color count");
          return false;
        }

        // Check if the line is unique
        const lineString = grid[line].join("");
        if (lineSet.has(lineString)) {
          console.log("Line not unique");
          return false;
        }
        lineSet.add(lineString);
      }

      return true;
    }
  }

  /**
   * TODO test
   * Checks if the provided grid breaks any rule. 
   * (Doesn't check that the grid is full and will work if the grid is not complete)
   * @param grid 
   * @returns 
   */
  private checkRules(grid: number[][]): boolean {
    const numLines = grid.length;
    let invert: boolean = false;

    do {
      const lineSet = new Set();
      for (let i = 0; i < numLines; i++) {
        let consecutiveCount: ColorCount = {0:0, 1:0, 2:0};
        let lineColorCount: ColorCount = {0:0, 1:0, 2:0};
        
        let line: number[] = [];
        
        for (let j = 0; j < numLines; j++) {
          line.push(invert ? this.getCell(j, i, grid) : this.getCell(i, j, grid));
        
          // Check if we have max 2 consecutive colors
          // For that, we check an interval of 3 cells, if any interval is all the same color, the rule is broken
          consecutiveCount[line[j]]++;
          if (j >= 3) {
            // Remove the cell that is now outside the interval
            consecutiveCount[line[j-3]]--;
          }
          // check the nb of consecutive colors
          if (consecutiveCount[1] > 2 || consecutiveCount[2] > 2) {
            if (LOG) console.log("consecutive colors");
            return false;
          }
          
          // Count the occurrences of each color
          lineColorCount[line[j]]++
        }
        
        // Check full line rules
        if (lineColorCount[0] == 0) {
          // Check if we have the same number of occurrences for the 2 colors in a full line
          if (lineColorCount[1] !== lineColorCount[2]) {
            if (LOG) console.log("color count");
            return false;
          }
          
          // Check if the line is unique
          const lineString = line.join("");
          if (lineSet.has(lineString)) {
            if (LOG) console.log("line not unique");
            return false;
          }
          lineSet.add(lineString);
        }
      }

      // Do the checks for the other direction
      invert = !invert;
    } while (invert)
    return true;
  }

  /* -------------------------------------------------------------------------- */
  /*                                Grid solution                               */
  /* -------------------------------------------------------------------------- */
  // Util functions that are used to find the solution to a grid

  /**
   * TODO optimize
   * Solve all moves we find instead of only one at a time
   * After we apply the moves, check if the grid is still valid
   * 
   * Find if the grid has a solution. Returns false if the solution doesn't exist, true if it does
   * @param grid Grid to solve
   */
  private hasSolution(grid: number[][]): boolean {
    let solution = PuzzleModel.copyGrid(grid);

    // Solve step by step
    while (this.solveNextMove(solution)) {}

    // check if the solution found is valid
    return this.verifyGrid(solution);
  }

  //! change to private after tests
  /**
   * Solves 1 move for the grid (mutate the grid).
   * @param grid
   * @returns If a move was found
   */
  public solveNextMove(grid?: number[][]): boolean {
    let solution = grid ?? this._grid;

    let move: Move | null = this.findNextMove(solution);
    if (move) {
      move.forEach((tile) => {
        this.setCell(tile.x, tile.y, tile.value, solution);
      });
      return true;
    }
    return false;
  }

  /**
   * TODO finish
   * Find the next move. The move is determined by following the basic rules of the game.
   * We will not find moves that require more complicated strategies.
   * @param grid
   * @returns
   */
  private findNextMove(grid: number[][]): Move | null {
    // Finds the next move(s) to do.
    // Sometimes, a move can be more than 1 tile (ex: 2 tiles of the same colors means the 2 tiles on both sides needs to be flipped)
    let invertedGrid = PuzzleModel.invertGrid(grid);

    // we do both rows and columns at the same time

    // Find patterns (0xx0 and x0x)
    for (let i = 0; i < grid.length; i++) {
      // Rows
      let move = this.findMovesPattern(grid[i], "row", i);
      if (move) {
        return move;
      }
      // Columns
      move = this.findMovesPattern(invertedGrid[i], "col", i);
      if (move) {
        return move;
      }
    }

    // Find color imbalance (one color has all its colors and there are empty tiles)
    for (let i = 0; i < grid.length; i++) {
      // Rows
      let move = this.findMovesColorImbalance(grid[i], "row", i);
      if (move) {
        return move;
      }
      // Columns
      move = this.findMovesColorImbalance(invertedGrid[i], "col", i);
      if (move) {
        return move;
      }
    }

    // Find a line that is similar to another and can be found using the rule that lines needs to be unique (only 2 empty tiles and every other tiles are the same as another line)
    // (do we do only compare 2 lines, or can we compare any number of lines?)
    for (let i = 0; i < grid.length; i++) {
      // Rows
      let move = this.findMovesSimilarLine(grid, "row");
      if (move) {
        return move;
      }
      // Columns
      move = this.findMovesSimilarLine(invertedGrid, "col");
      if (move) {
        return move;
      }
    }

    // If we haven't found any moves, the grid is either complete or "impossible"
    return null;
  }

  /**
   * Find if we have a pattern 0xx0 or x0x and return the moves we know are valid.
   * @param line Line to evaluate
   * @param direction if the line is a column or a row
   * @param position the position of the line in the grid
   * @returns
   */
  private findMovesPattern(
    line: number[],
    direction: "row" | "col",
    linePosition: number
  ): Move | null {
    let moves: Move[] = [];
    // the patterns we want to find are 0xx0 (or xx0, 0xx) and x0x
    // all these patterns can be reduced to:
    //    in a group of 3 adjacent cells
    //      if there are 2 cells of a color and one that is empty
    //        set the empty cell to the other color
    // we can use a sliding window for that

    let colors: ColorCount = {0: 0, 1: 0, 2: 0};

    // Calculate the number of each colors for the first window
    colors[line[0]]++;
    colors[line[1]]++;
    colors[line[2]]++;

    if (checkColorsPattern(colors)) {
      return createMovesPattern(2, line);
      // moves.push(createMovesPattern(2, line));
    }

    let sizeWindow = 3;
    for (let i = sizeWindow; i < line.length; i++) {
      // Add next cell
      colors[line[i]]++;
      // remove previous cell
      colors[line[i - sizeWindow]]--;

      if (checkColorsPattern(colors)) {
        return createMovesPattern(i, line)
        // moves.push(createMovesPattern(i, line));
      }
    }
    return null;
    // return moves;

    /* ----------------------------- Util functions ----------------------------- */
    /**
     * Check if we have 1 empty and 2 of 1 color
     * @param colors
     */
    function checkColorsPattern(colors: ColorCount): boolean {
      return colors[0] == 1 && (colors[1] == 2 || colors[2] == 2);
    }

    /**
     * Create a move from the pattern. (We assume we have 1 empty and 2 of 1 color in the window)
     * @param position Position of the head of the window
     * @param colors
     */
    function createMovesPattern(position: number, line: number[]): Move {
      // checks xx0
      if (line[position - 2] == line[position - 1]) {
        return PuzzleModel.createMoveForLine(direction, linePosition, [
          [position, PuzzleModel.invertTileType(line[position - 2])],
        ]);
      }
      // checks x0x
      else if (line[position - 2] == line[position]) {
        return PuzzleModel.createMoveForLine(direction, linePosition, [
          [position - 1, PuzzleModel.invertTileType(line[position - 2])],
        ]);
      }
      // checks 0xx
      else {
        let value = PuzzleModel.invertTileType(line[position]);
        let moves: [position: number, value: number][] = [
          [position - 2, value],
        ];
        if (position + 1 < line.length && line[position + 1] == 0) {
          moves.push([position + 1, value]);
        }

        return PuzzleModel.createMoveForLine(direction, linePosition, moves);
      }
    }
  }

  /**
   * Find if the line has all of one of its colors and has empty spaces, then return a move to fill the spaces with the correct color
   * @param line
   * @param direction
   * @param linePosition
   * @returns
   */
  private findMovesColorImbalance(
    line: number[],
    direction: "row" | "col",
    linePosition: number
  ): Move | null {
    // Count the nb of each colors
    let colors: ColorCount = {0: 0, 1: 0, 2: 0};
    line.forEach((cell) => colors[cell]++);

    // If a color has reached the limit, the rest of the tiles are the other color
    let nbColors = line.length / 2;
    let bigestColor = colors[1] >= colors[2] ? 1 : 2;

    if (colors[0] > 0 && colors[bigestColor] == nbColors) {
      let moves: [position: number, value: number][] = [];

      line.forEach((cell, position) => {
        if (cell == 0) {
          moves.push([position, PuzzleModel.invertTileType(bigestColor)]);
        }
      });

      return PuzzleModel.createMoveForLine(direction, linePosition, moves);
    }
    return null;
  }

  /**
   * Find a line that has 2 empty spaces and that is also similar to a completed line.
   * It then completes the line so it is different from the other.
   * Ex: 001122 and 121122 will create the moves (x: 0, y:0, value:2) (x: 1, y:0, value:1) so that the 2 lines are not identical
   * @param grid
   * @param direction
   * @returns
   */
  private findMovesSimilarLine(
    grid: number[][],
    direction: "row" | "col"
  ): Move | null {
    let fullLines: number[] = [];
    let potentialLines: number[] = [];

    grid.forEach((line, i) => {
      let colorCount: ColorCount = {0: 0, 1: 0, 2: 0};
      line.forEach((cell) => colorCount[cell]++);
      if (colorCount[0] == 0) {
        fullLines.push(i);
      } else if (colorCount[0] == 2) {
        potentialLines.push(i);
      }
    });

    // Now we have our potential lines, we need to see if they are similar
    let similar: [potential: number, full: number] | undefined;
    for (let potential of potentialLines) {
      for (let full of fullLines) {
        // Similar lines means that for all tiles except empty tiles, the tiles have the same value
        if (
          grid[potential].every((cell, i) => cell == 0 || grid[full][i] == cell)
        ) {
          similar = [potential, full];
          break;
        }
      }
    }

    // We didn't any find similar lines
    if (similar == null) {
      return null;
    }

    // We create moves to replace the empty spaces of the similar line to the inverse of the full line
    let moves: [position: number, value: number][] = [];
    grid[similar[0]].forEach((_, i) => {
      moves.push([i, PuzzleModel.invertTileType(grid[similar[1]][i])]);
    });

    return PuzzleModel.createMoveForLine(direction, similar[0], moves);
  }

  /**
   * Maps the given moves in the line to tiles in the grid.
   * @param lineDirection The direction of the line (row or col)
   * @param linePosition The position in the grid the line has
   * @param moves List of moves to create. A move is a position on the line and a value.
   * @returns
   */
  private static createMoveForLine(
    lineDirection: "row" | "col",
    linePosition: number,
    moves: [position: number, value: number][]
  ): Move {
    return moves.map((move) => {
      return {
        x: lineDirection == "row" ? move[0] : linePosition,
        y: lineDirection == "col" ? move[0] : linePosition,
        value: move[1],
      };
    });
  }

  // createGrid(key:PKey): number[][]{
  // 	let array:number[][] = [];
  // 	for(let i = 0 ; i < 7; i++){
  // 	  array[i] = [];
  // 	  for(let j = 0 ; j < 7; j++)
  // 		array[i][j] = 0;
  // 	}
  // 	// let challengeActive = s.isChallengeActive(key,CHALLENGE.threeStates);
  // 	for(let i = 0 ; i < 20; i++){
  // 	  this.newGrid_flipRandomly(array, /*challengeActive*/ false);
  // 	}
  // 	return array;
  //   }
  //   newGrid_flipRandomly(array:number[][],challengeActive:boolean){
  // 	let x = Math.floor(Math.random()*7);
  // 	let y = Math.floor(Math.random()*7);

  // 	let base = challengeActive ? 3 : 2;

  // 	if(array[y] && array[y][x] !== undefined)
  // 	  array[y][x] = (array[y][x] - 1 + base) % base;

  // 	if(array[y-1] && array[y-1][x] !== undefined)
  // 	  array[y-1][x] = (array[y-1][x] - 1 + base) % base;

  // 	if(array[y+1] && array[y+1][x] !== undefined)
  // 	  array[y+1][x] = (array[y+1][x] - 1 + base) % base;

  // 	if(array[y] && array[y][x-1] !== undefined)
  // 	  array[y][x-1] = (array[y][x-1] - 1 + base) % base;

  // 	if(array[y] && array[y][x+1] !== undefined)
  // 	  array[y][x+1] = (array[y][x+1] - 1 + base) % base;
  //   }
  //   testComplete(key:PKey){
  // 	let val1 = s.getNpcByTag(key,MAP.map1,{[TAG.tileType]:1});
  // 	let val2 = s.getNpcByTag(key,MAP.map1,{[TAG.tileType]:2});

  // 	if(!val1 && !val2){
  // 	  // s.stopChrono(key,LABEL.timer);
  // 	  // if(s.isChallengeActive(key,CHALLENGE.speedrun))
  // 		// s.stopChrono(key,LABEL.Cspeedrun);
  // 	  s.completeQuest(key, s.isFirstCompletion(key) ? 25 * 2 : 15);
  // 	}
  //   }
  public static testVerifyGrid() {
    let model = new PuzzleModel(6);
    function logFail(name: string) {
      console.log("\u001b[31m" + "FAIL: " + name);
    }
    let name, grid;

    //TODO test all sizes?
    // It seems to work. Might need a little bit more testing for edge cases

    // We don't have to test the columns because they use the same function and the function to invert the grid has been tested
    name = "Valid grid";
    grid = [
      [2, 1, 2, 1, 1, 2],
      [1, 2, 1, 1, 2, 2],
      [2, 1, 1, 2, 2, 1],
      [1, 2, 2, 1, 1, 2],
      [1, 2, 1, 2, 2, 1],
      [2, 1, 2, 2, 1, 1],
    ];
    if (!model.verifyGrid(grid)) logFail(name);

    name = "Invalid grid row, too many adjacent color"; // Error at 0,3
    grid = [
      [2, 2, 1, 1, 1, 2],
      [1, 2, 1, 1, 2, 2],
      [2, 1, 1, 2, 2, 1],
      [1, 2, 2, 1, 1, 2],
      [1, 2, 1, 2, 2, 1],
      [2, 1, 2, 2, 1, 1],
    ];
    if (model.verifyGrid(grid)) logFail(name);

    name = "Invalid grid row, colors unbalanced"; // Error at 0,4
    grid = [
      [2, 1, 2, 2, 1, 2],
      [1, 2, 1, 1, 2, 2],
      [2, 1, 1, 2, 2, 1],
      [1, 2, 2, 1, 1, 2],
      [1, 2, 1, 2, 2, 1],
      [2, 1, 2, 2, 1, 1],
    ];
    if (model.verifyGrid(grid)) logFail(name);

    name = "Invalid grid row, identical rows"; // Rows 0 and 1 are not uniques
    grid = [
      [2, 1, 2, 1, 1, 2],
      [2, 1, 2, 1, 1, 2],
      [1, 2, 1, 2, 2, 1],
      [1, 2, 2, 1, 1, 2],
      [2, 1, 1, 2, 2, 1],
      [2, 1, 2, 2, 1, 1],
    ];
    if (model.verifyGrid(grid)) logFail(name);

    name = "Invalid grid, not filled"; // Error at 0,3
    grid = [
      [2, 1, 0, 2, 1, 2],
      [1, 2, 1, 1, 2, 2],
      [2, 1, 1, 2, 2, 1],
      [1, 2, 2, 1, 1, 2],
      [1, 2, 1, 2, 2, 1],
      [2, 1, 2, 2, 1, 1],
    ];
    if (model.verifyGrid(grid)) logFail(name);

  }

  public static testSolveNextMove() {
    let model = new PuzzleModel(8);
    while (model.solveNextMove()) {}
  }
}

PuzzleModel.testVerifyGrid();
// PuzzleModel.testSolveNextMove();

/*
player starts the quest. ✅
player gets to the puzzle map. ✅
	TODO make a real map for the puzzle

create a new valid puzzle, save the solution
	TODO
When the player click a tile, change the tile's type (in the model and in the game)
	? I think its done?
The player can activate a lever to submit the solution
	The model verify the solution (Model.verifySolution())
	if valid
		finish quest
	else
		punish player? show error? reset?














On complete, what do we do?
	a lever to submit the solution?




add symbol to show which tiles are from the puzzle and which one can be changed
	sprite, image inside the tile?
		CST.ICON.padlockLocked
		add a method EVENT.setTileSprite(eid, type:ETileType, locked:boolean)




what kind of challenges can we do? What stats do we need to keep track of?
  speedrun
  larger puzzle (size 8?)
  hardest puzzle (size 12?)
  no empty squares (no tile can be empty)
  no hints
  puzzle run (multiple puzzles, becoming harder and harder)






if the puzzle is too complicated, we could keep a list of recently updated tiles and then check after modifications and update them (then removing them from the list)
	something like E.updateTiles(tiles: ...)

*/
