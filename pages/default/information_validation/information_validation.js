/**
 * @author 狂奔的蜗牛
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		opened: false,
		current: 0,
		drivingLicenseFace: {
			ocrObject: {}
		},
		drivingLicenseBack: {
			ocrObject: {}
		},
		carHead45: {},
		personIndex: 0, // 选择框当前选中索引
		personsArr: [2, 3, 4, 5, 6, 7, 8, 9] // 核载人数选择框
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
		util.go('/pages/default/processing_progress/processing_progress');
	},
	// 选择人数
	onPersonsCapacityPickerChange (e) {
		this.setData({
			personIndex: parseInt(e.detail.value)
		});
	}
});
