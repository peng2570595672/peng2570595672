/**
 * @author xdx
 * @desc 绑定车牌
 */
const util = require('../../../utils/util.js');
const app = getApp();
let timer;
Page({
	data: {
		cardMobilePhone: '',
		vehPlates: '',
		signChannelId: '', // 签约银行渠道编号
		signType: '', // 签约银行渠道类型
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		codeSuccess: false, // 是否获取验证码
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		numberNoStr: ['', '', '', '', '', ''],
		showKeyboard: false, // 是否显示输入数字键盘
		currentIndex: -1, // 当前输入的位置
		numberNo: '',
		orderInfo: {},
		isGetIdentifyingCoding: false // 获取验证码中
	},
	async onLoad (options) {
		if (options.signChannelId) {
			// 从选择银行进入
			this.setData({
				signChannelId: options.signChannelId,
				signType: options.signType,
				vehPlates: options.vehPlates,
				cardMobilePhone: options.cardMobilePhone
			});
		}
		if (options.associatedVeh) {
			// 从首页&我的ETC&ETC详情
			await this.getOrderInfo();
		}
	},
	onShow () {
	},
	// 获取订单信息
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '18'
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				vehPlates: result.data?.base?.vehPlates,
				cardMobilePhone: result.data?.ownerIdCard?.cardMobilePhone,
				orderInfo: {
					cardMobilePhone: result.data?.ownerIdCard?.cardMobilePhone,
					needCallback: true // 需要回调
				}
			});
			await this.getSteps();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取选装签约步骤
	async getSteps () {
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/getSteps', {
			orderId: app.globalData.orderInfo.orderId,
			mobile: this.data.cardMobilePhone
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				signType: result.data?.signType,
				signChannelId: result.data?.signChannelId
			});
		} else if (result.code === 1) {
			// 登录已过期
			this.selectComponent('#verifyCode').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async onClickHandle () {
		// 登录回调
		await this.getSteps();
	},
	setCurrentCodeNo (e) {
		if (!this.data.codeSuccess) {
			util.showToastNoIcon('请先获取验证码！');
			return;
		}
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
	// 输入验证码回调
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
		this.setData({
			available: this.data.codeSuccess && this.data.numberNoStr.length === 6
		});
	},
	// 确认绑定
	async onClickBind () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/carChannelRel', {
			orderId: app.globalData.orderInfo.orderId,
			signChannelId: this.data.signChannelId,
			signType: this.data.signType,
			code: this.data.numberNo.join('')
		});
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			util.showToastNoIcon('绑定成功！');
			util.go(`/pages/default/processing_progress/processing_progress`);
		} else {
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
	// 发送短信验证码
	async sendVerifyCode () {
		if (this.data.isGetIdentifyingCoding) return;
		// 如果在倒计时，直接不处理
		if (!this.data.cardMobilePhone) {
			util.showToastNoIcon('请输入手机号');
			return;
		} else if (!/^1[0-9]{10}$/.test(this.data.cardMobilePhone)) {
			util.showToastNoIcon('手机号输入不合法');
			return;
		}
		this.setData({
			isGetIdentifyingCoding: true
		});
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/frontSendMsg', {
			mobile: this.data.cardMobilePhone, // 手机号
			type: 2 // type 登录类型	1-登录 2-车牌签约绑定 3-售后
		});
		if (!result) return;
		if (result.code === 0) {
			this.startTimer();
			this.setData({codeSuccess: true});
		} else {
			this.setData({codeSuccess: false});
			this.setData({
				isGetIdentifyingCoding: false
			});
			util.showToastNoIcon(result.message);
		}
	}
});
