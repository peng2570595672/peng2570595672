// pages/moving_integral/confirm_exchange/confirm_exchange.js
import {
	mobilePhoneReplace
} from '../../../utils/util'
const changyou = require('../../../utils/changyou')
const util = require('../../../utils/util')
const app = getApp();
Page({
	data: {
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone),	//电话号码 隐藏号码的中间四位
		confirmBtn: true,														//确认兑换按钮的颜色控制
		myOrderId: '',															//畅由侧返回的标识ID
		goodsInfo: {},															//商品的信息
		integral: {},															//积分信息
		prepareOrder: null,														//预下单信息
		queryScoreCode: null,													//获取兑换积分验证码返回的信息
		integralHighlight: false,												//确定谁的积分高亮
		optCode: '',															//验证码
		exchangeScore: null,													//兑换畅游积分返回的信息
		makeOrder: null															//下单返回的信息
	},
	onLoad(options) {
		let that = this;
		that.getPrevPageData()
	},
	onReady() {
		let that = this;
	},
	
	// 获取上一个页面传来的数据
	getPrevPageData() {
		let that = this
		const eventChannel = this.getOpenerEventChannel();
		eventChannel.on('boundChangYouData', function(data) {
			console.log(data);
		    that.setData({
				myOrderId: data.myOrderId,
				goodsInfo: data.goodsObj,
				integral: data.queryScores.cmcc,
				prepareOrder: data.prepareOrder
			})
		})
		that.moveAndChangYou()
	},
	// 移动积分和畅游积分用谁来兑换
	moveAndChangYou() {
		let that = this;
		if (that.data.integral.lmPoints >= that.data.goodsInfo.goodPoints) {
			that.setData({
				integralHighlight: true,
				confirmBtn: false
			})
		} else{
			console.log("cccc");
		}
	},
	// 获取兑换积分验证码
	async getChangYouCode() {
		let that = this;
		const res = await util.getDataFromServersV2('consumer/member/changyou/queryScoreCode', {
			myOrderId: that.data.myOrderId,
			outerOrderId: that.data.prepareOrder.sessionId,
			outerPoints: "500",					//移动积分
			orderId: that.data.prepareOrder.orderId
		})
		that.setData({
			queryScoreCode: res.data.data
		})
		console.log(res);
		
	},
	// 点击兑换畅游积分
	confirmExchange() {
		if (!this.data.integralHighlight) {
			this.redeemPoints()
		} else{
			this.overBooking()
		}
	},
	// 兑换积分api
	async redeemPoints() {
		let that = this;
		console.log(that.data.optCode);
		// 兑换畅游积分
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/exchangeScore', {
			myOrderId: that.data.myOrderId,
			outerOrderId: that.data.prepareOrder.outerOrderId,
			outerPoints: that.data.integral.lmPoints,
			orderId: that.data.prepareOrder.orderId,
			optCode: that.data.optCode
		})
		console.log("兑换畅游积分");
		console.log(res1);
		that.setData({
			exchangeScore: res1.data
		})
		if (res1.code !== '0') {
			// 如果兑换不成功 直接跳回  上一个页面
			util.go('/pages/moving_integral/bound_changyou/bound_changyou')
		}
		util.showToastNoIcon('畅游积分兑换成功')
	},
	// 下单
	async overBooking() {
		console.log('下单');
		let that = this;
		// 下单api
		// const res2 = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
		// 	myOrderId: that.data.myOrderId,
		// 	orderId: that.data.exchangeScore.orderId,
		// 	sessionId: changyou.tonDunObj.sessionId
		// 	// mobileCode: 弃用
		// })
		// that.setData({
		// 	makeOrder: res2.data
		// })
		// console.log(res2);
		if (true) {
			util.go('/pages/moving_integral/exchange_success/exchange_success')
		} else{
			util.go('/pages/moving_integral/exchange_fail/exchange_fail')
		}
	},
	// 输入验证码
	inputCode2(e) {
		console.log(e.detail.value);
		let that = this;
		that.setData({
			confirmBtn: true
		})
		if (e.detail.value.length === 6) {
			that.setData({
				confirmBtn: false,
				optCode: e.detail.value
			})
		}
		
	},
	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {},


})
