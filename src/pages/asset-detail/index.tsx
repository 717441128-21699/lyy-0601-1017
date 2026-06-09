import React, { useState, useEffect } from 'react';
import { View, Text, Image, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { Asset, AssetStatus, CheckRecord } from '@/types';
import { getAssetById } from '@/data/mockAssets';
import StatusTag from '@/components/StatusTag';
import { storage } from '@/utils/storage';
import { mockTasks } from '@/data/mockTasks';
import styles from './index.module.scss';

const categoryIcons: Record<string, string> = {
  '电子设备': '💻',
  '办公设备': '🖨️',
  '办公家具': '🪑',
  '网络设备': '🔌',
  '服务器设备': '🖥️',
  '数码设备': '📷'
};

const statusOptions = [
  { status: 'normal' as AssetStatus, icon: '✅', name: '正常' },
  { status: 'idle' as AssetStatus, icon: '📦', name: '闲置' },
  { status: 'lost' as AssetStatus, icon: '❓', name: '丢失' },
  { status: 'mismatch' as AssetStatus, icon: '📍', name: '位置不符' }
];

const AssetDetailPage: React.FC = () => {
  const router = useRouter();
  const assetId = router.params.id as string;
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (assetId) {
      const found = getAssetById(assetId);
      if (found) {
        setAsset(found);
        console.log('[AssetDetailPage] 加载资产信息', found.assetNo);
      } else {
        Taro.showToast({
          title: '资产不存在',
          icon: 'none',
          duration: 2000
        });
      }
    }
  }, [assetId]);

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - photos.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      setPhotos(prev => [...prev, ...res.tempFilePaths]);
    } catch (error) {
      console.error('[AssetDetailPage] 选择照片失败', error);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!asset || !selectedStatus) {
      Taro.showToast({
        title: '请先选择盘点状态',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    const record: CheckRecord = {
      id: `draft-${Date.now()}`,
      taskId: mockTasks[0]?.id || 'task-001',
      taskName: mockTasks[0]?.name || '盘点任务',
      batchNo: mockTasks[0]?.batchNo || 'PD-2026-Q2',
      assetId: asset.id,
      assetNo: asset.assetNo,
      assetName: asset.name,
      status: selectedStatus,
      remark: remark,
      photos: photos,
      checker: '当前用户',
      department: asset.department,
      roomName: asset.roomName,
      checkedAt: new Date().toLocaleString(),
      isDraft: true
    };

    storage.saveDraftRecord(record);
    Taro.showToast({
      title: '已暂存',
      icon: 'success',
      duration: 2000
    });
    setTimeout(() => Taro.navigateBack(), 1500);
    console.log('[AssetDetailPage] 暂存盘点记录', record.assetNo);
  };

  const handleSubmit = () => {
    if (!asset || !selectedStatus) {
      Taro.showToast({
        title: '请先选择盘点状态',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    Taro.showModal({
      title: '提交盘点结果',
      content: `确定提交该资产的盘点结果吗？\n资产：${asset.name}\n状态：${statusOptions.find(o => o.status === selectedStatus)?.name}`,
      confirmText: '确认提交',
      confirmColor: '#165dff',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(() => Taro.navigateBack(), 1500);
          console.log('[AssetDetailPage] 提交盘点结果', asset.assetNo);
        }
      }
    });
  };

  if (!asset) {
    return (
      <View className={styles.assetDetailPage}>
        <View style={{ padding: '120rpx 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>📦</Text>
          <View style={{ marginTop: '32rpx', fontSize: '28rpx', color: '#86909C' }}>
            加载中...
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.assetDetailPage}>
      <ScrollView scrollY className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.header}>
            <View className={styles.assetIcon}>
              <Text>{categoryIcons[asset.category] || '📦'}</Text>
            </View>
            <View className={styles.basicInfo}>
              <Text className={styles.assetName}>{asset.name}</Text>
              <Text className={styles.assetNo}>📋 {asset.assetNo}</Text>
              <StatusTag status={asset.checkStatus || asset.status} />
            </View>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.label}>品牌型号</Text>
              <Text className={styles.value}>{asset.brand} {asset.model}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>资产分类</Text>
              <Text className={styles.value}>{asset.category}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>购置日期</Text>
              <Text className={styles.value}>{asset.purchaseDate}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>资产价值</Text>
              <Text className={styles.value}>¥{asset.price.toLocaleString()}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>所属部门</Text>
              <Text className={styles.value}>{asset.department}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.label}>存放位置</Text>
              <Text className={styles.value}>{asset.building} {asset.floor} {asset.roomName}</Text>
            </View>
          </View>
        </View>

        <View className={styles.checkSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📝</Text>
            盘点信息
          </Text>
          
          <View className={styles.statusGrid}>
            {statusOptions.map(option => (
              <View
                key={option.status}
                className={classnames(styles.statusOption, selectedStatus === option.status && styles.selected)}
                onClick={() => setSelectedStatus(option.status)}
              >
                <Text className={styles.optionIcon}>{option.icon}</Text>
                <Text className={styles.optionName}>{option.name}</Text>
              </View>
            ))}
          </View>

          <View className={styles.photoUpload}>
            <Text className={styles.uploadTitle}>现场照片（可选）</Text>
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
                  <Text className={styles.addText}>添加</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.remarkInput}>
            <Text className={styles.remarkTitle}>补充备注（可选）</Text>
            <Textarea
              className={styles.textarea}
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              placeholder="请输入备注说明，如资产现状、异常原因等..."
              maxlength={200}
            />
            <Text className={styles.charCount}>{remark.length}/200</Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSave} onClick={handleSave}>暂存</Button>
        <Button
          className={styles.btnSubmit}
          onClick={handleSubmit}
          disabled={!selectedStatus}
        >
          提交盘点
        </Button>
      </View>
    </View>
  );
};

export default AssetDetailPage;
