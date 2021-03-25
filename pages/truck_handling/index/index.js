/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		promptObject: {
			imgUrl: '/pages/truck_handling/assets/bill_img.png',
			content: '贵州省内公路享通行路费85折起其余省份95折起',
			isOk: true,
			isHide: false
		}
	},
	onClickHandle () {
		mta.Event.stat('truck_index',{});
		util.go('/pages/truck_handling/truck_receiving_address/truck_receiving_address');
	},
	onclickDetail () {
		this.selectComponent('#notFinishedOrder').show();
		// this.selectComponent('#passTheDiscount').show();
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		mta.Event.stat('truck_index_for_service',{});
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
