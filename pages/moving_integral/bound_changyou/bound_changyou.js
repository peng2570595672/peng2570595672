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
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), 	//电话号码 隐藏号码的中间四位
		moving_integral: '_', 									//移动积分
		chang_you_integral: 0, 									//畅游积分

		mask: false,											//控制遮慕层的显示隐藏
		authorizePop: false, 									//控制授权说明弹窗的显示隐藏
		verification_code: false, 								//控制验证码弹窗的显示隐藏

		checkBindStatus: null, 									//畅游是否绑定
		queryProducts: null, 									//商品列表
		sign: {}, //登记信息
		queryScores: null, 										//用户积分信息
		queryBindCode: null,									//获取绑定验证码信息
		prepareOrder: null,										//预下单信息
		
		arr1: {
			text1: '1. 本活动为移动积分兑换通行券活动，由合作伙伴上海分互链信息技术有限公司通过数据接口实时读取您在中国移动的消费积分的剩余数量，以完成兑换畅由积分后再兑换相应的ETC+通行券。',
			text2: '2. 积分兑换比例为：120移动积分=100畅由积分；180畅由积分=1元通行券，具体可兑换面值以页面可选为准。',
			text3: '3. 一旦您确认使用移动积分兑换，指定的移动积分将自动消耗并转换为对应的畅由积分，默认您已接受积分不可回退事实，如您不接受该情况，请勿操作兑换。',
			text4: '4. 畅由积分成功兑换通行券后，不支持退货，如您不接受该情况，请勿操作兑换。',
			text4: '5. 通行券有效期为自领取之日起30天内有效，逾期自动作废且不可补发。通行券仅限ETC+办理用户用于通行高速时抵扣ETC通行费，不支持其他渠道ETC及其他通行扣费使用。'
		},
		vcValue: '', 											//验证码弹窗输入的值
		time: 60,
		getCode: '获取验证码',
		timeFlag: false, 										//控制验证时间的
	},

	onLoad(options) {
		console.log("1");
		let that = this;
		setTimeout(that.loginCall, 0)
	},
	
	onShow() {
		console.log("2");
	},
	
	onReady() {
		console.log("3");
		setTimeout(this.queryGoods, 1000)
	},

	// onLogin doing
	async loginCall() {
		let that = this;
		// 登记接口 获取 myOrderId
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/sign');
		that.setData({
			sign: res1.data
		});
		console.log('登记');
		console.log(res1.data);

		// 畅游是否绑定 false->未绑定  true->已绑定
		const res2 = await util.getDataFromServersV2('consumer/member/changyou/checkBindStatus', {
			fingerprint: changyou.tonDunObj.fingerprint,
			sessionId: changyou.tonDunObj.sessionId,
			myOrderId: res1.data.myOrderId
		});
		that.setData({
			checkBindStatus: res2.data
		});
		console.log('是否绑定畅游');
		console.log(res2);
	},

	async queryGoods() {
		let that = this;
		// 查询商品
		const res3 = await util.getDataFromServersV2('consumer/member/changyou/queryProducts', {
			myOrderId: that.data.sign.myOrderId,
			pageSize: '10',
			pageNum: '1'
		})
		that.setData({
			queryProducts: res3.data
		});
		console.log("查询商品");
		console.log(res3);
	},

	// 立即兑换
	async confirm_exchange(e) {
		let that = this;
		const index = e.currentTarget.dataset.index
		console.log(e.currentTarget.dataset.index);
		// 预下单
		const res7 = await util.getDataFromServersV2('consumer/member/changyou/prepareOrder', {
			myOrderId: that.data.sign.myOrderId,
			couponConfigId: that.data.queryProducts.list[index].id,
			actualPrice: that.data.queryProducts.list[index].goodPoints,
			goodsList: [{
				goodsNo: that.data.queryProducts.list[index].goodsNo,
				goodsNum: 1
			}]
		})
		console.log("预下单");
		console.log(res7);
		wx.navigateTo({
			url: '/pages/moving_integral/confirm_exchange/confirm_exchange',
			success: function(res) {
			    res.eventChannel.emit('boundChangYouData', { 
					prepareOrder: res7.data,
					goodsObj: that.data.queryProducts.list[index],
					queryScores: that.data.queryScores,
					myOrderId: that.data.sign.myOrderId
				})
			}
		});
	},

	// 点击 弹出模态框的 继续 按键
	ruleDescription(e) {
		let that = this;
		if (e.currentTarget.id === 'rule') {
			that.setData({
				authorizePop: true,
				mask: true
			})
		}else if (e.currentTarget.id === 'cancel') {
			this.setData({
				authorizePop: false,
				mask: false
			})
			console.log("点击取消");
		} else {
			this.setData({
				authorizePop: false,
				mask: false
			})
		}
	},

	// 获取验证码 验证等待的时间
	async btnVerificationCode() {
		let that = this
		that.setData({
			timeFlag: true,
			getCode: '重新获取'
		})
		let timeClose = setInterval(function() {
			let num = --that.data.time
			if (num < 0) {
				clearInterval(timeClose)
				return that.setData({
					timeFlag: false,
					time: 60
				})
			}
			that.setData({
				time: num
			})
		}, 1000)
		// 获取绑定验证码
		// const res5 = await util.getDataFromServersV2('consumer/member/changyou/queryBindCode', {
		// 	myOrderId: that.data.sign.myOrderId
		// })
		// that.setData({
		// 	queryBindCode: res5.data
		// })
		console.log("获取绑定验证码");
		// console.log(res5);
	},

	// 验证码的输入
	input_change(e) {
		let that = this;
		that.setData({
			vcValue: e.detail.value
		})
		// 验证码输入第六位后触发
		if (that.data.vcValue.length === 6) {
			this.bindChangYou(that.data.vcValue)
		}
	},

	// 绑定畅游 
	async bindChangYou(vcValue) {
		console.log(vcValue);
		let that = this;
		console.log(that.data.queryBindCode);
		// const res6 = await util.getDataFromServersV2('consumer/member/changyou/bindChangYou', {
		// 	validateToken: that.data.queryBindCode.validateToken,
		// 	myOrderId: that.data.sign.myOrderId,
		// 	token: that.data.queryBindCode.token,
		// 	type: that.data.queryBindCode.type,
		// 	smscode: vcValue
		// })
		console.log("绑定畅游");
		// console.log(res6);
		if (true) {
			util.showToastNoIcon("已绑定畅游")
			// 查询积分
			const res4 = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
				fingerprint: changyou.tonDunObj.fingerprint,
				sessionId: changyou.tonDunObj.sessionId,
				myOrderId: that.data.sign.myOrderId
			});
			that.setData({
				queryScores: res4.data,
				vcValue: ''
			});
			console.log("查询积分");
			console.log(res4);
			// 测试用的
			that.setData({
				authorizePop: false,
				verification_code: false,
				checkBindStatus: true,
				queryScores:{
					cmcc:{
						lmPoints: 800,
						points: 1600
					}
				}
			})
			
		} else {
			util.showToastNoIcon("验证失败")
			// setTimeout(function(){
			// 	util.go('/pages/Home/Home')
			// },1000)
			that.setData({
				vcValue: ''
			})
		}
	},
	
	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {
		// 执行 再次加载 积分查询 和 商品查询
		// setTimeout(this.queryGoods, 0)
		util.showToastNoIcon("已刷新")
	},
	
	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {
		let that = this;
		if (that.data.mask || !that.data.checkBindStatus) {
			return
		}
		util.showToastNoIcon("亲，已到底了")
	},
})
