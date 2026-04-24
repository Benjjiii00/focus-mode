import * as vscode from "vscode";
import { StatusBarManager } from "./statusBar";

interface TimerCallbacks {
	onSessionCompleted: () => void;
	onSessionAbandoned: () => void;
	onTick?: () => void;
}

export class TimerManager implements vscode.Disposable {
	private interval: NodeJS.Timeout | undefined;
	private remainingSeconds = 0;
	private blockingListener: vscode.Disposable;

	public isRunning = false;
	public isPaused = false;

	constructor(
		private readonly statusBar: StatusBarManager,
		private readonly callbacks: TimerCallbacks
	) {
		this.blockingListener = vscode.workspace.onDidOpenTextDocument((doc) => {
			this.handleDocumentOpen(doc);
		});

		this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
		this.statusBar.setIdle(this.formatTime(this.remainingSeconds));
	}

	public start(): void {
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

	public pause(): void {
		if (!this.isRunning) {
			return;
		}

		this.clearTimerInterval();
		this.isRunning = false;
		this.isPaused = true;
		this.statusBar.setPaused(this.formatTime(this.remainingSeconds));
		this.callbacks.onTick?.();
	}

	public stop(): void {
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

	public getDisplayText(): string {
		if (this.isRunning) {
			return `🍅 ${this.formatTime(this.remainingSeconds)}`;
		}

		if (this.isPaused) {
			return `⏸ ${this.formatTime(this.remainingSeconds)}`;
		}

		return `🍅 ${this.formatTime(this.remainingSeconds)}`;
	}

	public dispose(): void {
		this.clearTimerInterval();
		this.blockingListener.dispose();
	}

	private completeSession(): void {
		this.clearTimerInterval();
		this.isRunning = false;
		this.isPaused = false;
		this.remainingSeconds = this.getConfiguredDurationMinutes() * 60;
		this.statusBar.setIdle(this.formatTime(this.remainingSeconds));

		void vscode.window.showInformationMessage("Focus session complete. Nice work.");
		this.callbacks.onSessionCompleted();
		this.callbacks.onTick?.();
	}

	private clearTimerInterval(): void {
		if (!this.interval) {
			return;
		}

		clearInterval(this.interval);
		this.interval = undefined;
	}

	private getConfiguredDurationMinutes(): number {
		const config = vscode.workspace.getConfiguration("focusMode");
		const raw = config.get<number>("timerDuration", 25);
		return Number.isFinite(raw) && raw > 0 ? raw : 25;
	}

	private handleDocumentOpen(doc: vscode.TextDocument): void {
		if (!this.isRunning) {
			return;
		}

		const config = vscode.workspace.getConfiguration("focusMode");
		const enabled = config.get<boolean>("enableFileBlocking", true);
		if (!enabled) {
			return;
		}

		const patterns = config.get<string[]>("blockedFilePatterns", ["*.md"]);
		if (this.isBlocked(doc.fileName, patterns)) {
			void vscode.commands.executeCommand("workbench.action.closeActiveEditor");
			void vscode.window.showWarningMessage(
				"That file is blocked during active focus sessions."
			);
		}
	}

	private isBlocked(filePath: string, patterns: string[]): boolean {
		const normalized = filePath.replace(/\\/g, "/").toLowerCase();
		return patterns.some((pattern) => {
			const regex = this.patternToRegExp(pattern.toLowerCase());
			return regex.test(normalized);
		});
	}

	private patternToRegExp(pattern: string): RegExp {
		const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
		const wildcard = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
		return new RegExp(`(^|/)${wildcard}$`);
	}

	private formatTime(totalSeconds: number): string {
		const safe = Math.max(0, totalSeconds);
		const minutes = Math.floor(safe / 60)
			.toString()
			.padStart(2, "0");
		const seconds = (safe % 60).toString().padStart(2, "0");
		return `${minutes}:${seconds}`;
	}
}
