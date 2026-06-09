import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { DepartmentProgress } from '@/types';
import { mockProgress } from '@/data/mockProgress';
import ProgressBar from '@/components/ProgressBar';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const ProgressPage: React.FC = () => {
  const [deptList, setDeptList] = useState<DepartmentProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const sorted = [...mockProgress].sort((a, b) => b.progress - a.progress);
      setDeptList(sorted);
      setLoading(false);
      Taro.stopPullDownRefresh();
      console.log('[ProgressPage] 进度列表加载完成', sorted.length);
    }, 500);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemind = (dept: DepartmentProgress, index: number) => {
    if (dept.progress === 100) {
      Taro.showToast({
        title: '该部门已完成盘点',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (dept.reminded) {
      Taro.showToast({
        title: '已催办过，请勿重复操作',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    Taro.showModal({
      title: '催办确认',
      content: `确定向${dept.name}发送催办通知吗？\n\n将通知：${dept.manager}（${dept.managerPhone}）`,
      confirmText: '确认催办',
      confirmColor: '#ff7d00',
      success: (res) => {
        if (res.confirm) {
          setDeptList(prev => prev.map((item, i) => 
            i === index 
              ? { ...item, reminded: true, remindedAt: new Date().toLocaleString() }
              : item
          ));
          Taro.showToast({
            title: '催办通知已发送',
            icon: 'success',
            duration: 2000
          });
          console.log('[ProgressPage] 发送催办通知', dept.name);
        }
      }
    });
  };

  const handleDeptClick = (dept: DepartmentProgress) => {
    Taro.showModal({
      title: dept.name,
      content: `负责人：${dept.manager}\n联系电话：${dept.managerPhone}\n\n盘点进度：${dept.progress}%\n已盘点：${dept.checkedAssets} / ${dept.totalAssets}\n${dept.lastCheckTime ? `最后盘点：${dept.lastCheckTime}` : '尚未开始盘点'}\n${dept.remindedAt ? `\n催办时间：${dept.remindedAt}` : ''}`,
      showCancel: false,
      confirmText: '关闭',
      confirmColor: '#165dff'
    });
  };

  const totalAssets = deptList.reduce((sum, d) => sum + d.totalAssets, 0);
  const checkedAssets = deptList.reduce((sum, d) => sum + d.checkedAssets, 0);
  const overallProgress = totalAssets > 0 ? Math.round((checkedAssets / totalAssets) * 100) : 0;
  const pendingCount = deptList.filter(d => d.progress < 100).length;
  const completedCount = deptList.filter(d => d.progress === 100).length;

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank1';
    if (index === 1) return 'rank2';
    if (index === 2) return 'rank3';
    return 'other';
  };

  return (
    <View className={styles.progressPage}>
      <View className={styles.overviewSection}>
        <Text className={styles.overviewTitle}>
          <Text className={styles.titleIcon}>📊</Text>
          整体盘点进度
        </Text>
        <View className={styles.progressOverview}>
          <View className={styles.progressText}>
            <Text className={styles.label}>总完成率</Text>
            <Text className={styles.value}>{overallProgress}%</Text>
          </View>
          <ProgressBar progress={overallProgress} showValue={false} height={16} />
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{deptList.length}</Text>
            <Text className={styles.statLabel}>部门总数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{completedCount}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{pendingCount}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{totalAssets - checkedAssets}</Text>
            <Text className={styles.statLabel}>待核对</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        scrollY 
        className={styles.rankList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadData}
      >
        {deptList.length > 0 ? (
          deptList.map((dept, index) => (
            <View 
              key={dept.id} 
              className={styles.rankCard}
              onClick={() => handleDeptClick(dept)}
            >
              <View className={classnames(styles.rankBadge, styles[getRankClass(index)])}>
                <Text>{index + 1}</Text>
              </View>
              <View className={styles.deptInfo}>
                <View className={styles.deptHeader}>
                  <Text className={styles.deptName}>{dept.name}</Text>
                  {dept.reminded && (
                    <Text className={styles.remindedTag}>⏰ 已催办</Text>
                  )}
                </View>
                <View className={styles.managerInfo}>
                  <View className={styles.manager}>
                    <Text>👤</Text>
                    <Text>{dept.manager}</Text>
                  </View>
                  {dept.lastCheckTime && (
                    <View className={styles.lastCheck}>
                      <Text>🕐</Text>
                      <Text>{dept.lastCheckTime}</Text>
                    </View>
                  )}
                </View>
                <View className={styles.stats}>
                  <View className={styles.statItem}>
                    <Text className={styles.num}>{dept.checkedAssets}</Text>
                    <Text> / {dept.totalAssets} 已盘点</Text>
                  </View>
                </View>
                <ProgressBar progress={dept.progress} showValue={false} height={8} />
              </View>
              <View className={styles.actionArea} onClick={(e) => e.stopPropagation()}>
                <Button
                  className={classnames(styles.remindBtn, dept.progress === 100 && styles.disabled)}
                  onClick={() => handleRemind(dept, index)}
                  disabled={dept.progress === 100}
                >
                  {dept.progress === 100 ? '已完成' : '催办'}
                </Button>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="📊"
            text="暂无进度数据"
            subText="请稍后再试"
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ProgressPage;
