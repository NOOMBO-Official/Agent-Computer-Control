const $ = (id) => document.getElementById(id);
const API = "http://127.0.0.1:3210";
chrome.storage?.local?.get(["apiKey"], ({apiKey}) => { if (apiKey) $("key").value = apiKey; });
async function call(path, method = "GET") {
  const key = $("key").value.trim();
  if (!key) throw new Error("Enter your API key first.");
  const response = await fetch(API + path, { method, headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data;
}
$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({apiKey: $("key").value.trim()});
  $("statusText").textContent = "API key saved in this browser profile.";
});
$("status").addEventListener("click", async () => {
  try { const d = await call("/v1/status"); $("statusText").textContent = `Connected · input ${d.enabled ? "ENABLED" : "disabled"} · ${d.screen.width}×${d.screen.height}`; }
  catch(e) { $("statusText").textContent = `Connection error: ${e.message}`; }
});
$("enable").addEventListener("click", async () => {
  try { const d = await call("/v1/control/enable", "POST"); $("statusText").textContent = d.message; }
  catch(e) { $("statusText").textContent = `Error: ${e.message}`; }
});
$("disable").addEventListener("click", async () => {
  try { const d = await call("/v1/control/disable", "POST"); $("statusText").textContent = `Input ${d.enabled ? "enabled" : "disabled"}.`; }
  catch(e) { $("statusText").textContent = `Error: ${e.message}`; }
});