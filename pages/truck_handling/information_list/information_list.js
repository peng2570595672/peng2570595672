const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		contractStatus: 0,// 1已签约
		orderInfo: undefined,
		orderDetails: undefined,
		vehicleInfo: undefined,
		ownerIdCard: undefined,
		isRequest: false,
		available: false,
		isIdCardError: false, // 是否身份证错误
		isDrivingLicenseError: false, // 是否行驶证错误
		isHeadstockError: false, // 是否车头照错误
		isRoadTransportCertificateError: false, // 是否道路运输证错误
		isModifiedData: false, // 是否是修改资料
		isUploadImage: !!app.globalData.memberStatusInfo?.uploadImageStatus, // 是否上传交行影像资料 flowVersion-7
		requestNum: 0
	},
	async onLoad (options) {
		if (options.isModifiedData) {
			this.setData({
				isModifiedData: true
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
		await this.getETCDetail();
	},
	init () {
		if (this.data.isModifiedData && !this.data.isIdCardError && !this.data.isDrivingLicenseError && !this.data.isRoadTransportCertificateError && !this.data.isHeadstockError) {
			this.setData({
				available: true
			});
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
			app.globalData.truckLicensePlate = vehPlates; // 存货车出牌
			app.globalData.processFlowVersion = orderInfo.flowVersion;
			if (this.data.isModifiedData && res.orderAudit && res.orderAudit?.errNums?.length && this.data.requestNum === 0) {
				// errNums
				this.getErrorStatus(res.orderAudit);
			}
			if (result.data.ownerIdCard?.ownerIdCardPositiveUrl && !this.data.isUploadImage) {
				await this.truckUploadImg();
			}
			this.setData({
				requestNum: 1,
				orderInfo: orderInfo,
				orderDetails: res,
				vehicleInfo: result.data.vehicle,
				ownerIdCard: result.data.ownerIdCard,
				vehPlates: vehPlates
			});
			this.availableCheck(orderInfo,result.data.vehicle);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取错误状态
	getErrorStatus (info) {
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
		if (this.data.vehicleInfo && this.data.ownerIdCard && this.data.vehicleInfo.owner !== this.data.ownerIdCard.ownerIdCardTrueName) {
			util.showToastNoIcon('行驶证及身份证必须为同一持有人');
			this.setData({
				available: false
			});
		}
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		util.go(`/pages/truck_handling/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}&flowVersion=${this.data.orderInfo.flowVersion}`);
	},
	// 获取二类户号信息
	async next () {
		if (!this.data.available) return;
		if (this.data.orderInfo.flowVersion === 7) {
			if (!this.data.isUploadImage) {
				util.showToastNoIcon('加载中,请稍后再试');
				return;
			}
			util.go(`/pages/truck_handling/face_of_check_tips/face_of_check_tips`);
			return;
		}
		if (this.data.isModifiedData || this.data.orderInfo.flowVersion === 4) {
			if (this.data.isRequest) {
				return;
			} else {
				this.setData({isRequest: true});
			}
			wx.uma.trackEvent('truck_information_list_next');
			util.showLoading('加载中');
			let params = {
				dataComplete: 1,// 资料已完善
				orderId: app.globalData.orderInfo.orderId,// 订单id
				changeAuditStatus: true
			};
			const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
			this.setData({isRequest: false});
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			util.go('/pages/default/processing_progress/processing_progress?type=main_process');
			return;
		}
		if (this.data.orderInfo.flowVersion === 6) { // 处理是否需要开二类户
			const result = await util.getDataFromServersV2('consumer/member/icbcv2/getV2BankId');
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			const path = result.data?.accountNo ? 'contract_management' : 'binding_account';
			util.go(`/pages/truck_handling/${path}/${path}`);
		}
	},
	// 影像资料上送
	async truckUploadImg () {
		const result = await util.getDataFromServersV2('consumer/member/bcm/truckUploadImg', {
			orderId: app.globalData.orderInfo.orderId// 订单id
		}, 'POST', false);
		if (!result) return;
		if (result.code === 0) {
			console.log(result);
			this.setData({
				isUploadImage: true
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
