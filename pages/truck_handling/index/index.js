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
		},
		problems: [
			{
				title: '办理时需要收费吗？',
				content: '我们为货车用户提供了丰富的货车车主权益，申办时收取权益费。应渠道办理要求，申办时需要支付通行保证金。'
			},
			{
				title: '支持哪些货车办理？',
				content: '市面上的货车、专项作业车、牵引车等均可办理。但目前仅支持个人用户办理，暂不支持企业用户办理。'
			},
			{
				title: '办理后可以预约绿通车吗？',
				content: '根据交通运输部引发《关于做好高速公路车辆通行优惠预约通行相关工作的通知》，符合条件的ETC车辆驾驶人或受其委托的代理人通过互联网预约才能享受免费政策。用户可通过中国ETC微信小程序进行绿通车预约。'
			},
			{
				title: 'ETC通行享受折扣吗？',
				content: '办理ETC通行的用户，享受通行费95折的优惠折扣。各省根据折扣规则不同，享受当省的折扣优惠。最可可享受85折优惠。'
			}
		]
	},
	onClickHandle () {
		wx.uma.trackEvent('truck_index_next');
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
		wx.uma.trackEvent('truck_index_for_service');
		mta.Event.stat('truck_index_for_service',{});
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
