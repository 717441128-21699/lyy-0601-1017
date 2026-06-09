import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  status: string;
  text?: string;
}

const statusTextMap: Record<string, string> = {
  normal: '正常',
  idle: '闲置',
  lost: '丢失',
  mismatch: '位置不符',
  unchecked: '待核对',
  pending: '待开始',
  ongoing: '进行中',
  completed: '已完成',
  processing: '处理中',
  resolved: '已解决'
};

const StatusTag: React.FC<StatusTagProps> = ({ status, text }) => {
  const displayText = text || statusTextMap[status] || status;
  
  return (
    <View className={classnames(styles.statusTag, styles[status])}>
      <Text>{displayText}</Text>
    </View>
  );
};

export default StatusTag;
