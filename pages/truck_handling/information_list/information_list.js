const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined,
		vehicleInfo: undefined,
		isRequest: false,
		available: false,
		isIdCardError: false, // 是否身份证错误
		isDrivingLicenseError: false, // 是否行驶证错误
		isHeadstockError: false, // 是否车头照错误
		isRoadTransportCertificateError: false, // 是否道路运输证错误
		isModifiedData: false // 是否是修改资料
	},
	onLoad (options) {
		if (options.isModifiedData) {
			this.setData({
				isModifiedData: true
			});
		}
	},
	onShow () {
		this.getETCDetail();
	},
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '16',
			needAllInfo: true
		}, () => {
			util.showToastNoIcon('获取订单详情失败！');
		}, (res) => {
			if (res.code === 0) {
				let result = res.data.base;
				let orderInfo = result.orderInfo;
				let vehPlates = result.vehPlates;
				if (this.data.isModifiedData && result.orderAudit) {
					// errNums
					this.getErrorStatus(result.orderAudit);
				}
				this.setData({
					orderInfo: orderInfo,
					vehicleInfo: res.data.vehicle,
					vehPlates: vehPlates
				});
				this.availableCheck(orderInfo,res.data.vehicle);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取错误状态
	getErrorStatus (info) {
		// 101 身份证  102 行驶证  103 营业执照  104 车头照  105 银行卡  106 无资料  201 邮寄地址  301 已办理过其他ETC  302 暂不支持企业用户  303 不支持车型  304 特殊情况  401 通用回复
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
		console.log(newArr);
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
		if (newArr.includes(104)) {
			this.setData({
				isHeadstockError: true
			});
		}
	},
	availableCheck (orderInfo,vehicleInfo) {
		if (orderInfo.isOwner === 1 && orderInfo.isVehicle === 1 && orderInfo.isHeadstock === 1) {
			if (vehicleInfo.isTraction === 0 || (vehicleInfo.isTraction === 1 && orderInfo.isTransportLicense === 1)) {
				this.setData({
					available: true
				});
			}
		}
	},
	// 跳转
	go (e) {
		if (this.data.isModifiedData === 1) {
			util.showToastNoIcon('签约成功，不可修改！');
		} else {
			let url = e.currentTarget.dataset['url'];
			util.go(`/pages/truck_handling/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}`);
		}
	},
	// 微信签约
	onclickSign () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			orderId: app.globalData.orderInfo.orderId,// 订单id
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
			this.setData({isRequest: false});
		}, (res) => {
			this.setData({isRequest: false});
			if (res.code === 0) {
				app.globalData.signAContract = -1;
				app.globalData.isTruckHandling = true;
				app.globalData.belongToPlatform = app.globalData.platformId;
				util.hideLoading();
				let result = res.data.contract;
				// 签约车主服务 2.0
				if (result.version === 'v2') {
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/route/index',
						extraData: result.extraData,
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				} else { // 签约车主服务 3.0
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/etc/index',
						extraData: {
							preopen_id: result.extraData.peropen_id
						},
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				}
			} else {
				util.hideLoading();
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	}
});
