/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		certificateStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		choiceActiveIndex: -1,
		promptObject: {
			content: '运输证车牌与{前置录入车牌号}不一致，请重新上传',
			isOk: true,
			isHide: false
		},
		transportationLicenseObj: {},
		list: [// 24:道路运输证经营范围仅有【货物专用运输(集装箱)】的牵引车,27:道路运输证经营范围不含【货物专用运输(集装箱)】的牵引车,28:道路运输证经营范围除【货物专用运输(集装箱)】外，还有【普通货运】等其他项目的牵引车
			{vehicleCustomerType: 24, name: '仅有“货物专用运输(集装箱)”'},
			{vehicleCustomerType: 28, name: '含“货物专用运输(集装箱)”+其他'},
			{vehicleCustomerType: 27, name: '不含“货物专用运输(集装箱)”'}
		],
		vehPlates: undefined
	},
	onLoad (options) {
		this.setData({
			vehPlates: options.vehPlates
		});
		this.getOrderInfo();
	},
	onShow () {
		// // 身份证正面
		let truck = wx.getStorageSync('truck-12');
		if (truck) {
			wx.removeStorageSync('truck-12');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		if (!app.globalData.truckHandlingOCRType) {
			// 没通过上传
			let truckTransportationLicense = wx.getStorageSync('truck-transportation-license');
			if (truckTransportationLicense) {
				truckTransportationLicense = JSON.parse(truckTransportationLicense);
				this.setData({
					certificateStatus: 4,
					transportationLicenseObj: truckTransportationLicense
				});
				this.setData({
					available: this.validateData(false)
				});
			}
		}
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: 'a'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				if (res.data.transportLicense) {
					let transportationLicenseObj = res.data.transportLicense;
					transportationLicenseObj.ocrObject = {};
					transportationLicenseObj.ocrObject = JSON.parse(transportationLicenseObj.ocrInfo);
					const choiceActiveIndex = this.data.list.findIndex(item => item.vehicleCustomerType === parseInt(transportationLicenseObj.vehicleCustomerType));
					this.setData({
						choiceActiveIndex,
						transportationLicenseObj
					});
					this.setData({
						available: this.validateData(false)
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 校验数据
	validateData (isToast) {
		if (this.data.certificateStatus !== 4) {
			if (isToast) util.showToastNoIcon('请上传道路运输证！');
			return false;
		}
		if (!this.data.transportationLicenseObj.ocrObject.vehicle_number) {
			if (isToast) util.showToastNoIcon('车牌号识别失败,请重新上传！');
			return false;
		}
		if (!this.data.transportationLicenseObj.ocrObject.business_certificate) {
			if (isToast) util.showToastNoIcon('经营许可证号识别失败,请重新上传！');
			return false;
		}
		if (!this.data.transportationLicenseObj.ocrObject.vehicle_type) {
			if (isToast) util.showToastNoIcon('车辆类型识别失败,请重新上传！');
			return false;
		}
		if (this.data.choiceActiveIndex === -1) {
			if (isToast) util.showToastNoIcon('请勾选道路运输证经莒范围！');
			return false;
		}
		return true;
	},
	// 下一步
	next () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true
		});
		const obj = this.data.transportationLicenseObj;
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: 'a', // 需要提交的数据类型(可多选) a: 道路运输经营许可证
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			transportLicense: {
				ownerName: obj.ocrObject.owner_name, // 业户名称
				licenseNumber: obj.ocrObject.license_number, // 道路运输证号
				vehicleNumber: obj.ocrObject.vehicle_number, // 车辆号牌
				vehicleType: obj.ocrObject.vehicle_type, // 车辆类型
				vehicleWeight: obj.ocrObject.maximum_capacity, // 吨(座)位
				vehicleSize: obj.ocrObject.vehicle_size, // 车辆尺寸
				issuingAuthority: obj.ocrObject.issuing_authority, // 核发机关（非必有，依赖对应运输证板式）
				issueDate: obj.ocrObject.issue_date, // 签发日期（非必有，依赖对应运输证板式）
				ownerAddress: obj.ocrObject.owner_address, // 业户地址（非必有，依赖对应运输证板式）
				economicType: obj.ocrObject.economic_type, // 经济类型（非必有，依赖对应运输证板式）
				businessCertificate: obj.ocrObject.business_certificate, // 经营许可证号（非必有，依赖对应运输证板式）
				// 相关字段的置信度信息，置信度越大，表示本次识别的对应字段的可靠性越高，在统计意义上，置信度越大，准确率越高。置信度由算法给出，不直接等价于对应字段的准确率。JSON字符串
				confidence: JSON.stringify(obj.ocrObject.confidence),
				// //车辆用户类型 24:道路运输证经营范围仅有【货物专用运输(集装箱)】的牵引车,27:道路运输证经营范围不含【货物专用运输(集装箱)】的牵引车,28:道路运输证经营范围除【货物专用运输(集装箱)】外，还有【普通货运】等其他项目的牵引车
				vehicleCustomerType: this.data.list[this.data.choiceActiveIndex].vehicleCustomerType,
				ocrInfo: JSON.stringify(obj.ocrObject), // OCR识别信息,JSON字符串
				fileUrl: obj.fileUrl // 图片地址
			}
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				wx.navigateBack({
					delta: 1
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				isRequest: false
			});
		});
	},
	// 上传图片
	uploadOcrFile (path) {
		const type = app.globalData.truckHandlingOCRType;
		this.setData({certificateStatus: 2});
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
			this.setData({certificateStatus: 3});
		}, (res) => {
			try {
				if (res) {
					console.log(res);
					res = JSON.parse(res);
					console.log(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRTyp = 0;
						if (res.data[0].ocrObject.vehicle_number !== this.data.vehPlates) {
							this.setData({
								certificateStatus: 3,
								[`promptObject.content`]: `运输证车牌与${this.data.vehPlates}不一致，请重新上传`
							});
							this.selectComponent('#notFinishedOrder').show();
							return;
						}
						this.setData({
							certificateStatus: 4,
							transportationLicenseObj: res.data[0]
						});
						this.setData({
							available: this.validateData(false)
						});
						wx.setStorageSync('truck-transportation-license', JSON.stringify(res.data[0]));
					} else { // 识别失败
						this.setData({certificateStatus: 3});
					}
				} else { // 识别失败
					this.setData({certificateStatus: 3});
				}
			} catch (e) {
				this.setData({certificateStatus: 3});
				util.showToastNoIcon('文件服务器异常！');
			}
		}, () => {
		});
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		// 识别中禁止修改
		if (this.data.certificateStatus === 2) return;
		util.go(`/pages/truck_handling/shot_card/shot_card?type=${type}&pathUrl=`);
	},
	choiceTheType (e) {
		let index = e.currentTarget.dataset.index;
		this.setData({
			choiceActiveIndex: index
		});
		this.setData({
			available: this.validateData(false)
		});
	}
});
