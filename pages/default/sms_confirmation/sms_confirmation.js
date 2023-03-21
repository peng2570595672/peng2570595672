/**
 * @author 老刘
 * @desc 签字确认-真机调试不能绘制
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		signType: 2,// 1-签字  2-验证码
		mobilePhone: '',
		beginDraw: false, // 开始绘画
		startX: 0,// 屏幕点x坐标
		startY: 0, // 屏幕点y坐标
		isNeedJump: true,
		strokeNum: 0 // 笔画
	},
	onShow () {
		this.setData({
			isNeedJump: true
		});
	},
	async onLoad (options) {
			const phone = app.globalData.userInfo.mobilePhone;
			this.setData({
				mobilePhone: phone.slice(0,3) + ' ' + phone.slice(3,7) + ' ' + phone.slice(7,11)
			});
			this.getETCDetail();
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
					identifyingCode: `（${this.data.time}S）`
				});
			}
		}, 1000);
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
		const result = await util.getDataFromServersV2('consumer/order/sendRightsConfirmVerifyCode', {
			orderId: app.globalData.orderInfo.orderId // 手机号
		});
		if (!result) return;
		if (result.code === 0) {
			this.startTimer();
		} else {
			this.setData({
				isGetIdentifyingCoding: false
			});
			util.showToastNoIcon(result.message);
		}
	},
	// 输入框输入值做处理
	onInputChangedHandle (e) {
		this.setData({
			verifyCode: e.detail.value.substring(0, 6)
		});
		if (this.data.verifyCode.length === 6) {
			this.saveSign(this.data.verifyCode);
		}
	},
	handleSignStatus () {
		util.go(`/pages/default/signature_confirmation/signature_confirmation`);
	},
	async saveSign (verifyCode) {
		util.showLoading('加载中');
		let params = {
			signType: this.data.signType,
			verifyCode: verifyCode,
			orderId: app.globalData.orderInfo.orderId// 订单id
		};
		console.log('保存签名信息');
		console.log(params);
		const result = await util.getDataFromServersV2('consumer/order/user/sign', params);
		if (!result) return;
		if (result.code === 0) {
			const obj = this.data.orderInfo;
			if (obj.orderType === 51) {
				if (obj.contractStatus === 2) {
					app.globalData.orderInfo.orderId = obj.id;
					// 恢复签约
					await this.restoreSign(obj);
				} else {
					app.globalData.signAContract = -1;
					await this.weChatSign(obj);
				}
				return;
			}
			if (!this.data.isNeedJump) return;
			this.setData({
				isNeedJump: false
			});
			util.go(`/pages/default/signature_confirmation/signature_confirmation`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			orderInfo['selfStatus'] = util.getStatus(orderInfo);
			this.setData({
				orderInfo
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async weChatSign (obj) {
		util.showLoading('加载中');
		let params = {
			orderId: app.globalData.orderInfo.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			util.hideLoading();
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
			app.globalData.belongToPlatform = obj.platformId;
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.contractStatus = obj.contractStatus;
			app.globalData.orderStatus = obj.selfStatus;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 恢复签约
	async restoreSign (obj) {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: obj.id
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 1;
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus !== 1) {
				if (result.data.version === 'v3') {
					if (result.data.contractId) {
						wx.navigateToMiniProgram({
							appId: 'wxbcad394b3d99dac9',
							path: 'pages/etc/index',
							extraData: {
								contract_id: result.data.contractId
							},
							success () {
							},
							fail (e) {
								// 未成功跳转到签约小程序
								util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
							}
						});
					} else {
						await this.weChatSign(obj);
					}
				} else {
					await this.weChatSign(obj);
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleCancel () {
		wx.navigateBack({
			delta: 1
		});
	},
	// 开始
	touchStart (e) {
		this.lineBegin(e.touches[0].x, e.touches[0].y);
	},
	// 移动
	touchMove (e) {
		if (this.data.beginDraw) {
			this.addPointInLine(e.touches[0].x, e.touches[0].y);
			context.draw(true); // true 本次绘制接着上一次绘制  false 清除上次绘制
		}
	},
	// 结束
	touchEnd (e) {
		console.log(e);
		this.lineEnd();
	},
	// 错误返回
	canvasErrorBack (e) {
		util.showToastNoIcon('签名失败，请稍后重试！');
	},
	// 开始划线
	lineBegin (x, y) {
		context.beginPath();
		this.setData({
			beginDraw: true,
			startX: x,
			startY: y
		});
		this.addPointInLine(x, y);
	},
	// 增加点
	addPointInLine (x, y) {
		context.moveTo(this.data.startX, this.data.startY);
		context.lineTo(x, y);
		context.stroke(); // 划弧线
		this.setData({
			startX: x,
			startY: y
		});
	},
	lineEnd () {
		context.closePath(); // 关闭当前路径
		this.beginDraw = false;
		this.setData({
			strokeNum: this.data.strokeNum + 1,
			beginDraw: false
		});
	}
});
