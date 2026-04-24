"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakManager = void 0;
const STATE_KEY = "focusMode.streakState";
class StreakManager {
    constructor(context) {
        this.context = context;
    }
    getState() {
        const stored = this.context.globalState.get(STATE_KEY);
        return (stored ?? {
            totalSessions: 0,
            currentStreak: 0,
            lastSessionDate: null
        });
    }
    completeSession() {
        const state = this.getState();
        const today = this.toDateKey(new Date());
        let nextStreak = state.currentStreak + 1;
        if (state.lastSessionDate) {
            const gap = this.dayGap(state.lastSessionDate, today);
            if (gap > 1) {
                nextStreak = 1;
            }
        }
        const nextState = {
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
    abandonSession() {
        const state = this.getState();
        const nextState = {
            ...state,
            currentStreak: 0
        };
        void this.context.globalState.update(STATE_KEY, nextState);
    }
    getRewardMessage(streak) {
        const rewards = {
            3: "🔥 3-session streak. Momentum is building.",
            5: "💪 5-session streak. Strong consistency.",
            10: "🏆 10-session streak. Focus champion.",
            20: "🚀 20-session streak. Elite discipline."
        };
        return rewards[streak] ?? null;
    }
    toDateKey(date) {
        return date.toISOString().slice(0, 10);
    }
    dayGap(from, to) {
        const fromDate = new Date(`${from}T00:00:00Z`);
        const toDate = new Date(`${to}T00:00:00Z`);
        const diffMs = toDate.getTime() - fromDate.getTime();
        return Math.floor(diffMs / (24 * 60 * 60 * 1000));
    }
}
exports.StreakManager = StreakManager;
//# sourceMappingURL=streakManager.js.map