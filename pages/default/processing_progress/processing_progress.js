/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		bankList: [],
		orderId: undefined,
		dashedHeight: 0,
		accountVerification: 0, //  0 没有核验id   1：核验成功，2-正在核验
		info: undefined,
		isContinentInsurance: false, // 是否是大地保险
		number: 0,
		showDetailWrapper: false,
		showDetailMask: false,
		showDetailInsurance: false,// 是否展示车险报价插屏
		memberId: '',
		rechargeId: '',// 预充保证金id
		requestNum: 0,// 请求次数
		weiBaoOrderId: '',
		isSalesmanPrecharge: false,
		prechargeInfo: ''// 预充流程,预充信息
	},
	async onLoad (options) {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance
		});
		if (options.orderId) {
			this.setData({
				orderId: options.orderId
			});
		} else {
			this.setData({
				orderId: app.globalData.orderInfo.orderId
			});
		}
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			await this.getBankAccounts();
			this.getProcessingProgress();
			await this.getQueryProcessInfo();
			if (!this.data.isContinentInsurance) {
				this.getInsuranceOffer();
			}
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, async (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						app.globalData.userInfo = res.data;
						app.globalData.openId = res.data.openId;
						app.globalData.memberId = res.data.memberId;
						app.globalData.mobilePhone = res.data.mobilePhone;
						await this.getBankAccounts();
						await this.getProcessingProgress();
						await this.getQueryProcessInfo();
						if (!this.data.isContinentInsurance) {
							this.getInsuranceOffer();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 获取一类户号信息
	async getBankAccounts () {
		util.hideLoading();
		return;
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getBankAccounts');
		if (!result) return;
		if (result.code === 0) {
			if (!result.data) result.data = [];
			result.data.map(item => {
				item.accountNo = item.accountNo.substr(0, 4) + ' *** *** ' + item.accountNo.substr(-4);
			});
			this.setData({
				bankList: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取预充结果
	async onClickRechargeResult () {
		this.setData({
			requestNum: 0
		});
		await this.applyQuery(this.data.rechargeId);
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
			util.showLoading('正在充值...');
			this.data.requestNum++;
			this.setData({
				requestNum: this.data.requestNum
			});
			if (this.data.requestNum === 5) {
				return;
			}
			setTimeout(async () => {
				await this.applyQuery(rechargeId);
			}, 2000);
			return;
		}
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		util.showToastNoIcon('充值成功');
		await this.orderHold();
	},
	// 保证金冻结
	async orderHold () {
		util.showLoading('冻结中...');
		const result = await util.getDataFromServersV2('consumer/order/orderHold', {
			bankAccountId: app.globalData.bankCardInfo?.bankAccountId,
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.getProcessingProgress();
		} else {
			util.showToastNoIcon(result.message);
			// 冻结失败-预充成功,更新账户金额
			await util.getV2BankId();
		}
	},
	// 预充保证金
	async onClickPrecharge () {
		if (!app.globalData.bankCardInfo?.bankAccountId) await util.getV2BankId();
		if (this.data.info.holdBalance <= app.globalData.bankCardInfo?.balanceAmount) {
			await this.orderHold();
			return;
		}
		const result = await util.getDataFromServersV2('consumer/order/orderDeposit', {
			bankAccountId: this.data.bankList[0].bankAccountId,
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				rechargeId: result?.data?.rechargeId
			});
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-查询预充信息
	async getQueryProcessInfo () {
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				prechargeInfo: result.data || {}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickCheckAccount () {
		util.go('/pages/account_management/index/index?needLoadEtc=true');
	},
	// 去微保
	goMicroInsurance () {
		mta.Event.stat('processing_progress_weibao',{});
		wx.uma.trackEvent('processing_progress_weibao');
		const wtagid = '104.210.3';
		let params = {
			memberId: app.globalData.userInfo.memberId,
			salesmanId: 0,
			carNo: this.data.info.vehPlates,
			orderId: this.data.orderId
		};
		if (this.data.info.orderType === 31) {
			let date = new Date();
			let mouth = date.getMonth() + 1;
			let time = date.getFullYear() + '-' + util.formatNumber(mouth) + '-' + util.formatNumber(date.getDate());
			if (time === this.data.info.contractTime.substring(0,10)) {
				params['salesmanId'] = this.data.info.shopUserId;
			}
		}
		util.goMicroInsuranceVehicleOwner(params, wtagid);
	},
	// 展示车险报价插屏
	goDriverInsurance () {
		let memberId = this.data.memberId;
		let orderId = this.data.weiBaoOrderId;
		mta.Event.stat('processing_progress_car_insurance',{});
		wx.uma.trackEvent('processing_progress_car_insurance');
		let url = `outerUserId=${memberId}&outerCarId=${orderId}&companyId=SJHT&configId=sjht&wtagid=116.115.12`;
		if (this.data.info.orderType === 31) {
			let date = new Date();
			let mouth = date.getMonth() + 1;
			let time = date.getFullYear() + '-' + util.formatNumber(mouth) + '-' + util.formatNumber(date.getDate());
			if (time === this.data.info.contractTime.substring(0,10)) {
				url = `${url}&sId=${this.data.info.shopUserId}`;
				console.log(url);
			}
		}
		let weiBoUrl = app.globalData.weiBoUrl + encodeURIComponent(url);
		let appId = app.globalData.test ? 'wx7f3f0032b6e6f0cc' : 'wx06a561655ab8f5b2';
		console.log(weiBoUrl);
		wx.navigateToMiniProgram({
			appId: appId,
			path: weiBoUrl,
			envVersion: 'release',
			fail () {
				util.showToastNoIcon('调起微保小程序失败, 请重试！');
			}
		});
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailInsurance: this.data.showDetailInsurance,
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 关闭详情
	close () {},
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailInsurance: false,
				showDetailMask: false
			});
		}, 400);
	},
	// 签约高速弹窗
	signingExpress () {
		this.selectComponent('#notSigningPrompt').show();
	},
	// 获取办理进度
	getProcessingProgress () {
		util.showLoading();
		let that = this;
		util.getDataFromServer('consumer/order/transact-schedule', {
			orderId: this.data.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				// 新流程-货车订单
				if (res.data.isNewTrucks === 1) {
					wx.uma.trackEvent('truck_for_processing_progress');
					mta.Event.stat('truck_for_processing_progress',{});
				}
				if (res.data.flowVersion === 4 && res.data.auditStatus === -1) res.data.auditStatus = 0;
				this.setData({
					isSalesmanPrecharge: res.data.orderType === 31 && res.data.flowVersion === 4,
					accountVerification: res.data.orderVerificationStatus,
					bankCardInfo: app.globalData.bankCardInfo,
					info: res.data
				});
				if (res.data.autoAuditStatus === 0 && res.data.auditStatus === 0) {
					if (that.data.number >= 5) {
						util.hideLoading();
						return;
					}
					let number = that.data.number + 1;
					that.setData({
						number: number
					});
					setTimeout(() => {
						that.getProcessingProgress();
					}, 2000);
				} else {
					util.hideLoading();
				}
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	},
	// 刷新1分钱核验
	refreshCheck () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-verification-status-refresh', {
			orderVerificationId: this.data.info.orderVerificationId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					accountVerification: res.data.status,
					[`info.orderVerificationId`]: res.data.orderVerificationId
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取是否在车险报价窗口期内
	getInsuranceOffer () {
		util.showLoading();
		util.getDataFromServer('consumer/order/insuranceOffer', {
			orderId: this.data.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				if (res.data && JSON.stringify(res.data) !== '{}') {
					let time = new Date().toLocaleDateString();
					this.data.weiBaoOrderId = res.data.orderId;
					this.data.memberId = res.data.memberId;
					let that = this;
					// 首先获取是否执行过
					wx.getStorage({
						key: 'today',
						success: function (res) {
							// 成功的话 说明之前执行过，再判断时间是否是当天
							if (res.data && res.data !== time) {
								wx.setStorageSync('today', new Date().toLocaleDateString());
								that.data.showDetailInsurance = true;
								that.showDetail();
							}
						},
						fail: function (res) {
							// 没有执行过的话 先存一下当前的执行时间
							that.data.showDetailInsurance = true;
							that.showDetail();
							wx.setStorageSync('today', new Date().toLocaleDateString());
						}
					});
				} else {
					let time = new Date().toLocaleDateString();
					let that = this;
					// 首先获取是否执行过
					wx.getStorage({
						key: 'today',
						success: function (res) {
							// 成功的话 说明之前执行过，再判断时间是否是当天
							if (res.data && res.data !== time) {
								wx.setStorageSync('today', new Date().toLocaleDateString());
								that.showDetail();
							}
						},
						fail: function (res) {
							// 没有执行过的话 先存一下当前的执行时间
							that.showDetail();
							wx.setStorageSync('today', new Date().toLocaleDateString());
						}
					});
				}
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	},
	// 去设备详情 审核失败:不可办理
	goEtcDetails () {
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.orderId}`);
	},
	// 下一步
	next () {
		app.globalData.packagePageData = undefined;
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=0');
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 复制快递单号
	copyLogisticsNo (e) {
		let logisticsNo = e.currentTarget.dataset['no'];
		wx.setClipboardData({
			data: logisticsNo,
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log(res.data); // data 剪贴板的内容
					}
				});
			}
		});
	},
	// 确认收货去激活
	onClickCctivate () {
		if (this.data.info.shopId && this.data.info.shopId === '624263265781809152') {
			// 津易行
			this.selectComponent('#notJinYiXingPrompt').show();
		} else {
			util.showLoading();
			util.getDataFromServer('consumer/order/affirm-take-obu', {
				logisticsId: this.data.info.logisticsId
			}, () => {
				util.hideLoading();
			}, (res) => {
				util.hideLoading();
				if (res.code === 0) {
					// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
					wx.navigateToMiniProgram({
						appId: 'wxdda17150b8e50bc4',
						path: 'pages/index/index',
						envVersion: 'release', // 目前联调为体验版
						fail () {
							util.showToastNoIcon('调起激活小程序失败, 请重试！');
						}
					});
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken);
		}
	},
	// 复制银行卡号
	onClickCopyBankCardNumber (e) {
		let bankCardNumber = e.currentTarget.dataset['no'];
		wx.setClipboardData({
			data: bankCardNumber,
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log(res.data); // data 剪贴板的内容
					}
				});
			}
		});
	},
	goHome () {
		wx.reLaunch({
			// url: '/pages/default/index/index'
			url: '/pages/Home/Home'
		});
	},
	onUnload () {
		if (this.data.type === 'main_process' || app.globalData.isNeedReturnHome) {
			wx.reLaunch({
				// url: '/pages/default/index/index'
				url: '/pages/Home/Home'
			});
		}
	}
});
