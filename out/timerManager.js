"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerManager = void 0;
const vscode = require("vscode");
class TimerManager {
    constructor(statusBar, callbacks) {
        this.statusBar = statusBar;
        this.callbacks = callbacks;
        this.remainingSeconds = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.blockingListener = vscode.workspace.onDidOpenTextDocument((doc) => {
            this.handleDocumentOpen(doc);
        });
        this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
        this.statusBar.setIdle(this.formatTime(this.remainingSeconds));
    }
    start() {
        if (this.isRunning) {
            return;
        }
        if (!this.isPaused) {
            this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.statusBar.setRunning(this.formatTime(this.remainingSeconds));
        this.callbacks.onTick?.();
        this.interval = setInterval(() => {
            this.remainingSeconds -= 1;
            if (this.remainingSeconds <= 0) {
                this.completeSession();
                return;
            }
            this.statusBar.setRunning(this.formatTime(this.remainingSeconds));
            this.callbacks.onTick?.();
        }, 1000);
    }
    pause() {
        if (!this.isRunning) {
            return;
        }
        this.clearTimerInterval();
        this.isRunning = false;
        this.isPaused = true;
        this.statusBar.setPaused(this.formatTime(this.remainingSeconds));
        this.callbacks.onTick?.();
    }
    stop() {
        if (!this.isRunning && !this.isPaused) {
            return;
        }
        const wasActive = this.isRunning || this.isPaused;
        this.clearTimerInterval();
        this.isRunning = false;
        this.isPaused = false;
        this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
        this.statusBar.setIdle(this.formatTime(this.remainingSeconds));
        if (wasActive) {
            this.callbacks.onSessionAbandoned();
        }
        this.callbacks.onTick?.();
    }
    getDisplayText() {
        if (this.isRunning) {
            return `🍅 ${this.formatTime(this.remainingSeconds)}`;
        }
        if (this.isPaused) {
            return `⏸ ${this.formatTime(this.remainingSeconds)}`;
        }
        return `🍅 ${this.formatTime(this.remainingSeconds)}`;
    }
    dispose() {
        this.clearTimerInterval();
        this.blockingListener.dispose();
    }
    completeSession() {
        this.clearTimerInterval();
        this.isRunning = false;
        this.isPaused = false;
        this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
        this.statusBar.setIdle(this.formatTime(this.remainingSeconds));
        void vscode.window.showInformationMessage("Focus session complete. Nice work.");
        this.callbacks.onSessionCompleted();
        this.callbacks.onTick?.();
    }
    clearTimerInterval() {
        if (!this.interval) {
            return;
        }
        clearInterval(this.interval);
        this.interval = undefined;
    }
    getConfiguredDurationMinutes() {
        const config = vscode.workspace.getConfiguration("focusMode");
        const raw = config.get("timerDuration", 25);
        return Number.isFinite(raw) && raw > 0 ? raw : 25;
    }
    handleDocumentOpen(doc) {
        if (!this.isRunning) {
            return;
        }
        const config = vscode.workspace.getConfiguration("focusMode");
        const enabled = config.get("enableFileBlocking", true);
        if (!enabled) {
            return;
        }
        const patterns = config.get("blockedFilePatterns", ["*.md"]);
        if (this.isBlocked(doc.fileName, patterns)) {
            void vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            void vscode.window.showWarningMessage("That file is blocked during active focus sessions.");
        }
    }
    isBlocked(filePath, patterns) {
        const normalized = filePath.replace(/\\/g, "/").toLowerCase();
        return patterns.some((pattern) => {
            const regex = this.patternToRegExp(pattern.toLowerCase());
            return regex.test(normalized);
        });
    }
    patternToRegExp(pattern) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
        const wildcard = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
        return new RegExp(`(^|/)${wildcard}$`);
    }
    formatTime(totalSeconds) {
        const safe = Math.max(0, totalSeconds);
        const minutes = Math.floor(safe / 60)
            .toString()
            .padStart(2, "0");
        const seconds = (safe % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    }
}
exports.TimerManager = TimerManager;
//# sourceMappingURL=timerManager.js.map