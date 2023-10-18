import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticker-Pad";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
const top = 0;
const left = 0;
document.body.append(canvas);
const ctx = canvas.getContext("2d")!;
const cursor = { active: false, x: left, y: top };
const cursorPaths: { x: number; y: number }[][] = [];
const redoPaths: { x: number; y: number }[][] = [];

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;
  cursorPaths.push([{ x: event.offsetX, y: event.offsetY }]);
});
canvas.addEventListener("mousemove", (event) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
    cursorPaths[cursorPaths.length - 1].push({
      x: event.offsetX,
      y: event.offsetY,
    });
  }
});
canvas.addEventListener("mouseup", (event) => {
  cursor.active = false;
  const drawingEvent = new Event("drawing-changed");
  canvas.dispatchEvent(drawingEvent);
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(top, left, canvas.width, canvas.height);
  for (const path of cursorPaths) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (const point of path) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  cursorPaths.length = 0;
  redoPaths.length = 0;
  ctx.clearRect(top, left, canvas.width, canvas.height);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (cursorPaths.length > 0) {
    redoPaths.push(cursorPaths.pop()!);
    ctx.clearRect(top, left, canvas.width, canvas.height);
    for (const path of cursorPaths) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const point of path) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoPaths.length > 0) {
    cursorPaths.push(redoPaths.pop()!);
    ctx.clearRect(top, left, canvas.width, canvas.height);
    for (const path of cursorPaths) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const point of path) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
});
