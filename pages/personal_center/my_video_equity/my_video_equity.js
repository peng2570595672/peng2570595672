const util = require('../../../utils/util.js');
Page({
	data: {
		couponList: [],
		recordId: '',
		couponRecordId: '',
		mobilePhone: '',
		isConverted: false,
		mask: false,
		wrapper: false
	},
	async onLoad (options) {
		this.setData({
			recordId: options.recordId
		});
		this.getExchangeCoupon();
	},
	onShow () {
		if (this.data.couponRecordId) {
			this.getExchangeCoupon();
		}
	},
	async getExchangeCoupon () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/com-coupon-list', {
			recordId: this.data.recordId
		});
		result.data.map(item => {
			// isReceive : 0-可兑换，1-已兑换，2-不可兑换
			if (item.isReceive === 1) {
				this.setData({
					isConverted: true
				});
			}
		});
		this.setData({
			couponList: result.data
		});
	},
	handleExchange (e) {
		if (this.data.isConverted) {
			return;
		}
		let index = e.currentTarget.dataset.index;
		this.setData({
			couponRecordId: this.data.couponList[index].recordId,
			mask: true,
			wrapper: true
		});
	},
	handleClose () {
		this.setData({
			wrapper: false
		});
		setTimeout(() => {
			this.setData({
				mask: false
			});
		}, 400);
	},
	// 输入框输入值
	onInputChangedHandle (e) {
		// 请填写正确的手机号码
		let value = e.detail.value;
		this.setData({
			mobilePhone: value
		});
	},
	async handleSubmit () {
		if (!this.data.mobilePhone) {
			util.showToastNoIcon('请输入手机号');
			return false;
		} else if (!/^1[0-9]{10}$/.test(this.data.mobilePhone.trim())) {
			util.showToastNoIcon('手机号格式错误');
			return false;
		}
		const result = await util.getDataFromServersV2('consumer/voucher/rights/exchange-com-coupon', {
			recordId: this.data.couponRecordId,
			mobilePhone: this.data.mobilePhone
		});
		this.handleClose();
		wx.setStorageSync('equityExchangeResult',JSON.stringify(result));
		util.go(`/pages/personal_center/equity_exchange_result/equity_exchange_result`);
	},
	onUnload () {
	}
});
