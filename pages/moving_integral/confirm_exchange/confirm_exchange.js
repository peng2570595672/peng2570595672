// pages/moving_integral/confirm_exchange/confirm_exchange.js
import {
	mobilePhoneReplace
} from '../../../utils/util'
const util = require('../../../utils/util')
const app = getApp();
Page({
	data: {
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), //电话号码 隐藏号码的中间四位
		popFlag: false, //控制验证码弹窗
		goodsInfo: {}, //商品的信息
		integral: {}, //积分信息
		mobileCode: '', //畅游积分可以直接兑换的验证码
		orderId: '', //预下单信息
		queryScoreCode: null, //获取兑换积分验证码返回的信息
		integralHighlight: false, //确定谁的积分高亮
		optCode: '', //验证码
		vcValue: '', //下单前验证码
		exchangeScore: null, //兑换畅游积分返回的信息
		makeOrder: null, //下单返回的信息
		confirmBtn: false, //控制确认按钮是下单还是兑换积分
		iphoneModel: false
	},

	onLoad(options) {
		let that = this;
		wx.getSystemInfo({
			success(res) {
				if (res.model == 'iPad'){
					that.setData({
						iphoneModel: true
					})
				}
			}
		})
		console.log(app.globalData.tonDunObj.index);
		that.setData({
			integralHighlight: app.globalData.tonDunObj.integralHighlight,
			orderId: app.globalData.tonDunObj.orderId
		})
		that.firstFuncton(options)
	},

	// 查询积分和商品
	async firstFuncton(options) {
		let that = this;
		// 查询商品
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/queryProducts', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			pageSize: '10',
			pageNum: '1'
		})
		that.setData({
			goodsInfo: res1.data.list[app.globalData.tonDunObj.index]
		});
		console.log("查询商品");
		console.log(res1);
		that.changYouIntegral()
	},

	// 查询积分
	async changYouIntegral() {
		let that = this;
		// 查询积分
		const res2 = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
			fingerprint: app.globalData.tonDunObj.fingerprint,
			sessionId: app.globalData.tonDunObj.sessionId,
			myOrderId: app.globalData.tonDunObj.myOrderId
		});
		that.setData({
			integral: res2.data,
		});
		// 测试
		// that.setData({
		// 	integral: {
		// 		points: 3600,
		// 		cmcc: {
		// 			lmPoints: 800
		// 		}
		// 	}
		// })
		console.log("查询积分");
		console.log(res2);
	},

	// 获取兑换积分验证码
	async getChangYouCode() {
		let that = this;
		console.log("获取兑换积分验证码");
		console.log(that.data.orderId);
		console.log(app.globalData.tonDunObj.myOrderId);
		const res = await util.getDataFromServersV2('consumer/member/changyou/queryScoreCode', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			outerPoints: parseInt(that.data.goodsInfo.goodPoints)*1.2, //移动积分
			orderId: that.data.orderId
		})
		that.setData({
			queryScoreCode: res.data,
		})
		console.log(res);
	},

	// 畅游积分可直接 兑换的输入获取
	input_change(e) {
		let that = this;
		if (e.detail.value.length === 4) {
			that.utilOverBooking(e.detail.value)
		}
	},
	// 当畅游积分不足输入验证码
	inputCode2(e) {
		let that = this;
		console.log(that.data.optCode);
		if (e.detail.value.length === 6) {
			that.setData({
				confirmBtn: true
			})
		}
	},

	// 点击兑换畅游积分和下单
	confirmExchange() {
		let that = this;
		if (that.data.confirmBtn && !that.data.integralHighlight) {
			that.redeemPoints()
		} else {
			that.overBooking()
		}
	},

	// 兑换积分
	async redeemPoints() {
		let that = this;
		// 兑换畅游积分
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/exchangeScore', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			outerOrderId: that.data.queryScoreCode.outerOrderId,
			orderId: that.data.orderId,
			sessionId: app.globalData.tonDunObj.sessionId,
			optCode: that.data.optCode
		})
		console.log("兑换畅游积分");
		console.log(res1);
		that.setData({
			exchangeScore: res1.data,
		})
		that.changYouIntegral()
		if (res1.code != 0) {
			that.setData({
				optCode: ''
			})
			// 如果兑换不成功 直接跳回  上一个页面
			util.showToastNoIcon('畅游积分兑换失败')
			setTimeout(()=>{util.go('/pages/moving_integral/bound_changyou/bound_changyou')},1000)
			return
		}
		that.setData({
			integralHighlight: true
		})
		app.globalData.tonDunObj.integralHighlight = true;
		util.showToastNoIcon('畅游积分兑换成功')
	},

	// 下单
	async overBooking() {
		console.log('确认');
		let that = this;
		// 下单api
		if (that.data.confirmBtn) {
			// 畅游兑换过积分
			that.setData({
				mobileCode: ''
			})
			// 下单
			console.log(app.globalData.tonDunObj.myOrderId);
			console.log(that.data.orderId);
			console.log(app.globalData.tonDunObj.sessionId);
			const res2 = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
				myOrderId: app.globalData.tonDunObj.myOrderId,
				orderId: that.data.orderId,
				sessionId: app.globalData.tonDunObj.sessionId,
			})
			that.setData({
				makeOrder: res2.data
			})
			console.log(res2);
			if (res2.code == 0) {
				util.go(`/pages/moving_integral/exchange_success/exchange_success?price=${that.data.goodsInfo.goodsPrice}`)
			} else {
				util.go("/pages/moving_integral/exchange_fail/exchange_fail")
			}
		} else {
			// 畅游没有兑换过积分  必须 获取下单验证码
			console.log('畅游没有兑换过积分  必须 获取下单验证码');
			const res3 = await util.getDataFromServersV2('consumer/member/changyou/queryOrderCode', {
				myOrderId: app.globalData.tonDunObj.myOrderId,
				orderId: that.data.orderId,
			})
			console.log(res3);
			that.setData({
				popFlag: true
			})
		}
	},

	// 下单-畅游积分足够不需要兑换 直接跳转
	async utilOverBooking(mobileCode) {
		console.log(mobileCode);
		let that = this;
		// 下单
		const res2 = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
			myOrderId: app.globalData.tonDunObj.myOrderId,
			orderId: that.data.orderId,
			sessionId: app.globalData.tonDunObj.sessionId,
			mobileCode: mobileCode
		})
		that.setData({
			makeOrder: res2.data
		})
		console.log(res2);
		if (res2.code == 0) {
			util.go(`/pages/moving_integral/exchange_success/exchange_success?price=${that.data.goodsInfo.goodsPrice}`)
		} else {
			util.go("/pages/moving_integral/exchange_fail/exchange_fail")
		}
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {
		util.go('/pages/moving_integral/bound_changyou/bound_changyou')
	},


})
