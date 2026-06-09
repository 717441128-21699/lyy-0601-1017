import React from 'react';
import { View, Input } from '@tarojs/components';
import styles from './index.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '搜索资产编号、名称...',
  onClear
}) => {
  return (
    <View className={styles.searchBar}>
      <View className={styles.searchIcon}>🔍</View>
      <Input
        className={styles.searchInput}
        value={value}
        onInput={(e) => onChange(e.detail.value)}
        placeholder={placeholder}
        confirmType="search"
      />
      {value && (
        <View 
          className={styles.clearBtn}
          onClick={() => onClear ? onClear() : onChange('')}
        >
          <View className={styles.clearIcon}>✕</View>
        </View>
      )}
    </View>
  );
};

export default SearchBar;
