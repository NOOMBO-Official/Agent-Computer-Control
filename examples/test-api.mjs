const baseUrl = process.env.CONTROL_API_URL || "http://127.0.0.1:3210";
const apiKey = process.env.CONTROL_API_KEY;
if (!apiKey) throw new Error("Set CONTROL_API_KEY before running this example.");
const response = await fetch(`${baseUrl}/v1/status`, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
console.log("HTTP", response.status, await response.json());
