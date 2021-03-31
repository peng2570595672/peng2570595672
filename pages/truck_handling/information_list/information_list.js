const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		contractStatus: 0,// 1已签约
		orderInfo: undefined,
		orderDetails: undefined,
		vehicleInfo: undefined,
		isRequest: false,
		available: false,
		isIdCardError: false, // 是否身份证错误
		isDrivingLicenseError: false, // 是否行驶证错误
		isHeadstockError: false, // 是否车头照错误
		isRoadTransportCertificateError: false, // 是否道路运输证错误
		isModifiedData: false, // 是否是修改资料
		requestNum: 0
	},
	onLoad (options) {
		if (options.isModifiedData) {
			this.setData({
				isModifiedData: true
			});
		}
	},
	onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		// 修改资料不需要查询订单详情
		if (currPage.__data__.isChangeHeadstock) {
			this.setData({
				isHeadstockError: false
			});
			this.init();
		}
		if (currPage.__data__.isChangeRoadTransportCertificate) {
			this.setData({
				isRoadTransportCertificateError: false
			});
			this.init();
		}
		if (currPage.__data__.isChangeIdCard) {
			this.setData({
				isIdCardError: false
			});
			this.init();
		}
		if (currPage.__data__.isChangeDrivingLicenseError) {
			this.setData({
				isDrivingLicenseError: false
			});
			this.init();
		}
		this.getETCDetail();
		if (!this.data.isModifiedData) {
			this.queryContract();
		}
	},
	// 查询车主服务签约
	queryContract () {
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					contractStatus: res.data.contractStatus
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	init () {
		if (this.data.isModifiedData && !this.data.isIdCardError && !this.data.isDrivingLicenseError && !this.data.isRoadTransportCertificateError && !this.data.isHeadstockError) {
			this.setData({
				available: true
			});
		}
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
				if (this.data.isModifiedData && result.orderAudit && this.data.requestNum === 0) {
					// errNums
					this.getErrorStatus(result.orderAudit);
				}
				this.setData({
					requestNum: 1,
					orderInfo: orderInfo,
					orderDetails: result,
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
		if (newArr.includes(106)) {
			this.setData({
				isRoadTransportCertificateError: true
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
		if (this.data.isModifiedData && this.data.requestNum === 0) {
			this.setData({
				available: false
			});
		}
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		util.go(`/pages/truck_handling/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}`);
	},
	// 微信签约
	onclickSign () {
		if (!this.data.available) return;
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		mta.Event.stat('truck_for_certificate_list_next',{});
		if (this.data.orderDetails.pledgeStatus === 0) {
			// 需要支付保证金
			util.go(`/pages/truck_handling/equipment_cost/equipment_cost?equipmentCost=${this.data.orderDetails.pledgeMoney}`);
			return;
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId,// 订单id
			changeAuditStatus: true,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1 || this.data.isModifiedData) {
			delete params.needSignContract;
			delete params.clientMobilePhone;
			delete params.clientOpenid;
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
			this.setData({isRequest: false});
		}, (res) => {
			this.setData({isRequest: false});
			if (res.code === 0) {
				if (this.data.contractStatus === 1 || this.data.isModifiedData) {
					// 1.0 已签约  或者 修改资料
					util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
					return;
				}
				app.globalData.signAContract = -1;
				app.globalData.isTruckHandling = true;
				app.globalData.belongToPlatform = app.globalData.platformId;
				util.hideLoading();
				let result = res.data.contract;
				util.weChatSigning(result);
			} else {
				util.hideLoading();
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	}
});
