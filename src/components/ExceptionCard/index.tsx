import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { ExceptionRecord } from '@/types';
import StatusTag from '../StatusTag';
import styles from './index.module.scss';

interface ExceptionCardProps {
  exception: ExceptionRecord;
  onClick?: (exception: ExceptionRecord) => void;
}

const ExceptionCard: React.FC<ExceptionCardProps> = ({
  exception,
  onClick
}) => {
  const handleClick = () => {
    onClick?.(exception);
  };

  return (
    <View className={styles.exceptionCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.assetInfo}>
          <Text className={styles.assetName}>{exception.assetName}</Text>
          <Text className={styles.assetNo}>📋 {exception.assetNo}</Text>
        </View>
        <StatusTag status={exception.status} />
      </View>

      <View className={styles.exceptionType}>
        <StatusTag status={exception.type} />
      </View>

      <Text className={styles.description}>{exception.description}</Text>

      {exception.photos && exception.photos.length > 0 && (
        <ScrollView scrollX className={styles.photoList}>
          {exception.photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image src={photo} mode="aspectFill" />
            </View>
          ))}
        </ScrollView>
      )}

      <View className={styles.cardFooter}>
        <View className={styles.reporterInfo}>
          <View className={styles.reporterAvatar}>
            {exception.reporter.charAt(0)}
          </View>
          <View className={styles.reporterDetail}>
            <Text className={styles.reporterName}>{exception.reporter}</Text>
            <Text className={styles.reportTime}>{exception.createdAt}</Text>
          </View>
        </View>
        {exception.remark && (
          <View className={styles.handleStatus}>
            <Text className={styles.remark}>💬 {exception.remark}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ExceptionCard;
