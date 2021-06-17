/**
 * @author 老刘
 * @desc 优惠购页面
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		etcList: [],
		activeIndex: -1,
		packageId: undefined,
		shopUserInfo: undefined,// 业务员信息
		choiceLicensePlat: {}
	},
	onLoad (options) {
		const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 1);
		this.setData({
			etcList,
			packageId: options.packageId,
			shopUserInfo: options.shopUserInfo
		});
	},
	onClickChoiceLicensePlat (e) {
		let index = +e.currentTarget.dataset['index'];
		if (this.data.etcList[index].obuStatus !== 1 && this.data.etcList[index].obuStatus !== 5) {
			util.alert({
				title: `请确认`,
				content: `当前车辆尚未激活ETC，可能导致通行券无法使用`,
				showCancel: true,
				confirmColor: '#576B95',
				cancelColor: '#000000',
				cancelText: '取消',
				confirmText: '确认',
				confirm: async () => {
					this.setData({activeIndex: index});
				},
				cancel: () => {
				}
			});
		} else {
			this.setData({activeIndex: index});
		}
	},
	async onClickPay () {
		if (this.data.activeIndex === -1) {
			util.showToastNoIcon('请选择车辆！');
			return;
		}
		// 支付
		await this.packagePayment();
	},
	// 支付
	async packagePayment () {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		const params = {
			tradeType: 1,
			packageId: this.data.packageId,
			orderId: this.data.etcList[this.data.activeIndex].id,
			openId: app.globalData.userInfo.openId
		};
		if (this.data.shopUserInfo) {
			params.shopUserInfo = this.data.shopUserInfo;
		}
		const result = await util.getDataFromServersV2('consumer/voucher/rights/independent-rights-buy', params);
		if (!result) {
			this.setData({isRequest: false});
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						util.go(`/pages/separate_interest_package/buy_success/buy_success`);
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({isRequest: false});
			util.showToastNoIcon(result.message);
		}
	}
});
