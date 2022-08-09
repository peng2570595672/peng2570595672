// pages/moving_integral/unbound_changyou/unbound_changyou.js
// const util = require('../../utils/util.js');
import { mobilePhoneReplace} from '../../../utils/util'
const app = getApp();
Page({
	data: {
		phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), //电话号码 隐藏号码的中间四位
		moving_integral: '_', //移动积分
		movingIntegralControl: false, //控制授权弹窗显示/隐藏
		mask: true, //控制遮慕显示/隐藏
		verification_code: true, //控制验证码弹窗显示/隐藏
		btn_off: false,
		arr1: {
			title: '您即将授权当前手机号使用中国移动账户登录上海分互链信息技术有限公司所有的“分互链积分平台”，如果您无法认同如下内容，请您点击“取消”并拒绝授权。如您点击“继续”：',
			text1: '1、即视为您同意和授权中国移动向上海分互链信息技术有限公司提供账户数据接口以使上海分互链信息技术有限公司可以调用您在中国移动网站(www.10086.cn)的注册账户的登录信息，便于您直接使用您在中国移动网站的注册信息登录“分互链积分平台”。',
			text2: '2、即视为您同意及授权（1）上海分互链信息技术有限公司通过数据接口实时读取您在中国移动的消费积分的剩余数量，以完成兑换畅由积分、集分宝或其他积分权益；（2）上海分互链信息技术有限公司将您在中国移动的消费积分的剩余数量，共享给小程序页面运营方世纪恒通科技股份限公司，用于为您在页面显示剩余积分数量。',
			text3: '3、表明您已明确知晓上海分互链信息技术有限公司及“分互链积分平台”并非中国移动的关联公司或由中国移动运营，您使用“分互链积分平台”或上海分互链信息技术有限公司提供的其他服务的行为均与中国移动无关，您也不能就使用中国移动网站注册信息登录及使用“分互链积分平台”的后果要求中国移动承担任何责任。',
			text4: '4、中国移动郑重提醒您保管好您在中国移动网站的注册登录信息，切勿向任何人透露您的账号、密码等相关信息。除非得到您的同意及授权，中国移动不会向任何第三方透露您的任何信息。',
		},
		get_code: '获取验证码',
		vc_value: "", //输入框的值
		set_time_out: 60,
		
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		
	},


	// 获取验证码
	btn_verification_code() {
		let time = setInterval(function() {
			let dd = --this.data.set_time_out
			if (dd === 0) {
				this.setData({
					set_time_out: 60,
					time_flag: false,
					get_code: '获取验证码'
				})
				clearInterval(time)
			}
			this.setData({
				set_time_out: dd
			})
		}, 1000)
		this.setData({
			get_code: '重新获取',
			time_flag: true
		})
	},
	// 验证码的输入
	input_change(e) {
		let that = this;
		let str = "";
		that.setData({
			vc_value: e.detail.value
		})
		if (that.data.vc_value.length === 6) {
			// 验证码输入第六位后触发
			console.log("dsadsad");
		}
	},
	// 测试 点击 规则说明
	btn() {
		this.setData({
			movingIntegralControl: true,
			mask: true
		})
	},
	// 点击 弹出模态框的 继续 按键
	btnMovingIntegral(e) {
		if (e.currentTarget.id === 'cancel') {
			this.setData({
				movingIntegralControl: false,
				mask: false,
				verification_code: false
			})
			console.log("点击取消");
		} else {
			this.setData({
				movingIntegralControl: false,
				mask: true,
				verification_code: true,
				btn_off: true
			})
			// 已绑定 畅游积分
			// wx.navigateTo({
			// 	url: "/pages/moving_integral/bound_changyou/bound_changyou"
			// })
		}
	},

	// 点击关闭遮慕层·
	btn_off() {
		this.setData({
			movingIntegralControl: false,
			mask: false,
			verification_code: false,
			btn_off: false
		})
	}

})
