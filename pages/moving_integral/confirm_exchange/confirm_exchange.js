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
		confirmBtn: false,														//确认兑换按钮的颜色控制
		myOrderId: '',															//畅由侧返回的标识ID
		index: null,
		goodsInfo: {},															//商品的信息
		integral: {},															//积分信息
		
		outerOrderId: '',														//预下单信息
		orderId: '',															//预下单信息
		queryScoreCode: null,													//获取兑换积分验证码返回的信息
		integralHighlight: false,												//确定谁的积分高亮
		optCode: '',															//验证码
		exchangeScore: null,													//兑换畅游积分返回的信息
		makeOrder: null															//下单返回的信息
	},
	onLoad(options) {
		console.log(options);
		let that = this;
		that.setData({
			myOrderId: options.myOrderId,
			index: options.index,
			outerOrderId: options.outerOrderId,
			orderId: options.orderId
		})
		that.firstFuncton(options)
	},
	onReady() {
		let that = this;
	},
	
	async firstFuncton(options) {
		let that = this;
		// 查询商品
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/queryProducts', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			pageSize: '10',
			pageNum: '1'
		})
		that.setData({
			goodsInfo: res1.data.list[options.index]
		});
		console.log("查询商品");
		console.log(res1);
		
		// 查询积分
		const res2 = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
			fingerprint: app.globalData.tonDunObj.fingerprint,
			sessionId: app.globalData.tonDunObj.sessionId,
			myOrderId: app.globalData.tonDunObj.myOrderId
		});
		that.setData({
			integral: res2.data.cmcc,
		});
		console.log("查询积分");
		console.log(res2);
		// 判断畅游积分是否大于商品积分
		if (800 >= res1.data.list[options.index].goodPoints) {
			that.setData({
				integralHighlight: true,
				confirmBtn: false
			})
		}
		console.log(res2.data.points);
		console.log(that.data.integralHighlight);
	},
	
	
	
	// 获取兑换积分验证码
	async getChangYouCode() {
		let that = this;
		const res = await util.getDataFromServersV2('consumer/member/changyou/queryScoreCode', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			outerOrderId: that.data.outerOrderId,
			outerPoints: "500",					//移动积分
			orderId: that.data.orderId
		})
		that.setData({
			queryScoreCode: res.data.data
		})
		console.log(res);
	},
	
	// 点击兑换畅游积分和下单
	confirmExchange() {
		console.log("aaaaaa");
		if (that.data.integralHighlight) {
			this.overBooking()
		} else{
			this.redeemPoints()
		}
	},
	// 兑换积分api
	async redeemPoints() {
		let that = this;
		console.log(that.data.optCode);
		// 兑换畅游积分
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/exchangeScore', {
			myOrderId: tapp.globalData.tonDunObj.myOrderId,
			outerOrderId: that.data.outerOrderId,
			orderId: that.data.orderId,
			outerPoints: that.data.integral.lmPoints,
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
		// sessionId: app.globalData.tonDunObj.sessionId
		// mobileCode: 弃用
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
		if (e.detail.value.length === 6) {
			that.setData({
				confirmBtn: true,
				optCode: e.detail.value
			})
		}
		
	},
	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {
		
	},


})
