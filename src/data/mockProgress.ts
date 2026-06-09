import { DepartmentProgress } from '@/types';

export const mockProgress: DepartmentProgress[] = [
  {
    id: 'dept-003',
    name: '财务部',
    totalTasks: 1,
    completedTasks: 1,
    totalAssets: 67,
    checkedAssets: 67,
    progress: 100,
    lastCheckTime: '2026-06-15 16:45:00',
    manager: '王经理',
    managerPhone: '13800138001',
    reminded: false
  },
  {
    id: 'dept-001',
    name: '技术研发部',
    totalTasks: 1,
    completedTasks: 0,
    totalAssets: 156,
    checkedAssets: 89,
    progress: 57,
    lastCheckTime: '2026-06-09 11:30:00',
    manager: '李经理',
    managerPhone: '13800138002',
    reminded: false
  },
  {
    id: 'dept-004',
    name: '市场部',
    totalTasks: 1,
    completedTasks: 0,
    totalAssets: 112,
    checkedAssets: 45,
    progress: 40,
    lastCheckTime: '2026-06-08 15:20:00',
    manager: '张经理',
    managerPhone: '13800138003',
    reminded: true,
    remindedAt: '2026-06-09 10:00:00'
  },
  {
    id: 'dept-002',
    name: '行政部',
    totalTasks: 1,
    completedTasks: 0,
    totalAssets: 89,
    checkedAssets: 0,
    progress: 0,
    manager: '赵经理',
    managerPhone: '13800138004',
    reminded: true,
    remindedAt: '2026-06-08 09:30:00'
  },
  {
    id: 'dept-005',
    name: '人力资源部',
    totalTasks: 1,
    completedTasks: 0,
    totalAssets: 58,
    checkedAssets: 0,
    progress: 0,
    manager: '刘经理',
    managerPhone: '13800138005',
    reminded: false
  }
];

export const getProgressList = (): DepartmentProgress[] => {
  return [...mockProgress].sort((a, b) => b.progress - a.progress);
};

export const getProgressByDept = (deptId: string): DepartmentProgress | undefined => {
  return mockProgress.find(p => p.id === deptId);
};
