import { defineStore } from 'pinia';

// 任务接口
interface PomodoroTask {
  id: string;
  title: string;
  goal: string;
  createdAt: string;
}

// 常用任务标题
interface FrequentTitle {
  id: string;
  title: string;
  useCount: number;
}

// 修改番茄钟记录，添加任务ID
interface PomodoroRecord {
  duration: number;
  type: 'completed' | 'interrupted';
  timestamp: string;
  taskId: string; // 关联的任务ID
  title: string; // 冗余存储任务标题，方便显示
}

interface PomodoroStats {
  records: PomodoroRecord[];
  completedCount: number;
  totalMinutes: number; // 改为 number 类型，支持小数
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
      records: [] as PomodoroRecord[],
      completedCount: 0,
      totalMinutes: 0,
      date: new Date().toISOString().split('T')[0]
    } as PomodoroStats,
    // 新增状态
    tasks: [] as PomodoroTask[],
    frequentTitles: [] as FrequentTitle[],
    currentTask: null as PomodoroTask | null
  }),

  actions: {
    // 初始化数据 - 扩展现有方法
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
      
      // 加载任务列表
      const tasks = uni.getStorageSync('pomodoroTasks');
      if (tasks) {
        this.tasks = JSON.parse(tasks);
      }
      
      // 加载常用标题
      const frequentTitles = uni.getStorageSync('pomodoroFrequentTitles');
      if (frequentTitles) {
        this.frequentTitles = JSON.parse(frequentTitles);
      }
    },
    
    // 新增方法：创建任务
    createTask(title: string, goal: string) {
      const task: PomodoroTask = {
        id: Date.now().toString(),
        title,
        goal,
        createdAt: new Date().toISOString()
      };
      
      this.tasks.push(task);
      this.currentTask = task;
      
      // 更新常用标题
      this.updateFrequentTitle(title);
      
      // 保存到本地存储
      uni.setStorageSync('pomodoroTasks', JSON.stringify(this.tasks));
      
      return task;
    },
    
    // 新增方法：更新常用标题
    updateFrequentTitle(title: string) {
      const existingTitle = this.frequentTitles.find(t => t.title === title);
      
      if (existingTitle) {
        existingTitle.useCount++;
      } else {
        this.frequentTitles.push({
          id: Date.now().toString(),
          title,
          useCount: 1
        });
      }
      
      // 按使用次数排序
      this.frequentTitles.sort((a, b) => b.useCount - a.useCount);
      
      // 只保留前10个
      if (this.frequentTitles.length > 10) {
        this.frequentTitles = this.frequentTitles.slice(0, 10);
      }
      
      // 保存到本地存储
      uni.setStorageSync('pomodoroFrequentTitles', JSON.stringify(this.frequentTitles));
    },
    
    // 修改现有方法：记录番茄钟
    recordPomodoro(duration: number, type: 'completed' | 'interrupted' = 'completed') {
      if (!this.currentTask) {
        // 如果没有当前任务，创建一个默认任务
        this.createTask('未命名任务', '');
      }
      
      const record: PomodoroRecord = {
        duration,
        type,
        timestamp: new Date().toISOString(),
        taskId: this.currentTask!.id,
        title: this.currentTask!.title
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
    },
    
    // 新增方法：获取任务详情
    getTaskDetails(taskId: string) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return null;
      
      // 获取与该任务相关的所有记录
      const records = this.stats.flatMap(s => 
        s.records.filter(r => r.taskId === taskId)
      );
      
      // 计算总时长和完成次数
      const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
      const completedCount = records.filter(r => r.type === 'completed').length;
      
      return {
        task,
        records,
        totalMinutes,
        completedCount
      };
    },
    
    // 添加保存设置方法
    saveSettings(newSettings: PomodoroSettings) {
      this.settings = newSettings;
      uni.setStorageSync('pomodoroSettings', JSON.stringify(newSettings));
    }
  }
});
