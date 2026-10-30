import { ComputerControl } from "../sdk/index.js";

const computer = new ComputerControl({
  baseUrl: "http://127.0.0.1:3210",
  apiKey: process.env.CONTROL_API_KEY
});

console.log("Status:", await computer.status());

// Control is disabled by default. Enable only after the user authorizes the task.
await computer.enable();
try {
  await computer.moveMouse(640, 360);
  await computer.click({ button: "left" });
  await computer.typeText("Hello from my AI agent");
  await computer.pressKey("ENTER");
  // Optional: navigate a focused Chrome window.
  // await computer.navigate("https://example.com");
} finally {
  await computer.disable();
  console.log("Remote input disabled.");
}
