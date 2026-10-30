/**
 * Agent Computer Control JavaScript SDK.
 * Requires the local server to be running and an API key.
 */
export class ComputerControl {
  constructor({ baseUrl = "http://127.0.0.1:3210", apiKey, fetchImpl = fetch } = {}) {
    if (!apiKey || typeof apiKey !== "string") throw new TypeError("ComputerControl requires { apiKey }");
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.fetch = fetchImpl;
  }

  async request(path, { method = "GET", body } = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      throw error;
    }
    return data;
  }

  status() { return this.request("/v1/status"); }
  enable() { return this.request("/v1/control/enable", { method: "POST", body: {} }); }
  disable() { return this.request("/v1/control/disable", { method: "POST", body: {} }); }

  moveMouse(x, y) {
    return this.request("/v1/mouse/move", { method: "POST", body: { x, y } });
  }
  click({ x, y, button = "left" } = {}) {
    const body = { button };
    if (x !== undefined) body.x = x;
    if (y !== undefined) body.y = y;
    return this.request("/v1/mouse/click", { method: "POST", body });
  }
  scroll(amount) {
    return this.request("/v1/mouse/scroll", { method: "POST", body: { amount } });
  }
  typeText(text) {
    return this.request("/v1/keyboard/type", { method: "POST", body: { text } });
  }
  pressKey(key) {
    return this.request("/v1/keyboard/press", { method: "POST", body: { key } });
  }
  navigate(url) {
    return this.request("/v1/browser/navigate", { method: "POST", body: { url } });
  }
}

export function createComputerControl(options) {
  return new ComputerControl(options);
}
