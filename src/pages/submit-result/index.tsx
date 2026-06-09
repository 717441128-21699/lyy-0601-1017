import React, { useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { HistoryInventory } from '@/types';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

const SubmitResultPage: React.FC = () => {
  const router = useRouter();
  const historyId = router.params.historyId as string;
  
  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getHistoryWithLocal = useInventoryStore(state => state.getHistoryWithLocal);
  const getDraftWithLocal = useInventoryStore(state => state.getDraftWithLocal);
  const refresh = useInventoryStore(state => state.refresh);

  const history = useMemo(() => {
    if (!historyId) return null;
    const historyList = getHistoryWithLocal();
    return historyList.find(h => h.id === historyId) || null;
  }, [getHistoryWithLocal, historyId, refreshTrigger]);

  const draftCount = useMemo(() => {
    return getDraftWithLocal().length;
  }, [getDraftWithLocal, refreshTrigger]);

  useDidShow(() => {
    refresh();
  });

  const handleViewHistory = () => {
    if (history) {
      Taro.navigateTo({
        url: `/pages/history-detail/index?id=${history.id}`
      });
    }
  };

  const handleBackToTasks = () => {
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const handleBackToMine = () => {
    Taro.switchTab({ url: '/pages/mine/index' });
  };

  if (!history) {
    return (
      <View className={styles.submitResultPage}>
        <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>❓</Text>
          <View style={{ marginTop: '32rpx', fontSize: '32rpx', color: '#4E5969', fontWeight: 600 }}>
            未找到提交记录
          </View>
          <View style={{ marginTop: '48rpx' }}>
            <Button
              style={{
                background: '#165DFF',
                color: '#fff',
                borderRadius: '48rpx',
                padding: '0 48rpx',
                fontSize: '28rpx'
              }}
              onClick={handleBackToTasks}
            >
              返回任务列表
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const overallProgress = history.totalAssets > 0 
    ? Math.round(((history.normalAssets + history.idleAssets) / history.totalAssets) * 100) 
    : 0;

  return (
    <View className={styles.submitResultPage}>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.successCard}>
          <View className={styles.successIcon}>
            <Text>✅</Text>
          </View>
          <Text className={styles.successTitle}>提交成功</Text>
          <Text className={styles.successSubtitle}>
            {history.department}盘点结果已提交
          </Text>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.infoHeader}>
            <Text className={styles.infoTitle}>
              <Text className={styles.infoIcon}>📋</Text>
              盘点信息
            </Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>任务名称</Text>
              <Text className={styles.infoValue}>{history.name}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>批次号</Text>
              <Text className={styles.infoValue} style={{ color: '#165DFF', fontWeight: 600 }}>
                {history.batchNo}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>盘点季度</Text>
              <Text className={styles.infoValue}>{history.year}年{history.quarter}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>提交人</Text>
              <Text className={styles.infoValue}>{history.checker}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>完成时间</Text>
              <Text className={styles.infoValue}>{history.completedAt}</Text>
            </View>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statsHeader}>
            <Text className={styles.statsTitle}>
              <Text className={styles.statsIcon}>📊</Text>
              盘点结果统计
            </Text>
          </View>
          
          <View style={{ marginBottom: '32rpx' }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12rpx' }}>
              <Text style={{ fontSize: '28rpx', color: '#4E5969' }}>整体完成率</Text>
              <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#165DFF' }}>
                {overallProgress}%
              </Text>
            </View>
            <ProgressBar progress={overallProgress} height={16} />
          </View>

          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statIcon}>📦</Text>
              <Text className={styles.statValue}>{history.totalAssets}</Text>
              <Text className={styles.statLabel}>资产总数</Text>
            </View>
            <View className={styles.statItem} style={{ background: 'rgba(0, 180, 42, 0.08)' }}>
              <Text className={styles.statIcon}>✅</Text>
              <Text className={styles.statValue} style={{ color: '#00B42A' }}>{history.normalAssets}</Text>
              <Text className={styles.statLabel}>正常资产</Text>
            </View>
            <View className={styles.statItem} style={{ background: 'rgba(245, 63, 63, 0.08)' }}>
              <Text className={styles.statIcon}>⚠️</Text>
              <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{history.exceptionAssets}</Text>
              <Text className={styles.statLabel}>异常资产</Text>
            </View>
            <View className={styles.statItem} style={{ background: 'rgba(255, 125, 0, 0.08)' }}>
              <Text className={styles.statIcon}>📦</Text>
              <Text className={styles.statValue} style={{ color: '#FF7D00' }}>{history.idleAssets}</Text>
              <Text className={styles.statLabel}>闲置资产</Text>
            </View>
          </View>

          <View className={styles.exceptionBreakdown}>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#F53F3F' }} />
              <Text className={styles.breakdownLabel}>丢失</Text>
              <Text className={styles.breakdownValue}>{history.lostAssets}</Text>
            </View>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#FF7D00' }} />
              <Text className={styles.breakdownLabel}>闲置</Text>
              <Text className={styles.breakdownValue}>{history.idleAssets}</Text>
            </View>
            <View className={styles.breakdownItem}>
              <View className={styles.breakdownDot} style={{ background: '#F7BA1E' }} />
              <Text className={styles.breakdownLabel}>位置不符</Text>
              <Text className={styles.breakdownValue}>{history.mismatchAssets}</Text>
            </View>
          </View>
        </View>

        <View className={styles.cleanupCard}>
          <View className={styles.cleanupHeader}>
            <Text className={styles.cleanupTitle}>
              <Text className={styles.cleanupIcon}>🧹</Text>
              暂存记录清理
            </Text>
          </View>
          <View className={styles.cleanupContent}>
            <View className={styles.cleanupItem}>
              <Text className={styles.cleanupStatus}>
                {draftCount === 0 ? '✅' : '⚠️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text className={styles.cleanupText}>
                  {draftCount === 0 
                    ? '所有暂存记录已清理完成' 
                    : `还有 ${draftCount} 条暂存记录未清理`}
                </Text>
                <Text className={styles.cleanupSubtext}>
                  {draftCount === 0 
                    ? '本次盘点的暂存数据已全部提交' 
                    : '请确认是否还有未提交的记录'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.actionSection}>
          <Button
            className={styles.primaryBtn}
            onClick={handleViewHistory}
          >
            查看历史详情
          </Button>
          <View className={styles.secondaryActions}>
            <Button
              className={styles.secondaryBtn}
              onClick={handleBackToTasks}
            >
              返回任务列表
            </Button>
            <Button
              className={styles.secondaryBtn}
              onClick={handleBackToMine}
            >
              查看我的记录
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SubmitResultPage;
