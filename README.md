# Agent Computer Control — HTTP API + JavaScript SDK

This project exposes a localhost-only HTTP API and a small JavaScript SDK for an authorized AI agent to control mouse and keyboard input on Windows. A Chrome extension popup is included as an optional local control panel.

## Requirements
- Windows 10/11
- Node.js 20+
- npm

## Install
1. Extract the ZIP.
2. Open PowerShell in the project directory.
3. Run `npm install`.
4. Set a unique API key and start the server:

```powershell
$env:CONTROL_API_KEY = "replace-this-with-your-own-long-random-secret"
$env:PORT = "3210"
npm start
```

Use a unique secret at least 24 characters long. Keep this terminal open. The server binds to `127.0.0.1` only.

## JavaScript SDK
The SDK is in `sdk/index.js` and is dependency-free on the client side.

```js
import { ComputerControl } from "./sdk/index.js";

const computer = new ComputerControl({
  baseUrl: "http://127.0.0.1:3210",
  apiKey: process.env.CONTROL_API_KEY
});

console.log(await computer.status());
await computer.enable();
try {
  await computer.moveMouse(640, 360);
  await computer.click({ x: 640, y: 360, button: "left" });
  await computer.typeText("Hello from my AI agent");
  await computer.pressKey("ENTER");
} finally {
  await computer.disable();
}
```

See `API.md` for all HTTP endpoints and examples.

## Optional Chrome extension
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `chrome-extension` folder.
5. Enter the same API key in the popup.

## Safety notes
Input is disabled at startup. Enable it only when the user authorizes the task, then disable it when done. Keep the API key secret. The server listens on localhost and should not be exposed directly to the internet. This is an initial starter project; test in a safe environment before connecting an autonomous agent.
