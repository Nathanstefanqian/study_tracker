<template>
  <div class="task-detail safe-area-inset-bottom">
    <view class="nav-bar">
      <u-icon name="arrow-left" size="40" @click="goBack"></u-icon>
      <text class="nav-title">任务详情</text>
    </view>
    
    <view class="task-container" v-if="taskDetails">
      <view class="task-header">
        <text class="task-title">{{ taskDetails.task.title }}</text>
        <text class="task-date">创建于 {{ formatDate(taskDetails.task.createdAt) }}</text>
      </view>
      
      <view class="task-goal" v-if="taskDetails.task.goal">
        <text class="goal-label">目标内容：</text>
        <text class="goal-content">{{ taskDetails.task.goal }}</text>
      </view>
      
      <view class="task-stats">
        <view class="stat-item">
          <text class="label">完成次数</text>
          <text class="value">{{ taskDetails.completedCount }}</text>
        </view>
        <view class="stat-item">
          <text class="label">专注时长</text>
          <text class="value">{{ formatDuration(taskDetails.totalMinutes) }}</text>
        </view>
      </view>
      
      <view class="record-list">
        <view class="record-list-title">专注记录</view>
        <view 
          class="record-item" 
          v-for="(record, index) in taskDetails.records" 
          :key="index"
        >
          <view class="record-info">
            <text class="record-time">{{ formatDate(record.timestamp) }}</text>
            <text class="record-duration">{{ formatDuration(record.duration) }}</text>
          </view>
          <u-tag 
            :text="record.type === 'completed' ? '完成' : '中断'" 
            :type="record.type === 'completed' ? 'success' : 'warning'"
            size="mini"
          ></u-tag>
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-else>
      <text>找不到任务信息</text>
    </view>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePomodoroStore } from '@/pinia/pomodoro';
import type { PomodoroTask, PomodoroRecord } from '@/pinia/pomodoro';

// 定義任務詳情介面
interface TaskDetails {
  task: PomodoroTask;
  records: PomodoroRecord[];
  totalMinutes: number;
  completedCount: number;
}

const store = usePomodoroStore();
const taskDetails = ref<TaskDetails | null>(null);

onMounted(async () => {
  await store.init();
  const pages = getCurrentPages();
  const currentPage: any = pages[pages.length - 1];
  const taskId = currentPage.$page?.options?.id;
  
  if (taskId) {
    taskDetails.value = store.getTaskDetails(taskId);
  }
});

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化持续时间
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}小时${remainingMinutes}分钟` : `${remainingMinutes}分钟`;
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.task-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-bar {
  height: 90rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  background-color: #ffffff;
  position: relative;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: bold;
}

.task-container {
  padding: 30rpx;
}

.task-header {
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.task-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  display: block;
}

.task-date {
  font-size: 24rpx;
  color: #999;
}

.task-goal {
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.goal-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  display: block;
}

.goal-content {
  font-size: 28rpx;
}

.task-stats {
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-around;
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

.record-list {
  background-color: #ffffff;
  padding: 30rpx;
  border-radius: 12rpx;
}

.record-list-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.record-time {
  font-size: 28rpx;
  margin-bottom: 6rpx;
}

.record-duration {
  font-size: 24rpx;
  color: #666;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  color: #999;
}

// 首页样式补充
.task-list {
  margin-top: 20rpx;
}

.task-list-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.frequent-titles {
  margin-top: 10rpx;
}

.frequent-title-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 6rpx;
  display: block;
}

.frequent-title-tags {
  display: flex;
  flex-wrap: wrap;
}
</style>