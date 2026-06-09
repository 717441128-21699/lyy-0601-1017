import React, { useState, useMemo } from 'react';
import { View, Text, Input, Image, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Asset, AssetStatus, CheckRecord } from '@/types';
import { getAssetByNo, searchAssets } from '@/data/mockAssets';
import { useScanCode } from '@/hooks/useScanCode';
import SearchBar from '@/components/SearchBar';
import AssetCard from '@/components/AssetCard';
import StatusTag from '@/components/StatusTag';
import { storage } from '@/utils/storage';
import { useInventoryStore } from '@/store';
import styles from './index.module.scss';

const statusOptions = [
  { status: 'normal' as AssetStatus, icon: '✅', name: '正常', desc: '资产完好，位置正确' },
  { status: 'idle' as AssetStatus, icon: '📦', name: '闲置', desc: '资产完好，使用频率低' },
  { status: 'lost' as AssetStatus, icon: '❓', name: '丢失', desc: '无法找到，疑似丢失' },
  { status: 'mismatch' as AssetStatus, icon: '📍', name: '位置不符', desc: '实际位置与登记不符' }
];

const ScanPage: React.FC = () => {
  const { scanning, scan } = useScanCode();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  
  const refreshTrigger = useInventoryStore(state => state.refreshTrigger);
  const getTasksWithState = useInventoryStore(state => state.getTasksWithState);
  const submitCheckResult = useInventoryStore(state => state.submitCheckResult);
  const markAssetChecked = useInventoryStore(state => state.markAssetChecked);
  const getAssetWithCheckState = useInventoryStore(state => state.getAssetWithCheckState);

  const ongoingTasks = useMemo(() => {
    return getTasksWithState().filter(t => t.status === 'ongoing');
  }, [getTasksWithState, refreshTrigger]);

  const currentTask = ongoingTasks[0] || null;

  const handleScan = async () => {
    if (!currentTask) {
      Taro.showToast({
        title: '请先领取盘点任务',
        icon: 'none',
        duration: 2000
      });
      Taro.switchTab({
        url: '/pages/tasks/index'
      });
      return;
    }

    const result = await scan();
    if (result) {
      const asset = getAssetWithCheckState(result);
      if (asset) {
        setCurrentAsset(asset);
        setSelectedStatus(null);
        setPhotos([]);
        setRemark('');
        console.log('[ScanPage] 扫码找到资产', asset.assetNo);
      } else {
        const rawAsset = getAssetByNo(result);
        if (rawAsset) {
          setCurrentAsset(rawAsset);
          setSelectedStatus(null);
          setPhotos([]);
          setRemark('');
        } else {
          Taro.showToast({
            title: '未找到该资产',
            icon: 'none',
            duration: 2000
          });
          console.log('[ScanPage] 扫码未找到资产', result);
        }
      }
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.trim()) {
      const results = searchAssets(keyword);
      if (results.length > 0) {
        const asset = getAssetWithCheckState(results[0].id) || results[0];
        setCurrentAsset(asset);
        setSelectedStatus(null);
        setPhotos([]);
        setRemark('');
        console.log('[ScanPage] 搜索找到资产', results[0].assetNo);
      } else {
        Taro.showToast({
          title: '未找到匹配的资产',
          icon: 'none',
          duration: 2000
        });
      }
    }
  };

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - photos.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setPhotos(prev => [...prev, ...res.tempFilePaths]);
      console.log('[ScanPage] 选择照片成功', res.tempFilePaths.length);
    } catch (error) {
      console.error('[ScanPage] 选择照片失败', error);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!currentAsset || !selectedStatus) {
      Taro.showToast({
        title: '请先选择资产状态',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const taskId = currentTask?.id || 'task-001';
    const taskName = currentTask?.name || '盘点任务';
    const batchNo = currentTask?.batchNo || 'PD-2026-Q2';

    const record: CheckRecord = {
      id: `draft-${Date.now()}`,
      taskId,
      taskName,
      batchNo,
      assetId: currentAsset.id,
      assetNo: currentAsset.assetNo,
      assetName: currentAsset.name,
      status: selectedStatus,
      remark: remark,
      photos: photos,
      checker: '当前用户',
      department: currentAsset.department,
      roomName: currentAsset.roomName,
      checkedAt: new Date().toLocaleString(),
      isDraft: true
    };

    storage.saveDraftRecord(record);
    markAssetChecked(currentAsset.id, currentAsset.roomId, taskId, selectedStatus);
    
    Taro.showToast({
      title: '已暂存',
      icon: 'success',
      duration: 2000
    });
    resetForm();
    console.log('[ScanPage] 暂存记录成功', record.assetNo);
  };

  const handleSubmit = () => {
    if (!currentAsset || !selectedStatus) {
      Taro.showToast({
        title: '请先选择资产状态',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const taskId = currentTask?.id || 'task-001';
    const taskName = currentTask?.name || '盘点任务';
    const batchNo = currentTask?.batchNo || 'PD-2026-Q2';
    const isException = selectedStatus !== 'normal';

    Taro.showModal({
      title: '提交盘点结果',
      content: `确定提交该资产的盘点结果吗？\n资产：${currentAsset.name}\n状态：${statusOptions.find(o => o.status === selectedStatus)?.name}${isException ? '\n⚠️ 异常记录将自动上报' : ''}`,
      confirmText: '确认提交',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          const record: CheckRecord = {
            id: `record-${Date.now()}`,
            taskId,
            taskName,
            batchNo,
            assetId: currentAsset.id,
            assetNo: currentAsset.assetNo,
            assetName: currentAsset.name,
            status: selectedStatus,
            remark: remark,
            photos: photos,
            checker: '当前用户',
            department: currentAsset.department,
            roomName: currentAsset.roomName,
            checkedAt: new Date().toLocaleString(),
            isDraft: false
          };

          submitCheckResult(record, isException);
          markAssetChecked(currentAsset.id, currentAsset.roomId, taskId, selectedStatus);

          console.log('[ScanPage] 提交盘点结果', record, '异常:', isException);
          Taro.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          });
          resetForm();
        }
      }
    });
  };

  const resetForm = () => {
    setCurrentAsset(null);
    setSelectedStatus(null);
    setPhotos([]);
    setRemark('');
    setSearchKeyword('');
  };

  const handleQuickAction = (action: string) => {
    if (action === 'search') {
      Taro.showToast({
        title: '请在上方搜索栏输入',
        icon: 'none',
        duration: 1500
      });
    } else if (action === 'draft') {
      Taro.switchTab({
        url: '/pages/mine/index'
      });
    }
  };

  return (
    <View className={styles.scanPage}>
      <View className={styles.searchSection}>
        <SearchBar
          value={searchKeyword}
          onChange={handleSearch}
          placeholder="输入资产编号、名称搜索..."
        />
      </View>

      {!currentAsset ? (
        <View className={styles.scanGuide}>
          <View className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanIcon}>📷</Text>
            <Text className={styles.scanText}>{scanning ? '扫码中...' : '点击扫码'}</Text>
          </View>
          <Text className={styles.guideTitle}>扫描资产二维码</Text>
          <Text className={styles.guideDesc}>
            将二维码置于取景框内，自动识别资产信息
          </Text>

          <View className={styles.quickActions}>
            <View className={styles.actionItem} onClick={() => handleQuickAction('search')}>
              <View className={styles.actionIcon}>🔍</View>
              <Text className={styles.actionLabel}>手动搜索</Text>
            </View>
            <View className={styles.actionItem} onClick={() => handleQuickAction('draft')}>
              <View className={styles.actionIcon}>📝</View>
              <Text className={styles.actionLabel}>暂存记录</Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView scrollY className={styles.assetResult}>
          <View className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📦</Text>
            <Text>资产信息</Text>
          </View>
          <AssetCard asset={currentAsset} showStatus={false} />

          <View className={styles.statusSelector}>
            <Text className={styles.selectorTitle}>选择盘点状态</Text>
            <View className={styles.statusGrid}>
              {statusOptions.map(option => (
                <View
                  key={option.status}
                  className={classnames(
                    styles.statusOption,
                    styles[option.status],
                    selectedStatus === option.status && styles.selected
                  )}
                  onClick={() => setSelectedStatus(option.status)}
                >
                  <Text className={styles.optionIcon}>{option.icon}</Text>
                  <View className={styles.optionInfo}>
                    <Text className={styles.optionName}>{option.name}</Text>
                    <Text className={styles.optionDesc}>{option.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.photoUpload}>
            <View className={styles.uploadTitle}>
              <Text>现场照片（可选）</Text>
              <Text className={styles.photoCount}>{photos.length}/9</Text>
            </View>
            <View className={styles.photoList}>
              {photos.map((photo, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image src={photo} mode="aspectFill" />
                  <View className={styles.deleteBtn} onClick={() => handleDeletePhoto(index)}>
                    <Text>✕</Text>
                  </View>
                </View>
              ))}
              {photos.length < 9 && (
                <View className={styles.addPhoto} onClick={handleChooseImage}>
                  <Text className={styles.addIcon}>+</Text>
                  <Text className={styles.addText}>添加照片</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.remarkSection}>
            <Text className={styles.remarkTitle}>补充备注（可选）</Text>
            <Textarea
              className={styles.remarkInput}
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              placeholder="请输入备注说明，如资产现状、异常原因等..."
              maxlength={200}
            />
            <Text className={styles.charCount}>{remark.length}/200</Text>
          </View>
        </ScrollView>
      )}

      {currentAsset && (
        <View className={styles.bottomBar}>
          <Button className={styles.btnSave} onClick={handleSave}>
            暂存
          </Button>
          <Button
            className={classnames(styles.btnSubmit, !selectedStatus && styles.disabled)}
            onClick={handleSubmit}
            disabled={!selectedStatus}
          >
            提交盘点
          </Button>
        </View>
      )}
    </View>
  );
};

export default ScanPage;
