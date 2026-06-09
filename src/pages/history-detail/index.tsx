import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { HistoryInventory, ExceptionRecord } from '@/types';
import { getExceptionSummary } from '@/data/mockExceptions';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

const HistoryDetailPage: React.FC = () => {
  const router = useRouter();
  const historyId = router.params.id as string;
  
  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getHistoryWithLocal = useInventoryStore(state => state.getHistoryWithLocal);
  const getExceptionsWithLocal = useInventoryStore(state => state.getExceptionsWithLocal);

  const history = useMemo(() => {
    const historyList = getHistoryWithLocal();
    return historyList.find(h => h.id === historyId) || null;
  }, [getHistoryWithLocal, historyId, refreshTrigger]);

  const exceptions = useMemo(() => {
    if (!history) return [];
    const allExceptions = getExceptionsWithLocal();
    return allExceptions.filter(e => e.batchNo === history.batchNo);
  }, [history, getExceptionsWithLocal, refreshTrigger]);

  useEffect(() => {
    if (history) {
      console.log('[HistoryDetailPage] 加载历史盘点', history.batchNo, '异常数:', exceptions.length);
    } else {
      console.log('[HistoryDetailPage] 未找到历史记录，ID:', historyId);
    }
  }, [history, exceptions, historyId]);

  const handleExport = () => {
    Taro.showModal({
      title: '导出报告',
      content: '确定导出该批次的盘点报告吗？\n报告将包含：\n• 资产盘点明细\n• 异常情况汇总\n• 部门完成情况',
      confirmText: '确认导出',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '报告已生成',
            icon: 'success',
            duration: 2000
          });
          console.log('[HistoryDetailPage] 导出盘点报告', history?.batchNo);
        }
      }
    });
  };

  const handleViewExceptions = () => {
    Taro.switchTab({
      url: '/pages/exception/index'
    });
  };

  if (!history) {
    return (
      <View className={styles.historyDetailPage}>
        <View style={{ padding: '120rpx 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>📚</Text>
          <View style={{ marginTop: '32rpx', fontSize: '28rpx', color: '#86909C' }}>
            加载中...
          </View>
        </View>
      </View>
    );
  }

  const exceptionSummary = {
    idle: exceptions.filter(e => e.type === 'idle').length,
    lost: exceptions.filter(e => e.type === 'lost').length,
    mismatch: exceptions.filter(e => e.type === 'mismatch').length,
    pending: exceptions.filter(e => e.status === 'pending').length,
    processing: exceptions.filter(e => e.status === 'processing').length,
    resolved: exceptions.filter(e => e.status === 'resolved').length,
    total: exceptions.length
  };
  const mockRooms = [
    { id: 'r1', name: '会议室A', checked: 8, total: 8 },
    { id: 'r2', name: '开放办公区', checked: 15, total: 16 },
    { id: 'r3', name: '机房', checked: 4, total: 4 },
    { id: 'r4', name: '文件室', checked: 6, total: 6 }
  ];

  const exceptionTypeColors: Record<string, string> = {
    'lost': '',
    'idle': 'idle',
    'mismatch': 'mismatch'
  };

  return (
    <View className={styles.historyDetailPage}>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.headerCard}>
          <Text className={styles.historyName}>
            <Text className={styles.historyIcon}>📋</Text>
            {history.name}
          </Text>
          <View className={styles.historyMeta}>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>批次号：</Text>
              <Text>{history.batchNo}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>盘点人：</Text>
              <Text>{history.checker}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaLabel}>完成时间：</Text>
              <Text>{history.completedAt}</Text>
            </View>
          </View>
          <View className={styles.historyStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{history.totalAssets}</Text>
              <Text className={styles.statLabel}>总数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#00B42A' }}>{history.normalAssets}</Text>
              <Text className={styles.statLabel}>正常</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{history.exceptionAssets}</Text>
              <Text className={styles.statLabel}>异常</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FF7D00' }}>{history.idleAssets}</Text>
              <Text className={styles.statLabel}>闲置</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📊</Text>
              盘点汇总
            </Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '24rpx' }}>
            <View>
              <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12rpx' }}>
                <Text style={{ fontSize: '28rpx', color: '#4E5969' }}>整体完成率</Text>
                <Text style={{ fontSize: '28rpx', fontWeight: 600, color: '#165DFF' }}>
                  {Math.round(((history.normalAssets + history.idleAssets) / history.totalAssets) * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={Math.round(((history.normalAssets + history.idleAssets) / history.totalAssets) * 100)} 
                height={16} 
              />
            </View>
            <View style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24rpx',
              paddingTop: '8rpx'
            }}>
              <View style={{ 
                background: 'rgba(22, 93, 255, 0.08)', 
                padding: '24rpx', 
                borderRadius: '16rpx' 
              }}>
                <Text style={{ fontSize: '24rpx', color: '#86909C' }}>异常总数</Text>
                <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#F53F3F', display: 'block' }}>
                  {exceptionSummary?.total || history.exceptionAssets}
                </Text>
              </View>
              <View style={{ 
                background: 'rgba(255, 125, 0, 0.08)', 
                padding: '24rpx', 
                borderRadius: '16rpx' 
              }}>
                <Text style={{ fontSize: '24rpx', color: '#86909C' }}>资产总值</Text>
                <Text style={{ fontSize: '40rpx', fontWeight: 700, color: '#FF7D00', display: 'block' }}>
                  ¥{(Math.random() * 500000 + 100000).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>⚠️</Text>
              异常资产列表
            </Text>
            <Text className={styles.sectionAction} onClick={handleViewExceptions}>
              查看全部
            </Text>
          </View>
          {exceptions.length > 0 ? (
            <View className={styles.exceptionList}>
              {exceptions.slice(0, 3).map(exp => (
                <View 
                  key={exp.id} 
                  className={[styles.exceptionItem, styles[exceptionTypeColors[exp.type] || '']].join(' ')}
                >
                  <View className={styles.exceptionHeader}>
                    <Text className={styles.assetName}>{exp.assetName}</Text>
                    <StatusTag status={exp.type === 'lost' ? 'lost' : exp.type as any} />
                  </View>
                  <View className={styles.exceptionMeta}>
                    <View className={styles.metaItem}>
                      <Text>📋</Text>
                      <Text>{exp.assetNo}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📍</Text>
                      <Text>{exp.roomName}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>👤</Text>
                      <Text>{exp.reportedBy}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📅</Text>
                      <Text>{exp.reportedAt}</Text>
                    </View>
                  </View>
                  {exp.description && (
                    <View style={{ marginTop: '16rpx', fontSize: '24rpx', color: '#4E5969' }}>
                      💬 {exp.description}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="✅"
              text="无异常资产"
              subText="该批次盘点未发现异常情况"
            />
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.titleIcon}>📍</Text>
              房间盘点进度
            </Text>
          </View>
          <View className={styles.roomProgress}>
            {mockRooms.map(room => (
              <View key={room.id} className={styles.roomItem}>
                <View className={styles.roomHeader}>
                  <Text className={styles.roomName}>
                    <Text className={styles.roomIcon}>🏢</Text>
                    {room.name}
                  </Text>
                  <Text className={styles.roomCount}>
                    {room.checked}/{room.total}
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.round((room.checked / room.total) * 100)} 
                  height={12} 
                />
              </View>
            ))}
          </View>
        </View>

        <View className={styles.actionCard}>
          <View className={styles.actionItem} onClick={handleExport}>
            <Text className={styles.actionIcon}>📤</Text>
            <Text className={styles.actionText}>导出报告</Text>
          </View>
          <View className={styles.actionItem} onClick={handleViewExceptions}>
            <Text className={styles.actionIcon}>📊</Text>
            <Text className={styles.actionText}>异常详情</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HistoryDetailPage;
