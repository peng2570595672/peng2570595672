/**
 * @author 老刘
 * @desc 空发订单查询
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		loginInfo: {},
		mobilePhoneTips: '',
		verifyCodeTips: '',
		sourceOrderIdTips: '',
		formData: {
			mobilePhone: '',
			sourceOrderId: '',
			verifyCode: ''
		}, // 提交数据
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		available: false,
		isAgreement: false,
		isGetIdentifyingCoding: false // 获取验证码中
	},
	async onLoad (options) {
	},
	async onShow () {
		// 公众号进入需要登录
		this.login();
	},
	handleCheckAgreement () {
		this.setData({
			isAgreement: !this.data.isAgreement
		});
		this.validateAvailable();
	},
	handleProtocol () {
		util.go('/pages/agreement_documents/equity_agreement/equity_agreement');
	},
	handleQTProtocol () {
		util.go('/pages/truck_handling/agreement_for_qiantong_to_charge/agreement');
	},
	handlePrivacy () {
		util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
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
		this.setData({
			mobilePhoneTips: /^1[0-9]{10}$/.test(this.data.formData.mobilePhone) ? '' : '*手机号不正确'
		});
		if (this.data.mobilePhoneTips) {
			return;
		}
		this.setData({
			isGetIdentifyingCoding: true
		});
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/sendEmptySendOrderVerifyCode', {
			mobilePhone: this.data.formData.mobilePhone// 手机号
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
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (!result) return;
				if (result.code) {
					util.showToastNoIcon(result.message);
					return;
				}
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				this.setData({
					loginInfo: result.data
				});
				// 已经绑定了手机号
				if (result.data.needBindingPhone !== 1) {
					app.globalData.userInfo = result.data;
					app.globalData.openId = result.data.openId;
					app.globalData.memberId = result.data.memberId;
					app.globalData.mobilePhone = result.data.mobilePhone;
					// 查询是否欠款
					await util.getIsArrearage();
				} else {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					// util.go('/pages/login/login/login');
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 校验字段是否满足
	validateAvailable (key) {
		let isOk = true;
		let formData = this.data.formData;
		isOk = isOk && /^1[0-9]{10}$/.test(formData.mobilePhone);
		isOk = isOk && formData.verifyCode && formData.verifyCode.length === 6;
		isOk = isOk && this.data.isAgreement;
		isOk = isOk && formData.sourceOrderId;
		this.setData({
			mobilePhoneTips: key === 'mobilePhone' ? /^1[0-9]{10}$/.test(formData.mobilePhone) ? '' : '*手机号不正确' : '',
			verifyCodeTips: key === 'verifyCode' ? formData.verifyCode.length === 6 ? '' : '*验证码不正确' : '',
			sourceOrderIdTips: key === 'sourceOrderId' ? !formData.sourceOrderId ? '' : '*电商订单号不能为空' : '',
			available: isOk
		});
	},
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	handleInstall () {
	},
	handleNoOrderTips () {
		util.alert({
			title: '',
			content: '更换一下手机号试试?比如订单的收件人手机号',
			confirmText: '确定',
			showCancel: true,
			cancelText: '取消',
			confirm: () => {
			}
		});
	},
	async handleBind () {
		if (!this.data.available) {
			if (!this.data.isAgreement) {
				util.showToastNoIcon('请查看并勾选协议');
			}
			return;
		}
		const params = this.data.formData;
		params.contractPlatformId = app.globalData.platformId;
		const result = await util.getDataFromServersV2('consumer/order/queryEmptySendOrdersByMobile', this.data.formData);
		// const result = {"message":"操作成功","code":0,"data":{"noActiveOrders":[{"etcNo":"0123456789876543210","orderId":"1094912451081674752","vehColor":0,"auditStatus":0,"obuNo":"123456","vehPlate":"","payStatus":-1,"obuStatus":0},{"etcNo":"66666","orderId":"1094919258055385088","vehColor":0,"auditStatus":0,"obuNo":"123456789","vehPlate":"贵Z42111","payStatus":-1,"obuStatus":0}],"acticedOrders":[]}}
		if (!result) return;
		if (result.code === 0) {
			const list = result.data.noActiveOrders;
			if (!list.length) {
				this.handleNoOrderTips();
			} else if (list.length === 1) {
				const slicingLength = 4;
				let strEtcNo = [];
				for (let i = 0; i < list[0].etcNo?.length; i += slicingLength) {
					strEtcNo.push(list[0].etcNo.slice(i,i + slicingLength));
				}
				list[0].newEtcNo = strEtcNo.join(' ');
				let strObuNo = [];
				for (let i = 0; i < list[0].obuNo?.length; i += slicingLength) {
					strObuNo.push(list[0].obuNo.slice(i,i + slicingLength));
				}
				list[0].newObuNo = strObuNo.join(' ');
				if ((list[0].status === 1 && list[0].contractStatus) || list[0].auditStatus === 2) {
					util.go(`/pages/default/processing_progress/processing_progress?orderId=${list[0].orderId}`);
					return;
				}
				if (list[0].vehPlate) {
					app.globalData.orderInfo.orderId = list[0].orderId;
					if (!list[0].isOwner && list[0].orderType === 71) {
						util.go('/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?emptyHairOrder=true');
						return;
					}
					util.go('/pages/default/information_list/information_list');
					return;
				}
				util.go(`/pages/empty_hair/basic_information/basic_information?info=${JSON.stringify(list[0])}`);
			} else {
				app.globalData.emptyHairDeviceList = result.data;
				util.go(`/pages/empty_hair/device_list/device_list`);
			}
			util.hideLoading();
		} else {
			util.hideLoading();
			util.showToastNoIcon(result.message);
		}
	},
	async onGetPhoneNumber (e) {
		if (e.detail.errno === 1400001) {
			util.showToastNoIcon('开发方预存费用不足！');
			return;
		}
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '绑定中...'
			});
			const result = await util.getDataFromServersV2('consumer/member/common/applet/bindingPhone', {
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			}, 'POST', false);
			if (!result) return;
			// 绑定手机号成功
			if (result.code === 0) {
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				app.globalData.userInfo = result.data; // 用户登录信息
				app.globalData.openId = result.data.openId;
				app.globalData.memberId = result.data.memberId;
				app.globalData.mobilePhone = result.data.mobilePhone;
				let loginInfo = this.data.loginInfo;
				loginInfo['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				loginInfo.needBindingPhone = 0;
				this.setData({
					loginInfo
				});
				util.hideLoading();
			} else {
				util.hideLoading();
				util.showToastNoIcon(result.message);
			}
		}
	},
	// 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let formData = this.data.formData;
		if (key === 'mobilePhone' && e.detail.value.length > 11) {
			formData[key] = e.detail.value.substring(0, 11);
		}
		if (key === 'verifyCode' && e.detail.value.length > 6) {
			formData[key] = e.detail.value.substring(0, 6);
		} else {
			formData[key] = e.detail.value;
		}
		this.setData({
			formData
		});
		this.fangDou(key,500);
	},
	fangDou (fn, time) {
		let that = this;
		that.setData({available: false});
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.validateAvailable(fn);
			}, time);
		})();
	},
	onUnload () {
	}
});
