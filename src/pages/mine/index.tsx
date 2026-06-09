import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { CheckRecord, HistoryInventory, UserInfo } from '@/types';
import { storage } from '@/utils/storage';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

type TabType = 'draft' | 'history';

const mockUser: UserInfo = {
  id: 'user-001',
  name: '张三',
  phone: '13800138000',
  department: '技术研发部',
  departmentId: 'dept-001',
  role: 'manager'
};

const MinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('draft');
  const [user] = useState<UserInfo>(mockUser);

  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const refresh = useInventoryStore(state => state.refresh);
  const getTasksWithState = useInventoryStore(state => state.getTasksWithState);
  const submitInventoryResult = useInventoryStore(state => state.submitInventoryResult);
  const getHistoryWithLocal = useInventoryStore(state => state.getHistoryWithLocal);

  const tasks = useMemo(() => getTasksWithState(), [getTasksWithState, refreshTrigger]);
  const historyList = useMemo(() => getHistoryWithLocal(), [getHistoryWithLocal, refreshTrigger]);

  const ongoingTask = useMemo(() => {
    return tasks.find(t => t.status === 'ongoing');
  }, [tasks]);

  const draftRecords = useMemo(() => {
    return storage.getDraftRecords();
  }, [refreshTrigger]);

  useDidShow(() => {
    refresh();
    console.log('[MinePage] 页面显示，刷新数据');
  });

  const handleSubmitResult = useCallback(() => {
    if (!ongoingTask) {
      Taro.showToast({
        title: '没有进行中的任务',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    Taro.showModal({
      title: '提交盘点结果',
      content: `确定提交${user.department}的盘点结果吗？\n\n任务：${ongoingTask.name}\n批次：${ongoingTask.batchNo}\n暂存记录：${draftRecords.length}条\n\n提交后将无法修改，请确认所有资产已盘点完成。`,
      confirmText: '确认提交',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          const history = submitInventoryResult(ongoingTask.id);
          if (history) {
            Taro.showToast({
              title: '提交成功',
              icon: 'success',
              duration: 2000
            });
            console.log('[MinePage] 提交盘点结果成功，生成历史记录:', history.batchNo);
          } else {
            Taro.showToast({
              title: '提交失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  }, [ongoingTask, user.department, draftRecords.length, submitInventoryResult]);

  const handleDeleteDraft = (recordId: string) => {
    Taro.showModal({
      title: '删除确认',
      content: '确定删除这条暂存记录吗？',
      confirmText: '删除',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          storage.removeDraftRecord(recordId);
          refresh();
          Taro.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
          });
          console.log('[MinePage] 删除暂存记录', recordId);
        }
      }
    });
  };

  const handleEditDraft = (record: CheckRecord) => {
    Taro.navigateTo({
      url: `/pages/asset-detail/index?id=${record.assetId}`
    });
  };

  const handleHistoryClick = (history: HistoryInventory) => {
    Taro.navigateTo({
      url: `/pages/history-detail/index?id=${history.id}`
    });
  };

  const roleText: Record<string, string> = {
    admin: '系统管理员',
    manager: '部门资产管理员',
    operator: '盘点操作员'
  };

  const functions = [
    { icon: '📝', label: '暂存记录', class: 'draft', onClick: () => setActiveTab('draft') },
    { icon: '📚', label: '历史盘点', class: 'history', onClick: () => setActiveTab('history') },
    { icon: '✅', label: '提交结果', class: 'submit', onClick: handleSubmitResult },
    { icon: 'ℹ️', label: '关于', class: 'about', onClick: () => Taro.showToast({ title: '资产盘点 v1.0.0', icon: 'none' }) }
  ];

  return (
    <View className={styles.minePage}>
      <View className={styles.profileSection}>
        <View className={styles.profileCard}>
          <View className={styles.avatar}>
            <Text>{user.name.charAt(0)}</Text>
          </View>
          <View className={styles.profileInfo}>
            <Text className={styles.userName}>{user.name}</Text>
            <Text className={styles.userDept}>{user.department}</Text>
            <Text className={styles.userRole}>{roleText[user.role]}</Text>
          </View>
        </View>
      </View>

      <View className={styles.contentSection}>
        <View className={styles.functionGrid}>
          {functions.map((fn, index) => (
            <View 
              key={index} 
              className={styles.functionItem}
              onClick={fn.onClick}
            >
              <View className={classnames(styles.functionIcon, styles[fn.class])}>
                <Text>{fn.icon}</Text>
              </View>
              <Text className={styles.functionLabel}>{fn.label}</Text>
              {fn.label === '暂存记录' && draftRecords.length > 0 && (
                <View className={styles.badge}>{draftRecords.length}</View>
              )}
            </View>
          ))}
        </View>

        <View className={styles.tabSection}>
          <View
            className={classnames(styles.tabItem, activeTab === 'draft' && styles.active)}
            onClick={() => setActiveTab('draft')}
          >
            <Text>暂存记录 ({draftRecords.length})</Text>
          </View>
          <View
            className={classnames(styles.tabItem, activeTab === 'history' && styles.active)}
            onClick={() => setActiveTab('history')}
          >
            <Text>历史盘点</Text>
          </View>
        </View>

        <ScrollView scrollY className={styles.recordList}>
          {activeTab === 'draft' ? (
            draftRecords.length > 0 ? (
              draftRecords.map((record, index) => (
                <View key={record.id} className={styles.recordCard}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordTitle}>{record.assetName}</Text>
                    <StatusTag status={record.status} />
                  </View>
                  <View className={styles.recordMeta}>
                    <View className={styles.metaItem}>
                      <Text>📋</Text>
                      <Text>{record.assetNo}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📍</Text>
                      <Text>{record.roomName}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📝</Text>
                      <Text>{record.taskName}</Text>
                    </View>
                  </View>
                  {record.remark && (
                    <View style={{ marginBottom: '16rpx', fontSize: '24rpx', color: '#4E5969' }}>
                      备注：{record.remark}
                    </View>
                  )}
                  <View className={styles.recordFooter}>
                    <Text className={styles.checkTime}>🕐 {record.checkedAt}</Text>
                    <View style={{ display: 'flex', gap: '16rpx' }}>
                      <Button
                        className={classnames(styles.actionBtn, styles.secondary)}
                        onClick={() => handleDeleteDraft(record.id)}
                      >
                        删除
                      </Button>
                      <Button
                        className={styles.actionBtn}
                        onClick={() => handleEditDraft(record)}
                      >
                        继续编辑
                      </Button>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                icon="📝"
                text="暂无暂存记录"
                subText="扫码盘点时点击暂存可保存记录"
              />
            )
          ) : (
            historyList.length > 0 ? (
              historyList.map(history => (
                <View 
                  key={history.id} 
                  className={styles.recordCard}
                  onClick={() => handleHistoryClick(history)}
                >
                  <View className={styles.recordHeader}>
                    <Text className={styles.recordTitle}>{history.name}</Text>
                    <StatusTag status="completed" text="已完成" />
                  </View>
                  <View className={styles.recordMeta}>
                    <View className={styles.metaItem}>
                      <Text>📋</Text>
                      <Text>{history.batchNo}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>👤</Text>
                      <Text>{history.checker}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📅</Text>
                      <Text>{history.year}年{history.quarter}</Text>
                    </View>
                  </View>
                  <View className={styles.recordStats}>
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
                  <View className={styles.recordFooter}>
                    <Text className={styles.checkTime}>✅ 完成时间：{history.completedAt}</Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                icon="📚"
                text="暂无历史记录"
                subText="完成盘点后将自动记录"
              />
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default MinePage;
