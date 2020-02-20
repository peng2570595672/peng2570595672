const util = require('../../../utils/util.js');
Page({
	data: {
		details: '',
		arrearsInstructionsList: [
			{ title: '1.为什么产生服务费？',content: '车辆产生高速通行费且扣费失败时，由我司垫付这笔通行费给高速，若此笔通行费在扣费失败的48小时内我司主动补扣未成功或车主未补缴成功这笔通行费，则我司会额外向用户收取服务费。' },
			{title: '2.服务费收取标准是什么？',content: '服务费每日按应付通行费的万分之五进行计算，累计服务费每年不超过通行费的18%。'},
			{title: '3.多久开始计算服务费？',content: '自我司给车辆垫付通行费，48小时内未补扣成功或未补缴成功，第49小时起开始计算服务费。'},
			{title: '4.举例说明：',content: '车辆1月1日通行高速时产生一条为50元通行金额的账单并发起扣款，如扣款失败，从微信支付返回扣款失败时间的次日0时起，48小时期间我司主动对用户的通行扣费账户发起此条欠费账单补扣，或用户主动补缴，若期间未补扣成功或未补缴成功，则从第49小时起按日计算服务费。'}
		]
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
	},
	// 去补缴
	go () {
		util.go('/pages/personal_center/order_complaint/order_complaint?details=' + JSON.stringify(this.data.details));
	}
});
