import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, usePullDownRefresh } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { InventoryTask, TaskStatus } from '@/types';
import TaskCard from '@/components/TaskCard';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

type FilterType = 'all' | TaskStatus;

const TasksPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  
  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getTasksWithState = useInventoryStore(state => state.getTasksWithState);
  const claimTask = useInventoryStore(state => state.claimTask);
  const refresh = useInventoryStore(state => state.refresh);
  const getHistoryWithLocal = useInventoryStore(state => state.getHistoryWithLocal);

  const tasks = useMemo(() => {
    return getTasksWithState();
  }, [getTasksWithState, refreshTrigger]);

  const loadTasks = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      refresh();
      setLoading(false);
      Taro.stopPullDownRefresh();
      console.log('[TasksPage] 任务列表刷新完成', tasks.length);
    }, 500);
  }, [refresh, tasks.length]);

  useEffect(() => {
    refresh();
    console.log('[TasksPage] 页面加载，刷新数据');
  }, [refresh]);

  usePullDownRefresh(() => {
    loadTasks();
  });

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const handleClaim = (taskId: string) => {
    Taro.showModal({
      title: '领取任务',
      content: '确定要领取该盘点任务吗？领取后将开始盘点工作。',
      confirmText: '确认领取',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          const success = claimTask(taskId);
          if (success) {
            Taro.showToast({
              title: '领取成功',
              icon: 'success',
              duration: 2000
            });
            console.log('[TasksPage] 任务领取成功', taskId);
          } else {
            Taro.showToast({
              title: '领取失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
      })
    });
  };

  const handleEnter = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'completed') {
      const historyList = getHistoryWithLocal();
      const history = historyList.find(h => h.batchNo === task.batchNo);
      if (history) {
        Taro.navigateTo({
          url: `/pages/history-detail/index?id=${history.id}`
        });
        console.log('[TasksPage] 跳转到历史盘点详情', history.id, history.batchNo);
      } else {
        Taro.showToast({
          title: '历史记录不存在',
          icon: 'none',
          duration: 2000
        });
      }
    } else if (task && task.status === 'ongoing') {
      Taro.switchTab({
        url: '/pages/scan/index'
      });
      console.log('[TasksPage] 进入扫码盘点', taskId);
    } else {
      Taro.showToast({
        title: '请先领取任务',
        icon: 'none',
        duration: 1500
      });
    }
  };

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    ongoing: tasks.filter(t => t.status === 'ongoing').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待开始' },
    { key: 'ongoing', label: '进行中' },
    { key: 'completed', label: '已完成' }
  ];

  return (
    <View className={styles.tasksPage}>
      <View className={styles.statsSection}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>📋</View>
            <Text className={styles.statValue}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待领取</Text>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>⏳</View>
            <Text className={styles.statValue}>{stats.ongoing}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>✅</View>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterTabs}>
          {filters.map(f => (
            <View
              key={f.key}
              className={classnames(styles.tabItem, filter === f.key && styles.active)}
              onClick={() => setFilter(f.key)}
            >
              <Text>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView 
        scrollY 
        className={styles.taskList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadTasks}
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              showRooms={task.status !== 'pending'}
              onClaim={handleClaim}
              onEnter={handleEnter}
            />
          ))
        ) : (
          <EmptyState
            icon="📭"
            text="暂无盘点任务"
            subText={filter !== 'all' ? '切换筛选条件查看更多' : '敬请期待新的盘点任务'}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default TasksPage;
