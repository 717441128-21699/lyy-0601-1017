import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  text: string;
  subText?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  text,
  subText
}) => {
  return (
    <View className={styles.emptyState}>
      <View className={styles.emptyIcon}>{icon}</View>
      <Text className={styles.emptyText}>{text}</Text>
      {subText && <Text className={styles.emptySubText}>{subText}</Text>}
    </View>
  );
};

export default EmptyState;
