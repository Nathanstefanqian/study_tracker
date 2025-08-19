<template>
  <div class="home safe-area-inset-bottom">
    <view class="placeholder">
      <!-- 添加设置按钮 -->
      <view class="settings-button">
        <u-icon name="setting" size="40" @click="showSettings = true"></u-icon>
      </view>
    </view>
    <view class="timer-container">
      <view class="timer-circle" :class="{ 'active': isRunning }">
        <text class="timer-text">{{ formatTime(currentTime) }}</text>
        <text class="timer-label">{{ isRunning ? '专注中' : '准备开始' }}</text>
      </view>
      
      <view class="controls mt-40">
        <u-button 
          type="primary" 
          text="开始番茄钟"
          v-if="!isRunning && !isPaused"
          @click="showTaskInput = true"
        ></u-button>
        
        <block v-else>
          <u-button 
            type="warning" 
            :text="isPaused ? '继续' : '暂停'"
            @click="togglePause"
            class="mr-20"
          ></u-button>
          <u-button 
            type="error" 
            text="结束"
            @click="stopTimer"
          ></u-button>
        </block>
      </view>
      
      <view class="statistics mt-40">
        <!-- 在统计卡片标题旁添加刷新按钮 -->
        <u-card title="今日统计">
          <template #body>
            <view class="statistics-content">
              <view class="stat-item">
                <text class="label">完成次数</text>
                <text class="value">{{ store.todayStats.completedCount }}</text>
              </view>
              <view class="stat-item">
                <text class="label">专注时长</text>
                <text class="value">{{ formatDuration(store.todayStats.totalMinutes) }}</text>
              </view>
            </view>
          </template>
        </u-card>

      </view>
    </view>

    <!-- 设置弹窗 -->
    <!-- 设置弹窗 -->
    <u-popup :show="showSettings" @close="showSettings = false" mode="center">
      <view class="settings-popup">
        <view class="settings-title">设置</view>
        <view class="settings-content">
          <u-form :model="tempSettings" labelWidth="180">
            <u-form-item label="倒计时时长（秒）">
              <u-number-box v-model="tempSettings.countdownDuration" :min="1" :max="3600"></u-number-box>
            </u-form-item>
            <u-form-item label="休息时长（秒）">
              <u-number-box v-model="tempSettings.restCountdownDuration" :min="1" :max="1800"></u-number-box>
            </u-form-item>
            <u-form-item label="提醒音效">
              <u-switch v-model="tempSettings.soundEnabled"></u-switch>
            </u-form-item>
          </u-form>
        </view>
        <view class="settings-footer">
          <u-button type="primary" text="保存" @click="saveSettings"></u-button>
        </view>
      </view>
    </u-popup>
    
    <!-- 休息提醒弹窗 -->
    <u-modal
      :show="showRestModal"
      title="太棒了！"
      :closeOnClickOverlay="true"
      @confirm="startRest"
      @close="showRestModal = false"
    >
      <view class="rest-modal-content">
        <text>你已完成一个番茄钟，现在开始休息 {{ store.settings.restDuration }} 分钟吧！</text>
      </view>
    </u-modal>

    <!-- 休息结束弹窗 -->
    <u-modal
      :show="showWorkModal"
      title="休息结束"
      :closeOnClickOverlay="true"
      @confirm="startNextPomodoro"
      @close="showWorkModal = false"
    >
      <view class="rest-modal-content">
        <text>休息时间结束，要开始下一个番茄钟吗？</text>
      </view>
    </u-modal>

    <!-- 任务输入弹窗 -->
    <u-popup :show="showTaskInput" @close="showTaskInput = false" mode="center">
      <view class="settings-popup">
        <view class="settings-title">添加任务</view>
        <view class="settings-content">
          <u-form :model="taskForm" labelWidth="80">
            <u-form-item label="任务标题">
              <u-input 
                v-model="taskForm.title" 
                placeholder="请输入任务标题"
                :clearable="true"
              />
            </u-form-item>
            <u-form-item label="目标内容">                 
              <view class="frequent-titles" v-if="store.frequentTitles.length > 0">
                <view class="frequent-title-tags">
                  <u-tag 
                    v-for="title in store.frequentTitles" 
                    :key="title.id"
                    :text="title.title"
                    @click="selectFrequentTitle(title.title)"
                    size="mini"
                    mode="light"
                    class="mr-10 mb-10"
                  ></u-tag>
                </view>
              </view>
            </u-form-item>
            <u-form-item label="目标内容">
              <u-textarea 
                v-model="taskForm.goal" 
                placeholder="请输入目标内容"
                :count="true"
                :maxlength="200"
              ></u-textarea>
            </u-form-item>
          </u-form>
        </view>
        <view class="settings-footer">
          <u-button type="primary" text="开始" @click="startTimerWithTask"></u-button>
        </view>
      </view>
    </u-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePomodoroStore } from '@/pinia/pomodoro';

const store = usePomodoroStore();

// 状态变量
const isRunning = ref(false);
const isPaused = ref(false);
const currentTime = ref(10); // 修改为10秒
const showRestModal = ref(false);
const showWorkModal = ref(false);
const showSettings = ref(false);
const showTaskInput = ref(false); // 添加任务输入弹窗显示状态
const timer = ref<number | null>(null);
const isRestTime = ref(false);

// 任务表单
const taskForm = ref({
  title: '',
  goal: ''
});

// 临时设置
const tempSettings = ref({ ...store.settings });

// 初始化
onMounted(async () => {
  await store.init();
  currentTime.value = store.settings.countdownDuration;
  
  // 添加调试代码
  console.log('todayStats:', JSON.stringify(store.todayStats));
  
  // 添加假数据到今日统计
  console.log('添加假数据到今日统计');
  
  // 创建一些假任务
  const fakeTasks = [
    {
      id: '1',
      title: '学习Vue 3',
      goal: '掌握组合式API和响应式系统',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: '开发番茄钟应用',
      goal: '实现基本功能和UI界面',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: '阅读技术文档',
      goal: '了解最新前端发展趋势',
      createdAt: new Date().toISOString()
    }
  ];
  
  // // 将假任务添加到store中
  // store.tasks = fakeTasks;
  
  // 创建假记录
  const fakeRecords = [
    {
      duration: 25,
      type: 'completed',
      timestamp: new Date().toISOString(),
      taskId: '1',
      title: '学习Vue 3'
    },
    {
      duration: 15,
      type: 'interrupted',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      taskId: '2',
      title: '开发番茄钟应用'
    },
    {
      duration: 25,
      type: 'completed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      taskId: '3',
      title: '阅读技术文档'
    },
    {
      duration: 25,
      type: 'completed',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      taskId: '1',
      title: '学习Vue 3'
    }
  ];
  
  // 更新今日统计数据
  // store.todayStats = {
  //   records: fakeRecords,
  //   completedCount: 3,  // 3个已完成的番茄钟
  //   totalMinutes: 90,   // 总共90分钟
  //   date: new Date().toISOString().split('T')[0]
  // };
  
  // 更新或添加今日数据到统计列表
  const todayIndex = store.stats.findIndex(s => s.date === store.todayStats.date);
  if (todayIndex >= 0) {
    store.stats[todayIndex] = { ...store.todayStats };
  } else {
    store.stats.push({ ...store.todayStats });
  }
  
  // 保存到本地存储
  uni.setStorageSync('pomodoroStats', JSON.stringify(store.stats));
  uni.setStorageSync('pomodoroTasks', JSON.stringify(store.tasks));
});

// 格式化时间显示
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// 格式化持续时间
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  if (hours > 0) result += `${hours}小时`;
  if (minutes > 0) result += `${minutes}分钟`;
  if (remainingSeconds > 0 || (!hours && !minutes)) result += `${remainingSeconds}秒`;
  return result;
};

// 播放提示音
const playSound = () => {
  if (store.settings.soundEnabled) {
    const innerAudioContext = uni.createInnerAudioContext();
    innerAudioContext.src = '/static/notification.mp3';
    innerAudioContext.play();
  }
};

// 开始计时（原方法）
const startTimer = () => {
  // 如果不是休息时间，创建新任务
  if (!isRestTime.value) {
    store.createTask(taskForm.value.title || '未命名任务', taskForm.value.goal);
    // 清空表单
    taskForm.value.title = '';
    taskForm.value.goal = '';
  }
  
  isRunning.value = true;
  currentTime.value = isRestTime.value ? store.settings.restCountdownDuration : store.settings.countdownDuration;
  timer.value = setInterval(() => {
    if (currentTime.value > 0) {
      currentTime.value--;
    } else {
      if (isRestTime.value) {
        completeRest();
      } else {
        completePomodoro();
      }
    }
  }, 1000);
};

// 带任务的开始计时（新方法）
const startTimerWithTask = () => {
  showTaskInput.value = false; // 关闭任务输入弹窗
  startTimer(); // 调用原有的开始计时方法
};

// 暂停/继续
const togglePause = () => {
  if (isPaused.value) {
    startTimer();
    isPaused.value = false;
  } else {
    clearInterval(timer.value!);
    isPaused.value = true;
    isRunning.value = false;
  }
};

// 停止计时
const stopTimer = () => {
  clearInterval(timer.value!);
  isRunning.value = false;
  isPaused.value = false;
  
  // 如果不是在休息时间且已经开始计时，记录为中断
  if (!isRestTime.value && currentTime.value < store.settings.countdownDuration) {
    const elapsedMinutes = (store.settings.countdownDuration - currentTime.value) / 60;
    store.recordPomodoro(elapsedMinutes, 'interrupted');
  }
  
  currentTime.value = store.settings.countdownDuration;
};

// 完成一个番茄钟
const completePomodoro = () => {
  clearInterval(timer.value!);
  isRunning.value = false;
  store.recordPomodoro(store.settings.countdownDuration, 'completed');
  showRestModal.value = true;
  playSound();
  uni.vibrateLong();
};

// 开始休息
const startRest = () => {
  showRestModal.value = false;
  isRestTime.value = true;
  currentTime.value = store.settings.restCountdownDuration;
  startTimer();
};

// 完成休息
const completeRest = () => {
  clearInterval(timer.value!);
  isRunning.value = false;
  isRestTime.value = false;
  currentTime.value = store.settings.countdownDuration;
  showWorkModal.value = true;
  playSound();
  uni.vibrateLong();
};

// 开始下一个番茄钟
const startNextPomodoro = () => {
  showWorkModal.value = false;
  currentTime.value = store.settings.countdownDuration;
  startTimer();
};

// 选择常用标题
const selectFrequentTitle = (title: string) => {
  taskForm.value.title = title;
};

// 保存设置
const saveSettings = () => {
  store.saveSettings(tempSettings.value);
  currentTime.value = store.settings.countdownDuration;
  showSettings.value = false;
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  });
};
// 添加刷新方法
const refreshStats = async () => {
  await store.init();
  uni.showToast({
    title: '数据已刷新',
    icon: 'success'
  });
};
</script>

<style lang="scss" scoped>
.placeholder {
  height: 200rpx;
  width: 100%;
  position: relative;
}

.settings-button {
  position: absolute;
  left: 30rpx;
  top: 65%;
  transform: translateY(-50%);
  padding: 20rpx;
}

.home {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: constant(safe-area-inset-bottom); /* iOS < 11.2 */
  padding-bottom: env(safe-area-inset-bottom); /* iOS >= 11.2 */
}

.setting-icon {
  padding: 20rpx;
}

.timer-container {
  padding: 40rpx;
}

.timer-circle {
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: #ffffff;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &.active {
    box-shadow: 0 6rpx 24rpx rgba(186, 38, 54, 0.2);
    transform: scale(1.02);
  }
}

.timer-text {
  font-size: 80rpx;
  font-weight: bold;
  color: #ba2636;
  margin-bottom: 10rpx;
}

.timer-label {
  font-size: 28rpx;
  color: #666;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20rpx;
}

.statistics {
  margin-top: 40rpx;
}

.statistics-content {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
}

.stat-item {
  text-align: center;
  
  .label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 10rpx;
    display: block;
  }
  
  .value {
    font-size: 36rpx;
    color: #ba2636;
    font-weight: bold;
  }
}

.settings-popup {
  background: #ffffff;
  border-radius: 24rpx;
  width: 600rpx;
  
  .settings-title {
    font-size: 32rpx;
    font-weight: bold;
    text-align: center;
    padding: 30rpx;
    border-bottom: 2rpx solid #f5f5f5;
  }
  
  .settings-content {
    padding: 30rpx;
  }
  
  .settings-footer {
    padding: 20rpx 30rpx 30rpx;
  }
}

.rest-modal-content {
  padding: 30rpx;
  text-align: center;
}
</style>