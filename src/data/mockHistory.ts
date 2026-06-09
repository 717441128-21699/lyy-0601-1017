import { HistoryInventory, CheckRecord } from '@/types';

export const mockHistory: HistoryInventory[] = [
  {
    id: 'hist-005',
    batchNo: 'PD-2026-Q2-003',
    name: '2026年Q2财务部资产盘点',
    quarter: 'Q2',
    year: 2026,
    department: '财务部',
    totalAssets: 67,
    normalAssets: 63,
    exceptionAssets: 4,
    lostAssets: 0,
    idleAssets: 2,
    mismatchAssets: 2,
    completedAt: '2026-06-15 16:45:00',
    checker: '王五',
    taskId: 'task-003',
    rooms: [
      { id: 'room-009', name: '财务室', floor: '4F', building: 'B栋', totalAssets: 45, checkedAssets: 45 },
      { id: 'room-010', name: '档案库房', floor: '4F', building: 'B栋', totalAssets: 22, checkedAssets: 22 }
    ]
  },
  {
    id: 'hist-001',
    batchNo: 'PD-2026-Q1-001',
    name: '2026年Q1技术部资产盘点',
    quarter: 'Q1',
    year: 2026,
    department: '技术研发部',
    totalAssets: 156,
    normalAssets: 148,
    exceptionAssets: 8,
    lostAssets: 1,
    idleAssets: 4,
    mismatchAssets: 3,
    completedAt: '2026-03-31 17:30:00',
    checker: '张三'
  },
  {
    id: 'hist-002',
    batchNo: 'PD-2025-Q4-001',
    name: '2025年Q4技术部资产盘点',
    quarter: 'Q4',
    year: 2025,
    department: '技术研发部',
    totalAssets: 152,
    normalAssets: 145,
    exceptionAssets: 7,
    lostAssets: 0,
    idleAssets: 5,
    mismatchAssets: 2,
    completedAt: '2025-12-30 16:45:00',
    checker: '张三'
  },
  {
    id: 'hist-003',
    batchNo: 'PD-2025-Q3-001',
    name: '2025年Q3技术部资产盘点',
    quarter: 'Q3',
    year: 2025,
    department: '技术研发部',
    totalAssets: 148,
    normalAssets: 142,
    exceptionAssets: 6,
    lostAssets: 1,
    idleAssets: 3,
    mismatchAssets: 2,
    completedAt: '2025-09-30 17:00:00',
    checker: '李四'
  },
  {
    id: 'hist-004',
    batchNo: 'PD-2025-Q2-001',
    name: '2025年Q2技术部资产盘点',
    quarter: 'Q2',
    year: 2025,
    department: '技术研发部',
    totalAssets: 145,
    normalAssets: 140,
    exceptionAssets: 5,
    lostAssets: 0,
    idleAssets: 3,
    mismatchAssets: 2,
    completedAt: '2025-06-30 16:30:00',
    checker: '李四'
  }
];

export const mockCheckRecords: CheckRecord[] = [
  {
    id: 'record-001',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q2-001',
    assetId: 'asset-001',
    assetNo: 'IT-2023-0001',
    assetName: 'MacBook Pro 14寸',
    status: 'normal',
    remark: '',
    photos: [],
    checker: '张三',
    department: '技术研发部',
    roomName: '研发1室',
    checkedAt: '2026-06-05 10:30:00',
    isDraft: false
  },
  {
    id: 'record-002',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q2-001',
    assetId: 'asset-002',
    assetNo: 'IT-2023-0002',
    assetName: 'Dell显示器27寸',
    status: 'idle',
    remark: '显示器外观完好，使用频率较低',
    photos: ['https://picsum.photos/id/3/300/300'],
    checker: '张三',
    department: '技术研发部',
    roomName: '研发1室',
    checkedAt: '2026-06-05 10:35:00',
    isDraft: false
  },
  {
    id: 'record-003',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q2-001',
    assetId: 'asset-007',
    assetNo: 'IT-2022-0159',
    assetName: '思科交换机',
    status: 'unchecked',
    remark: '',
    photos: [],
    checker: '王五',
    department: '技术研发部',
    roomName: '服务器机房',
    checkedAt: '2026-06-07 09:20:00',
    isDraft: true
  }
];

export const getHistoryList = (): HistoryInventory[] => {
  return mockHistory.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
};

export const getHistoryById = (id: string): HistoryInventory | undefined => {
  return mockHistory.find(h => h.id === id);
};

export const getDraftRecords = (): CheckRecord[] => {
  return mockCheckRecords.filter(r => r.isDraft);
};

export const getCompletedRecords = (): CheckRecord[] => {
  return mockCheckRecords.filter(r => !r.isDraft);
};
