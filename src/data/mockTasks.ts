import { InventoryTask } from '@/types';

export const mockTasks: InventoryTask[] = [
  {
    id: 'task-001',
    name: '2026年Q2技术部资产盘点',
    batchNo: 'PD-2026-Q2-001',
    quarter: 'Q2',
    year: 2026,
    department: '技术研发部',
    departmentId: 'dept-001',
    totalAssets: 156,
    checkedAssets: 89,
    status: 'ongoing',
    deadline: '2026-06-30',
    createdAt: '2026-06-01 09:00:00',
    claimedAt: '2026-06-02 10:30:00',
    rooms: [
      { id: 'room-001', name: '研发1室', floor: '3F', building: 'A栋', totalAssets: 45, checkedAssets: 32 },
      { id: 'room-002', name: '研发2室', floor: '3F', building: 'A栋', totalAssets: 38, checkedAssets: 28 },
      { id: 'room-003', name: '服务器机房', floor: '5F', building: 'A栋', totalAssets: 28, checkedAssets: 15 },
      { id: 'room-004', name: '会议室A', floor: '3F', building: 'A栋', totalAssets: 25, checkedAssets: 14 },
      { id: 'room-005', name: '测试室', floor: '4F', building: 'A栋', totalAssets: 20, checkedAssets: 0 }
    ]
  },
  {
    id: 'task-002',
    name: '2026年Q2行政部资产盘点',
    batchNo: 'PD-2026-Q2-002',
    quarter: 'Q2',
    year: 2026,
    department: '行政部',
    departmentId: 'dept-002',
    totalAssets: 89,
    checkedAssets: 0,
    status: 'pending',
    deadline: '2026-06-30',
    createdAt: '2026-06-01 09:00:00',
    rooms: [
      { id: 'room-006', name: '办公区A', floor: '2F', building: 'B栋', totalAssets: 35, checkedAssets: 0 },
      { id: 'room-007', name: '办公区B', floor: '2F', building: 'B栋', totalAssets: 28, checkedAssets: 0 },
      { id: 'room-008', name: '仓库', floor: '1F', building: 'B栋', totalAssets: 26, checkedAssets: 0 }
    ]
  },
  {
    id: 'task-003',
    name: '2026年Q2财务部资产盘点',
    batchNo: 'PD-2026-Q2-003',
    quarter: 'Q2',
    year: 2026,
    department: '财务部',
    departmentId: 'dept-003',
    totalAssets: 67,
    checkedAssets: 67,
    status: 'completed',
    deadline: '2026-06-30',
    createdAt: '2026-06-01 09:00:00',
    claimedAt: '2026-06-02 08:30:00',
    completedAt: '2026-06-15 16:45:00',
    rooms: [
      { id: 'room-009', name: '财务室', floor: '4F', building: 'B栋', totalAssets: 45, checkedAssets: 45 },
      { id: 'room-010', name: '档案库房', floor: '4F', building: 'B栋', totalAssets: 22, checkedAssets: 22 }
    ]
  },
  {
    id: 'task-004',
    name: '2026年Q2市场部资产盘点',
    batchNo: 'PD-2026-Q2-004',
    quarter: 'Q2',
    year: 2026,
    department: '市场部',
    departmentId: 'dept-004',
    totalAssets: 112,
    checkedAssets: 45,
    status: 'ongoing',
    deadline: '2026-06-30',
    createdAt: '2026-06-01 09:00:00',
    claimedAt: '2026-06-03 14:20:00',
    rooms: [
      { id: 'room-011', name: '市场办公区', floor: '5F', building: 'B栋', totalAssets: 52, checkedAssets: 28 },
      { id: 'room-012', name: '创意工作室', floor: '5F', building: 'B栋', totalAssets: 35, checkedAssets: 17 },
      { id: 'room-013', name: '会议室B', floor: '5F', building: 'B栋', totalAssets: 25, checkedAssets: 0 }
    ]
  },
  {
    id: 'task-005',
    name: '2026年Q2人力资源部资产盘点',
    batchNo: 'PD-2026-Q2-005',
    quarter: 'Q2',
    year: 2026,
    department: '人力资源部',
    departmentId: 'dept-005',
    totalAssets: 58,
    checkedAssets: 0,
    status: 'pending',
    deadline: '2026-06-30',
    createdAt: '2026-06-01 09:00:00',
    rooms: [
      { id: 'room-014', name: 'HR办公区', floor: '6F', building: 'B栋', totalAssets: 38, checkedAssets: 0 },
      { id: 'room-015', name: '培训室', floor: '6F', building: 'B栋', totalAssets: 20, checkedAssets: 0 }
    ]
  }
];
