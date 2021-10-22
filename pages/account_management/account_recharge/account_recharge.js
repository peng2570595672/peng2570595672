/**
 * @author 老刘
 * @desc 预充通行保证金
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		bankList: [],
		isRechargeEarnestMoney: false,
		choiceBankObj: undefined,
		cardInfo: undefined,
    requestNum: 0,
		rechargeAmount: undefined
	},
	async onLoad (options) {
		console.log(options,'---------预充保证金----------')
		if (options.money) {
			// 预充保证金
			this.setData({
				isRechargeEarnestMoney: true,
				rechargeAmount: options.money / 100
			});
		}
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
		await this.getBankAccounts();
		// 查询是否欠款
		await util.getIsArrearage();
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
	// 账户充值
	onNext(){
		if (!this.data.rechargeAmount) return;
		console.log(app.globalData.bankCardInfo,'========订单ID=============')
		 if(app.globalData.bankCardInfo.serviceFeeContractStatus==1){ //去开通小额免密
		   	this.icbc2Recharge()
		 }else{//去开通小额免密签约
				util.go("/pages/account_management/pay_accout/pay_accout")
		 }
	},
	// 获取有效一类卡列表
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
	 //是否小额签约
		//二类户充值发起
		async	icbc2Recharge(){
			util.showLoading('正在充值中...');
			console.log(this.data.choiceBankObj,'一类卡信息')
			console.log(this.data.cardInfo,'========二类卡信息=============')
			console.log(app.globalData.orderInfo.orderId,'========订单ID=============')
			console.log(this.data.rechargeAmount,'========充值金额不=============')
		
			const result = await util.getDataFromServersV2('consumer/order/icbc2/recharge', {
				    orderId:app.globalData.orderInfo.orderId,
				    bankAccountId:this.data.choiceBankObj.bankAccountId,
						bankV2AccountId:this.data.cardInfo.bankAccountId,
						changeAmount:this.data.rechargeAmount
				});
				this.icbc2RechargeQuery()
		},
		//二类户充值查询
		async icbc2RechargeQuery(){
			 // 充值中
			const result = await util.getDataFromServersV2('consumer/order/icbc2/rechargeQuery', {
					orderId:app.globalData.orderInfo.orderId,
					bankAccountId:this.data.choiceBankObj.bankAccountId,
					bankV2AccountId:this.data.cardInfo.bankAccountId,
					changeAmount:this.data.rechargeAmount
				});
				console.log(result)
				if(result.code==0){//充值成功
					util.go("/pages/obu/add/add") //走到了圈存
				}
		},
	// 绑定卡
	onClickSwitchBankCard () {
		wx.uma.trackEvent('account_management_for_recharge_to_switch_bank_card');
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card?isSwitch=1`);
	},
	// 输入框输入值做处理
	inputValueChange (e) {
		let key = e.currentTarget.dataset.key;
		let val = e.detail.value.trim();
		// 充值金额
		if (!+val) return;
		let amount = +val;
		this.setData({
			rechargeAmount: amount
		});
	}
});
