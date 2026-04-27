"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarManager = void 0;
const vscode = require("vscode");
class StatusBarManager {
    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = "focusMode.statusBarAction";
        this.item.tooltip = "Focus Mode: click to start/pause, double-click to stop";
        this.item.show();
    }
    setRunning(time) {
        this.item.text = `🍅 ${time}`;
    }
    setPaused(time) {
        this.item.text = `⏸ ${time}`;
    }
    setIdle(time) {
        this.item.text = `🍅 ${time}`;
    }
    dispose() {
        this.item.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBar.js.map