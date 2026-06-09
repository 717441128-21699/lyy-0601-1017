import { ExceptionRecord } from '@/types';

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'exp-001',
    assetId: 'asset-002',
    assetNo: 'IT-2023-0002',
    assetName: 'Dell显示器27寸',
    type: 'idle',
    description: '显示器外观完好，使用频率较低，建议内部调配或处置',
    photos: ['https://picsum.photos/id/3/300/300'],
    reporter: '张三',
    reportedBy: '张三',
    reporterId: 'user-001',
    department: '技术研发部',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q1-001',
    roomName: '研发1室',
    createdAt: '2026-06-05 10:35:00',
    reportedAt: '2026-06-05 10:35:00',
    status: 'pending',
    remark: ''
  },
  {
    id: 'exp-002',
    assetId: 'asset-004',
    assetNo: 'IT-2022-0156',
    assetName: 'ThinkPad X1 Carbon',
    type: 'mismatch',
    description: '实际位置在研发1室，与系统登记位置（研发2室）不符',
    photos: ['https://picsum.photos/id/1/300/300'],
    reporter: '李四',
    reportedBy: '李四',
    reporterId: 'user-002',
    department: '技术研发部',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q1-001',
    roomName: '研发1室',
    createdAt: '2026-06-06 14:20:00',
    reportedAt: '2026-06-06 14:20:00',
    status: 'processing',
    remark: '已核实，正在更新位置信息'
  },
  {
    id: 'exp-003',
    assetId: 'asset-005',
    assetNo: 'IT-2022-0157',
    assetName: '华为MateBook X Pro',
    type: 'lost',
    description: '多次寻找未果，疑似丢失。最后使用记录为2026年5月15日',
    photos: [],
    reporter: '李四',
    reportedBy: '李四',
    reporterId: 'user-002',
    department: '技术研发部',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q1-001',
    roomName: '研发2室',
    createdAt: '2026-06-06 14:30:00',
    reportedAt: '2026-06-06 14:30:00',
    status: 'pending',
    remark: ''
  },
  {
    id: 'exp-004',
    assetId: 'asset-008',
    assetNo: 'OF-2021-0567',
    assetName: '投影仪',
    type: 'idle',
    description: '投影仪使用较少，设备完好，可考虑调配至其他部门',
    photos: ['https://picsum.photos/id/8/300/300'],
    reporter: '赵六',
    reportedBy: '赵六',
    reporterId: 'user-004',
    department: '技术研发部',
    taskId: 'task-001',
    taskName: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q1-001',
    roomName: '会议室A',
    createdAt: '2026-06-08 11:15:00',
    reportedAt: '2026-06-08 11:15:00',
    status: 'resolved',
    remark: '已调配至市场部会议室'
  },
  {
    id: 'exp-005',
    assetId: 'asset-010',
    assetNo: 'IT-2023-0089',
    assetName: 'iPhone 14 Pro',
    type: 'mismatch',
    description: '设备实际由市场总监使用，系统登记在创意部名下',
    photos: ['https://picsum.photos/id/6/300/300'],
    reporter: '陈七',
    reportedBy: '陈七',
    reporterId: 'user-005',
    department: '市场部',
    taskId: 'task-004',
    taskName: '2026年Q2市场部资产盘点',
    batchNo: 'PD-2026-Q2-002',
    roomName: '总监办公室',
    createdAt: '2026-06-09 09:45:00',
    reportedAt: '2026-06-09 09:45:00',
    status: 'processing',
    remark: '正在确认使用人信息'
  }
];

export const getExceptionsByTask = (taskId: string): ExceptionRecord[] => {
  return mockExceptions.filter(exp => exp.taskId === taskId);
};

export const getExceptionsByDepartment = (department: string): ExceptionRecord[] => {
  return mockExceptions.filter(exp => exp.department === department);
};

export const getExceptionById = (id: string): ExceptionRecord | undefined => {
  return mockExceptions.find(exp => exp.id === id);
};

export const getExceptionSummary = (taskId?: string) => {
  const data = taskId ? mockExceptions.filter(exp => exp.taskId === taskId) : mockExceptions;
  return {
    total: data.length,
    idle: data.filter(exp => exp.type === 'idle').length,
    lost: data.filter(exp => exp.type === 'lost').length,
    mismatch: data.filter(exp => exp.type === 'mismatch').length,
    pending: data.filter(exp => exp.status === 'pending').length,
    processing: data.filter(exp => exp.status === 'processing').length,
    resolved: data.filter(exp => exp.status === 'resolved').length
  };
};
