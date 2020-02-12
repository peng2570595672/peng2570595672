/**
 * @author 狂奔的蜗牛
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		opened: false, // 是否展开更多信息
		current: 0, // 当前轮播图索引
		drivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面
		drivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面
		carHead45: {}, // 车头照
		personIndex: 0, // 选择框当前选中索引
		personsArr: [2, 3, 4, 5, 6, 7, 8, 9], // 核载人数选择框
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		orderInfo: undefined // 订单信息
	},
	onLoad () {
		// 行驶证正面
		let drivingLicenseFace = wx.getStorageSync('driving_license_face');
		if (drivingLicenseFace) {
			drivingLicenseFace = JSON.parse(drivingLicenseFace).data[0];
		}
		// 行驶证反面
		let drivingLicenseBack = wx.getStorageSync('driving_license_back');
		if (drivingLicenseBack) {
			drivingLicenseBack = JSON.parse(drivingLicenseBack).data[0];
		}
		// 车头照
		let carHead45 = wx.getStorageSync('car_head_45');
		if (carHead45) {
			carHead45 = JSON.parse(carHead45).data[0];
		}
		this.setData({
			drivingLicenseFace,
			drivingLicenseBack,
			carHead45
		});
		// 回显人数
		let personCount = this.data.drivingLicenseBack.ocrObject.personsCapacity;
		if (personCount) {
			try {
				personCount = parseInt(personCount);
				let index = this.data.personsArr.indexOf(personCount);
				this.setData({
					personIndex: index !== -1 ? index : 3
				});
			} catch (e) {
			}
		}
		// 加载订单信息
		this.getOrderInfo();
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '1'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data,
					available: true // 下一步按钮可用
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	//  展开和关闭切换
	onClickToggleOpenOrCloseHandle () {
		this.setData({
			opened: !this.data.opened
		});
	},
	// 轮播图当前页改变
	onChangeHandle (e) {
		this.setData({
			current: e.detail.current
		});
	},
	// 提交信息
	onClickComfirmHandle () {
		// 统计点击事件
		mta.Event.stat('035',{});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		let face = this.data.drivingLicenseFace.ocrObject;
		let back = this.data.drivingLicenseBack.ocrObject;
		let carHead45 = this.data.carHead45;
		// 比对之前输入车牌和当前行驶证车牌是否一致
		if (face.numberPlates !== this.data.orderInfo['base'].vehPlates.trim()) {
			util.showToastNoIcon(`行驶证车牌${face.numberPlates}与下单时车牌${this.data.orderInfo['base'].vehPlates.trim()}不一致，请检查！`);
			return;
		}
		let isOk = true;
		// 比对车牌颜色和车牌位数是否一致
		// 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
		if (face.numberPlates.length === 7) {
			isOk = this.data.orderInfo['base'].vehColor === 0 || this.data.orderInfo['base'].vehColor === 1;
		} else {
			isOk = this.data.orderInfo['base'].vehColor === 4;
		}
		if (!isOk) {
			let color = this.data.orderInfo['base'].vehColor === 1 ? '黄色' : this.data.orderInfo['base'].vehColor === 4 ? '渐变绿色' : '蓝色';
			util.showToastNoIcon(`车牌格式与下单时车牌颜色（${color}）不符，请检查！`);
			return;
		}
		// 校验外廓尺寸
		isOk = /^[1-9][0-9]{3,4}(([×*x][1-9][0-9]{3}){2})[m]{2}$/.test(back.size);
		if (!isOk) {
			util.showToastNoIcon('外廓尺寸单位必须为毫米 如：4500*1780*1560mm，请修改！');
			return;
		}
		// 提价哦数据
		this.setData({
			isRequest: true,
			available: false
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '67', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 1, // 订单资料是否已完善 1-是，0-否
			vehicleInfo: {
				carType: 1,
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
				issuingUnit: '', // 发证单位 【dataType包含6】
				licenseMainPage: this.data.drivingLicenseFace.fileUrl, // 主页地址 【dataType包含6】
				licenseVicePage: this.data.drivingLicenseBack.fileUrl, // 副页地址 【dataType包含6】
				fileNumber: back.fileNumber, // 档案编号 【dataType包含6】
				personsCapacity: back.personsCapacity, // 核定载人数 【dataType包含6】
				totalMass: back.totalMass, // 总质量 【dataType包含6】
				loadQuality: back.loadQuality, // 核定载质量 【dataType包含6】
				curbWeight: back.curbWeight, // 整备质量 【dataType包含6】
				size: back.size, // 外廓尺寸 【dataType包含6】
				tractionMass: back.tractionMass, // 准牵引总质量 【dataType包含6】
				recode: back.recode // 检验记录 【dataType包含6】
			}
		};
		// 车头照
		if (carHead45) {
			params['headstockInfo'] = {
				vehPlate: face.numberPlates,// 车牌号 【dataType包含7】
				fileName: carHead45.fileName, // 文件名称 【dataType包含7】
				fileGroup: carHead45.fileGroup, // 所在组 【dataType包含7】
				fileUrl: carHead45.fileUrl // 访问地址 【dataType包含7】
			};
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/default/processing_progress/processing_progress');
			} else {
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
		drivingLicenseBack.ocrObject.personsCapacity = this.data.personsArr[this.data.personIndex] + '人';
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
	// 重新拍照识别
	onClickPhotoHandle (e) {
		let type = e.currentTarget.dataset.type;
		type = parseInt(type);
		wx.setStorageSync('photo_recognition_of_driving_license_type', type);
		wx.navigateBack({
			delta: 1
		});
	}
});
