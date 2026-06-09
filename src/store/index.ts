import { create } from 'zustand';
import { InventoryTask, ExceptionRecord, CheckRecord, HistoryInventory, Asset, AssetStatus } from '@/types';
import { mockTasks } from '@/data/mockTasks';
import { mockAssets } from '@/data/mockAssets';
import { mockExceptions } from '@/data/mockExceptions';
import { mockHistory, getDraftRecords } from '@/data/mockHistory';
import { storage } from '@/utils/storage';

interface InventoryStore {
  tasks: InventoryTask[];
  assets: Asset[];
  exceptions: ExceptionRecord[];
  historyRecords: HistoryInventory[];
  draftRecords: CheckRecord[];
  currentTaskId: string | null;
  refreshTrigger: number;

  init: () => void;
  refresh: () => void;
  claimTask: (taskId: string) => boolean;
  submitCheckResult: (record: CheckRecord, isException: boolean) => void;
  markAssetChecked: (assetId: string, roomId: string, taskId: string, status: AssetStatus) => void;
  submitInventoryResult: (taskId: string) => HistoryInventory | null;
  getTaskWithState: (taskId: string) => InventoryTask | null;
  getTasksWithState: () => InventoryTask[];
  getExceptionsWithLocal: () => ExceptionRecord[];
  getHistoryWithLocal: () => HistoryInventory[];
  getHistoryByBatchNo: (batchNo: string) => HistoryInventory | null;
  getAllBatches: () => { batchNo: string; name: string; status: string }[];
  getExceptionsByBatch: (batchNo: string) => ExceptionRecord[];
  getDraftWithLocal: () => CheckRecord[];
  getAssetWithCheckState: (assetId: string) => Asset | null;
  getAssetsByRoomWithState: (roomId: string) => Asset[];
  getRoomCheckProgress: (roomId: string, taskId: string) => { checked: number; total: number; progress: number };
  updateExceptionStatus: (exceptionId: string, status: 'pending' | 'processing' | 'resolved', remark?: string) => boolean;
  addExceptionRemark: (exceptionId: string, remark: string) => boolean;
  getCheckRecordsByBatch: (batchNo: string) => CheckRecord[];
  getAssetsByBatchWithState: (batchNo: string) => Asset[];
  getStatistics: () => {
    pendingTasks: number;
    ongoingTasks: number;
    completedTasks: number;
    totalAssets: number;
    checkedAssets: number;
    uncheckedAssets: number;
    exceptionCount: number;
  };
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  tasks: [],
  assets: [],
  exceptions: [],
  historyRecords: [],
  draftRecords: [],
  currentTaskId: null,
  refreshTrigger: 0,

  init: () => {
    const storedTasks = storage.getAllTaskState();
    const storedExceptions = storage.getExceptionRecords();
    const storedHistory = storage.getHistoryRecords();
    const storedDrafts = storage.getDraftRecords();
    const mockDrafts = getDraftRecords();

    const mergedTasks = mockTasks.map(task => {
      const savedState = storedTasks[task.id];
      if (savedState) {
        return { ...task, ...savedState };
      }
      return task;
    });

    const mergedExceptions = [...storedExceptions, ...mockExceptions.filter(
      me => !storedExceptions.find(se => se.id === me.id)
    )];

    const mergedHistory = [...storedHistory, ...mockHistory.filter(
      mh => !storedHistory.find(sh => sh.id === mh.id)
    )];

    const mergedDrafts = [...storedDrafts, ...mockDrafts.filter(
      md => !storedDrafts.find(sd => sd.id === md.id)
    )];

    set({
      tasks: mergedTasks,
      assets: mockAssets,
      exceptions: mergedExceptions,
      historyRecords: mergedHistory,
      draftRecords: mergedDrafts,
      refreshTrigger: Date.now()
    });

    console.log('[Store] 初始化完成', {
      tasks: mergedTasks.length,
      assets: mockAssets.length,
      exceptions: mergedExceptions.length,
      history: mergedHistory.length,
      drafts: mergedDrafts.length
    });
  },

  refresh: () => {
    const state = get();
    state.init();
    set({ refreshTrigger: Date.now() });
  },

  claimTask: (taskId: string): boolean => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (!task || task.status !== 'pending') {
      console.log('[Store] 任务不可领取', taskId, task?.status);
      return false;
    }

    const updatedTask = {
      ...task,
      status: 'ongoing' as const,
      claimedAt: new Date().toLocaleString()
    };

    storage.saveTaskState(taskId, {
      status: 'ongoing',
      claimedAt: updatedTask.claimedAt
    });

    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
      refreshTrigger: Date.now()
    }));

    console.log('[Store] 任务领取成功', taskId, updatedTask);
    return true;
  },

  submitCheckResult: (record: CheckRecord, isException: boolean) => {
    const state = get();
    
    if (isException) {
      const exceptionRecord: ExceptionRecord = {
        id: `exp-local-${Date.now()}`,
        assetId: record.assetId,
        assetNo: record.assetNo,
        assetName: record.assetName,
        type: record.status,
        description: record.remark || `${record.assetName}盘点结果：${
          record.status === 'idle' ? '闲置' :
          record.status === 'lost' ? '丢失' :
          record.status === 'mismatch' ? '位置不符' : '异常'
        }`,
        photos: record.photos,
        reporter: record.checker,
        reportedBy: record.checker,
        reporterId: 'user-local',
        department: record.department,
        taskId: record.taskId,
        taskName: record.taskName,
        batchNo: record.batchNo,
        roomName: record.roomName,
        createdAt: record.checkedAt,
        reportedAt: record.checkedAt,
        status: 'pending',
        remark: record.remark
      };

      storage.saveExceptionRecord(exceptionRecord);
      
      set(state => ({
        exceptions: [exceptionRecord, ...state.exceptions],
        refreshTrigger: Date.now()
      }));

      console.log('[Store] 异常记录已添加', exceptionRecord.assetNo, exceptionRecord.type);
    }

    if (!record.isDraft) {
      storage.removeDraftRecord(record.id);
      set(state => ({
        draftRecords: state.draftRecords.filter(d => d.id !== record.id),
        refreshTrigger: Date.now()
      }));
    }

    console.log('[Store] 盘点结果已提交', record.assetNo, record.status);
  },

  markAssetChecked: (assetId: string, roomId: string, taskId: string, status: AssetStatus) => {
    const checkTime = new Date().toLocaleString();
    
    storage.saveCheckedAsset(assetId, roomId, status, checkTime);
    
    const state = get();
    const assets = state.assets.map(a => 
      a.id === assetId 
        ? { ...a, checkStatus: status, checkTime, checkedAt: checkTime }
        : a
    );

    const roomAssets = assets.filter(a => a.roomId === roomId);
    const checkedCount = roomAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;
    
    storage.saveRoomCheckState(roomId, taskId, checkedCount, roomAssets.length);

    set({ 
      assets, 
      refreshTrigger: Date.now() 
    });

    console.log('[Store] 资产已标记', assetId, status, '房间进度:', checkedCount, '/', roomAssets.length);
  },

  submitInventoryResult: (taskId: string): HistoryInventory | null => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.log('[Store] 任务不存在', taskId);
      return null;
    }

    const taskAssets = state.assets.filter(a => 
      task.rooms.some(r => r.id === a.roomId)
    );

    const checkedAssets = taskAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked');
    const normalAssets = checkedAssets.filter(a => a.checkStatus === 'normal').length;
    const idleAssets = checkedAssets.filter(a => a.checkStatus === 'idle').length;
    const lostAssets = checkedAssets.filter(a => a.checkStatus === 'lost').length;
    const mismatchAssets = checkedAssets.filter(a => a.checkStatus === 'mismatch').length;
    const exceptionAssets = idleAssets + lostAssets + mismatchAssets;

    const roomsWithProgress = task.rooms.map(room => {
      const roomAssets = taskAssets.filter(a => a.roomId === room.id);
      const roomChecked = roomAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;
      return {
        ...room,
        checkedAssets: roomChecked,
        totalAssets: roomAssets.length
      };
    });

    const historyRecord: HistoryInventory = {
      id: `hist-local-${Date.now()}`,
      batchNo: task.batchNo,
      name: task.name,
      quarter: task.quarter,
      year: task.year,
      department: task.department,
      totalAssets: task.totalAssets,
      normalAssets,
      exceptionAssets,
      lostAssets,
      idleAssets,
      mismatchAssets,
      completedAt: new Date().toLocaleString(),
      checker: '当前用户',
      rooms: roomsWithProgress,
      taskId: taskId
    };

    storage.saveHistoryRecord(historyRecord);

    const updatedTask = {
      ...task,
      status: 'completed' as const,
      completedAt: historyRecord.completedAt,
      checkedAssets: checkedAssets.length
    };

    storage.saveTaskState(taskId, {
      status: 'completed',
      completedAt: updatedTask.completedAt,
      checkedAssets: updatedTask.checkedAssets
    });

    storage.clearDraftRecords();

    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
      historyRecords: [historyRecord, ...state.historyRecords],
      draftRecords: [],
      refreshTrigger: Date.now()
    }));

    console.log('[Store] 盘点结果已提交', task.batchNo, historyRecord);
    return historyRecord;
  },

  getTaskWithState: (taskId: string): InventoryTask | null => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const taskAssets = state.assets.filter(a => 
      task.rooms.some(r => r.id === a.roomId)
    );
    const checkedCount = taskAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;

    const updatedRooms = task.rooms.map(room => {
      const roomState = storage.getRoomCheckState(room.id, taskId);
      const roomAssets = taskAssets.filter(a => a.roomId === room.id);
      const roomChecked = roomAssets.filter(a => a.checkStatus && a.checkStatus !== 'unchecked').length;
      
      return {
        ...room,
        checkedAssets: roomState?.checkedAssets || roomChecked || room.checkedAssets,
        totalAssets: roomState?.totalAssets || roomAssets.length || room.totalAssets
      };
    });

    return {
      ...task,
      checkedAssets: checkedCount || task.checkedAssets,
      rooms: updatedRooms
    };
  },

  getTasksWithState: (): InventoryTask[] => {
    const state = get();
    return state.tasks.map(task => state.getTaskWithState(task.id)!).filter(Boolean);
  },

  getExceptionsWithLocal: (): ExceptionRecord[] => {
    const state = get();
    return state.exceptions;
  },

  getHistoryWithLocal: (): HistoryInventory[] => {
    const state = get();
    return [...state.historyRecords].sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  },

  getHistoryByBatchNo: (batchNo: string): HistoryInventory | null => {
    const state = get();
    return state.historyRecords.find(h => h.batchNo === batchNo) || null;
  },

  getAllBatches: (): { batchNo: string; name: string; status: string }[] => {
    const state = get();
    const completedBatches = state.historyRecords.map(h => ({
      batchNo: h.batchNo,
      name: h.name,
      status: 'completed'
    }));
    const ongoingBatches = state.tasks
      .filter(t => t.status === 'ongoing')
      .map(t => ({
        batchNo: t.batchNo,
        name: t.name,
        status: 'ongoing'
      }));
    return [...ongoingBatches, ...completedBatches];
  },

  getExceptionsByBatch: (batchNo: string): ExceptionRecord[] => {
    const state = get();
    return state.exceptions.filter(e => e.batchNo === batchNo);
  },

  getDraftWithLocal: (): CheckRecord[] => {
    const state = get();
    return state.draftRecords;
  },

  getAssetWithCheckState: (assetId: string): Asset | null => {
    const state = get();
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return null;

    const checkedState = storage.getCheckedAsset(assetId);
    if (checkedState) {
      return {
        ...asset,
        checkStatus: checkedState.status as AssetStatus,
        checkTime: checkedState.checkTime,
        checkedAt: checkedState.checkTime
      };
    }

    return asset;
  },

  getAssetsByRoomWithState: (roomId: string): Asset[] => {
    const state = get();
    const roomAssets = state.assets.filter(a => a.roomId === roomId);
    
    return roomAssets.map(asset => {
      const checkedState = storage.getCheckedAsset(asset.id);
      if (checkedState) {
        return {
          ...asset,
          checkStatus: checkedState.status as AssetStatus,
          checkTime: checkedState.checkTime,
          checkedAt: checkedState.checkTime
        };
      }
      return asset;
    });
  },

  getRoomCheckProgress: (roomId: string, taskId: string) => {
    const state = get();
    const roomState = storage.getRoomCheckState(roomId, taskId);
    const roomAssets = state.assets.filter(a => a.roomId === roomId);
    const checkedCount = roomAssets.filter(a => {
      const checked = storage.getCheckedAsset(a.id);
      return checked && checked.status !== 'unchecked';
    }).length;

    const total = roomState?.totalAssets || roomAssets.length;
    const checked = roomState?.checkedAssets || checkedCount;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { checked, total, progress };
  },

  getStatistics: () => {
    const state = get();
    const tasks = state.getTasksWithState();
    
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const ongoingTasks = tasks.filter(t => t.status === 'ongoing').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const totalAssets = state.assets.length;
    const checkedAssets = state.assets.filter(a => {
      const checked = storage.getCheckedAsset(a.id);
      return checked && checked.status !== 'unchecked';
    }).length;
    const uncheckedAssets = totalAssets - checkedAssets;
    
    const exceptions = state.getExceptionsWithLocal();
    const exceptionCount = exceptions.filter(e => e.status === 'pending' || e.status === 'processing').length;

    return {
      pendingTasks,
      ongoingTasks,
      completedTasks,
      totalAssets,
      checkedAssets,
      uncheckedAssets,
      exceptionCount
    };
  },

  updateExceptionStatus: (exceptionId: string, status: 'pending' | 'processing' | 'resolved', remark?: string): boolean => {
    const state = get();
    const exceptionIndex = state.exceptions.findIndex(e => e.id === exceptionId);
    
    if (exceptionIndex === -1) {
      console.log('[Store] 异常记录不存在', exceptionId);
      return false;
    }

    const updatedExceptions = [...state.exceptions];
    const updatedException = {
      ...updatedExceptions[exceptionIndex],
      status,
      remark: remark || updatedExceptions[exceptionIndex].remark,
      processedAt: new Date().toLocaleString()
    };
    updatedExceptions[exceptionIndex] = updatedException;

    storage.saveExceptionRecord(updatedException);

    set({
      exceptions: updatedExceptions,
      refreshTrigger: state.refreshTrigger + 1
    });

    console.log('[Store] 更新异常状态', exceptionId, status, remark);
    return true;
  },

  addExceptionRemark: (exceptionId: string, remark: string): boolean => {
    const state = get();
    const exceptionIndex = state.exceptions.findIndex(e => e.id === exceptionId);
    
    if (exceptionIndex === -1) {
      console.log('[Store] 异常记录不存在', exceptionId);
      return false;
    }

    const updatedExceptions = [...state.exceptions];
    const existingRemark = updatedExceptions[exceptionIndex].remark;
    const newRemark = existingRemark 
      ? `${existingRemark}\n\n[${new Date().toLocaleString()}] ${remark}`
      : `[${new Date().toLocaleString()}] ${remark}`;

    const updatedException = {
      ...updatedExceptions[exceptionIndex],
      remark: newRemark,
      processedAt: new Date().toLocaleString()
    };
    updatedExceptions[exceptionIndex] = updatedException;

    storage.saveExceptionRecord(updatedException);

    set({
      exceptions: updatedExceptions,
      refreshTrigger: state.refreshTrigger + 1
    });

    console.log('[Store] 添加异常备注', exceptionId);
    return true;
  },

  getCheckRecordsByBatch: (batchNo: string): CheckRecord[] => {
    const state = get();
    const allDrafts = storage.getDraftRecords();
    const allRecords = [...allDrafts, ...state.draftRecords];
    return allRecords.filter(r => r.batchNo === batchNo);
  },

  getAssetsByBatchWithState: (batchNo: string): Asset[] => {
    const state = get();
    const history = state.getHistoryByBatchNo(batchNo);
    
    if (!history || !history.taskId) {
      return [];
    }

    const task = state.tasks.find(t => t.id === history.taskId);
    if (!task || !task.rooms) {
      return [];
    }

    const roomIds = task.rooms.map(r => r.id);
    const batchAssets = state.assets.filter(a => roomIds.includes(a.roomId));

    return batchAssets.map(asset => {
      const checkedState = storage.getCheckedAsset(asset.id);
      if (checkedState) {
        return {
          ...asset,
          checkStatus: checkedState.status as AssetStatus,
          checkTime: checkedState.checkTime,
          checkedAt: checkedState.checkTime,
          remark: checkedState.remark,
          photos: checkedState.photos
        };
      }
      return asset;
    });
  }
}));
