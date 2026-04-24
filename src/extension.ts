import * as vscode from "vscode";
import { TimerManager } from "./timerManager";
import { StreakManager } from "./streakManager";
import { StatusBarManager } from "./statusBar";
import { FocusWebviewPanel } from "./webviewPanel";

let timerManager: TimerManager | undefined;
let statusBarManager: StatusBarManager | undefined;
let webviewPanel: FocusWebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  statusBarManager = new StatusBarManager();
  const streakManager = new StreakManager(context);

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

  timerManager = new TimerManager(statusBarManager, {
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

  webviewPanel = new FocusWebviewPanel(context.extensionUri, {
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

  context.subscriptions.push(
    statusBarManager,
    timerManager,
    webviewPanel,
    vscode.commands.registerCommand("focusMode.start", () => {
      timerManager?.start();
      refreshDashboard();
    }),
    vscode.commands.registerCommand("focusMode.pause", () => {
      timerManager?.pause();
      refreshDashboard();
    }),
    vscode.commands.registerCommand("focusMode.stop", () => {
      timerManager?.stop();
      refreshDashboard();
    }),
    vscode.commands.registerCommand("focusMode.openDashboard", () => {
      const streak = streakManager.getState();
      webviewPanel?.show({
        timerText: timerManager?.getDisplayText() ?? "🍅 25:00",
        isRunning: timerManager?.isRunning ?? false,
        isPaused: timerManager?.isPaused ?? false,
        totalSessions: streak.totalSessions,
        currentStreak: streak.currentStreak,
        lastSessionDate: streak.lastSessionDate
      });
    })
  );
}

export function deactivate(): void {
  timerManager?.dispose();
  statusBarManager?.dispose();
  webviewPanel?.dispose();
}