const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: undefined,
		refundDetails: undefined,
		open: true,
		activeIndex: -1,
		isComplaintDetails: true,
		entrance: true,// 是否是从账单详情进入 true 是  false 从通行手续费详情进入
		problemList: [
			{open: false, title: 'Q：ETC车道与人工车道收费不一样？',content: `
				A：通常来说，ETC通行费用会比人工通道收费较低，但如果出现ETC通行账单于人工车道收费不一致，可能是一下两种原因。
				① 【ETC通行打折计费】ETC通行各省份拥有不同的政策优惠，除此之外ETC通行费金额按照“四舍五不入”再打折的方式收费，及收费金额尾数小于0.5元时舍去，但对于大于0.5元的部分不入位计费，而人工收费按照“四舍五入”的方式收取费用。所以收费标准不一致，但通常不会出现ETC收费大于人工收费的情况；
				② 【分段计费】如果您的发现ETC费用大于人工通道分的费用，很有可能是因为ETC分段计费。自2020年1月1日起，各省高速实行新的计费方式-分段计费，该方式不再只按照出入站进行计费。而根据您通行的实际路段进行扣费，可能会高于人工收费。
			`},
			{open: false, title: 'Q:我在家休息，没开车，收到了扣款通知。',content: `
				A：因为您的ETC通行是先通行后付费的方式，您在家休息或没开车时收到的账单，可能是您近期通行的账单。我们在账单详情中为您列出了该笔账单出入站名称、出入站时间来协助您回忆您的通行记录。
			`},
			{open: false, title: 'Q:为什么我的银行卡里有钱，但是还是扣费失败了？',content: `
				A：如果您银行卡里有余额，但扣款失败。通常有以下几种可能，供您参考
				① 账户有余额，但余额小于您账单的费用时会因为余额不足导致扣款失败；
				② 账户有余额，且余额大于账单费用。
				a. 可能是您通行账单笔数超过微信支付扣款限额的次数，导致您扣款失败；
				b. 可能您的账单大于微信免密支付的金额，免密扣费失败。需要您手动进行补缴；
				c. 可能您的账单扣款限额超过了微信或银行允许的日（或年）的扣款限额，需要您联系微信升级您的支付账户或联系您绑定扣款的银行，提升您银行卡的支付限额。
			`}
		]
	},
	async onLoad (options) {
		let details = JSON.parse(options.details);
		if (details?.channelTips?.tips1) {
			details.channelTips.tips1 = details.channelTips.tips1.split('，');
			details.channelTips.tips2 = details.channelTips.tips2.replace('/', '或');
		}
		this.setData({
			details,
			refundDetails: JSON.parse(options.refundDetails),
			entrance: +options.entrance === 1
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onclickMoreProblem () {
		util.go(`/pages/personal_center/order_answer/order_answer?details=${JSON.stringify(this.data.details)}`);
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
