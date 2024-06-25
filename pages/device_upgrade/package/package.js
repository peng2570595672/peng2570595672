const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        imgList: [
            {imgUrl: 'https://file.cyzl.com/g001/M01/E2/EA/oYYBAGR5oAiAL42TAAE0P4zE2TM889.png'}
        ],
        duration: 500,	// 轮播图时间间隔
		interval: 5000,	// 轮播图切换时间
		Hei: 628,	// banner默认高度
        autoplay: true, // 是否无缝衔接
        describeList: [
            {name: 'S**u',addrAndYear: '来自佛山 | 车龄1年',content: '安装激活后，高速走ETC通道，反应灵敏很好用， 以后再也不用排队交过路费了， 办理真的快速，不到三天，如果去指定地方办这个又是排队又是安装激活，浪费不少时间'},
            {name: '王**胜',addrAndYear: '来自深圳 | 车龄10年',content: ' 办理真的快速，不到三天，如果去指定地方办这个又是排队又是安装激活'}
        ],
        navbarHeight: app.globalData.navbarHeight, // 自定义导航栏的高度
        custom: app.globalData.capsule, //  自定义导航栏胶囊数据
        orderId: '', // 订单ID
        pay: false // 是否去支付
    },

    onLoad (options) {
        if (options?.orderId) {
            this.setData({orderId: options.orderId});
        }
    },

    async onShow () {
        this.getOrderList();
    },
    catchtouchmove () {},
    // 返回上一级页面
    goBack () {
        let pageLen = getCurrentPages();
        if (pageLen.length === 1) {
            wx.reLaunch({
                url: '/pages/my/index'
              });
        } else {
            wx.navigateBack({
                delta: 1
            });
        }
    },
    // 按钮：马上升级
    onClickHandle () {
        this.useComponents();
    },
    // 使用组件
	useComponents () {
		this.selectComponent('#cdPopup').show({
			isBtnClose: false,
			argObj: {
                type: 'device_upgrade',
				title: '办理车牌号',
                orderId: this.data.orderId
			}
		});
	},
    async getOrderList () {
        const result = await util.getDataFromServersV2('consumer/order/my-etc-list', {openId: app.globalData.openId},'POST', false);
        if (!result) return;
        if (result.code === 0) {
            app.globalData.myEtcList = result.data;
        } else {
            showToastNoIcon(result.message);
        }
    }
});
