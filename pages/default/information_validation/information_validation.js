/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		topProgressBar: 3,	// 进度条展示的长度 ，再此页面的取值范围 [3,4),默认为3,保留一位小数
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		backStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		personIndex: 0, // 选择框当前选中索引
		oldPersonIndex: 0, // 选择框当前选中索引 原始数据,用于与新数据比对(秒审)
		personsArr: [2, 3, 4, 5, 6, 7, 8, 9], // 核载人数选择框
		drivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面
		drivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面
		vehPlates: undefined, // 邮寄地址提交的车牌号
		vehColor: undefined, // 邮寄地址提交的车牌颜色
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		oldDrivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面 原始数据,用于与新数据比对(秒审)
		oldDrivingLicenseBack: {
			ocrObject: {}
		} // 行驶证反面 原始数据,用于与新数据比对(秒审)
	},
	async onLoad (options) {
		this.setData({
			vehColor: options.vehColor,
			vehPlates: options.vehPlates
		});
		await this.getOrderInfo();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		// 行驶证正面
		let path = wx.getStorageSync('passenger-car-3');
		if (path) {
			wx.removeStorageSync('passenger-car-3');
			if (app.globalData.handlingOCRType) this.uploadOcrFile(path);
		}
		// 行驶证反面
		path = wx.getStorageSync('passenger-car-4');
		if (path) {
			wx.removeStorageSync('passenger-car-4');
			if (app.globalData.handlingOCRType) this.uploadOcrFile(path);
		}
		if (!app.globalData.handlingOCRType) {
			// 没通过上传
			let drivingLicenseFace = wx.getStorageSync('passenger-car-driving-license-face');
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
			let drivingLicenseBack = wx.getStorageSync('passenger-car-driving-license-back');
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
		const type = app.globalData.handlingOCRType;
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
						app.globalData.handlingOCRType = 0;
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
										available: false
									});
									util.showToastNoIcon(`行驶证车牌与${this.data.vehPlates}不一致，请重新上传`);
									return;
								}
								if (!this.checkVehicleType(faceObj.ocrObject.vehicleType)) {
									util.showToastNoIcon('车辆类型不符，请检查无误重新上传！');
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
								wx.setStorageSync('passenger-car-driving-license-face', JSON.stringify(faceObj));
							} catch (err) {
								this.setData({
									available: false,
									faceStatus: 3
								});
							}
						} else {
							try {
								const backObj = res.data[0];
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
								wx.setStorageSync('passenger-car-driving-license-back', JSON.stringify(backObj));
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
	checkVehicleType (vehicleType) {
		let flag;
		const vehicleList = ['中型普通客车','小型专用客车', '小型轿车', '小型普通客车', '小型面包车', '小型旅居车', '小型客车',
			'微型越野客车', '微型普通客车', '微型轿车', '轻型客车', '普通客车', '大型轿车', '小型越野客车', '轿车'];
		for (let name of vehicleList) {
			if (vehicleType.indexOf(name) !== -1) {
				flag = true;
			}
		}
		return flag;
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
			if (isToast) util.showToastNoIcon(`行驶证车牌与${this.data.vehPlates}不一致，请重新上传`);
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
		if (!this.data.drivingLicenseBack.ocrObject.size) {
			if (isToast) util.showToastNoIcon('车辆尺寸不能为空！');
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
		util.go(`/pages/default/shot_card/shot_card?type=${type}&pathUrl=${type === 3 ? this.data.drivingLicenseFace.fileUrl : this.data.drivingLicenseBack.fileUrl}`);
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
				let index = this.data.personsArr.findIndex((value) => value === parseInt(result.data.vehicle.personsCapacity));
				this.setData({
					[`drivingLicenseBack.ocrObject`]: result.data.vehicle,
					[`drivingLicenseFace.ocrObject`]: result.data.vehicle,
					[`drivingLicenseFace.ocrObject.numberPlates`]: result.data.vehicle.vehPlates,
					[`drivingLicenseBack.ocrObject.numberPlates`]: result.data.vehicle.vehPlates,
					personIndex: index,
					oldPersonIndex: index,
					[`drivingLicenseFace.ocrObject.address`]: result.data.vehicle.ownerAddress,
					[`drivingLicenseFace.ocrObject.resgisterDate`]: result.data.vehicle.registerDate,
					[`drivingLicenseFace.fileUrl`]: result.data.vehicle.licenseMainPage,
					[`drivingLicenseBack.fileUrl`]: result.data.vehicle.licenseVicePage
				});
				this.setData({
					backStatus: 4,
					faceStatus: 4,
					oldDrivingLicenseFace: this.data.drivingLicenseFace,
					oldDrivingLicenseBack: this.data.drivingLicenseBack
				});
				this.setData({
					available: this.validateData(false)
				});
				wx.setStorageSync('passenger-car-driving-license-face', JSON.stringify(this.data.drivingLicenseFace));
				wx.setStorageSync('passenger-car-driving-license-back', JSON.stringify(this.data.drivingLicenseBack));
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 提交信息
	onClickConfirmHandle () {
		if (!this.validateData(true) || this.data.isRequest) {
			return;
		}
		wx.uma.trackEvent('information_validation_next');
		this.confirmHandle();
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
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '6',
			changeAuditStatus: 0,// 修改不计入待审核
			vehicleInfo: {
				carType: 1,
				vehPlates: face.numberPlates,
				haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含6】
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
				totalMass: this.determineTheWeight(back.totalMass), // 总质量 【dataType包含6】
				loadQuality: this.determineTheWeight(back.loadQuality), // 核定载质量 【dataType包含6】
				curbWeight: this.determineTheWeight(back.curbWeight), // 整备质量 【dataType包含6】
				size: back.size, // 外廓尺寸 【dataType包含6】
				tractionMass: this.determineTheWeight(back.tractionMass), // 准牵引总质量 【dataType包含6】
				recode: back.recode // 检验记录 【dataType包含6】
			}
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
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
	},
	determineTheWeight (info) {
		if (!info) return '--';
		if (info.includes('kg') || info.includes('--')) return info;
		return info + 'kg';
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
	// 选择注册日期
	resgisterDatePickerChange (e) {
		let value = e.detail.value;
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.ocrObject.resgisterDate = value;
		this.setData({
			drivingLicenseFace
		});
	},
	// 选择发证日期
	issueDatePickerChange (e) {
		let value = e.detail.value;
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.ocrObject.issueDate = value;
		this.setData({
			drivingLicenseFace
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
	}
});
