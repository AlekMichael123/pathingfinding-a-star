import "./style.css";

enum SpaceOccupancy {
  EMPTY,
  FILLED,
  PATH,
}

interface Node {
  i: number;
  j: number;
  fScore: number;
  gScore: number;
  h: number;

  neighbors: Node[];
  previous?: Node;

  wall: SpaceOccupancy;
}

function generateNewPuzzle() {
  return new Promise<void>((r) => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const { width, height } = canvas;

    const n = 80 * 1;
    const DIM = height / n;
    const maze: SpaceOccupancy[][] = [...new Array(n)].map((_) =>
      [...new Array(n)].map((_) =>
        Math.random() > 0.5 ? SpaceOccupancy.EMPTY : SpaceOccupancy.FILLED
      )
    );

    const start = [
      Math.floor(Math.random() * n),
      Math.floor(Math.random() * n),
    ];
    let end = [Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
    while (start[0] === end[0] && start[1] === end[1])
      end = [Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
    maze[start[0]][start[1]] = maze[end[0]][end[1]] = SpaceOccupancy.EMPTY;

    function h(a: Node, b: Node) {
      const d = Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
      return d;
    }
    const nodes: Node[][] = [...new Array(n)].map((_, i) =>
      [...new Array(n)].map((_, j) => createNode(i, j) as Node)
    );
    function createNode(i: number, j: number): Node | null {
      const node = {
        i,
        j,
        fScore: 0,
        gScore: 0,
        h: 0,
        neighbors: new Array<Node>(),
        wall: maze[i][j],
      };

      return node;
    }

    nodes.forEach((row, i) =>
      row.forEach((node, j) => {
        node.h = h(node, nodes[end[0]][end[1]]);
        const directions = [
          [1, 1],
          [1, -1],
          [1, 0],
          [0, 1],
          [0, -1],
          [-1, 1],
          [-1, -1],
          [-1, 0],
        ];

        if (node.wall !== SpaceOccupancy.FILLED)
          for (const [iDir, jDir] of directions) {
            const iOff = i + iDir,
              jOff = j + jDir;
            if (iOff > -1 && iOff < n && jOff > -1 && jOff < n)
              node.neighbors.push(nodes[iOff][jOff]);
          }
      })
    );

    const openSet: Node[] = [nodes[start[0]][start[1]]];
    const openIncludeSet = new Set<Node>();
    const closedSet = new Set<Node>();
    openIncludeSet.add(openSet[0]);

    const path: Node[] = [];
    let success = false;

    function A_Star() {
      if (!openSet.length || success) {
        success = true;
        return;
      }

      openSet.sort((a, b) => (a.h !== b.h ? b.h - a.h : b.fScore - a.fScore));
      const bestMove = openSet.pop() as Node;
      openIncludeSet.delete(bestMove);

      closedSet.add(bestMove);
      const { neighbors } = bestMove;

      if (bestMove.i === end[0] && bestMove.j === end[1]) {
        let curr: Node | undefined = bestMove;
        while (curr) {
          path.push(curr);
          curr = curr.previous;
        }

        success = true;
        return;
      }

      for (const neighbor of neighbors) {
        if (
          !neighbor ||
          closedSet.has(neighbor) ||
          neighbor.wall === SpaceOccupancy.FILLED
        )
          continue;

        let newFoundPath = false;
        const tempGScore = bestMove.gScore + h(neighbor, bestMove);
        if (openIncludeSet.has(neighbor)) {
          if (tempGScore < neighbor.gScore) {
            neighbor.gScore = tempGScore;
            newFoundPath = true;
          }
        } else {
          neighbor.gScore = tempGScore;
          newFoundPath = true;
          openIncludeSet.add(neighbor);
          openSet.push(neighbor);
        }

        if (newFoundPath) {
          neighbor.fScore = neighbor.gScore + neighbor.h;
          neighbor.previous = bestMove;
        }
      }
    }

    function draw() {
      A_Star();
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "grey";
      maze.forEach((row, i) =>
        row.forEach((space, j) =>
          space === SpaceOccupancy.FILLED
            ? ctx.fillRect(i * DIM, j * DIM, DIM, DIM)
            : null
        )
      );

      ctx.fillStyle = "red";
      openSet.forEach((node) =>
        ctx.fillRect(node.i * DIM, node.j * DIM, DIM, DIM)
      );

      ctx.fillStyle = "white";
      closedSet.forEach((node) =>
        ctx.fillRect(node.i * DIM, node.j * DIM, DIM, DIM)
      );

      ctx.fillStyle = "purple";
      path.forEach((node) =>
        ctx.fillRect(node.i * DIM, node.j * DIM, DIM, DIM)
      );

      ctx.fillStyle = "pink";
      ctx.fillRect(start[0] * DIM, start[1] * DIM, DIM, DIM);
      ctx.fillStyle = "green";
      ctx.fillRect(end[0] * DIM, end[1] * DIM, DIM, DIM);

      if (!success) requestAnimationFrame(draw);
      else r();
    }

    requestAnimationFrame(draw);
  });
}

function main() {
  generateNewPuzzle().then(() => setTimeout(() => main(), 5000));
}

window.addEventListener("load", main);
