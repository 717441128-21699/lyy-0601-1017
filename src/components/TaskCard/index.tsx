import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { InventoryTask } from '@/types';
import StatusTag from '../StatusTag';
import ProgressBar from '../ProgressBar';
import styles from './index.module.scss';

interface TaskCardProps {
  task: InventoryTask;
  showRooms?: boolean;
  onClaim?: (taskId: string) => void;
  onEnter?: (taskId: string) => void;
  onRoomClick?: (taskId: string, roomId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showRooms = false,
  onClaim,
  onEnter,
  onRoomClick
}) => {
  const progress = Math.round((task.checkedAssets / task.totalAssets) * 100);

  const handleAction = () => {
    if (task.status === 'pending') {
      onClaim?.(task.id);
    } else {
      onEnter?.(task.id);
    }
  };

  const getActionText = () => {
    if (task.status === 'pending') return '领取任务';
    if (task.status === 'ongoing') return '继续盘点';
    return '查看详情';
  };

  const handleRoomClick = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room-assets/index?taskId=${task.id}&roomId=${roomId}`
    });
  };

  return (
    <View className={styles.taskCard}>
      <View className={styles.cardHeader}>
        <View className={styles.taskInfo}>
          <Text className={styles.taskName}>{task.name}</Text>
          <View className={styles.taskMeta}>
            <View className={styles.metaItem}>
              <Text className={styles.metaIcon}>📋</Text>
              <Text>{task.batchNo}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaIcon}>📅</Text>
              <Text>截止: {task.deadline}</Text>
            </View>
          </View>
        </View>
        <StatusTag status={task.status} />
      </View>

      {task.status !== 'pending' && (
        <View className={styles.progressSection}>
          <ProgressBar progress={progress} label="盘点进度" />
        </View>
      )}

      <View className={styles.cardFooter}>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{task.totalAssets}</Text>
            <Text className={styles.statLabel}>资产总数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{task.checkedAssets}</Text>
            <Text className={styles.statLabel}>已盘点</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{task.totalAssets - task.checkedAssets}</Text>
            <Text className={styles.statLabel}>待盘点</Text>
          </View>
        </View>
        <Button
          className={classnames(styles.actionBtn, task.status === 'completed' && styles.secondary)}
          onClick={handleAction}
        >
          {getActionText()}
        </Button>
      </View>

      {showRooms && task.rooms && task.rooms.length > 0 && (
        <View className={styles.roomList}>
          <Text className={styles.roomTitle}>盘点区域</Text>
          <View className={styles.roomGrid}>
            {task.rooms.map(room => (
              <View
                key={room.id}
                className={styles.roomItem}
                onClick={() => handleRoomClick(room.id)}
              >
                <Text className={styles.roomName}>{room.name}</Text>
                <Text className={styles.roomLocation}>{room.building} {room.floor}</Text>
                <Text className={styles.roomProgress}>
                  <Text className={styles.progressNum}>{room.checkedAssets}</Text>
                  <Text> / {room.totalAssets} 已盘点</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskCard;
