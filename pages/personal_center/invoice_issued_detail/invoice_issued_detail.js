const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		invoiceTypes: [
			{name: '公司开票'},
			{name: '个人开票'}
		],
		currentTab: 0,
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		disabled: false,
		origin: 0, // 0 开票 1.查看详情
		invoiceType: 2, // 开票主体类型 1个人 2企业 必填
		invoiceInfo: {}
	},
	async onLoad (options) {
		this.data.origin = parseInt(options.origin);
		let invoiceInfo = options.infoStr ? JSON.parse(options.infoStr) : {};
		if (this.data.origin === 0) {
			invoiceInfo.userPhone = app.globalData.mobilePhone;
			invoiceInfo.invoiceType = 2;
		} else {
			const index = invoiceInfo.invoiceType === 2 ? 1 : 0;
			this.data.invoiceTypes.splice(index,1);
		}
		this.setData({
			invoiceTypes: this.data.invoiceTypes,
			origin: this.data.origin,
			invoiceInfo: invoiceInfo,
			disabled: this.data.origin === 1,
			currentTab: invoiceInfo.invoiceType === 2 ? 0 : 1
		});
		// 查询是否欠款
		await util.getIsArrearage();
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
			this.data.invoiceInfo.invoiceType = e.target.dataset.current === 0 ? 2 : 1;
			that.setData({
				currentTab: e.target.dataset.current
			});
		}
		this.setData({
			available: !!this.validateAvailable()
		});
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
		if (invoiceInfo.invoiceType === 2 && !/^[A-Z0-9]{15}$|^[A-Z0-9]{18}$|^[A-Z0-9]{20}$/.test(invoiceInfo.taxNo)) {
			util.showToastNoIcon('税号格式不正确！');
			return false;
		}
		this.invoiceTip();
	},
	// 发票确认提示弹窗
	invoiceTip () {
		let that = this;
		that.selectComponent('#popTipComp').show({
			type: 'invoiceTip',
			title: '重要提示',
			btnCancel: '我再想想',
			btnconfirm: '确认开票',
			content: {
				text: `当前正在开具${that.data.currentTab === 1 ? '个人开票' : '公司发票'}，一经开票，不允许作废重开，请仔细核对开票信息是否正确！`,
				phoneNumber: that.data.invoiceInfo.userPhone
			},
			callBack: () => {
				that.saveInfo();
			}
		});
	},
	saveInfo () {
		wx.uma.trackEvent('personal_center_for_make_invoice_to_confirm');
		this.setData({
			isRequest: true
		});
		util.showLoading({
			title: `开票中请稍等...`
		});
		let invoiceInfo = this.data.invoiceInfo;
		let params = {
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
		};
		if (invoiceInfo.invoiceType === 1) {
			params = {
				orderId: invoiceInfo.orderId,
				userPhone: invoiceInfo.userPhone,
				userEmail: invoiceInfo.userEmail,
				invoiceType: invoiceInfo.invoiceType,
				customerName: invoiceInfo.customerName
			};
		}
		util.getDataFromServer('consumer/order/after-sale-record/applyInvoice', params, () => {
			util.showToastNoIcon('保存失败！');
		}, (res) => {
			if (res.code === 0) {
				util.hideLoading();
				wx.redirectTo({
					url: '/pages/personal_center/success_tips/success_tips'
				});
			} else {
				util.hideLoading();
				this.setData({
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				isRequest: false
			});
		});
	}
});
