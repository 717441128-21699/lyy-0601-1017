export default defineAppConfig({
  pages: [
    'pages/tasks/index',
    'pages/scan/index',
    'pages/exception/index',
    'pages/progress/index',
    'pages/mine/index',
    'pages/asset-detail/index',
    'pages/room-assets/index',
    'pages/history-detail/index',
    'pages/submit-result/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165dff',
    navigationBarTitleText: '资产盘点',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f6f7'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '盘点任务'
      },
      {
        pagePath: 'pages/scan/index',
        text: '扫码核对'
      },
      {
        pagePath: 'pages/exception/index',
        text: '异常上报'
      },
      {
        pagePath: 'pages/progress/index',
        text: '进度排行'
      },
      {
        pagePath: 'pages/mine/index',
        text: '个人中心'
      }
    ]
  }
})
