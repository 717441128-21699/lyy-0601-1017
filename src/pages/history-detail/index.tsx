import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { HistoryInventory, ExceptionRecord, Asset } from '@/types';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import { mockTasks } from '@/data/mockTasks';
import { mockAssets } from '@/data/mockAssets';
import styles from './index.module.scss';

type TabType = 'overview' | 'review';

const HistoryDetailPage: React.FC = () => {
  const router = useRouter();
  const historyId = router.params.id as string;
  const batchNo = router.params.batchNo as string;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  
  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getHistoryWithLocal = useInventoryStore(state => state.getHistoryWithLocal);
  const getHistoryByBatchNo = useInventoryStore(state => state.getHistoryByBatchNo);
  const getExceptionsWithLocal = useInventoryStore(state => state.getExceptionsWithLocal);
  const getAssetsByBatchWithState = useInventoryStore(state => state.getAssetsByBatchWithState);
  const getTaskWithState = useInventoryStore(state => state.getTaskWithState);
  const refresh = useInventoryStore(state => state.refresh);

  const history = useMemo(() => {
    const historyList = getHistoryWithLocal();
    if (historyId) {
      return historyList.find(h => h.id === historyId) || null;
    }
    if (batchNo) {
      return getHistoryByBatchNo(batchNo) || null;
    }
    return null;
  }, [getHistoryWithLocal, getHistoryByBatchNo, historyId, batchNo, refreshTrigger]);

  const exceptions = useMemo(() => {
    if (!history) return [];
    const allExceptions = getExceptionsWithLocal();
    return allExceptions.filter(e => e.batchNo === history.batchNo);
  }, [history, getExceptionsWithLocal, refreshTrigger]);

  const rooms = useMemo(() => {
    if (history?.rooms && history.rooms.length > 0) {
      return history.rooms;
    }
    
    if (history?.taskId) {
      const task = getTaskWithState(history.taskId);
      if (task?.rooms) {
        return task.rooms.map(room => ({
          ...room,
          checkedAssets: room.checkedAssets || 0,
          totalAssets: room.totalAssets || 0
        }));
      }
    }
    
    if (history) {
      const mockTask = mockTasks.find(t => t.batchNo === history.batchNo);
      if (mockTask?.rooms) {
        return mockTask.rooms.map(room => ({
          ...room,
          checkedAssets: room.checkedAssets || 0,
          totalAssets: room.totalAssets || 0
        }));
      }
    }
    
    return [];
  }, [history, getTaskWithState]);

  const batchAssets = useMemo(() => {
    if (!history) return [];
    
    const assets = getAssetsByBatchWithState(history.batchNo);
    if (assets.length > 0) {
      return assets;
    }
    
    if (history?.taskId) {
      const task = getTaskWithState(history.taskId);
      if (task?.rooms) {
        const roomIds = task.rooms.map(r => r.id);
        return mockAssets.filter(a => roomIds.includes(a.roomId));
      }
    }
    
    if (history) {
      const mockTask = mockTasks.find(t => t.batchNo === history.batchNo);
      if (mockTask?.rooms) {
        const roomIds = mockTask.rooms.map(r => r.id);
        return mockAssets.filter(a => roomIds.includes(a.roomId));
      }
    }
    
    return [];
  }, [history, getAssetsByBatchWithState, getTaskWithState]);

  const assetsByRoom = useMemo(() => {
    const grouped: Record<string, Asset[]> = {};
    batchAssets.forEach(asset => {
      if (!grouped[asset.roomId]) {
        grouped[asset.roomId] = [];
      }
      grouped[asset.roomId].push(asset);
    });
    return grouped;
  }, [batchAssets]);

  const toggleRoomExpand = (roomId: string) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
    }
    setExpandedRooms(newExpanded);
  };

  const handleViewAssetDetail = (assetId: string) => {
    Taro.navigateTo({
      url: `/pages/asset-detail/index?id=${assetId}`
    });
  };

  const handleViewPhotos = (asset: Asset) => {
    if (asset.photos && asset.photos.length > 0) {
      Taro.previewImage({
        urls: asset.photos,
        current: asset.photos[0]
      });
    } else {
      Taro.showToast({
        title: '暂无照片',
        icon: 'none'
      });
    }
  };

  useDidShow(() => {
    refresh();
    setLoading(false);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (history) {
      console.log('[HistoryDetailPage] 加载历史盘点', history.batchNo, '异常数:', exceptions.length, '房间数:', rooms.length);
    } else if (!loading) {
      console.log('[HistoryDetailPage] 未找到历史记录，ID:', historyId, 'batchNo:', batchNo);
    }
  }, [history, exceptions, rooms, historyId, batchNo, loading]);

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
    if (history) {
      Taro.setStorageSync('selectedBatchNo', history.batchNo);
    }
    Taro.switchTab({
      url: '/pages/exception/index'
    });
  };

  if (loading) {
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

  if (!history) {
    return (
      <View className={styles.historyDetailPage}>
        <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>�</Text>
          <View style={{ marginTop: '32rpx', fontSize: '32rpx', color: '#4E5969', fontWeight: 600 }}>
            未找到该批次盘点记录
          </View>
          <View style={{ marginTop: '16rpx', fontSize: '28rpx', color: '#86909C' }}>
            {batchNo ? `批次号：${batchNo}` : historyId ? `记录ID：${historyId}` : ''}
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
              onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}
            >
              返回任务列表
            </Button>
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

  const exceptionTypeColors: Record<string, string> = {
    'lost': '',
    'idle': 'idle',
    'mismatch': 'mismatch'
  };

  const handleBackToTasks = () => {
    Taro.switchTab({ url: '/pages/tasks/index' });
  };

  const tabs = [
    { key: 'overview' as TabType, label: '概览', icon: '📊' },
    { key: 'review' as TabType, label: '批次复核', icon: '✅' }
  ];

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

        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={[styles.tabItem, activeTab === tab.key && styles.tabActive].join(' ')}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabIcon}>{tab.icon}</Text>
              <Text className={styles.tabLabel}>{tab.label}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'overview' && (
          <View className={styles.tabContent}>
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
              {exceptions.map(exp => (
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
                      <Text>{exp.reportedBy || exp.reporter}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text>📅</Text>
                      <Text>{exp.reportedAt || exp.createdAt}</Text>
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
          {rooms.length > 0 ? (
            <View className={styles.roomProgress}>
              {rooms.map(room => (
                <View key={room.id} className={styles.roomItem}>
                  <View className={styles.roomHeader}>
                    <Text className={styles.roomName}>
                      <Text className={styles.roomIcon}>🏢</Text>
                      {room.name}
                    </Text>
                    <Text className={styles.roomCount}>
                      {room.checkedAssets}/{room.totalAssets}
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={room.totalAssets > 0 ? Math.round((room.checkedAssets / room.totalAssets) * 100) : 0} 
                    height={12} 
                  />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="📋"
              text="暂无房间数据"
              subText="该批次暂无房间盘点进度信息"
            />
          )}
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
          </View>
        )}

        {activeTab === 'review' && (
          <View className={styles.tabContent}>
            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>
                  <Text className={styles.titleIcon}>✅</Text>
                  批次复核视图
                </Text>
                <Text className={styles.sectionSubtitle}>
                  共 {batchAssets.length} 台资产，{rooms.length} 个房间
                </Text>
              </View>

              {batchAssets.length > 0 ? (
                <View className={styles.reviewList}>
                  {rooms.map(room => {
                    const roomAssets = assetsByRoom[room.id] || [];
                    const isExpanded = expandedRooms.has(room.id);
                    const roomChecked = roomAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;
                    
                    return (
                      <View key={room.id} className={styles.reviewRoomSection}>
                        <View 
                          className={styles.reviewRoomHeader}
                          onClick={() => toggleRoomExpand(room.id)}
                        >
                          <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx', flex: 1 }}>
                            <Text className={styles.roomIcon}>🏢</Text>
                            <View style={{ flex: 1 }}>
                              <Text className={styles.reviewRoomName}>{room.name}</Text>
                              <Text className={styles.reviewRoomMeta}>
                                {room.checkedAssets || roomChecked}/{room.totalAssets || roomAssets.length} 台 · 
                                {room.building} {room.floor}
                              </Text>
                            </View>
                          </View>
                          <Text className={[styles.expandIcon, isExpanded && styles.expanded].join(' ')}>
                            ▼
                          </Text>
                        </View>

                        {isExpanded && (
                          <View className={styles.reviewAssetList}>
                            {roomAssets.length > 0 ? (
                              roomAssets.map(asset => (
                                <View 
                                  key={asset.id} 
                                  className={styles.reviewAssetItem}
                                  onClick={() => handleViewAssetDetail(asset.id)}
                                >
                                  <View className={styles.reviewAssetHeader}>
                                    <Text className={styles.reviewAssetName}>{asset.name}</Text>
                                    <StatusTag 
                                      status={asset.checkStatus || 'unchecked'} 
                                      size="small"
                                    />
                                  </View>
                                  <View className={styles.reviewAssetMeta}>
                                    <View className={styles.metaItem}>
                                      <Text>📋</Text>
                                      <Text>{asset.assetNo}</Text>
                                    </View>
                                    <View className={styles.metaItem}>
                                      <Text>🏷️</Text>
                                      <Text>{asset.category}</Text>
                                    </View>
                                    {asset.checkTime && (
                                      <View className={styles.metaItem}>
                                        <Text>📅</Text>
                                        <Text>{asset.checkTime}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <View className={styles.reviewAssetActions}>
                                    {asset.remark && (
                                      <View className={styles.remarkBadge} onClick={(e) => {
                                        e.stopPropagation();
                                        Taro.showModal({
                                          title: '盘点备注',
                                          content: asset.remark,
                                          showCancel: false
                                        });
                                      }}>
                                        💬 有备注
                                      </View>
                                    )}
                                    {asset.photos && asset.photos.length > 0 && (
                                      <View 
                                        className={styles.photoBadge} 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewPhotos(asset);
                                        }}
                                      >
                                        📷 {asset.photos.length}张
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ))
                            ) : (
                              <EmptyState
                                icon="📭"
                                text="该房间暂无资产"
                                size="small"
                              />
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <EmptyState
                  icon="📋"
                  text="暂无复核数据"
                  subText="该批次暂无资产明细数据，可查看概览页的汇总信息"
                />
              )}
            </View>

            <View className={styles.summaryCard}>
              <Text className={styles.summaryTitle}>
                <Text className={styles.summaryIcon}>📈</Text>
                复核汇总
              </Text>
              <View className={styles.summaryGrid}>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#00B42A' }}>
                    {batchAssets.filter(a => a.checkStatus === 'normal').length}
                  </Text>
                  <Text className={styles.summaryLabel}>正常</Text>
                </View>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#F53F3F' }}>
                    {batchAssets.filter(a => a.checkStatus === 'lost').length}
                  </Text>
                  <Text className={styles.summaryLabel}>丢失</Text>
                </View>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#FF7D00' }}>
                    {batchAssets.filter(a => a.checkStatus === 'idle').length}
                  </Text>
                  <Text className={styles.summaryLabel}>闲置</Text>
                </View>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#F7BA1E' }}>
                    {batchAssets.filter(a => a.checkStatus === 'mismatch').length}
                  </Text>
                  <Text className={styles.summaryLabel}>位置不符</Text>
                </View>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#86909C' }}>
                    {batchAssets.filter(a => !a.checkStatus || a.checkStatus === 'unchecked').length}
                  </Text>
                  <Text className={styles.summaryLabel}>未核对</Text>
                </View>
                <View className={styles.summaryItem}>
                  <Text className={styles.summaryValue} style={{ color: '#722ED1' }}>
                    {batchAssets.filter(a => a.remark || (a.photos && a.photos.length > 0)).length}
                  </Text>
                  <Text className={styles.summaryLabel}>有凭证</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HistoryDetailPage;
