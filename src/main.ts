import "./style.css";

const container: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticker-Pad";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
container.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
container.append(canvas);

class DrawingTool {
  context: CanvasRenderingContext2D;
  lineWidth: number;

  constructor(context: CanvasRenderingContext2D, lineWidth: number) {
    this.context = context;
    this.context.strokeStyle = "black";
    this.lineWidth = lineWidth;
  }
}

class DrawingCommand {
  points: { x: number; y: number }[];
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.points = [{ x, y }];
    this.thickness = thickness;
  }

  display(context: CanvasRenderingContext2D) {
    context.lineWidth = this.thickness;
    context.beginPath();
    const { x, y } = this.points[0];
    context.moveTo(x, y);
    for (const { x, y } of this.points) {
      context.lineTo(x, y);
    }
    context.stroke();
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class DrawingPreviewCommand {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 6;
    const yOffset = 4;
    context.font = `${this.thickness * magnitude}px monospace`;
    context.fillText(
      "○",
      this.x - (this.thickness * magnitude) / xOffset,
      this.y + (this.thickness * magnitude) / yOffset
    );
  }
}

class StickerTool {
  points: { x: number; y: number }[];
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.points = [{ x, y }];
    this.sticker = sticker;
  }

  display(context: CanvasRenderingContext2D) {
    const offset = 1;
    const { x, y } = this.points[this.points.length - offset];
    context.fillText(this.sticker, x, y);
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class StickerPreviewTool {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 6;
    const yOffset = 4;
    context.font = `${magnitude}px monospace`;
    context.fillText(
      this.sticker,
      this.x - magnitude / xOffset,
      this.y + magnitude / yOffset
    );
  }
}

const start = 0;
const thin = 2; // Adjusted thin line thickness
const thick = 8; // Adjusted thick line thickness

const ctx = canvas.getContext("2d")!;
const thinDrawingTool = new DrawingTool(ctx, thin);
const thickDrawingTool = new DrawingTool(ctx, thick);
let currentDrawingTool: DrawingTool | null = thinDrawingTool;
let currentTool: Sticker | null = null;

const drawingCommands: (DrawingCommand | StickerTool)[] = [];
const redoCommands: (DrawingCommand | StickerTool)[] = [];

const stickerButtons: Sticker[] = [
  {
    name: "🫥",
    button: createStickerButton("🫥"),
  },
  {
    name: "😾",
    button: createStickerButton("😾"),
  },
  {
    name: "🍵",
    button: createStickerButton("🍵"),
  },
];

function createStickerButton(name: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = name;
  button.addEventListener("click", () => {
    currentTool = { name, button };
    currentDrawingTool = null;
    notify("tool-changed");
  });
  return button;
}

interface Sticker {
  name: string;
  button: HTMLButtonElement;
}

let cursorCommand: DrawingPreviewCommand | StickerPreviewTool | null = null;

const eventBus = new EventTarget();

function notify(eventName: string) {
  eventBus.dispatchEvent(new Event(eventName));
}

function redrawCanvas() {
  ctx.clearRect(start, start, canvas.width, canvas.height);
  drawingCommands.forEach((cmd) => cmd.display(ctx));

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
}

function changeCurrentTool() {
  stickerButtons.forEach(function (tool) {
    tool.button?.classList.remove("selectedTool");
  });
  currentTool?.button.classList.add("selectedTool");
  thickButton?.classList.remove("selectedTool");
  thinButton?.classList.remove("selectedTool");
}

eventBus.addEventListener("drawing-changed", redrawCanvas);
eventBus.addEventListener("tool-moved", redrawCanvas);
eventBus.addEventListener("tool-changed", changeCurrentTool);

let currentDrawingCommand: DrawingCommand | StickerTool | null = null;

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentDrawingTool) {
    cursorCommand = new DrawingPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentDrawingTool.lineWidth
    );
    notify("tool-moved");
  } else if (currentTool) {
    cursorCommand = new StickerPreviewTool(
      e.offsetX,
      e.offsetY,
      currentTool.name
    );
    notify("tool-moved");
  }
});

canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  if (currentDrawingTool) {
    cursorCommand = new DrawingPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentDrawingTool.lineWidth
    );
  } else if (currentTool) {
    cursorCommand = new StickerPreviewTool(
      e.offsetX,
      e.offsetY,
      currentTool.name
    );
  }
  notify("tool-moved");

  if (e.buttons == leftButton) {
    cursorCommand = null;
    if (currentDrawingTool) {
      currentDrawingCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    } else if (currentTool) {
      currentDrawingCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentDrawingTool) {
    currentDrawingCommand = new DrawingCommand(
      e.offsetX,
      e.offsetY,
      currentDrawingTool.lineWidth
    );
    drawingCommands.push(currentDrawingCommand);
  }
  if (currentTool) {
    currentDrawingCommand = new StickerTool(
      e.offsetX,
      e.offsetY,
      currentTool.name
    );
    drawingCommands.push(currentDrawingCommand);
  }
  redoCommands.splice(start, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentDrawingCommand = null;
  notify("drawing-changed");
});

container.append(document.createElement("br"));

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
container.append(thickButton);

thickButton.addEventListener("click", () => {
  currentDrawingTool = thickDrawingTool;
  currentTool = null;
  notify("tool-changed");
  thickButton?.classList.add("selectedTool");
  thinButton?.classList.remove("selectedTool");
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
container.append(thinButton);

thinButton.addEventListener("click", () => {
  currentDrawingTool = thinDrawingTool;
  currentTool = null;
  notify("tool-changed");
  thinButton?.classList.add("selectedTool");
  thickButton?.classList.remove("selectedTool");
});

stickerButtons.forEach(function (tool) {
  container.append(tool.button);
});

const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Create Custom Sticker";
container.append(customStickerButton);

customStickerButton.addEventListener("click", () => {
  const stickerName = prompt("Enter the custom sticker:");
  if (stickerName) {
    const customSticker: Sticker = {
      name: stickerName,
      button: createStickerButton(stickerName),
    };
    stickerButtons.push(customSticker);
    container.insertBefore(customSticker.button, customStickerButton);
  }
});

const exportButton = document.createElement("button");
exportButton.innerHTML = "Export";
container.append(exportButton);

exportButton.addEventListener("click", () => {
  // Create a new canvas for export
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  // Scale the context to fit the larger canvas
  exportCtx.scale(4, 4);

  // Execute all items on the display list against the new canvas
  drawingCommands.forEach((cmd) => {
    if (cmd instanceof DrawingCommand) {
      cmd.display(exportCtx);
    } else if (cmd instanceof StickerTool) {
      cmd.display(exportCtx);
    }
  });

  // Trigger file download as PNG
  const dataURL = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "sticker_export.png";
  link.click();
});

container.append(document.createElement("br"));

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
container.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    drawingCommands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
container.append(undoButton);

undoButton.addEventListener("click", () => {
  if (drawingCommands.length) {
    redoCommands.push(drawingCommands.pop()!);
    notify("drawing-changed");
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
container.append(clearButton);

clearButton.addEventListener("click", () => {
  drawingCommands.splice(start, drawingCommands.length);
  notify("drawing-changed");
});
