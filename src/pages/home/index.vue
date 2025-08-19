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
          @click="startTimer"
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
        <u-card title="今日统计">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePomodoroStore } from '@/pinia/pomodoro';

const store = usePomodoroStore();

// 状态变量
const isRunning = ref(false);
const isPaused = ref(false);
const currentTime = ref(10); // 修改为10秒
const showRestModal = ref(false);
const showWorkModal = ref(false);
const showSettings = ref(false);
const timer = ref<number | null>(null);
const isRestTime = ref(false);

// 临时设置
const tempSettings = ref({ ...store.settings });

// 初始化
onMounted(async () => {
  await store.init();
  currentTime.value = store.settings.countdownDuration;
});

// 格式化时间显示
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// 格式化持续时间
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}小时${remainingMinutes}分钟` : `${remainingMinutes}分钟`;
};

// 播放提示音
const playSound = () => {
  if (store.settings.soundEnabled) {
    const innerAudioContext = uni.createInnerAudioContext();
    innerAudioContext.src = '/static/notification.mp3';
    innerAudioContext.play();
  }
};

// 开始计时
const startTimer = () => {
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
  store.recordPomodoro(store.settings.countdownDuration / 60, 'completed');
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