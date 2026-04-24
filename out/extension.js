"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const timerManager_1 = require("./timerManager");
const streakManager_1 = require("./streakManager");
const statusBar_1 = require("./statusBar");
const webviewPanel_1 = require("./webviewPanel");
let timerManager;
let statusBarManager;
let webviewPanel;
function activate(context) {
    statusBarManager = new statusBar_1.StatusBarManager();
    const streakManager = new streakManager_1.StreakManager(context);
    const refreshDashboard = () => {
        if (!timerManager || !webviewPanel) {
            return;
        }
        const streak = streakManager.getState();
        webviewPanel.update({
            timerText: timerManager.getDisplayText(),
            isRunning: timerManager.isRunning,
            isPaused: timerManager.isPaused,
            totalSessions: streak.totalSessions,
            currentStreak: streak.currentStreak,
            lastSessionDate: streak.lastSessionDate
        });
    };
    timerManager = new timerManager_1.TimerManager(statusBarManager, {
        onSessionCompleted: () => {
            const result = streakManager.completeSession();
            if (result.rewardMessage) {
                void vscode.window.showInformationMessage(result.rewardMessage);
            }
            refreshDashboard();
        },
        onSessionAbandoned: () => {
            streakManager.abandonSession();
            refreshDashboard();
        },
        onTick: () => {
            refreshDashboard();
        }
    });
    webviewPanel = new webviewPanel_1.FocusWebviewPanel(context.extensionUri, {
        onStart: () => {
            timerManager?.start();
            refreshDashboard();
        },
        onPause: () => {
            timerManager?.pause();
            refreshDashboard();
        },
        onStop: () => {
            timerManager?.stop();
            refreshDashboard();
        }
    });
    context.subscriptions.push(statusBarManager, timerManager, webviewPanel, vscode.commands.registerCommand("focusMode.start", () => {
        timerManager?.start();
        refreshDashboard();
    }), vscode.commands.registerCommand("focusMode.pause", () => {
        timerManager?.pause();
        refreshDashboard();
    }), vscode.commands.registerCommand("focusMode.stop", () => {
        timerManager?.stop();
        refreshDashboard();
    }), vscode.commands.registerCommand("focusMode.openDashboard", () => {
        const streak = streakManager.getState();
        webviewPanel?.show({
            timerText: timerManager?.getDisplayText() ?? "🍅 25:00",
            isRunning: timerManager?.isRunning ?? false,
            isPaused: timerManager?.isPaused ?? false,
            totalSessions: streak.totalSessions,
            currentStreak: streak.currentStreak,
            lastSessionDate: streak.lastSessionDate
        });
    }));
}
function deactivate() {
    timerManager?.dispose();
    statusBarManager?.dispose();
    webviewPanel?.dispose();
}
//# sourceMappingURL=extension.js.map