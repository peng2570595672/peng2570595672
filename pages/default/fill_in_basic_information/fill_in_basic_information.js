// pages/default/fillInBasicInformation/fillInBasicInformation.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		topProgressBar: 1.0,	// 进度条展示的长度 ，再此页面的取值范围 [1,2),默认为1,保留一位小数
		inputNum: 7,	// 车牌的位数，用于控制颜色
		currentIndex: -1,
		available: false, // 按钮是否可点击
		test: false,
		test1: false,
		isNewPowerCar: true
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad (options) {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow () {

	},

	setCurrentCarNo (e) {
		this.setData({
			currentIndex: e.currentTarget.dataset.index
		});
	}
});
