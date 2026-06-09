// 盘点任务状态
export type TaskStatus = 'pending' | 'ongoing' | 'completed';

// 资产状态
export type AssetStatus = 'normal' | 'idle' | 'lost' | 'mismatch' | 'unchecked';

// 盘点任务
export interface InventoryTask {
  id: string;
  name: string;
  batchNo: string;
  quarter: string;
  year: number;
  department: string;
  departmentId: string;
  totalAssets: number;
  checkedAssets: number;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
  rooms: RoomInfo[];
}

// 房间信息
export interface RoomInfo {
  id: string;
  name: string;
  floor: string;
  building: string;
  totalAssets: number;
  checkedAssets: number;
}

// 资产信息
export interface Asset {
  id: string;
  assetNo: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchaseDate: string;
  price: number;
  department: string;
  roomId: string;
  roomName: string;
  floor: string;
  building: string;
  qrCode: string;
  status: AssetStatus;
  checkStatus?: AssetStatus;
  checkRemark?: string;
  checkPhotos?: string[];
  checkedAt?: string;
  checker?: string;
}

// 异常记录
export interface ExceptionRecord {
  id: string;
  assetId: string;
  assetNo: string;
  assetName: string;
  type: AssetStatus;
  description: string;
  photos: string[];
  reporter: string;
  reportedBy?: string;
  reporterId: string;
  department: string;
  taskId: string;
  taskName: string;
  batchNo?: string;
  roomName?: string;
  createdAt: string;
  reportedAt?: string;
  status: 'pending' | 'processing' | 'resolved';
  remark?: string;
}

// 部门进度
export interface DepartmentProgress {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  totalAssets: number;
  checkedAssets: number;
  progress: number;
  lastCheckTime?: string;
  manager: string;
  managerPhone: string;
  reminded?: boolean;
  remindedAt?: string;
}

// 盘点记录
export interface CheckRecord {
  id: string;
  taskId: string;
  taskName: string;
  batchNo: string;
  assetId: string;
  assetNo: string;
  assetName: string;
  status: AssetStatus;
  remark?: string;
  photos: string[];
  checker: string;
  department: string;
  roomName: string;
  checkedAt: string;
  isDraft?: boolean;
}

// 历史盘点
export interface HistoryInventory {
  id: string;
  batchNo: string;
  name: string;
  quarter: string;
  year: number;
  department: string;
  totalAssets: number;
  normalAssets: number;
  exceptionAssets: number;
  lostAssets: number;
  idleAssets: number;
  mismatchAssets: number;
  completedAt: string;
  checker: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  department: string;
  departmentId: string;
  role: 'admin' | 'manager' | 'operator';
  avatar?: string;
}

// 统计数据
export interface Statistics {
  totalTasks: number;
  ongoingTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalAssets: number;
  checkedAssets: number;
  exceptionCount: number;
  pendingCheckCount: number;
}
