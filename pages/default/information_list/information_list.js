/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		topProgressBar: 3,	// 进度条展示的长度 ，再此页面的取值范围 [3,4),默认为3,保留一位小数
		fenCheck: false,
		contractStatus: 0,// 1已签约
		orderInfo: undefined,
		orderDetails: undefined,
		vehicleInfo: undefined,
		isRequest: false,
		available: false,
		isIdCardError: false, // 是否身份证错误
		isDrivingLicenseError: false, // 是否行驶证错误
		isHeadstockError: false, // 是否车头照错误
		isModifiedData: false, // 是否是修改资料
		isEtcContractId: true, // 是否需要签约微信
		requestNum: 0,
		isReturn: false,
		ownerIdCard: {}, // 实名身份信息
		vehicle: {}, // 车辆信息
		tips: ''	// 审核失败返回的结果
	},
	async onLoad (options) {
		if (options.isModifiedData) {
			this.setData({
				isModifiedData: true
			});
		}
		if (options.type) {
			this.setData({
				isReturn: +options.type === 1
			});
		}
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		// 修改资料不需要查询订单详情
		if (currPage.__data__.isChangeHeadstock) {
			this.setData({
				isHeadstockError: false
			});
			this.availableCheck();
		}
		if (currPage.__data__.isChangeIdCard) {
			this.setData({
				isIdCardError: false
			});
			this.availableCheck();
		}
		if (currPage.__data__.isChangeDrivingLicenseError) {
			this.setData({
				isDrivingLicenseError: false
			});
			this.availableCheck();
		}
		await this.getETCDetail();
		if (!this.data.isModifiedData) {
			await this.queryContract();
			await this.getProductOrderInfo();
		}
	},
	async getProductOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				fenCheck: result.data.fenCheck === 1
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查询车主服务签约
	async queryContract () {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				contractStatus: result.data.contractStatus
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '168',
			needAllInfo: true
		});
		if (!result) return;
		if (result.code === 0) {
			let res = result.data.base;
			let orderInfo = res.orderInfo;
			let vehPlates = res.vehPlates;
			let vehicle = result.data.vehicle;
			let ownerIdCard = result.data.ownerIdCard;
			if (this.data.isModifiedData && res.orderAudit?.errNums?.length && this.data.requestNum === 0) {
				// errNums
				this.getErrorStatus(res.orderAudit);
			}
			this.setData({
				vehicle: vehicle,
				ownerIdCard: ownerIdCard,
				requestNum: 1,
				orderInfo: orderInfo,
				isEtcContractId: orderInfo.etcContractId !== -1,
				orderDetails: res,
				vehicleInfo: res.vehPlates,
				vehPlates: vehPlates
			});
			this.availableCheck();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取错误状态
	getErrorStatus (info) {
		console.log(info);
		// 101 身份证  102 行驶证  103 营业执照  104 车头照  105 银行卡  106 无资料  201 邮寄地址  301 已办理过其他ETC
		// 106 道路运输证  107 车辆侧身照  302 暂不支持企业用户  303 不支持车型  304 特殊情况  401 通用回复
		let errNums = [];
		let newArr = [];
		if (info.errNums.length > 5) {
			// 多个审核失败条件
			errNums = info.errNums.split(';');
		} else {
			errNums[0] = info.errNums;
		}
		errNums.map(item => {
			newArr.push(parseInt(item.slice(0, 3)));
		});
		if (newArr.includes(101)) {
			this.setData({
				isIdCardError: true
			});
		}
		if (newArr.includes(102)) {
			this.setData({
				isDrivingLicenseError: true
			});
		}
		if (newArr.includes(104) || newArr.includes(107)) {
			this.setData({
				isHeadstockError: true
			});
		}
	},
	availableCheck () {
		if (this.data.orderInfo && this.data.orderInfo.isOwner === 1 && this.data.orderInfo.isVehicle === 1 && this.data.ownerIdCard?.ownerIdCardTrueName !== this.data.vehicle?.owner) {
			util.showToastNoIcon('身份证与行驶证必须为同一持有人');
			this.setData({
				available: false
			});
			return false;
		}
		if (this.data.orderInfo && this.data.orderInfo.isOwner === 1 && this.data.orderInfo.isVehicle === 1 && ((this.data.orderInfo.isHeadstock === 1 && this.data.orderInfo.obuCardType !== 1) || (this.data.orderInfo.obuCardType === 1))) {
			this.setData({
				available: true
			});
		}
		if (this.data.isModifiedData) {
			if (this.data.isIdCardError || this.data.isDrivingLicenseError || this.data.isHeadstockError || this.data.requestNum === 0) {
				this.setData({
					available: false
				});
			} else {
				this.setData({
					available: true
				});
			}
		}
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		util.go(`/pages/default/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}`);
	},
	// ETC申办审核结果通知、ETC发货提示
	subscribe () {
		if (this.data.orderInfo && this.data.orderInfo?.isOwner === 1 && this.data.orderInfo?.isVehicle === 1 && this.data.ownerIdCard?.ownerIdCardTrueName !== this.data.vehicle?.owner) {
			util.showToastNoIcon('身份证与行驶证必须为同一持有人');
			return;
		}
		if (!this.data.available) return;
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['aHsjeWaJ0RRU08Uc-OeLs2OyxLxBd_ta3zweXloC66U','K6gUmq_RSjfR1Hm_F8ORAzlpZZDVaDhuRDE6JoVvsuo'],
				success: (res) => {
					wx.hideLoading();
					if (res.errMsg === 'requestSubscribeMessage:ok') {
						let keys = Object.keys(res);
						// 是否存在部分未允许的订阅消息
						let isReject = false;
						for (let key of keys) {
							if (res[key] === 'reject') {
								isReject = true;
								break;
							}
						}
						// 有未允许的订阅消息
						if (isReject) {
							util.alert({
								content: '检查到当前订阅消息未授权接收，请授权',
								showCancel: true,
								confirmText: '授权',
								confirm: () => {
									wx.openSetting({
										success: (res) => {
										},
										fail: () => {
											util.showToastNoIcon('打开设置界面失败，请重试！');
										}
									});
								},
								cancel: () => { // 点击取消按钮
									this.onclickSign();
								}
							});
						} else {
							this.onclickSign();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.onclickSign();
					} else {
						util.alert({
							content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
							showCancel: true,
							confirmText: '打开设置',
							confirm: () => {
								wx.openSetting({
									success: (res) => {
									},
									fail: () => {
										util.showToastNoIcon('打开设置界面失败，请重试！');
									}
								});
							},
							cancel: () => {
								this.onclickSign();
							}
						});
					}
				}
			});
		} else {
			util.alert({
				title: '微信更新提示',
				content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
				confirmText: '继续使用',
				showCancel: true,
				confirm: () => {
					this.onclickSign();
				}
			});
		}
	},
	// 微信签约
	async onclickSign () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		wx.uma.trackEvent('information_list_next');
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId,// 订单id
			changeAuditStatus: true,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1 || this.data.isModifiedData || !this.data.isEtcContractId) {
			delete params.needSignContract;
			delete params.clientMobilePhone;
			delete params.clientOpenid;
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.isNeedReturnHome = true;
			if (this.data.orderInfo.flowVersion === 2 || this.data.orderInfo.flowVersion === 3) {
				// 总对总
				util.go(`/pages/default/order_audit/order_audit`);
				return;
			}
			if (this.data.contractStatus === 1 || this.data.isModifiedData) {
				//  已签约  或者 修改资料
				util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
				return;
			}
			app.globalData.signAContract = -1;
			app.globalData.belongToPlatform = app.globalData.platformId;
			let res = result.data.contract;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onUnload () {
		if (this.data.isReturn) {
			wx.reLaunch({
				url: '/pages/Home/Home'
			});
		}
	}
});
