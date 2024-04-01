import {jumpCouponMini} from '../../../utils/utils';

/**
 * @author 老刘
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,
		orderId: undefined,
		info: undefined,
		firstCar: app.globalData.pingAnBindGuests	// 平安获客
	},
	async onLoad (options) {
		this.setData({
			orderId: app.globalData.orderInfo.orderId || options.orderId
		});
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			if (!this.data.firstCar) {
				this.setData({firstCar: await util.getBindGuests()});
			}
			this.getProcessingProgress();
		}
	},
	onShow () {
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, async (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						app.globalData.userInfo = res.data;
						app.globalData.openId = res.data.openId;
						app.globalData.memberId = res.data.memberId;
						app.globalData.mobilePhone = res.data.mobilePhone;
						if (!this.data.firstCar) {
							this.setData({firstCar: await util.getBindGuests()});
						}
						await this.getProcessingProgress();
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 获取办理进度
	getProcessingProgress () {
		util.showLoading();
		let that = this;
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: this.data.orderId,
			dataType: '12'
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					info: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/customer_service/index/index`);
		// util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	goInstallationTutorial () {
		let channel = this.data.info?.obuCardType;
		switch (channel) {
			case 1:	// 贵州 黔通卡
				util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 8:	// 辽宁 辽通卡
				util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 3:	// 山东 鲁通卡
			case 9:	// 山东 齐鲁通卡
				util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${this.data.info.auditStatus}`);
				break;
			case 2:	// 蒙通卡
				util.go(`/pages/empty_hair/neimeng_installation_tutorial/neimeng_installation_tutorial?auditStatus=${this.data.info.auditStatus}`);
				break;
			default:	// 其他需要我们自己激活的省
				util.go(`/pages/empty_hair/instructions/index?auditStatus=${this.data.info.auditStatus}`);
		}
	},
	goHome () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	},
	// 跳转平安绑客
	goPingAn () {
		// 授权提醒
		// this.selectComponent('#popTipComp').show({type: 'bingGuttes',title: '礼品领取',bgColor: 'rgba(42, 80, 68, 0.7)'});
		if (this.data.info?.vehPlates.includes('云')) {
			this.selectComponent('#popTipComp').show({type: 'newPop',title: '云',bgColor: 'rgba(0,0,0, 0.6)'});
		} else {
			this.selectComponent('#popTipComp').show({type: 'newPop',title: '全国',bgColor: 'rgba(0,0,0, 0.6)'});
		}
	},
	onUnload () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	}

});
