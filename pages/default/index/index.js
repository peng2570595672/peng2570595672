/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
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
		],
		testData: [
			{title: '哪些车辆支持办理ETC？',contant: '支持9座及以下的小型汽车办理，货车办理通，敬请关注。支持9座及以下的小型汽车办理，货车办理通，敬请关注。'},
			{title: '办理你们的ETC是否支持全国通行？通行全国高速都是95折',contant: '是的。目前全国高速已实现联网，ETC设备通行均可享受通行费95折的普惠政策，如部分省份高速或路段还有其他优惠可叠加同享。'},
			{title: '哪些车辆支持已经办理过ETC还能再办吗？',contant: '根据交通部规定一个车牌号只能办理一个ETC设备，如您的车牌已办理过，需要先注销原有ETC，可联系在线客服咨询如何注销'},
			{title: '哪些车辆支持办理ETC？',contant: '支持9座及以下的小型汽车办理，货车办理通，敬请关注。'}
		],
		viewTc: {}
	},
	async onLoad (options) {
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
		// 查询是否欠款
		await util.getIsArrearage();
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	onClickHandle () {
		wx.uma.trackEvent('index_next');
		util.go('/pages/default/receiving_address/receiving_address');
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		wx.uma.trackEvent('index_for_service');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	goTruck () {
		// 去办理货车ETC
		util.go(`/pages/truck_handling/index/index`);
	},
	// 查看办理步骤
	viewProcedure () {
		this.setData({
			viewTc: {
				type: 'moduleOne'
			}
		});
		this.selectComponent('#viewProcedure').show();
	}
});
