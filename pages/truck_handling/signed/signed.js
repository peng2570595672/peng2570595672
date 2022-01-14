const util = require('../../../utils/util.js');
let timer;
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
	data: {
		// 是否获取焦点
		focus: false,
		// 需要获取焦点的序号
		focusIndex: 0,
		value1: '',
		value2: '',
		value3: '',
		value4: '',
		value5: '',
		value6: '',
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		truckLicensePlate: '',
		phone: '',
		smsCodeSeq: {},
		isRequest: false,
		isSetBankConfig: false,
		isGetIdentifyingCoding: 1,
		isDisabled: true,
		numberNoStr: ['', '', '', '', '', ''],
		showKeyboard: false, // 是否显示输入数字键盘
		currentIndex: -1, // 当前输入的位置
		numberNo: ''
	},
	async onLoad () {
		if (app.globalData.processFlowVersion === 7) {
			// 获取订单银行配置信息
			const result = await util.getDataFromServersV2('/consumer/order/getOrderBankConfigInfo', {
				orderId: app.globalData.orderInfo.orderId
			});
			if (result.code) {
				util.showToastNoIcon(result.message);
			} else {
				this.setData({
					isSetBankConfig: Boolean(result.data?.isExcess)
				});
			}
		}
		await util.getMemberStatus();
		const info = app.globalData.memberStatusInfo.accountList.find(item => item.orderId === app.globalData.orderInfo.orderId);
		this.setData({
			phone: info?.mobilePhone || app.globalData.userInfo.mobilePhone,
			truckLicensePlate: app.globalData.truckLicensePlate
		});
	},
	// 输入时事件
	inputListener (event) {
		let currentIndex = parseInt(event.target.id);
		if (currentIndex < 7) {
			this.setData({
				focus: true,
				focusIndex: currentIndex + 1
			});
		} else {
			this.setData({
			focus: false
			});
		}
	},
	setCurrentCodeNo (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index
		});
		this.setData({
			showKeyboard: true
		});
		// 低版本微信 无法显示键盘 兼容处理方式
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
	},
	valueChange (e) {
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(e.detail.index, this.data.currentIndex);
		}
		this.setData({
			numberNo: e.detail.numberNo,
			numberNoStr: e.detail.numberNo.join(''),
			currentIndex: e.detail.index,
			showKeyboard: e.detail.show
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
		if (!this.data.showKeyboard) {
			wx.pageScrollTo({
				scrollTop: 0,
				duration: 400
			});
		}
		if (this.data.numberNoStr.length === 6 && (e.detail.index === 6 || (e.detail.status && e.detail.status === 'end'))) {
			this.setData({
				showKeyboard: false
			});
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
	},
	// 失去焦点
	onBindblur (event) {
		let currentIndex = parseInt(event.target.id);
		let val = event.detail.value;
		switch (currentIndex) {
			case 1:
				this.setData({value1: val});
				break;
			case 2:
				this.setData({value2: val});
				break;
			case 3:
				this.setData({value3: val});
				break;
			case 4:
				this.setData({value4: val});
				break;
			case 5:
				this.setData({value5: val});
				break;
			case 6:
				this.setData({value6: val});
				break;
		}
		let smsCode = this.data.value1.toString() + this.data.value2.toString() + this.data.value3.toString() + this.data.value4.toString() + this.data.value6.toString();
		smsCode.trim();
		console.log(smsCode,'============' + smsCode.length);
		if (smsCode.length >= 5) {
			this.setData({
				isDisabled: false
			});
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
					isGetIdentifyingCoding: 2,
					identifyingCode: '重新获取'
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}s`
				});
			}
		}, 1000);
	},
	// 获取验证码-签约短信验证码
	async getCode () {
		let params = {
			mobilePhone: this.data.phone || app.globalData.userInfo.mobilePhone,
			phone: this.data.phone,
			orderId: app.globalData.orderInfo.orderId
		};
		const path = `/consumer/order/${app.globalData.processFlowVersion === 7 ? 'bcmFastPayContractSms' : 'submitETCTradeDepositContract'}`;
		const result = await util.getDataFromServersV2(path, params);
		if (!result.code) {
			this.startTimer();
			if (app.globalData.processFlowVersion === 7) {
				this.setData({
					smsCodeSeq: result.data.smsCodeSeq
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
		console.log(result,'-----------------');
	},
	// 提交代码
	async onSubmit () {
		if (this.data.numberNoStr.length !== 6) {
			util.showToastNoIcon('请输入验证码');
			return;
		}
		if (app.globalData.processFlowVersion === 7 && !this.data.isSetBankConfig) {
			// 发起超额圈存设置
			const result = await util.getDataFromServersV2('/consumer/order/bcmExcessFreezeSetting', {
				excessAmt: '20000000',// 圈存上限金额，分
				orderId: app.globalData.orderInfo.orderId
			});
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			this.setData({
				isSetBankConfig: true
			});
		}
		this.setData({isRequest: true});
		let params = {
			smsCode: this.data.numberNoStr,
			smsCodeSeq: this.data.smsCodeSeq,// 短信验证码序号-交行二类户
			orderId: app.globalData.orderInfo.orderId
		};
		const path = `/consumer/order/${app.globalData.processFlowVersion === 7 ? 'bcmTruckTwoTypeContract' : 'confirmETCTradeDepositContract'}`;
		const result = await util.getDataFromServersV2(path, params);
		this.setData({isRequest: false});
		if (!result.code) {
			let params = {
				dataComplete: 1,// 资料已完善
				orderId: app.globalData.orderInfo.orderId,// 订单id
				changeAuditStatus: true
			};
			const res = await util.getDataFromServersV2('consumer/order/save-order-info', params);
			if (!res) return;
			if (res.code) {
				util.showToastNoIcon(res.message);
				return;
			}
			util.go('/pages/default/processing_progress/processing_progress?type=main_process');
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
