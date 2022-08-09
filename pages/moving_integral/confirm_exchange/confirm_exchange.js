// pages/moving_integral/confirm_exchange/confirm_exchange.js
import {
	mobilePhoneReplace
} from '../../../utils/util'
const changyou = require('../../../utils/changyou')
const app = getApp();
Page({
	data: {
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), //电话号码 隐藏号码的中间四位
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	getChangYouCode() {
		changyou.changYouApi('queryScoreCode')
	},
	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

})
