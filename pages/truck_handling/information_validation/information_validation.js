/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		backStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		drivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面
		drivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面
		carTypeArr: [
			{'id': '11', 'name': '两轴'},
			{'id': '12', 'name': '三轴'},
			{'id': '12', 'name': '四轴'},
			{'id': '12', 'name': '五轴'},
			{'id': '12', 'name': '六轴'}
		], // 车型数组
		carType: -1, // 车型
		ownershipTypeIndex: 1, // 车辆归属

		count: 0,// 计数,因网络图片老是404,所以做计数刷新处理
		opened: false, // 是否展开更多信息
		current: 0, // 当前轮播图索引
		firstVersionPic4: '',
		isFirstVersionPic4: false,
		carHead45: {}, // 车头照
		oldCarHead45: {}, // 车头照 原始数据,用于与新数据比对(秒审)
		personIndex: 0, // 选择框当前选中索引
		oldPersonIndex: 0, // 选择框当前选中索引 原始数据,用于与新数据比对(秒审)
		personsArr: [2, 3, 4, 5, 6, 7, 8, 9], // 核载人数选择框
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isShowTextarea: true,// 是否显示textarea
		productInfo: undefined,// 套餐信息
		orderInfo: undefined // 订单信息
	},
	onLoad () {
	},
	onShow () {
		// 行驶证正面
		let truck = wx.getStorageSync('truck-3');
		if (truck) {
			wx.removeStorageSync('truck-3');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		// 行驶证反面
		truck = wx.getStorageSync('truck-4');
		if (truck) {
			wx.removeStorageSync('truck-4');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		if (!app.globalData.truckHandlingOCRType) {
			// 没通过上传
			let drivingLicenseFace = wx.getStorageSync('truck-driving-license-face');
			if (drivingLicenseFace) {
				drivingLicenseFace = JSON.parse(drivingLicenseFace);
				this.setData({
					faceStatus: 4,
					drivingLicenseFace
				});
			}
			let drivingLicenseBack = wx.getStorageSync('truck-driving-license-back');
			if (drivingLicenseBack) {
				drivingLicenseBack = JSON.parse(drivingLicenseBack);
				this.setData({
					backStatus: 4,
					drivingLicenseBack
				});
			}
		}
	},
	// 上传图片
	uploadOcrFile (path) {
		const type = app.globalData.truckHandlingOCRType;
		if (type === 3) {
			this.setData({faceStatus: 2});
		} else {
			this.setData({backStatus: 2});
		}
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
			if (type === 3) {
				this.setData({faceStatus: 3});
			} else {
				this.setData({backStatus: 3});
			}
			util.showToastNoIcon('文件服务器异常！');
		}, (res) => {
			try {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRTyp = 0;
						if (type === 3) {
							this.setData({
								faceStatus: 4,
								drivingLicenseFace: res.data[0]
							});
							wx.setStorageSync('truck-driving-license-face', JSON.stringify(res.data[0]));
						} else {
							let personsCapacity = res.data[0].ocrObject.personsCapacity;
							const personsCapacityStr = personsCapacity.slice(0, aaa.length - 1);
							let personsCapacityNum = 0;
							if (personsCapacityStr.includes('+')) {
								personsCapacityNum = parseInt(personsCapacityStr.split('+')[0]) + parseInt(personsCapacityStr.split('+')[1]);
							} else {
								personsCapacityNum = personsCapacityStr;
							}
							res.data[0].ocrObject.personsCapacity = personsCapacityNum;
							this.setData({
								backStatus: 4,
								drivingLicenseBack: res.data[0]
							});
							wx.setStorageSync('truck-driving-license-back', JSON.stringify(res.data[0]));
						}
						this.setData({
							available: this.validateData(false)
						});
					} else { // 识别失败
						if (type === 3) {
							this.setData({faceStatus: 3});
						} else {
							this.setData({backStatus: 3});
						}
					}
				} else { // 识别失败
					if (type === 3) {
						this.setData({faceStatus: 3});
					} else {
						this.setData({backStatus: 3});
					}
					util.showToastNoIcon('识别失败');
				}
			} catch (e) {
				if (type === 3) {
					this.setData({faceStatus: 3});
				} else {
					this.setData({backStatus: 3});
				}
				util.showToastNoIcon('文件服务器异常！');
			}
		}, () => {
		});
	},
	// 校验数据
	validateData (isToast) {
		// if (!this.data.idCardBack.fileUrl || !this.data.idCardFace.fileUrl) {
		// 	if (isToast) util.showToastNoIcon('请上传身份证！');
		// 	return false;
		// }
		// if (!this.data.idCardFace.ocrObject.name) {
		// 	if (isToast) util.showToastNoIcon('姓名不能为空！');
		// 	return false;
		// }
		// if (!this.data.idCardFace.ocrObject.idNumber) {
		// 	if (isToast) util.showToastNoIcon('身份证号不能为空！');
		// 	return false;
		// }
		// if (!/^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(this.data.idCardFace.ocrObject.idNumber)) {
		// 	if (isToast) util.showToastNoIcon('身份证号格式不正确！');
		// 	return false;
		// }
		// if (!this.data.idCardBack.ocrObject.validDate || !this.data.idCardFace.ocrObject.address ||
		// 	!this.data.idCardBack.ocrObject.authority || !this.data.idCardFace.ocrObject.birth ||
		// 	!this.data.idCardFace.ocrObject.sex) {
		// 	if (isToast) util.showToastNoIcon('部分信息识别失败,请重新上传身份证照片！');
		// 	return false;
		// }
		return true;
	},
	onClickOwnershipType (e) {
		let ownershipTypeIndex = +e.currentTarget.dataset.type;
		this.setData({
			ownershipTypeIndex
		});
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		// 识别中禁止修改
		if ((type === 3 && this.data.faceStatus === 2) || (type === 4 && this.data.backStatus === 2)) return;
		util.go(`/pages/truck_handling/shot_card/shot_card?type=${type}&pathUrl=${type === 1 ? this.data.drivingLicenseFace.fileUrl : this.data.drivingLicenseBack.fileUrl}`);
	},
	bindPersonsCarTypeChange (e) {
		this.setData({
			carType: parseInt(e.detail.value)
		});
	},
	// 根据订单id获取套餐信息
	getProductOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					productInfo: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取订单信息
	getOrderInfo (isCache) {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: isCache ? '14' : '1467'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data,
					available: true // 下一步按钮可用
				});
				if (!isCache) {
					let that = this;
					if (res.data.vehicle) { // 是否有行驶证
						let index = this.data.personsArr.findIndex((value) => value === parseInt(res.data.vehicle.personsCapacity));
						this.setData({
							[`drivingLicenseBack.ocrObject`]: res.data.vehicle,
							[`drivingLicenseFace.ocrObject`]: res.data.vehicle,
							[`drivingLicenseFace.ocrObject.numberPlates`]: res.data.vehicle.vehPlates,
							[`drivingLicenseBack.ocrObject.numberPlates`]: res.data.vehicle.vehPlates,
							personIndex: index,
							oldPersonIndex: index,
							[`drivingLicenseFace.ocrObject.address`]: res.data.vehicle.ownerAddress,
							[`drivingLicenseFace.ocrObject.resgisterDate`]: res.data.vehicle.registerDate,
							[`drivingLicenseFace.fileUrl`]: res.data.vehicle.licenseMainPage,
							[`drivingLicenseBack.fileUrl`]: res.data.vehicle.licenseVicePage
						});
						this.setData({
							oldDrivingLicenseFace: this.data.drivingLicenseFace,
							oldDrivingLicenseBack: this.data.drivingLicenseBack
						});
						wx.setStorageSync('driving_license_face', JSON.stringify(this.data.drivingLicenseFace));
						wx.setStorageSync('driving_license_back', JSON.stringify(this.data.drivingLicenseBack));
					}
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 提交信息
	onClickComfirmHandle () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.subscribe();
	},
	// ETC申办审核结果通知、ETC发货提示
	subscribe () {
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
									this.comfirmHandle();
								}
							});
						} else {
							this.comfirmHandle();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.comfirmHandle();
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
								this.comfirmHandle();
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
					this.comfirmHandle();
				}
			});
		}
	},
	comfirmHandle () {
		// 比对车牌颜色和车牌位数是否一致   新老数据做对比,判断是否进行面审
		// 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
		let face = this.data.drivingLicenseFace.ocrObject;
		let back = this.data.drivingLicenseBack.ocrObject;
		// 比对之前输入车牌和当前行驶证车牌是否一致
		if (face.numberPlates !== this.data.orderInfo['base'].vehPlates.trim()) {
			util.showToastNoIcon(`行驶证车牌${face.numberPlates}与下单时车牌${this.data.orderInfo['base'].vehPlates.trim()}不一致，请检查！`);
			return;
		}
		// 提价数据
		this.setData({
			isRequest: true,
			available: false
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			vehicleInfo: {
				dataType: '6',
				carType: 1,
				haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含6】
				vehPlates: face.numberPlates,
				platesColor: this.data.orderInfo['base'].vehColor,
				owner: face.owner, // 车辆所有者 【dataType包含6】
				ownerAddress: face.address, // 所有人地址 【dataType包含6】
				engineNo: face.engineNo, // 发动机编号 【dataType包含6】
				vehicleType: face.vehicleType, // 车辆类型 【dataType包含6】
				useCharacter: face.useCharacter, // 使用性质 【dataType包含6】
				model: face.model, // 品牌型号 【dataType包含6】
				vin: face.vin, // 车辆识别代号 【dataType包含6】
				registerDate: face.resgisterDate, // 车辆识别代号 【dataType包含6】
				issueDate: face.issueDate, // 发证日期 【dataType包含6】
				issuingUnit: face.issuingUnit, // 发证单位 【dataType包含6】
				licenseMainPage: this.data.drivingLicenseFace.fileUrl, // 主页地址 【dataType包含6】
				licenseVicePage: this.data.drivingLicenseBack.fileUrl, // 副页地址 【dataType包含6】
				fileNumber: back.fileNumber, // 档案编号 【dataType包含6】
				personsCapacity: this.data.personsArr[this.data.personIndex], // 核定载人数 【dataType包含6】
				totalMass: back.totalMass, // 总质量 【dataType包含6】
				loadQuality: back.loadQuality, // 核定载质量 【dataType包含6】
				curbWeight: back.curbWeight, // 整备质量 【dataType包含6】
				size: back.size, // 外廓尺寸 【dataType包含6】
				tractionMass: back.tractionMass, // 准牵引总质量 【dataType包含6】
				recode: back.recode // 检验记录 【dataType包含6】
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
				this.setData({
					available: true,
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	// 选择人数
	onPersonsCapacityPickerChange (e) {
		this.setData({
			personIndex: parseInt(e.detail.value)
		});
		let drivingLicenseBack = this.data.drivingLicenseBack;
		drivingLicenseBack.ocrObject.personsCapacity = this.data.personsArr[this.data.personIndex];
		this.setData({
			drivingLicenseBack
		});
	},
	// 输入项值变化
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let type = e.currentTarget.dataset.type;
		let value = e.detail.value.trim();
		let drivingLicenseFace = this.data.drivingLicenseFace;
		let drivingLicenseBack = this.data.drivingLicenseBack;
		// 行驶证正面
		if (parseInt(type) === 3) {
			drivingLicenseFace.ocrObject[key] = value;
		} else { // 行驶证反面
			drivingLicenseBack.ocrObject[key] = value;
		}
		// 如果修改项为车牌 则对行驶证反面和正面车牌数据同时修改
		if (key === 'numberPlates') {
			drivingLicenseFace.ocrObject[key] = value;
			drivingLicenseBack.ocrObject[key] = value;
		}
		this.setData({
			drivingLicenseFace,
			drivingLicenseBack
		});
	},
	// 隐藏弹窗
	onHandle () {
		this.setData({
			isShowTextarea: true
		});
	}
});
