import Taro from '@tarojs/taro';
import { CheckRecord } from '@/types';

const DRAFT_RECORDS_KEY = 'inventory_draft_records';
const USER_INFO_KEY = 'inventory_user_info';

export const storage = {
  saveDraftRecord: (record: CheckRecord): void => {
    try {
      const drafts = storage.getDraftRecords();
      const existingIndex = drafts.findIndex(r => r.id === record.id);
      if (existingIndex >= 0) {
        drafts[existingIndex] = { ...record, isDraft: true };
      } else {
        drafts.push({ ...record, isDraft: true });
      }
      Taro.setStorageSync(DRAFT_RECORDS_KEY, JSON.stringify(drafts));
      console.log('[Storage] 暂存记录保存成功', record.assetNo);
    } catch (error) {
      console.error('[Storage] 暂存记录保存失败', error);
    }
  },

  getDraftRecords: (): CheckRecord[] => {
    try {
      const data = Taro.getStorageSync(DRAFT_RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] 获取暂存记录失败', error);
      return [];
    }
  },

  removeDraftRecord: (recordId: string): void => {
    try {
      const drafts = storage.getDraftRecords();
      const filtered = drafts.filter(r => r.id !== recordId);
      Taro.setStorageSync(DRAFT_RECORDS_KEY, JSON.stringify(filtered));
      console.log('[Storage] 暂存记录删除成功', recordId);
    } catch (error) {
      console.error('[Storage] 暂存记录删除失败', error);
    }
  },

  clearDraftRecords: (): void => {
    try {
      Taro.removeStorageSync(DRAFT_RECORDS_KEY);
      console.log('[Storage] 清空暂存记录成功');
    } catch (error) {
      console.error('[Storage] 清空暂存记录失败', error);
    }
  },

  getUserInfo: () => {
    try {
      const data = Taro.getStorageSync(USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[Storage] 获取用户信息失败', error);
      return null;
    }
  },

  setUserInfo: (userInfo: any): void => {
    try {
      Taro.setStorageSync(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('[Storage] 用户信息保存成功');
    } catch (error) {
      console.error('[Storage] 用户信息保存失败', error);
    }
  },

  clearUserInfo: (): void => {
    try {
      Taro.removeStorageSync(USER_INFO_KEY);
      console.log('[Storage] 清除用户信息成功');
    } catch (error) {
      console.error('[Storage] 清除用户信息失败', error);
    }
  }
};
