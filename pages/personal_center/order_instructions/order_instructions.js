const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: '',
		isComplaintDetails: true,
		arrearsInstructionsList: [
			{ title: '1.为什么产生违约金？',content: '用户车辆产生高速通行费且扣费失败时，我司将垫付该笔通行费至发卡方高速集团以保证用户的能够正常通行。若该笔通行费在首次扣费失败的次日0点起15日内未补扣成功或用户没有主动补缴这笔通行费，第16日起我司会额外向用户收取违约金。' },
			{title: '2.违约金收取标准是什么？',content: '违约金每日按应付通行费的万分之四进行计算，累计违约金每年不超过通行费的18%。'},
			{title: '3.多久开始计算违约金？',content: '通行费扣费失败的第16个自然日的0点起开始计算。'},
			{title: '4.举例说明：',content: '车辆1月1日通行高速时产生一条为50元通行金额的账单并发起扣款，若扣款失败，24小时期间我司主动对用户的通行扣费账户发起此条欠费账单补扣或用户主动补缴，期间未补扣或未补缴成功，则从1月17日（第16个自然日）0点起按日计算违约金。'}
		]
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
		this.getComplaintDetails();
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
