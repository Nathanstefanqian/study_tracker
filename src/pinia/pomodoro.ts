import { defineStore } from 'pinia';

interface PomodoroRecord {
  duration: number;
  type: 'completed' | 'interrupted';
  timestamp: string;
}

interface PomodoroStats {
  records: PomodoroRecord[];
  completedCount: number;
  totalMinutes: number;
  date: string;
}

interface PomodoroSettings {
  countdownDuration: number; // 倒计时时长（秒）
  restCountdownDuration: number; // 休息时长（秒）
  soundEnabled: boolean;
}

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    stats: [] as PomodoroStats[],
    settings: {
      countdownDuration: 10, // 默认10秒
      restCountdownDuration: 2, // 默认2秒
      soundEnabled: true
    } as PomodoroSettings,
    todayStats: {
      records: [] as PomodoroRecord[], // 明确指定类型
      completedCount: 0,
      totalMinutes: 0,
      date: new Date().toISOString().split('T')[0]
    } as PomodoroStats
  }),

  actions: {
    // 初始化数据
    async init() {
      const settings = uni.getStorageSync('pomodoroSettings');
      if (settings) {
        this.settings = JSON.parse(settings);
      }

      const stats = uni.getStorageSync('pomodoroStats');
      if (stats) {
        this.stats = JSON.parse(stats);
        // 获取今日数据
        const today = new Date().toISOString().split('T')[0];
        const todayData = this.stats.find(s => s.date === today);
        if (todayData) {
          // 确保 records 数组存在
          this.todayStats = {
            ...todayData,
            records: todayData.records || []
          };
        } else {
          this.todayStats = {
            records: [] as PomodoroRecord[],
            completedCount: 0,
            totalMinutes: 0,
            date: today
          };
        }
      }
    },
    
    // 保存设置
    saveSettings(newSettings: PomodoroSettings) {
      this.settings = { ...newSettings };
      uni.setStorageSync('pomodoroSettings', JSON.stringify(this.settings));
    },
    
    // 记录番茄钟
    recordPomodoro(duration: number, type: 'completed' | 'interrupted' = 'completed') {
      const record: PomodoroRecord = {
        duration,
        type,
        timestamp: new Date().toISOString()
      };
      
      // 确保 records 数组存在
      if (!this.todayStats.records) {
        this.todayStats.records = [];
      }
      
      this.todayStats.records.push(record);
      
      // 更新统计数据
      if (type === 'completed') {
        this.todayStats.completedCount++;
      }
      this.todayStats.totalMinutes += duration;
      
      // 更新或添加今日数据到统计列表
      const todayIndex = this.stats.findIndex(s => s.date === this.todayStats.date);
      if (todayIndex >= 0) {
        this.stats[todayIndex] = { ...this.todayStats };
      } else {
        this.stats.push({ ...this.todayStats });
      }
      
      // 保存到本地存储
      uni.setStorageSync('pomodoroStats', JSON.stringify(this.stats));
    }
  }
});