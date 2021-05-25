const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: undefined,
		refundDetails: undefined,
		open: true,
		activeIndex: -1,
		isComplaintDetails: true,
		problemList: [
			{ open: false, title: '1.为什么产生服务费？', content: '用户车辆产生高速通行费且扣费失败时，我司将垫付该笔通行费至发卡方高速集团以保证用户的能够正常通行。若该笔通行费在首次扣费失败的次日0点起15日内未补扣成功或用户没有主动补缴这笔通行费，第16日起我司会额外向用户收取服务费。' },
			{open: false, title: '2.服务费收取标准是什么？', content: '服务费每日按应付通行费的万分之四进行计算，累计服务费每年不超过通行费的18%。'},
			{open: false, title: '3.多久开始计算服务费？', content: '通行费扣费失败的第16个自然日的0点起开始计算。'},
			{open: false, title: '4.举例说明：', content: '车辆1月1日通行高速时产生一条为50元通行金额的账单并发起扣款，若扣款失败，24小时期间我司主动对用户的通行扣费账户发起此条欠费账单补扣或用户主动补缴，期间未补扣或未补缴成功，则从1月17日（第16个自然日）0点起按日计算服务费。'}
		]
	},
	onLoad (options) {
		let details = JSON.parse(options.details);
		if (details?.channelTips?.tips1) {
			details.channelTips.tips1 = details.channelTips.tips1.split('，');
			details.channelTips.tips2 = details.channelTips.tips2.replace('/', '或');
		}
		this.setData({
			details,
			refundDetails: JSON.parse(options.refundDetails)
		});
	},
	onclickMoreProblem () {
		util.go('/pages/personal_center/order_answer/order_answer');
	},
	callHotLine (e) {
		let model = e.currentTarget.dataset.model;
		console.log(model);
		wx.makePhoneCall({
			phoneNumber: model // 此号码并非真实电话号码，仅用于测试
		});
	},
	onclickProblem (e) {
		let activeIndex = parseInt(e.currentTarget.dataset.index);
		this.data.problemList[activeIndex].open = !this.data.problemList[activeIndex].open;
		this.setData({
			activeIndex,
			problemList: this.data.problemList
		});
	}
});
