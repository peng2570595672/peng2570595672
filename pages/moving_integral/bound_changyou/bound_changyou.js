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
		moving_integral: 1488, //移动积分
		chang_you_integral: 0, //畅游积分

		checkBindStatus: '', //畅游是否绑定
		mask: false, //控制遮罩层的显示隐藏
		movingIntegralControl: false, //控制规则说明弹窗的显示隐藏
		verification_code: false, //控制验证码弹窗的显示隐藏

		queryProducts: null, //商品列表
		sign: {}, //登记信息
		queryScores: null,	//用户积分信息


		arr1: {
			title: '您即将授权当前手机号使用中国移动账户登录上海分互链信息技术有限公司所有的“分互链积分平台”，如果您无法认同如下内容，请您点击“取消”并拒绝授权。如您点击“继续”：',
			text1: '1、即视为您同意和授权中国移动向上海分互链信息技术有限公司提供账户数据接口以使上海分互链信息技术有限公司可以调用您在中国移动网站(www.10086.cn)的注册账户的登录信息，便于您直接使用您在中国移动网站的注册信息登录“分互链积分平台”。',
			text2: '2、即视为您同意及授权（1）上海分互链信息技术有限公司通过数据接口实时读取您在中国移动的消费积分的剩余数量，以完成兑换畅由积分、集分宝或其他积分权益；（2）上海分互链信息技术有限公司将您在中国移动的消费积分的剩余数量，共享给小程序页面运营方世纪恒通科技股份限公司，用于为您在页面显示剩余积分数量。',
			text3: '3、表明您已明确知晓上海分互链信息技术有限公司及“分互链积分平台”并非中国移动的关联公司或由中国移动运营，您使用“分互链积分平台”或上海分互链信息技术有限公司提供的其他服务的行为均与中国移动无关，您也不能就使用中国移动网站注册信息登录及使用“分互链积分平台”的后果要求中国移动承担任何责任。',
			text4: '4、中国移动郑重提醒您保管好您在中国移动网站的注册登录信息，切勿向任何人透露您的账号、密码等相关信息。除非得到您的同意及授权，中国移动不会向任何第三方透露您的任何信息。',
		},
		vcValue: '', //验证码弹窗输入的值
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		let that = this;
		that.loginCall()
	},
	onReady() {
		
	},
	onShow() {
		
	},

	// onLogin doing
	async loginCall() {
		let that = this;
		// 登记接口 获取 myOrderId
		const res1 = await util.getDataFromServersV2('consumer/member/changyou/sign');
		that.setData({
			sign: res1.data
		});
		console.log(res1.data);
		
		// 畅游是否绑定 false->未绑定  true->已绑定
		const res2 = await util.getDataFromServersV2('consumer/member/changyou/checkBindStatus', {
			fingerprint: changyou.tonDunObj.fingerprint,
			sessionId: changyou.tonDunObj.sessionId,
			myOrderId: res1.data.myOrderId
		});
		that.setData({
			checkBindStatus: res2.data,
		});
		console.log(res2);
		
		// 查询积分
		const res3 = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
			fingerprint: changyou.tonDunObj.fingerprint,
			sessionId: changyou.tonDunObj.sessionId,
			myOrderId: res1.data.myOrderId
		});
		that.setData({
			queryScores: res3.data
		});
		console.log(res3);
		// 查询商品
		const res4 = await util.getDataFromServersV2('consumer/member/changyou/queryProducts', {
			myOrderId: that.data.sign.myOrderId,
			pageSize: '10',
			pageNum: '1'
		})
		that.setData({
			queryProducts: res4.data
		});
		console.log(res4);
		console.log(this.data.queryProducts);
		
	},
	
	


	// 立即兑换
	async confirm_exchange(e) {
		console.log(e.currentTarget.dataset.index);
		changyou.tonDunObj.goodsListNum = e.currentTarget.dataset.index
		await changyou.changYouApi('prepareOrder')
		util.go('/pages/moving_integral/confirm_exchange/confirm_exchange')
		console.log("点击确认");
	},

	// 点击 弹出模态框的 继续 按键
	btnMovingIntegral(e) {
		if (e.currentTarget.id === 'cancel') {
			this.setData({
				movingIntegralControl: false,
				mask: false,
			})
			console.log("点击取消");
		} else {
			this.setData({
				movingIntegralControl: false,
				mask: true,
			})
		}
	},

	// 验证码的输入
	input_change(e) {
		let that = this;
		that.setData({
			vcValue: e.detail.value
		})
		if (that.data.vcValue.length === 6) {
			// 验证码输入第六位后触发
			changyou.tonDunObj.smscode = that.data.vcValue
			console.log(changyou.tonDunObj.smscode);
			// 绑定畅游 
			console.log("=============================================");
			if (!changyou.changYouApi('bindChangYou').data) {
				// 已绑定 畅游积分
				util.go("/pages/moving_integral/bound_changyou/bound_changyou")
				util.showToastNoIcon("绑定畅游")
			} else {
				util.showToastNoIcon("验证失败")
			}
		}
	},
	// 获取验证码 验证等待的时间
	btnVerificationCode() {
		let that = this
		that.setData({
			timeFlag: true,
			getCode: '重新获取'
		})
		// 获取绑定验证码 有请求数量限制 一天5次
		// const res = changyou.changYouApi('getVerificationCode')
		// console.log(res);
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
	}
})
