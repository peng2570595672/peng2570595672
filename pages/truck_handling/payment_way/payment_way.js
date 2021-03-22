/**
 * @author 老刘
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showChoiceBank: true, // 选择套餐
		choiceSetMeal: undefined, // 选择支付方式逐渐
		choiceObj: undefined, // 选择的套餐
		isRequest: false,// 是否请求中
		orderInfo: undefined, // 订单信息
		regionCode: []// 区域编码
	},
	onShow (options) {
		// this.getOrderInfo();
		this.init();
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '1345'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取套餐列表
	getListOfPackages () {
		util.showLoading();
		let params = {
			areaCode: this.data.regionCode[0] || 0,
			productType: 2,
			vehType: 2,
			platformId: app.globalData.platformId,
			shopId: app.globalData.miniProgramServiceProvidersId
		};
		util.getDataFromServer('consumer/system/get-usable-product', params, () => {
			util.showToastNoIcon('获取套餐失败!');
		}, (res) => {
			if (res.code === 0) {
				if (res.data.length === 0) {
					if (app.globalData.isSalesmanPromotion) {
						util.showToastNoIcon('未查询到套餐，请联系工作人员处理！');
						return;
					}
				}
				let list = res.data;
				this.setData({
					listOfPackages: list,
					choiceObj: list[0]
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 选择银行
	choiceSetMeal () {
		if (!this.data.choiceSetMeal) {
			this.setData({
				choiceSetMeal: this.selectComponent('#choiceSetMeal')
			});
		}
		this.data.choiceSetMeal.switchDisplay(true);
	},
	// 获取数据
	init () {
		// 是否缓存了定位信息
		let locationInfo = wx.getStorageSync('location-info');
		if (locationInfo) {
			let res = JSON.parse(locationInfo);
			let info = res.result.ad_info;
			// 获取区域编码
			let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
			this.setData({
				regionCode
			});
			// 加载套餐
			this.getListOfPackages();
			return;
		}
		// 定位
		this.getLocationInfo();
	},
	// 定位
	getLocationInfo () {
		util.showLoading();
		wx.getLocation({
			type: 'wgs84',
			success: (res) => {
				util.getAddressInfo(res.latitude, res.longitude, (res) => {
					wx.setStorageSync('location-info',JSON.stringify(res));
					let info = res.result.ad_info;
					let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
					this.setData({
						regionCode
					});
					// 加载套餐
					this.getListOfPackages();
				}, () => {
					// 加载套餐
					this.getListOfPackages();
				});
			},
			fail: (res) => {
				util.hideLoading();
				console.log(res);
				if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === 'getLocation:fail authorize no response') {
					util.alert({
						content: '由于您拒绝了定位授权，导致无法获取扣款方式，请允许定位授权！',
						showCancel: true,
						confirmText: '允许授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (res.errMsg === 'getLocation:fail:ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' || res.errMsg === 'getLocation:fail system permission denied') {
					util.showToastNoIcon('请开启手机或微信定位功能！');
				}
			}
		});
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.choiceSetMeal.switchDisplay(false);
	},
	// 具体支付方式
	onClickItemHandle (e) {
		this.setData({
			choiceObj: e.detail.targetObj
		});
		app.globalData.isHeadImg = e.detail.targetObj.isHeadImg === 1 ? true : false;
		app.globalData.orderInfo.shopProductId = e.detail.targetObj.shopProductId;
		this.data.choiceSetMeal.switchDisplay(false);
	},
	// ETC服务状态提醒（A）
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['rWHTLYmUdcuYw-wKU0QUyM7H0t-adDKeu193RjILL0M'],
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
									this.signAContract();
								}
							});
						} else {
							this.signAContract();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.signAContract();
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
								this.signAContract();
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
					this.signAContract();
				}
			});
		}
	},
	// 签约
	next () {
		if (this.data.isRequest) {
			return;
		}
		// 订阅消息
		this.subscribe();
	},
	// 提交签约数据
	signAContract () {
		this.setData({
			isRequest: true
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			shopId: app.globalData.miniProgramServiceProvidersId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.choiceObj.shopProductId,
			areaCode: this.data.choiceObj.areaCode || 0
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/truck_handling/information_list/information_list');
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				isRequest: false
			});
		});
	}
});
