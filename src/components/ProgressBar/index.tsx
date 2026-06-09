import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showValue?: boolean;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  showValue = true,
  height = 12
}) => {
  const getProgressClass = () => {
    if (progress >= 80) return 'high';
    if (progress >= 50) return 'medium';
    return 'low';
  };

  return (
    <View className={styles.progressBar}>
      {(label || showValue) && (
        <View className={styles.progressHeader}>
          {label && <Text className={styles.progressLabel}>{label}</Text>}
          {showValue && <Text className={styles.progressValue}>{progress}%</Text>}
        </View>
      )}
      <View className={styles.progressTrack} style={{ height: `${height}rpx` }}>
        <View 
          className={classnames(styles.progressFill, styles[getProgressClass()])}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;
