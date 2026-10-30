# Agent Computer Control API v1

Base URL: `http://127.0.0.1:3210`

Every endpoint requires `Authorization: Bearer <API\_KEY>`. JSON endpoints use `Content-Type: application/json`.

## Authentication and safety

* API listens only on `127.0.0.1` by default.
* A unique API key of at least 24 characters is required to start.
* Input is disabled on startup. Call `POST /v1/control/enable` only after the user authorizes control.
* Call `POST /v1/control/disable` when finished.
* Do not expose this server to the public internet or an untrusted network.
* Actions are rate-limited and request bodies are size-limited.

## Endpoints

### `GET /v1/status`

Returns enabled state, platform, screen dimensions, API version and base URL.

### `POST /v1/control/enable`

Enables mouse and keyboard commands. Body: `{}`.

### `POST /v1/control/disable`

Disables mouse and keyboard commands. Body: `{}`.

### `POST /v1/mouse/move`

Body: `{"x":640,"y":360}`. Screen coordinates start at top-left.

### `POST /v1/mouse/click`

Body: `{"x":640,"y":360,"button":"left"}`. Coordinates optional. Button: `left`, `right`, `middle`.

### `POST /v1/mouse/scroll`

Body: `{"amount":5}`. Positive scrolls down, negative scrolls up; range -20 to 20.

### `POST /v1/keyboard/type`

Body: `{"text":"Hello"}`. Up to 2,000 characters per request.

### `POST /v1/keyboard/press`

Body: `{"key":"ENTER"}`. Supported: `ENTER`, `TAB`, `ESC`, `SPACE`, `BACKSPACE`, `DELETE`, `UP`, `DOWN`, `LEFT`, `RIGHT`, `HOME`, `END`, `PAGEUP`, `PAGEDOWN`, `CTRL`, `SHIFT`, `ALT`, `META`.

### `POST /v1/browser/navigate`

Body: `{"url":"https://example.com"}`. Uses keyboard shortcuts to navigate the currently focused browser; it does not directly control tabs or inspect the DOM.

## curl examples

```bash
curl http://127.0.0.1:3210/v1/status \\
  -H "Authorization: Bearer YOUR\_API\_KEY"

curl -X POST http://127.0.0.1:3210/v1/control/enable \\
  -H "Authorization: Bearer YOUR\_API\_KEY" \\
  -H "Content-Type: application/json" -d '{}'

curl -X POST http://127.0.0.1:3210/v1/mouse/move \\
  -H "Authorization: Bearer YOUR\_API\_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"x":640,"y":360}'

curl -X POST http://127.0.0.1:3210/v1/control/disable \\
  -H "Authorization: Bearer YOUR\_API\_KEY" \\
  -H "Content-Type: application/json" -d '{}'
```

## JavaScript SDK

```js
import { ComputerControl } from "./sdk/index.js";

const computer = new ComputerControl({
  baseUrl: "http://127.0.0.1:3210",
  apiKey: process.env.CONTROL\_API\_KEY
});

console.log(await computer.status());
await computer.enable();
try {
  await computer.moveMouse(640, 360);
  await computer.click({ x: 640, y: 360, button: "left" });
  await computer.typeText("Hello");
  await computer.pressKey("ENTER");
} finally {
  await computer.disable();
}
```

The SDK runs in Node.js. A remote agent on another machine cannot reach the PC's `127.0.0.1`; for remote agents, use a separately secured tunnel/gateway rather than exposing this service directly.

