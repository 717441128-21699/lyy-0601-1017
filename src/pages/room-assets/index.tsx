import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { Asset, AssetStatus, InventoryTask } from '@/types';
import { getAssetsByRoom, searchAssets } from '@/data/mockAssets';
import { mockTasks } from '@/data/mockTasks';
import { storage } from '@/utils/storage';
import StatusTag from '@/components/StatusTag';
import ProgressBar from '@/components/ProgressBar';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
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
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const initial = getAssetsByRoom(roomId || 'room-001');
    console.log('[RoomAssetsPage] 初始加载资产', initial.length, '条');
    return initial;
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const currentTask: InventoryTask = mockTasks.find(t => t.id === taskId) || mockTasks[0];
  
  const currentRoom = currentTask?.rooms?.find(r => r.id === roomId) || {
    id: roomId,
    name: '会议室A',
    building: 'A栋',
    floor: '3层',
    totalAssets: assets.length,
    checkedAssets: assets.filter(a => a.checkStatus === 'normal').length
  };

  const roomProgress = currentRoom.totalAssets > 0 
    ? Math.round((currentRoom.checkedAssets / currentRoom.totalAssets) * 100) 
    : 0;

  const filteredAssets = useMemo(() => {
    let result = [...assets];
    
    if (filter === 'unchecked') {
      result = result.filter(a => a.checkStatus === 'unchecked');
    } else if (filter === 'checked') {
      result = result.filter(a => a.checkStatus !== 'unchecked');
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
    const updated = assets.map(a => {
      if (a.id === asset.id) {
        const record = {
          ...a,
          checkStatus: 'normal' as AssetStatus,
          checkTime: new Date().toLocaleString()
        };
        storage.saveDraftRecord({
          id: `auto-${Date.now()}`,
          taskId,
          assetId: asset.id,
          status: 'normal',
          remark: '',
          photos: [],
          isDraft: false,
          checkedAt: new Date().toLocaleString(),
          taskName: currentTask?.name || '盘点任务',
          batchNo: currentTask?.batchNo || '',
          assetNo: asset.assetNo,
          assetName: asset.name,
          checker: '当前用户',
          department: asset.department,
          roomName: asset.roomName
        });
        return record;
      }
      return a;
    });
    setAssets(updated);
    Taro.showToast({
      title: '已标记正常',
      icon: 'success',
      duration: 1500
    });
    console.log('[RoomAssetsPage] 快速标记资产正常', asset.assetNo);
  };

  const uncheckedCount = assets.filter(a => a.checkStatus === 'unchecked').length;
  const checkedCount = assets.filter(a => a.checkStatus !== 'unchecked').length;

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
            <Text className={styles.progressText}>{roomProgress}%</Text>
          </View>
          <ProgressBar progress={roomProgress} height={16} />
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
