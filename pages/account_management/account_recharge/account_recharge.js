/**
 * @author 老刘
 * @desc 预充通行保证金
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		isShowAlert: false,
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		bankList: [],
		isRechargeEarnestMoney: false,
		choiceBankObj: undefined,
		cardInfo: undefined,
		marId: undefined,
		requestNum: 0,
		type: 0,// 0 预充模式  1 工行  2 交行
		rechargeAmount: undefined
	},
	async onLoad (options) {
		// 查询是否欠款
		await util.getIsArrearage();
		if (options.money) {
			// 预充保证金
			this.setData({
				isRechargeEarnestMoney: true,
				rechargeAmount: options.money / 100
			});
		}
		this.setData({
			type: +options.type || 0
		});
		if (this.data.type === 2) {
			// 交行
			let memberStatusInfo = app.globalData.memberStatusInfo.accountList.find(accountItem => accountItem.orderId === app.globalData.orderInfo.orderId);
			memberStatusInfo.account = memberStatusInfo.accountNo.substr(-4);
			memberStatusInfo.v1Account = memberStatusInfo.v1AccountNo.substr(-4);
			this.setData({
				choiceBankObj: memberStatusInfo
			});
			return;
		}
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
		await this.getBankAccounts();
	},
	onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		// 从选择银行卡返回
		if (currPage.__data__.index) {
			this.setData({
				choiceBankObj: this.data.bankList[currPage.__data__.index]
			});
		}
	},
	// 获取二类户号信息
	async getBankAccounts () {
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getBankAccounts');
		if (!result) return;
		if (result.code === 0) {
			result.data.map(item => {
				item.accountNo = item.accountNo.substr(-4);
			});
			this.setData({
				bankList: result.data,
				choiceBankObj: result.data[0]
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 发送短信验证码
	async sendVerifyCode () {
		if (this.data.isGetIdentifyingCoding) return;
		this.setData({
			isGetIdentifyingCoding: true
		});
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/bcmPaySendCode', {
			orderId: app.globalData.orderInfo.orderId,
			amount: +this.data.rechargeAmount * 100
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				marId: result.data.marId,
				isShowAlert: true
			});
			this.selectComponent('#bocomCertification').show();
			this.startTimer();
		} else {
			this.setData({
				isGetIdentifyingCoding: false
			});
			util.showToastNoIcon(result.message);
		}
	},
	// 倒计时
	startTimer () {
		// 设置状态
		this.setData({
			identifyingCode: `${this.data.time}s`
		});
		// 清倒计时
		clearInterval(timer);
		timer = setInterval(() => {
			this.setData({time: --this.data.time});
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 59,
					isGetIdentifyingCoding: false,
					identifyingCode: '重新获取'
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}s`
				});
			}
		}, 1000);
	},
	onHandle () {
		this.setData({
			isShowAlert: false
		});
	},
	// 交行充值提交
	async bcmPayTransfer (e) {
		if (!e.detail.verifyCode) {
			util.showToastNoIcon('请输入验证码');
			return;
		}
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/bcmPayTransfer', {
			marId: this.data.marId,
			orderId: app.globalData.orderInfo.orderId,
			mobileCode: e.detail.verifyCode,
			amount: +this.data.rechargeAmount * 100
		});
		if (!result) return;
		if (result.code === 0) {
			util.showToastNoIcon('充值成功');
			setTimeout(() => {
				const pages = getCurrentPages();
				const prevPage = pages[pages.length - 2];// 上一个页面
				prevPage.setData({
					isReload: true // 重置状态
				});
				wx.navigateBack({
					delta: 1
				});
			},3000);
		} else {
			this.setData({
				isGetIdentifyingCoding: false
			});
			util.showToastNoIcon(result.message);
		}
	},
	// 账户充值
	async next () {
		console.log(this.data.isRechargeEarnestMoney);
		if (this.data.isRechargeEarnestMoney) {
			wx.uma.trackEvent('account_management_for_recharge_to_recharge_earnest_money');
			await this.rechargeEarnestMoney();
			return;
		}
		if (!this.data.rechargeAmount) return;
		wx.uma.trackEvent('account_management_for_recharge_to_recharge');
		if (this.data.type === 2) {
			if (this.data.rechargeAmount < 50) return;
			// 交行
			await this.sendVerifyCode();
			return;
		}
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/recharge', {
			bankAccountId: this.data.choiceBankObj.bankAccountId,
			amount: +this.data.rechargeAmount * 100
		});
		if (!result) return;
		if (result.code === 0) {
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 充值查询
	async applyQuery (rechargeId) {
		if (!rechargeId) {
			util.showToastNoIcon('rechargeId丢失');
			return;
		}
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/applyQuery', {
			rechargeId: rechargeId
		});
		if (!result) return;
		if (result.code === 1) {
			// 充值中
			util.showLoading('正在充值中...');
			this.data.requestNum++;
			this.setData({
				requestNum: this.data.requestNum
			});
			if (this.data.requestNum === 5) {
				util.go(`/pages/account_management/recharge_result/recharge_result?isRechargeEarnestMoney=${+this.data.isRechargeEarnestMoney}`);
				return;
			}
			setTimeout(async () => {
				await this.applyQuery(rechargeId);
			}, 2000);
			return;
		}
		if (result.code === 0 && this.data.isRechargeEarnestMoney) {
			await this.orderHold();
			return;
		}
		util.go(`/pages/account_management/recharge_state/recharge_state?info=${JSON.stringify(result)}`);
	},
	// 保证金冻结
	async orderHold () {
		util.showLoading('冻结中...');
		const result = await util.getDataFromServersV2('consumer/order/orderHold', {
			bankAccountId: app.globalData.bankCardInfo?.bankAccountId,
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}`);
		} else {
			util.showToastNoIcon(result.message);
			// 冻结失败-预充成功,更新账户金额
			await util.getV2BankId();
		}
	},
	// 预充保证金
	async rechargeEarnestMoney () {
		const result = await util.getDataFromServersV2('consumer/order/orderDeposit', {
			bankAccountId: this.data.choiceBankObj.bankAccountId,
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 绑定卡
	onClickSwitchBankCard () {
		wx.uma.trackEvent('account_management_for_recharge_to_switch_bank_card');
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card?isSwitch=1`);
	},
	// 输入框输入值做处理
	inputValueChange (e) {
		let val = e.detail.value.trim();
		// 充值金额
		if (!+val) return;
		let amount = +val;
		this.setData({
			rechargeAmount: amount
		});
	},
	onUnload () {
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2];// 上一个页面
		prevPage.setData({
			isReload: true // 重置状态
		});
	}
});
