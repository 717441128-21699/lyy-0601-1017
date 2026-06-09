import Taro from '@tarojs/taro';
import { CheckRecord, ExceptionRecord, InventoryTask, Asset, HistoryInventory } from '@/types';

const DRAFT_RECORDS_KEY = 'inventory_draft_records';
const USER_INFO_KEY = 'inventory_user_info';
const TASK_STATE_KEY = 'inventory_task_state';
const EXCEPTION_RECORDS_KEY = 'inventory_exception_records';
const CHECKED_ASSETS_KEY = 'inventory_checked_assets';
const HISTORY_RECORDS_KEY = 'inventory_history_records';
const ROOM_CHECK_STATE_KEY = 'inventory_room_check_state';

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

  saveTaskState: (taskId: string, state: Partial<InventoryTask>): void => {
    try {
      const allState = storage.getAllTaskState();
      allState[taskId] = { ...allState[taskId], ...state };
      Taro.setStorageSync(TASK_STATE_KEY, JSON.stringify(allState));
      console.log('[Storage] 任务状态保存成功', taskId, state);
    } catch (error) {
      console.error('[Storage] 任务状态保存失败', error);
    }
  },

  getTaskState: (taskId: string): Partial<InventoryTask> | null => {
    try {
      const allState = storage.getAllTaskState();
      return allState[taskId] || null;
    } catch (error) {
      console.error('[Storage] 获取任务状态失败', error);
      return null;
    }
  },

  getAllTaskState: (): Record<string, Partial<InventoryTask>> => {
    try {
      const data = Taro.getStorageSync(TASK_STATE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[Storage] 获取所有任务状态失败', error);
      return {};
    }
  },

  clearTaskState: (): void => {
    try {
      Taro.removeStorageSync(TASK_STATE_KEY);
      console.log('[Storage] 清空任务状态成功');
    } catch (error) {
      console.error('[Storage] 清空任务状态失败', error);
    }
  },

  saveExceptionRecord: (record: ExceptionRecord): void => {
    try {
      const records = storage.getExceptionRecords();
      const existingIndex = records.findIndex(r => r.id === record.id);
      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.unshift(record);
      }
      Taro.setStorageSync(EXCEPTION_RECORDS_KEY, JSON.stringify(records));
      console.log('[Storage] 异常记录保存成功', record.assetNo, record.type);
    } catch (error) {
      console.error('[Storage] 异常记录保存失败', error);
    }
  },

  getExceptionRecords: (): ExceptionRecord[] => {
    try {
      const data = Taro.getStorageSync(EXCEPTION_RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] 获取异常记录失败', error);
      return [];
    }
  },

  getExceptionRecordsByBatch: (batchNo: string): ExceptionRecord[] => {
    const records = storage.getExceptionRecords();
    return records.filter(r => r.batchNo === batchNo);
  },

  clearExceptionRecords: (): void => {
    try {
      Taro.removeStorageSync(EXCEPTION_RECORDS_KEY);
      console.log('[Storage] 清空异常记录成功');
    } catch (error) {
      console.error('[Storage] 清空异常记录失败', error);
    }
  },

  saveCheckedAsset: (assetId: string, roomId: string, status: string, checkTime: string): void => {
    try {
      const allChecked = storage.getAllCheckedAssets();
      allChecked[assetId] = { assetId, roomId, status, checkTime };
      Taro.setStorageSync(CHECKED_ASSETS_KEY, JSON.stringify(allChecked));
      console.log('[Storage] 资产核对状态保存成功', assetId, status);
    } catch (error) {
      console.error('[Storage] 资产核对状态保存失败', error);
    }
  },

  getCheckedAsset: (assetId: string): { assetId: string; roomId: string; status: string; checkTime: string } | null => {
    try {
      const allChecked = storage.getAllCheckedAssets();
      return allChecked[assetId] || null;
    } catch (error) {
      console.error('[Storage] 获取资产核对状态失败', error);
      return null;
    }
  },

  getAllCheckedAssets: (): Record<string, { assetId: string; roomId: string; status: string; checkTime: string }> => {
    try {
      const data = Taro.getStorageSync(CHECKED_ASSETS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[Storage] 获取所有资产核对状态失败', error);
      return {};
    }
  },

  getCheckedAssetsByRoom: (roomId: string): string[] => {
    const allChecked = storage.getAllCheckedAssets();
    return Object.values(allChecked)
      .filter(c => c.roomId === roomId)
      .map(c => c.assetId);
  },

  clearCheckedAssets: (): void => {
    try {
      Taro.removeStorageSync(CHECKED_ASSETS_KEY);
      console.log('[Storage] 清空资产核对状态成功');
    } catch (error) {
      console.error('[Storage] 清空资产核对状态失败', error);
    }
  },

  saveRoomCheckState: (roomId: string, taskId: string, checkedAssets: number, totalAssets: number): void => {
    try {
      const allState = storage.getAllRoomCheckState();
      const key = `${taskId}_${roomId}`;
      allState[key] = { roomId, taskId, checkedAssets, totalAssets, updatedAt: new Date().toLocaleString() };
      Taro.setStorageSync(ROOM_CHECK_STATE_KEY, JSON.stringify(allState));
      console.log('[Storage] 房间核对状态保存成功', roomId, checkedAssets, '/', totalAssets);
    } catch (error) {
      console.error('[Storage] 房间核对状态保存失败', error);
    }
  },

  getRoomCheckState: (roomId: string, taskId: string): { roomId: string; taskId: string; checkedAssets: number; totalAssets: number; updatedAt: string } | null => {
    try {
      const allState = storage.getAllRoomCheckState();
      const key = `${taskId}_${roomId}`;
      return allState[key] || null;
    } catch (error) {
      console.error('[Storage] 获取房间核对状态失败', error);
      return null;
    }
  },

  getAllRoomCheckState: (): Record<string, { roomId: string; taskId: string; checkedAssets: number; totalAssets: number; updatedAt: string }> => {
    try {
      const data = Taro.getStorageSync(ROOM_CHECK_STATE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[Storage] 获取所有房间核对状态失败', error);
      return {};
    }
  },

  saveHistoryRecord: (record: HistoryInventory): void => {
    try {
      const records = storage.getHistoryRecords();
      const existingIndex = records.findIndex(r => r.id === record.id);
      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.unshift(record);
      }
      Taro.setStorageSync(HISTORY_RECORDS_KEY, JSON.stringify(records));
      console.log('[Storage] 历史记录保存成功', record.batchNo);
    } catch (error) {
      console.error('[Storage] 历史记录保存失败', error);
    }
  },

  getHistoryRecords: (): HistoryInventory[] => {
    try {
      const data = Taro.getStorageSync(HISTORY_RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[Storage] 获取历史记录失败', error);
      return [];
    }
  },

  getHistoryByBatch: (batchNo: string): HistoryInventory | null => {
    const records = storage.getHistoryRecords();
    return records.find(r => r.batchNo === batchNo) || null;
  },

  clearHistoryRecords: (): void => {
    try {
      Taro.removeStorageSync(HISTORY_RECORDS_KEY);
      console.log('[Storage] 清空历史记录成功');
    } catch (error) {
      console.error('[Storage] 清空历史记录失败', error);
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
  },

  clearAll: (): void => {
    storage.clearDraftRecords();
    storage.clearTaskState();
    storage.clearExceptionRecords();
    storage.clearCheckedAssets();
    storage.clearHistoryRecords();
    storage.clearUserInfo();
    console.log('[Storage] 清空所有数据成功');
  }
};
