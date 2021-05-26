const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: '',
		open: true,
		activeIndex: -1,
		isComplaintDetails: true,
		problemList: [
			{open: false, title: 'Q：我为什么只通行了一次，会有很多笔账单呢？',content: `
				A：一次通行，有多笔账单，我们把常见的情况列举在下方，便于您确认核实。
				① 【账单拆分扣款】
				如果您单次的通行金额较大，很可能因为超过微信支付的扣款限制导致您扣费失败，我们系统自动为您的账单拆分为多笔进行扣款。经过拆分的账单，您可以在账单列表显示“拆分扣款”字样，且进入账单详情后点击上方“查看拆分记录”可查看到账单拆分情况。
				②【开放式站点】如果您收到两笔出入口、金额一致，扣费时间间隔较短的账单。可能是开放式站点，此类账单的出入口信息包含有“开放式”字段的描述，或经过桥、机场、停车场等路段。
				③【通行跨省】由于部分省份高速的规定，可能会把一笔完整的通行账单拆分为多笔。
			` },
			{open: false, title: 'Q：ETC车道与人工车道收费不一样？',content: `
				A：通常来说，ETC通行费用会比人工通道收费较低，但如果出现ETC通行账单于人工车道收费不一致，可能是一下两种原因。
				① 【ETC通行打折计费】ETC通行各省份拥有不同的政策优惠，除此之外ETC通行费金额按照“四舍五不入”再打折的方式收费，及收费金额尾数小于0.5元时舍去，但对于大于0.5元的部分不入位计费，而人工收费按照“四舍五入”的方式收取费用。所以收费标准不一致，但通常不会出现ETC收费大于人工收费的情况；
				② 【分段计费】如果您的发现ETC费用大于人工通道分的费用，很有可能是因为ETC分段计费。自2020年1月1日起，各省高速实行新的计费方式-分段计费，该方式不再只按照出入站进行计费。而根据您通行的实际路段进行扣费，可能会高于人工收费。
			`},
			{open: false, title: 'Q:我在家休息，没开车，收到了扣款通知。',content: `
				A：因为您的ETC通行是先通行后付费的方式，您在家休息或没开车时收到的账单，可能是您近期通行的账单。我们在账单详情中为您列出了该笔账单出入站名称、出入站时间来协助您回忆您的通行记录。
			`},
			{open: false, title: 'Q：同一段路我人工缴费了，但是ETC又给我扣费了。',content: `
				A：如果您出现这样的情况，您可以联系在线客服或拨打给您提供的高速客服电话并提供相关证明材料后，高速可以执行退还。
			`},
			{open: false, title: 'Q：出账时间就是我的通行时间吗？',content: `
				A：不是。出账时间是收到您通行账单的时间，与您实际的通行时间并不一致。但您可以通过点击账单，进入账单详情后查看到您该笔账单的出入站时间和出入站扣。
			`},
			{open: false, title: 'Q：我使用了你们的通行券，退款之后优惠券会退还吗？',content: `
				A: 很抱歉，使用了的通行券一经使用不可退还。
			`},
			{open: false, title: 'Q：我使用了停车场使用ETC缴费，我怎么才能看到这个账单。',content: `
				A： 因为目前账单未能提供您的ETC费用是否是停车费，但是您可以通过出入口站信息进行判断。我们也会积极和高速集团沟通，优化扣费内容的展示。
			`},
			{open: false, title: 'Q：我在账单详情里看到了“服务费”，为什么要收取我的服务费。',content: `
				A： 您办理的ETC享受了先通行后付费，当您的通行费欠费后，由我司垫付这笔通行费给高速。若您在欠费后的指定时间内（客车用户为扣款失败第16日，货车用户为扣款失败的当日）仍未缴清的，每日将加收万分之五的服务费。每笔通行费的服务费每年累计金额不超过该通行费金额的18%。为了保证您的正常通行不受影响，请您务必保证您支付账户余额充足。
			`},
			{open: false, title: 'Q：通行手续费是什么？',content: `
				A：通行手续费是对于货车办理的用户，会额外收取您千分之六的通行费。货车用户的通行手续费=通行费x 0.6%。
			`},
			{open: false, title: 'Q:为什么我的银行卡里有钱，但是还是扣费失败了？',content: `
				A：如果您银行卡里有余额，但扣款失败。通常有以下几种可能，供您参考
				① 账户有余额，但余额小于您账单的费用时会因为余额不足导致扣款失败；
				② 账户有余额，且余额大于账单费用。
				a. 可能是您通行账单笔数超过微信支付扣款限额的次数，导致您扣款失败；
				b. 可能您的账单大于微信免密支付的金额，免密扣费失败。需要您手动进行补缴；
				c. 可能您的账单扣款限额超过了微信或银行允许的日（或年）的扣款限额，需要您联系微信升级您的支付账户或联系您绑定扣款的银行，提升您银行卡的支付限额。
			`},
			{open: false, title: 'Q：为什么我账单里面会有部分扣款的字样？',content: `
				A：部分扣款是指高速主动对用户通行费中额外收取的通行费用进行退款。退款金额会原路返还到用户的支付账户。
			`}
		]
	},
	onLoad (options) {
		let details = JSON.parse(options.details);
		if (details.channelTips.tips1) {
			details.channelTips.tips1 = details.channelTips.tips1.split('，');
		}
		this.setData({
			details: details
		});
		this.getComplaintDetails();
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
	},
	// 通过账单id获取账单申诉详情
	getComplaintDetails () {
		util.showLoading();
		let params = {
			billId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/get-bill-complain-by-bill-id', params, () => {
			util.showToastNoIcon('获取账单申诉详情失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					isComplaintDetails: res.data ? true : false
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去申诉
	go () {
		if (this.data.isComplaintDetails) {
			let model = this.data.details;
			util.go(`/pages/personal_center/complaint_details/complaint_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
		} else {
			util.go('/pages/personal_center/order_complaint/order_complaint?details=' + JSON.stringify(this.data.details));
		}
	}
});
