import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { Asset, AssetStatus, InventoryTask, CheckRecord } from '@/types';
import { getAssetsByRoom } from '@/data/mockAssets';
import { storage } from '@/utils/storage';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

type FilterType = 'all' | 'unchecked' | 'checked';

const categoryIcons: Record<string, string> = {
  '电子设备': '💻',
  '办公设备': '🖨️',
  '办公家具': '🪑',
  '网络设备': '🔌',
  '服务器设备': '🖥️',
  '数码设备': '📷'
};

const RoomAssetsPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.roomId as string;
  const taskId = router.params.taskId as string;
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getAssetsByRoomWithState = useInventoryStore(state => state.getAssetsByRoomWithState);
  const getTaskWithState = useInventoryStore(state => state.getTaskWithState);
  const getRoomCheckProgress = useInventoryStore(state => state.getRoomCheckProgress);
  const markAssetChecked = useInventoryStore(state => state.markAssetChecked);
  const submitCheckResult = useInventoryStore(state => state.submitCheckResult);
  const refresh = useInventoryStore(state => state.refresh);

  const assets = useMemo(() => {
    return getAssetsByRoomWithState(roomId || 'room-001');
  }, [getAssetsByRoomWithState, roomId, refreshTrigger]);

  const currentTask = useMemo(() => {
    return getTaskWithState(taskId || 'task-001');
  }, [getTaskWithState, taskId, refreshTrigger]);

  const roomProgress = useMemo(() => {
    return getRoomCheckProgress(roomId || 'room-001', taskId || 'task-001');
  }, [getRoomCheckProgress, roomId, taskId, refreshTrigger]);

  const currentRoom = useMemo(() => {
    if (!currentTask) {
      return {
        id: roomId,
        name: '会议室A',
        building: 'A栋',
        floor: '3层',
        totalAssets: assets.length,
        checkedAssets: roomProgress.checked
      };
    }
    
    const room = currentTask.rooms?.find(r => r.id === roomId);
    return {
      id: roomId,
      name: room?.name || '会议室A',
      building: room?.building || 'A栋',
      floor: room?.floor || '3层',
      totalAssets: roomProgress.total,
      checkedAssets: roomProgress.checked
    };
  }, [currentTask, roomId, assets.length, roomProgress]);

  useEffect(() => {
    refresh();
    console.log('[RoomAssetsPage] 页面加载，刷新数据');
  }, [refresh]);

  useDidShow(() => {
    refresh();
    console.log('[RoomAssetsPage] 页面显示，刷新数据');
  });

  const filteredAssets = useMemo(() => {
    let result = [...assets];
    
    if (filter === 'unchecked') {
      result = result.filter(a => !a.checkStatus || a.checkStatus === 'unchecked');
    } else if (filter === 'checked') {
      result = result.filter(a => a.checkStatus && a.checkStatus !== 'unchecked');
    }
    
    if (searchText) {
      result = result.filter(a => 
        a.assetNo.toLowerCase().includes(searchText.toLowerCase()) ||
        a.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return result;
  }, [assets, filter, searchText]);

  const handleAssetClick = (asset: Asset) => {
    Taro.navigateTo({
      url: `/pages/asset-detail/index?id=${asset.id}`
    });
  };

  const handleScan = () => {
    Taro.switchTab({
      url: '/pages/scan/index'
    });
  };

  const handleCheck = (asset: Asset) => {
    const checkTime = new Date().toLocaleString();
    const status = 'normal' as AssetStatus;
    
    markAssetChecked(asset.id, asset.roomId, taskId || 'task-001', status);

    const record: CheckRecord = {
      id: `auto-${Date.now()}`,
      taskId: taskId || 'task-001',
      taskName: currentTask?.name || '盘点任务',
      batchNo: currentTask?.batchNo || '',
      assetId: asset.id,
      assetNo: asset.assetNo,
      assetName: asset.name,
      status: status,
      remark: '',
      photos: [],
      checker: '当前用户',
      department: asset.department,
      roomName: asset.roomName,
      checkedAt: checkTime,
      isDraft: false
    };

    submitCheckResult(record, false);

    Taro.showToast({
      title: '已标记正常',
      icon: 'success',
      duration: 1500
    });
    console.log('[RoomAssetsPage] 快速标记资产正常', asset.assetNo, '房间进度:', roomProgress.checked + 1, '/', roomProgress.total);
  };

  const uncheckedCount = assets.filter(a => !a.checkStatus || a.checkStatus === 'unchecked').length;
  const checkedCount = assets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;

  return (
    <View className={styles.roomAssetsPage}>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.roomInfoCard}>
          <Text className={styles.roomName}>
            <Text className={styles.roomIcon}>📍</Text>
            {currentRoom.name}
          </Text>
          <Text className={styles.roomLocation}>
            {currentRoom.building} {currentRoom.floor}
          </Text>
          <View className={styles.roomStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{currentRoom.totalAssets}</Text>
              <Text className={styles.statLabel}>总数量</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{currentRoom.checkedAssets}</Text>
              <Text className={styles.statLabel}>已盘点</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FF7D00' }}>{uncheckedCount}</Text>
              <Text className={styles.statLabel}>待核对</Text>
            </View>
          </View>
        </View>

        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressTitle}>盘点进度</Text>
            <Text className={styles.progressText}>{roomProgress.progress}%</Text>
          </View>
          <ProgressBar progress={roomProgress.progress} height={16} />
        </View>

        {showSearch && (
          <View style={{ marginBottom: '24rpx' }}>
            <SearchBar
              value={searchText}
              onChange={setSearchText}
              onClear={() => setSearchText('')}
              placeholder="搜索资产编号/名称..."
            />
          </View>
        )}

        <View className={styles.filterSection}>
          <View
            className={classnames(styles.filterItem, filter === 'all' && styles.active)}
            onClick={() => setFilter('all')}
          >
            <Text>全部 ({assets.length})</Text>
          </View>
          <View
            className={classnames(styles.filterItem, filter === 'unchecked' && styles.active)}
            onClick={() => setFilter('unchecked')}
          >
            <Text>待核对 ({uncheckedCount})</Text>
          </View>
          <View
            className={classnames(styles.filterItem, filter === 'checked' && styles.active)}
            onClick={() => setFilter('checked')}
          >
            <Text>已盘点 ({checkedCount})</Text>
          </View>
        </View>

        <View className={styles.assetList}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map(asset => (
              <View key={asset.id} className={styles.assetCard}>
                <View className={styles.assetHeader}>
                  <View className={styles.assetInfo}>
                    <Text className={styles.assetName}>
                      {categoryIcons[asset.category] || '📦'} {asset.name}
                    </Text>
                    <Text className={styles.assetNo}>📋 {asset.assetNo}</Text>
                  </View>
                  <StatusTag status={asset.checkStatus || asset.status} />
                </View>
                <View className={styles.assetMeta}>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>💳</Text>
                    <Text>{asset.brand} {asset.model}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>💰</Text>
                    <Text>¥{asset.price.toLocaleString()}</Text>
                  </View>
                  <View className={styles.metaItem}>
                    <Text className={styles.metaIcon}>📅</Text>
                    <Text>{asset.purchaseDate}</Text>
                  </View>
                </View>
                <View className={styles.assetActions}>
                  {asset.checkTime && (
                    <Text style={{ fontSize: '24rpx', color: '#86909C' }}>
                      ✅ {asset.checkTime}
                    </Text>
                  )}
                  {asset.checkStatus === 'unchecked' ? (
                    <Button
                      className={styles.actionBtn}
                      onClick={() => handleCheck(asset)}
                    >
                      标记正常
                    </Button>
                  ) : (
                    <Button
                      className={styles.checkedBtn}
                      onClick={() => handleAssetClick(asset)}
                    >
                      查看详情
                    </Button>
                  )}
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              icon="📦"
              text={searchText ? '未找到匹配的资产' : '暂无资产数据'}
              subText={searchText ? '请尝试其他关键词' : '该房间尚未录入资产'}
            />
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.btnScan} onClick={handleScan}>
          <Text className={styles.scanIcon}>📷</Text>
          <Text>扫码盘点</Text>
        </Button>
        <Button
          className={styles.btnSearch}
          onClick={() => setShowSearch(!showSearch)}
        >
          <Text>{showSearch ? '✕' : '🔍'}</Text>
        </Button>
      </View>
    </View>
  );
};

export default RoomAssetsPage;
