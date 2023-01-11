var app = getApp();
Component({
  data: {
    selected: '0',
    index: '0',
    color: '#7A7E83', // 颜色
    selectedColor: '#1E70E1', // 被选中颜色
    list: [
      {
        'pagePath': 'pages/Home/Home',
        'text': '首页'
        },
        {
        'pagePath': 'pages/etc_handle/etc_handle',
        'text': 'ETC办理'
        },
        {
        'pagePath': 'pages/membershipCertificate/membershipCertificate',
        'text': '会员券'
        },
        {
        'pagePath': 'pages/my/index',
        'text': '我的'
        }
    ]
  },
  attached () {},
  methods: {
    switchTab (e) {
      var url = e.currentTarget.dataset.path;
      var index = e.currentTarget.dataset;
      app.globalData.selectedIndex = e.currentTarget.dataset.index;
      this.setData({
        selected: e.currentTarget.dataset.index
      });
      // 根据index判断，发布是渲染的时候是没有url的
      if (url) {
        wx.switchTab({
          url
        });
      }
    }
  }
});
