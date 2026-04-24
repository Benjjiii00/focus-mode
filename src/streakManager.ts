import * as vscode from "vscode";

interface StreakState {
  totalSessions: number;
  currentStreak: number;
  lastSessionDate: string | null;
}

interface CompleteResult {
  state: StreakState;
  rewardMessage: string | null;
}
































const STATE_KEY = "focusMode.streakState";

export class StreakManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public getState(): StreakState {
    const stored = this.context.globalState.get<StreakState>(STATE_KEY);
    return (
      stored ?? {
        totalSessions: 0,
        currentStreak: 0,
        lastSessionDate: null
      }
    );
  }

  public completeSession(): CompleteResult {
    const state = this.getState();
    const today = this.toDateKey(new Date());

    let nextStreak = state.currentStreak + 1;
    if (state.lastSessionDate) {
      const gap = this.dayGap(state.lastSessionDate, today);
      if (gap > 1) {
        nextStreak = 1;
      }
    }

    const nextState: StreakState = {
      totalSessions: state.totalSessions + 1,
      currentStreak: nextStreak,
      lastSessionDate: today
    };

    void this.context.globalState.update(STATE_KEY, nextState);

    return {
      state: nextState,
      rewardMessage: this.getRewardMessage(nextState.currentStreak)
    };
  }

  public abandonSession(): void {
    const state = this.getState();
    const nextState: StreakState = {
      ...state,
      currentStreak: 0
    };

    void this.context.globalState.update(STATE_KEY, nextState);
  }

  private getRewardMessage(streak: number): string | null {
    const rewards: Record<number, string> = {
      3: "🔥 3-session streak. Momentum is building.",
      5: "💪 5-session streak. Strong consistency.",
      10: "🏆 10-session streak. Focus champion.",
      20: "🚀 20-session streak. Elite discipline."
    };

    return rewards[streak] ?? null;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private dayGap(from: string, to: string): number {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T00:00:00Z`);
    const diffMs = toDate.getTime() - fromDate.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }
}