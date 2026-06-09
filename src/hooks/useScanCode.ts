import Taro from '@tarojs/taro';
import { useState } from 'react';

export const useScanCode = () => {
  const [scanning, setScanning] = useState(false);

  const scan = async (): Promise<string | null> => {
    setScanning(true);
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      });
      console.log('[ScanCode] 扫码结果', res.result);
      return res.result;
    } catch (error) {
      console.error('[ScanCode] 扫码失败', error);
      Taro.showToast({
        title: '扫码取消或失败',
        icon: 'none',
        duration: 2000
      });
      return null;
    } finally {
      setScanning(false);
    }
  };

  return {
    scanning,
    scan
  };
};
