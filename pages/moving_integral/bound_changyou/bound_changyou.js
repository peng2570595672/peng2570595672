// pages/moving_integral/bound_changyou/bound_changyou.js
import {
	mobilePhoneReplace
} from '../../../utils/util';
const util = require('../../../utils/util');
const changyou = require('../../../utils/changyou')
const app = getApp();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		phone_number: mobilePhoneReplace('15870105857'), //电话号码 隐藏号码的中间四位
		moving_integral: 399, //移动积分
		// flag: false, //根据是否绑定控制页面元素的显示与隐藏
		pass_ticket: []
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad(options) {
		let that = this;
		// 查询商品
		const queryProductList = await changyou.changYouApi('queryProducts');
		that.setData({
			pass_ticket: queryProductList.data.list
		})
		// 查询积分
		const queryScoresList = await changyou.changYouApi('queryScores')
	},

	// 立即兑换
	async confirm_exchange(e) {
		console.log(e.currentTarget.dataset.index);
		changyou.tonDunObj.goodsListNum = e.currentTarget.dataset.index
		await changyou.changYouApi('prepareOrder')
		util.go('/pages/moving_integral/confirm_exchange/confirm_exchange')
		console.log("点击确认");
	}

})
