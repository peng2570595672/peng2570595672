const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        loginInfo: undefined, // 登录信息
        roadRescueList: [] // 道路救援订单列表
    },

    onLoad (options) {
        if (app.globalData.userInfo.accessToken) {
            this.getOrderList();
		} else {
			// 公众号进入需要登录
			this.login();
		}
    },

    async onShow () {
        // 查询是否欠款
		await util.getIsArrearage();
    },

    // 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						await this.getOrderList();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},

    // 获取道路救援订单列表数据
    async getOrderList () {
        const result = await util.getDataFromServersV2('consumer/order/road-resue/order-list', {},'POST',true);
		if (!result) return;
		if (result.code === 0) {
			if (result.data.length === 0) {
				this.setData({roadRescueList: [
					{vehPlates: '贵ZQ0101'},
					{vehPlates: '贵ZQ01021'},
					{vehPlates: '贵ZQ0103'},
					{vehPlates: '贵ZQ0104'}
				]});
				return;
			}
			this.setData({roadRescueList: result.data});
		} else {
			util.showToastNoIcon(result.message);
		}
    },

    // 点击“申请补贴” 跳转至 “在线客服”
    btnLoad (e) {
        // /pages/web/web/web?type=online_customer_service
        // if (!app.globalData.userInfo?.accessToken) {
		// 	util.go('/pages/login/login/login');
		// }
        // wx.uma.trackEvent('index_for_service');
		// util.go(`/pages/web/web/web?type=online_customer_service`);
		let item = e.currentTarget.dataset.item;
		let url = item.vehPlates === '贵ZQ01021' || item.vehPlates === '贵ZQ0103' ? 'road_rescue_receive' : 'road_rescue_detail';
		if (item.vehPlates === '贵ZQ0104') {
			url = 'road_rescue_schedule';
		}
		wx.navigateTo({
			url: `/pages/road_rescue_orders/${url}/${url}`,
			success: function (res) {
				switch (item.vehPlates) {
					case '贵ZQ01021':
						res.eventChannel.emit('roadRescueList', { data: item });
						break;
					case '贵ZQ0103':
						res.eventChannel.emit('roadRescueList', { data: item });
						break;
					case '贵ZQ0101':
						res.eventChannel.emit('roadRescueList', { data: item });
						break;
					case '贵ZQ0104':
						res.eventChannel.emit('roadRescueList', { data: item });
						break;
					default:
						break;
				}
			}
		});
    },

    onUnload () {

    }
});
