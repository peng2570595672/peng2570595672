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
		processList: [
			{
				title: '填写资料',
				content: '填写邮寄地址及车辆信息，仅支持蓝牌或绿牌且9座以下客车办理。'
			},
			{
				title: '选择办理方式',
				content: '选择办理方式及加购权益，完成支付且设备激活后获赠对应服务权益。'
			},
			{
				title: '上传证件及签约免密代扣',
				content: '按要求上传对应资料，签约微信免密代扣通行费。资料审核通过后即安排快递配送。'
			},
			{
				title: '安装激活',
				content: '收到设备后按指引激活ETC，先通行后付费，通行后费用将通过微信代扣。'
			}
		]
	},
	onLoad (options) {
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
	},
	onClickHandle () {
		wx.uma.trackEvent('index_next');
		mta.Event.stat('truck_index',{});
		util.go('/pages/default/receiving_address/receiving_address');
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		wx.uma.trackEvent('index_for_service');
		mta.Event.stat('truck_index_for_service',{});
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	goTruck () {
		// 去办理货车ETC
		util.go(`/pages/truck_handling/index/index`);
	}
});
