import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useInventoryStore } from '@/store';
// 全局样式
import './app.scss';

function App(props) {
  const initStore = useInventoryStore(state => state.init);
  const refreshStore = useInventoryStore(state => state.refresh);

  useEffect(() => {
    initStore();
    console.log('[App] Store初始化完成');
  }, [initStore]);

  useDidShow(() => {
    refreshStore();
    console.log('[App] 页面显示，刷新Store');
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
