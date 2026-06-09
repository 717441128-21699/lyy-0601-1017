import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, usePullDownRefresh } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { ExceptionRecord, AssetStatus } from '@/types';
import { getExceptionSummary } from '@/data/mockExceptions';
import ExceptionCard from '@/components/ExceptionCard';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

type TypeFilter = 'all' | AssetStatus;
type StatusFilter = 'all' | 'pending' | 'processing' | 'resolved';

const ExceptionPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(false);

  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getExceptionsWithLocal = useInventoryStore(state => state.getExceptionsWithLocal);
  const refresh = useInventoryStore(state => state.refresh);

  const exceptions = useMemo(() => {
    return getExceptionsWithLocal();
  }, [getExceptionsWithLocal, refreshTrigger]);

  const loadExceptions = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      refresh();
      setLoading(false);
      Taro.stopPullDownRefresh();
      console.log('[ExceptionPage] 异常列表刷新完成', exceptions.length);
    }, 500);
  }, [refresh, exceptions.length]);

  useEffect(() => {
    refresh();
    console.log('[ExceptionPage] 页面加载，刷新数据');
  }, [refresh]);

  usePullDownRefresh(() => {
    loadExceptions();
  });

  const filteredExceptions = exceptions.filter(exp => {
    const typeMatch = typeFilter === 'all' || exp.type === typeFilter;
    const statusMatch = statusFilter === 'all' || exp.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const handleGenerateSummary = () => {
    const idle = exceptions.filter(e => e.type === 'idle').length;
    const lost = exceptions.filter(e => e.type === 'lost').length;
    const mismatch = exceptions.filter(e => e.type === 'mismatch').length;
    const pending = exceptions.filter(e => e.status === 'pending').length;
    const processing = exceptions.filter(e => e.status === 'processing').length;
    const resolved = exceptions.filter(e => e.status === 'resolved').length;
    const total = exceptions.length;

    Taro.showModal({
      title: '异常汇总报告',
      content: `本次盘点异常汇总：\n\n异常总数：${total} 项\n\n闲置资产：${idle} 项\n丢失资产：${lost} 项\n位置不符：${mismatch} 项\n\n待处理：${pending} 项\n处理中：${processing} 项\n已解决：${resolved} 项`,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#165dff'
    });
    console.log('[ExceptionPage] 生成异常汇总', { total, idle, lost, mismatch, pending, processing, resolved });
  };

  const handleExceptionClick = (exception: ExceptionRecord) => {
    Taro.showModal({
      title: exception.assetName,
      content: `资产编号：${exception.assetNo}\n异常类型：${exception.type === 'idle' ? '闲置' : exception.type === 'lost' ? '丢失' : '位置不符'}\n\n异常描述：\n${exception.description}\n\n处理状态：${exception.status === 'pending' ? '待处理' : exception.status === 'processing' ? '处理中' : '已解决'}\n${exception.remark ? `\n处理备注：\n${exception.remark}` : ''}`,
      showCancel: false,
      confirmText: '关闭',
      confirmColor: '#165dff'
    });
  };

  const summary = {
    idle: exceptions.filter(e => e.type === 'idle').length,
    lost: exceptions.filter(e => e.type === 'lost').length,
    mismatch: exceptions.filter(e => e.type === 'mismatch').length,
    pending: exceptions.filter(e => e.status === 'pending').length,
    total: exceptions.length
  };

  const typeFilters: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'idle', label: '闲置' },
    { key: 'lost', label: '丢失' },
    { key: 'mismatch', label: '位置不符' }
  ];

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '全部状态' },
    { key: 'pending', label: '待处理' },
    { key: 'processing', label: '处理中' },
    { key: 'resolved', label: '已解决' }
  ];

  return (
    <View className={styles.exceptionPage}>
      <View className={styles.statsSection}>
        <Text className={styles.statsTitle}>
          <Text className={styles.titleIcon}>⚠️</Text>
          异常统计
        </Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>📦</Text>
            <Text className={styles.statValue}>{summary.idle}</Text>
            <Text className={styles.statLabel}>闲置</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>❓</Text>
            <Text className={styles.statValue}>{summary.lost}</Text>
            <Text className={styles.statLabel}>丢失</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>📍</Text>
            <Text className={styles.statValue}>{summary.mismatch}</Text>
            <Text className={styles.statLabel}>位置不符</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>⏳</Text>
            <Text className={styles.statValue}>{summary.pending}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterRow}>
          <Text className={styles.filterLabel}>异常类型</Text>
          <ScrollView scrollX className={styles.filterTabs}>
            {typeFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.tabItem, typeFilter === f.key && styles.active)}
                onClick={() => setTypeFilter(f.key)}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <View className={styles.filterRow}>
          <Text className={styles.filterLabel}>处理状态</Text>
          <ScrollView scrollX className={styles.filterTabs}>
            {statusFilters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.tabItem, statusFilter === f.key && styles.active)}
                onClick={() => setStatusFilter(f.key)}
              >
                <Text>{f.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      <View className={styles.summaryBtn}>
        <Button className={styles.btn} onClick={handleGenerateSummary}>
          <Text className={styles.btnIcon}>📊</Text>
          <Text>生成异常汇总</Text>
        </Button>
      </View>

      <ScrollView 
        scrollY 
        className={styles.exceptionList}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={loadExceptions}
      >
        {filteredExceptions.length > 0 ? (
          filteredExceptions.map(exp => (
            <ExceptionCard
              key={exp.id}
              exception={exp}
              onClick={handleExceptionClick}
            />
          ))
        ) : (
          <EmptyState
            icon="✅"
            text="暂无异常记录"
            subText={typeFilter !== 'all' || statusFilter !== 'all' ? '切换筛选条件查看更多' : '所有资产状态正常'}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ExceptionPage;
