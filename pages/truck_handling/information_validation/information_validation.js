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
		oldDrivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面 原始数据,用于与新数据比对(秒审)
		oldDrivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面 原始数据,用于与新数据比对(秒审)
		carTypeArr: [
			{'id': 2, 'name': '两轴'},
			{'id': 3, 'name': '三轴'},
			{'id': 4, 'name': '四轴'},
			{'id': 5, 'name': '五轴'},
			{'id': 6, 'name': '六轴'}
		], // 车型数组
		carType: -1, // 车型
		ownershipTypeIndex: 1, // 车辆归属
		isTraction: 0, // 是否是牵引车 0 不是  1 是
		vehPlates: undefined, // 邮寄地址提交的车牌号
		vehColor: undefined, // 邮寄地址提交的车牌颜色
		promptObject: {
			content: '',
			isOk: true,
			isHide: false
		},
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isShowTextarea: true// 是否显示textarea
	},
	async onLoad (options) {
		this.setData({
			vehColor: options.vehColor,
			vehPlates: options.vehPlates
		});
		await this.getOrderInfo();
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
					drivingLicenseFace,
					oldDrivingLicenseFace: drivingLicenseFace
				});
				this.setData({
					available: this.validateData(false)
				});
			}
			let drivingLicenseBack = wx.getStorageSync('truck-driving-license-back');
			if (drivingLicenseBack) {
				drivingLicenseBack = JSON.parse(drivingLicenseBack);
				this.setData({
					backStatus: 4,
					drivingLicenseBack,
					oldDrivingLicenseBack: drivingLicenseBack
				});
				this.setData({
					available: this.validateData(false)
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
					console.log(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRType = 0;
						if (type === 3) {
							try {
								const faceObj = res.data[0];
								if (!faceObj.ocrObject.numberPlates || !faceObj.ocrObject.owner || !faceObj.ocrObject.vehicleType) {
									util.showToastNoIcon('识别失败！');
									this.setData({
										available: false,
										faceStatus: 3
									});
									return;
								}
								if (faceObj.ocrObject.numberPlates !== this.data.vehPlates) {
									this.setData({
										faceStatus: 3,
										available: false,
										[`promptObject.content`]: `行驶证与${this.data.vehPlates}不一致`
									});
									this.selectComponent('#notFinishedOrder').show();
									return;
								}
								const vehicleList = ['普通货车', '厢式货车', '仓栅式货车', '封闭货车', '罐式货车', '平板货车',
									'集装箱车', '车辆运输车', '特殊结构货车', '自卸货车', '半挂牵引车', '全挂牵引车', '栏板货车',
									'轻型货车', '多用途货车', '专门用途货车', '低速货车'];
								if (vehicleList.includes(faceObj.ocrObject.vehicleType)) {
									util.showToastNoIcon('非货车类型无法办理！');
									this.setData({
										available: false,
										faceStatus: 3
									});
									return;
								}
								this.setData({
									faceStatus: 4,
									drivingLicenseFace: faceObj,
									oldDrivingLicenseFace: faceObj
								});
								wx.setStorageSync('truck-driving-license-face', JSON.stringify(faceObj));
							} catch (err) {
								this.setData({
									available: false,
									faceStatus: 3
								});
							}
						} else {
							try {
								const backObj = res.data[0];
								backObj.ocrObject.size = backObj.ocrObject.size.match(/[\d]+/g);
								backObj.ocrObject.vehicleLength = backObj.ocrObject.size[0];
								backObj.ocrObject.vehicleWidth = backObj.ocrObject.size[1];
								backObj.ocrObject.vehicleHeight = backObj.ocrObject.size[2];
								backObj.ocrObject.totalMass = backObj.ocrObject.totalMass.slice(0, backObj.ocrObject.totalMass.length - 2);
								backObj.ocrObject.curbWeight = backObj.ocrObject.curbWeight.slice(0, backObj.ocrObject.curbWeight.length - 2);
								backObj.ocrObject.loadQuality = backObj.ocrObject.loadQuality.slice(0, backObj.ocrObject.loadQuality.length - 2);
								// 计算人数
								let personsCapacity = backObj.ocrObject.personsCapacity;
								const personsCapacityStr = personsCapacity.slice(0, personsCapacity.length - 1);
								let personsCapacityNum = 0;
								if (personsCapacityStr.includes('+')) {
									personsCapacityNum = parseInt(personsCapacityStr.split('+')[0]) + parseInt(personsCapacityStr.split('+')[1]);
								} else {
									personsCapacityNum = personsCapacityStr;
								}
								backObj.ocrObject.personsCapacity = personsCapacityNum;
								this.setData({
									backStatus: 4,
									oldDrivingLicenseBack: backObj,
									drivingLicenseBack: backObj
								});
								wx.setStorageSync('truck-driving-license-back', JSON.stringify(backObj));
							} catch (err) {
								this.setData({
									available: false,
									faceStatus: 4
								});
							}
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
		if (this.data.faceStatus !== 4 || this.data.backStatus !== 4) {
			if (isToast) util.showToastNoIcon('请上传行驶证！');
			return false;
		}
		if (!this.data.drivingLicenseFace.ocrObject.numberPlates || !this.data.drivingLicenseBack.ocrObject.numberPlates) {
			if (isToast) util.showToastNoIcon('车牌号不能为空！');
			return false;
		}
		if (this.data.drivingLicenseFace.ocrObject.numberPlates !== this.data.vehPlates) {
			if (isToast) util.showToastNoIcon(`行驶证与${this.data.vehPlates}不一致`);
			return false;
		}
		if (!this.data.drivingLicenseFace.ocrObject.owner) {
			if (isToast) util.showToastNoIcon('车辆所有人不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseFace.ocrObject.vehicleType) {
			if (isToast) util.showToastNoIcon('车辆类型不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseFace.ocrObject.vin) {
			if (isToast) util.showToastNoIcon('车辆识别代号不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.personsCapacity) {
			if (isToast) util.showToastNoIcon('车辆核载人数不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.vehicleLength) {
			if (isToast) util.showToastNoIcon('车辆尺寸(长)不能为空！');
			return false;
		}
		if (this.data.carType === -1) {
			if (isToast) util.showToastNoIcon('请选择车轴数！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.vehicleWidth) {
			if (isToast) util.showToastNoIcon('车辆尺寸(宽)不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.vehicleHeight) {
			if (isToast) util.showToastNoIcon('车辆尺寸(高)不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.totalMass) {
			if (isToast) util.showToastNoIcon('车辆总质量不能为空！');
			return false;
		}
		if (!this.data.drivingLicenseBack.ocrObject.curbWeight) {
			if (isToast) util.showToastNoIcon('车辆整备质量不能为空！');
			return false;
		}
		return true;
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		// 识别中禁止修改
		if ((type === 3 && this.data.faceStatus === 2) || (type === 4 && this.data.backStatus === 2)) return;
		util.go(`/pages/truck_handling/shot_card/shot_card?type=${type}&pathUrl=${type === 3 ? this.data.drivingLicenseFace.fileUrl : this.data.drivingLicenseBack.fileUrl}`);
	},
	bindPersonsCarTypeChange (e) {
		this.setData({
			carType: parseInt(e.detail.value)
		});
		this.setData({
			available: this.validateData(false)
		});
	},
	// 获取订单信息
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '6'
		});
		if (!result) return;
		if (result.code === 0) {
			if (result.data.vehicle) { // 是否有行驶证
				const carType = this.data.carTypeArr.findIndex(item => item.id === result.data.vehicle.axleNum);
				const size = result.data.vehicle.size.slice(0, result.data.vehicle.size.length - 2).split('×');
				this.setData({
					[`drivingLicenseBack.ocrObject`]: result.data.vehicle,
					[`drivingLicenseFace.ocrObject`]: result.data.vehicle,
					[`drivingLicenseBack.ocrObject.vehicleLength`]: size[0],
					[`drivingLicenseBack.ocrObject.vehicleWidth`]: size[1],
					[`drivingLicenseBack.ocrObject.vehicleHeight`]: size[2],
					[`drivingLicenseBack.ocrObject.totalMass`]: result.data.vehicle.totalMass.slice(0, result.data.vehicle.totalMass.length - 2),
					[`drivingLicenseBack.ocrObject.curbWeight`]: result.data.vehicle.curbWeight.slice(0, result.data.vehicle.curbWeight.length - 2),
					[`drivingLicenseBack.ocrObject.loadQuality`]: result.data.vehicle.loadQuality.slice(0, result.data.vehicle.loadQuality.length - 2),
					[`drivingLicenseFace.ocrObject.numberPlates`]: result.data.vehicle.vehPlates,
					[`drivingLicenseBack.ocrObject.numberPlates`]: result.data.vehicle.vehPlates,
					[`drivingLicenseFace.ocrObject.address`]: result.data.vehicle.ownerAddress,
					[`drivingLicenseFace.ocrObject.resgisterDate`]: result.data.vehicle.registerDate,
					[`drivingLicenseFace.fileUrl`]: result.data.vehicle.licenseMainPage,
					[`drivingLicenseBack.fileUrl`]: result.data.vehicle.licenseVicePage,
					isTraction: result.data.vehicle.isTraction,
					carType,
					oldDrivingLicenseFace: this.data.drivingLicenseFace,
					oldDrivingLicenseBack: this.data.drivingLicenseBack,
					backStatus: 4,
					faceStatus: 4
				});
				this.setData({
					available: this.validateData(false)
				});
				wx.setStorageSync('truck-driving-license-face', JSON.stringify(this.data.drivingLicenseFace));
				wx.setStorageSync('truck-driving-license-back', JSON.stringify(this.data.drivingLicenseBack));
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 提交信息
	async onClickConfirmHandle () {
		if (!this.validateData(true) || this.data.isRequest) {
			return;
		}
		await this.confirmHandle();
	},
	async confirmHandle () {
		// 比对车牌颜色和车牌位数是否一致   新老数据做对比,判断是否进行秒审
		// 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
		let face = this.data.drivingLicenseFace.ocrObject;
		let oldFace = this.data.oldDrivingLicenseFace.ocrObject;
		let back = this.data.drivingLicenseBack.ocrObject;
		let oldBack = this.data.oldDrivingLicenseBack.ocrObject;
		let backValue;
		let oldBackValue;
		let faceValue;
		let oldFaceValue;
		let haveChange = true;
		for (let key in back) { backValue += back[key]; }
		for (let key in oldBack) { oldBackValue += oldBack[key]; }
		for (let key in face) { faceValue += face[key]; }
		for (let key in oldFace) { oldFaceValue += oldFace[key]; }
		if (backValue === oldBackValue && faceValue === oldFaceValue) {
			haveChange = false;
		}
		// 提价数据
		this.setData({
			isRequest: true,
			available: false
		});
		if (face.vehicleType.includes('牵引') || face.vehicleType.includes('挂') || face.vehicleType.includes('集装箱')) {
			// 牵引车
			this.setData({isTraction: 1});
		}
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '6',
			changeAuditStatus: 0,// 修改不计入待审核
			vehicleInfo: {
				carType: 1,
				haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含6】
				vehPlates: face.numberPlates,
				platesColor: this.data.vehColor,
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
				personsCapacity: back.personsCapacity, // 核定载人数 【dataType包含6】
				totalMass: back.totalMass + 'kg', // 总质量 【dataType包含6】
				loadQuality: back.loadQuality ? back.loadQuality + 'kg' : '--', // 核定载质量 【dataType包含6】
				curbWeight: back.curbWeight + 'kg', // 整备质量 【dataType包含6】
				size: `${back.vehicleLength}×${back.vehicleWidth}×${back.vehicleHeight}mm`, // 外廓尺寸 【dataType包含6】
				tractionMass: back.tractionMass, // 准牵引总质量 【dataType包含6】
				recode: back.recode, // 检验记录 【dataType包含6】
				vehicleCategory: 0, // 收费车型(后台选) 一型客车 1,二型客车 2,三型客车 3,四型客车 4,一型货车 11,二型货车 12,三型货车 13,四型货车 14,五型货车 15,六型货车 16
				axleNum: this.data.carTypeArr[this.data.carType].id, // 轴数
				isTraction: this.data.isTraction // 是否牵引车
			}
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];// 上一个页面
			prevPage.setData({
				isChangeDrivingLicenseError: true // 重置状态
			});
			wx.navigateBack({
				delta: 1
			});
		} else {
			util.showToastNoIcon(result.message);
		}
		this.setData({
			available: true,
			isRequest: false
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
		if (key === 'personsCapacity') {
			if (parseInt(value) < 1 || parseInt(value) > 6) value = '';
			drivingLicenseBack.ocrObject[key] = value;
		}
		this.setData({
			drivingLicenseFace,
			drivingLicenseBack
		});
		this.setData({
			available: this.validateData(false)
		});
	},
	// 隐藏弹窗
	onHandle () {
		this.setData({
			isShowTextarea: true
		});
	}
});
