import * as vscode from "vscode";

export class StatusBarManager implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = "focusMode.stop";
    this.item.tooltip = "Focus Mode: stop current session";
    this.item.show();
  }

  public setRunning(time: string): void {
    this.item.text = `🍅 ${time}`;
  }

  public setPaused(time: string): void {
    this.item.text = `⏸ ${time}`;
  }

  public setIdle(time: string): void {
    this.item.text = `🍅 ${time}`;
  }

  public dispose(): void {
    this.item.dispose();
  }
}