const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		invoiceTypes: [
			{name: '个人开票'},
			{name: '公司开票'}
		],
		currentTab: 0,
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		disabled: false,
		origin: 0, // 0 开票 1.查看详情
		invoiceType: 1, // 开票主体类型 1个人 2企业 必填
		invoiceInfo: {}
	},
	onLoad (options) {
		this.data.origin = parseInt(options.origin);
		let invoiceInfo = options.infoStr ? JSON.parse(options.infoStr) : {};
		if (this.data.origin === 0) {
			invoiceInfo.userPhone = app.globalData.mobilePhone;
			invoiceInfo.invoiceType = 1;
		}
		this.setData({
			origin: this.data.origin,
			invoiceInfo: invoiceInfo,
			disabled: this.data.origin === 1,
			currentTab: invoiceInfo.invoiceType === 2 ? 1 : 0
		});
	},
	onShow () {
	},
	// tab切换逻辑
	switchInvoiceType (e) {
		if (this.data.origin === 1) {
			return;
		}
		let that = this;
		if (this.data.currentTab === e.target.dataset.current) {
			return false;
		} else {
			this.data.invoiceInfo.invoiceType = e.target.dataset.current + 1;
			that.setData({
				currentTab: e.target.dataset.current
			});
		}
	},
	// 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let invoiceInfo = this.data.invoiceInfo;
		invoiceInfo[key] = e.detail.value;
		this.setData({
			invoiceInfo
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	validateAvailable () {
		let invoiceInfo = this.data.invoiceInfo;
		let isOk = true;
		// 检验手机号码
		isOk = isOk && invoiceInfo.userPhone && /^1[0-9]{10}$/.test(invoiceInfo.userPhone);
		isOk = isOk && invoiceInfo.customerName && invoiceInfo.customerName.length >= 1;
		if (invoiceInfo.invoiceType === 2) {
			isOk = isOk && invoiceInfo.taxNo && invoiceInfo.taxNo.length >= 1;
			isOk = isOk && invoiceInfo.addrees && invoiceInfo.addrees.length >= 1;
			isOk = isOk && invoiceInfo.addreesTel && invoiceInfo.addreesTel.length >= 1;
			isOk = isOk && invoiceInfo.bank && invoiceInfo.bank.length >= 1;
			isOk = isOk && invoiceInfo.account && invoiceInfo.account.length >= 1;
		}
		return isOk;
	},
	onClickCommit () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		let invoiceInfo = this.data.invoiceInfo;
		if (invoiceInfo.userEmail && !/^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,5}$/.test(invoiceInfo.userEmail)) {
			util.showToastNoIcon('邮箱格式不正确！');
			return false;
		}
		if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(invoiceInfo.customerName)) {
			util.showToastNoIcon('发票抬头格式不正确！');
			return false;
		}
		if (invoiceInfo.invoiceType === 2 && !/^[A-Z]{15}$|^[A-Z]{18}$|^[A-Z]{20}$/.test(invoiceInfo.taxNo)) {
			util.showToastNoIcon('税号格式不正确！');
			return false;
		}
		this.saveInfo();
	},
	saveInfo () {
		this.setData({
			isRequest: true
		});
		util.showLoading();
		let invoiceInfo = this.data.invoiceInfo;
		util.getDataFromServer('consumer/order/after-sale-record/applyInvoice', {
			orderId: invoiceInfo.orderId,
			invoiceType: invoiceInfo.invoiceType,
			userPhone: invoiceInfo.userPhone,
			customerName: invoiceInfo.customerName,
			userEmail: invoiceInfo.userEmail,
			taxNo: invoiceInfo.taxNo,
			addrees: invoiceInfo.addrees,
			addreesTel: invoiceInfo.addreesTel,
			bank: invoiceInfo.bank,
			account: invoiceInfo.account
		}, () => {
			util.showToastNoIcon('保存失败！');
		}, (res) => {
			if (res.code === 0) {
				wx.redirectTo({
					url: '/pages/personal_center/success_tips/success_tips'
				});
			} else {
				this.setData({
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
			this.setData({
				isRequest: false
			});
		});
	}
});
