// pages/moving_integral/confirm_exchange/confirm_exchange.js
import {
	mobilePhoneReplace
} from '../../../utils/util'
const changyou = require('../../../utils/changyou')
const app = getApp();
Page({
	data: {
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), //电话号码 隐藏号码的中间四位
		goodsInfo: {},
		confirmBtn: true
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad(options) {
		let that = this
		// 获取点击确认兑换的单个商品信息
		const res = await changyou.changYouApi('queryProducts')
		console.log(res.data.list[changyou.tonDunObj.goodsListNum]);
		that.setData({
			goodsInfo: res.data.list[changyou.tonDunObj.goodsListNum]
		})
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},
	// 获取兑换积分验证码
	getChangYouCode() {
		changyou.changYouApi('queryScoreCode')
	},
	// 兑换畅游积分
	confirmExchange() {
		console.log('aaqaaaa');
	},
	inputCode2(e) {
		console.log(e.detail.value);
		let that = this;
		that.setData({
			confirmBtn: true
		})
		if (e.detail.value.length === 6) {
			that.setData({
				confirmBtn: false
			})
		}
		
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
