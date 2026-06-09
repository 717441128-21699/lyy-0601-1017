import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Asset } from '@/types';
import StatusTag from '../StatusTag';
import styles from './index.module.scss';

interface AssetCardProps {
  asset: Asset;
  showStatus?: boolean;
  onClick?: (asset: Asset) => void;
}

const categoryIcons: Record<string, string> = {
  '电子设备': '💻',
  '办公设备': '🖨️',
  '办公家具': '🪑',
  '网络设备': '🔌',
  '服务器设备': '🖥️',
  '数码设备': '📷'
};

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  showStatus = true,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(asset);
    } else {
      Taro.navigateTo({
        url: `/pages/asset-detail/index?id=${asset.id}`
      });
    }
  };

  const displayStatus = asset.checkStatus || asset.status;

  return (
    <View className={styles.assetCard} onClick={handleClick}>
      <View className={styles.assetImage}>
        <Text className={styles.assetIcon}>
          {categoryIcons[asset.category] || '📦'}
        </Text>
      </View>
      <View className={styles.assetContent}>
        <View className={styles.assetHeader}>
          <Text className={styles.assetName}>{asset.name}</Text>
          {showStatus && <StatusTag status={displayStatus} />}
        </View>
        <Text className={styles.assetNo}>📋 {asset.assetNo}</Text>
        <View className={styles.assetInfo}>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>🏷️</Text>
            <Text>{asset.brand} {asset.model}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>💰</Text>
            <Text>¥{asset.price.toLocaleString()}</Text>
          </View>
        </View>
        <View className={styles.assetLocation}>
          <Text className={styles.locationIcon}>📍</Text>
          <Text>{asset.building} {asset.floor} {asset.roomName}</Text>
        </View>
      </View>
    </View>
  );
};

export default AssetCard;
