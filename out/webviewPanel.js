"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusWebviewPanel = void 0;
const vscode = require("vscode");
class FocusWebviewPanel {
    constructor(extensionUri, actions) {
        this.extensionUri = extensionUri;
        this.actions = actions;
        this.disposables = [];
    }
    show(initialState) {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            this.update(initialState);
            return;
        }
        this.panel = vscode.window.createWebviewPanel("focusModeDashboard", "Focus Mode Dashboard", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [this.extensionUri]
        });
        this.panel.webview.html = this.getHtml();
        this.disposables.push(this.panel.onDidDispose(() => {
            this.panel = undefined;
        }), this.panel.webview.onDidReceiveMessage((msg) => {
            switch (msg.command) {
                case "start":
                    this.actions.onStart();
                    break;
                case "pause":
                    this.actions.onPause();
                    break;
                case "stop":
                    this.actions.onStop();
                    break;
                default:
                    break;
            }
        }));
        this.update(initialState);
    }
    update(state) {
        if (!this.panel) {
            return;
        }
        void this.panel.webview.postMessage({
            type: "state",
            payload: state
        });
    }
    dispose() {
        this.panel?.dispose();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
    getHtml() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Focus Mode</title>
  <style>
    :root {
      --bg: #f4efe9;
      --surface: #fff8f1;
      --text: #2f261f;
      --muted: #71665d;
      --primary: #d14f3f;
      --primary-strong: #b53a2b;
      --ring: #f3cbbf;
    }

    body {
      margin: 0;
      padding: 24px;
      font-family: Georgia, "Times New Roman", serif;
      background: radial-gradient(circle at top right, #ffe8dc, var(--bg));
      color: var(--text);
    }

    .card {
      max-width: 720px;
      border-radius: 16px;
      background: var(--surface);
      padding: 24px;
      box-shadow: 0 12px 30px rgba(20, 10, 5, 0.12);
      border: 1px solid #efd6cb;
    }

    h1 {
      margin: 0 0 8px;
      letter-spacing: 0.02em;
    }

    p {
      margin: 0;
      color: var(--muted);
    }

    .timer {
      margin-top: 20px;
      font-size: 40px;
      font-weight: 700;
    }

    .stats {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
    }

    .stat {
      background: #fff;
      border: 1px solid #edd2c6;
      border-radius: 12px;
      padding: 12px;
    }

    .label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    .value {
      margin-top: 4px;
      font-size: 20px;
      font-weight: 700;
    }

    .actions {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    button {
      border: none;
      border-radius: 999px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: white;
      background: var(--primary);
      transition: transform 120ms ease, background 120ms ease;
    }

    button:hover {
      background: var(--primary-strong);
      transform: translateY(-1px);
    }

    button:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Focus Mode Dashboard</h1>
    <p>Track your sessions and keep the streak alive.</p>

    <div class="timer" id="timer">🍅 25:00</div>

    <div class="stats">
      <div class="stat">
        <div class="label">Status</div>
        <div class="value" id="status">Idle</div>
      </div>
      <div class="stat">
        <div class="label">Total Sessions</div>
        <div class="value" id="totalSessions">0</div>
      </div>
      <div class="stat">
        <div class="label">Current Streak</div>
        <div class="value" id="currentStreak">0</div>
      </div>
      <div class="stat">
        <div class="label">Last Session Date</div>
        <div class="value" id="lastSessionDate">-</div>
      </div>
    </div>

    <div class="actions">
      <button id="start">Start</button>
      <button id="pause">Pause</button>
      <button id="stop">Stop</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const timerEl = document.getElementById("timer");
    const statusEl = document.getElementById("status");
    const totalSessionsEl = document.getElementById("totalSessions");
    const currentStreakEl = document.getElementById("currentStreak");
    const lastSessionDateEl = document.getElementById("lastSessionDate");

    document.getElementById("start").addEventListener("click", () => {
      vscode.postMessage({ command: "start" });
    });

    document.getElementById("pause").addEventListener("click", () => {
      vscode.postMessage({ command: "pause" });
    });

    document.getElementById("stop").addEventListener("click", () => {
      vscode.postMessage({ command: "stop" });
    });

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (!message || message.type !== "state") {
        return;
      }

      const state = message.payload;
      timerEl.textContent = state.timerText;
      totalSessionsEl.textContent = String(state.totalSessions);
      currentStreakEl.textContent = String(state.currentStreak);
      lastSessionDateEl.textContent = state.lastSessionDate || "-";

      if (state.isRunning) {
        statusEl.textContent = "Running";
      } else if (state.isPaused) {
        statusEl.textContent = "Paused";
      } else {
        statusEl.textContent = "Idle";
      }
    });
  </script>
</body>
</html>`;
    }
}
exports.FocusWebviewPanel = FocusWebviewPanel;
//# sourceMappingURL=webviewPanel.js.map