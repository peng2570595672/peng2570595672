const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		addValueService: {
			type: Object,
			value: {}
		},
		sendMode: {
			type: Number,
			value: 0
		}
	},
	data: {
		parkingTicket: [],
		trafficTicket: [],
		parkingTicketCount: undefined,
		trafficTicketCount: undefined,
		trafficTicketMoney: undefined,
		parkingTicketMoney: undefined,
		parkingTicketValidityDay: undefined,
		trafficTicketValidityDay: undefined
	},
	// 在组建布局完成后执行
	ready () {
		this.getPackageIds();
	},
	methods: {
		async getPackageIds () {
			this.getPackageRelation(this.data.addValueService[0]);
		},

		getPackageRelation: async function (id) {
			this.setData({
				parkingTicket: [],
				trafficTicket: []
			});
			const result = await util.getDataFromServersV2('consumer/voucher/rights/get-package-coupon-list-buy', {
				packageId: id
			},'POST',false);
			if (!result) return;
			if (result.code === 0) {
				// const trafficTicket = result.data.filter(item => item.couponType === 1 || item.couponType === 3);
				// const parkingTicket = result.data.filter(item => item.couponType === 2 || item.couponType === 4);
				const trafficTicket = result.data.filter(item => item.couponType === 1);
				const parkingTicket = result.data.filter(item => item.couponType === 2);
				let trafficTicketNum = 0;
				let parkingTicketNum = 0;
				let trafficTicketMoney = 0;
				let parkingTicketMoney = 0;
				if (trafficTicket.length > 0) {
					let trafficTicketTime = trafficTicket[0].minTime;
					let trafficTicketValidityDay = trafficTicket[0].minDays;
					trafficTicket.map(item => {
						trafficTicketNum += item.periodCount;
						trafficTicketMoney += item.couponCount * item.denomination;
						if (trafficTicket.length === 1) {
							trafficTicketValidityDay = item.minDays;
						} else {
							if (util.timeComparison(trafficTicketTime, item.minTime) === 2) {
								trafficTicketTime = item.minTime;
								trafficTicketValidityDay = item.minDays;
							}
						}
					});
					this.setData({
						trafficTicket,
						trafficTicketCount: trafficTicketNum,
						trafficTicketMoney,
						trafficTicketValidityDay
					});
				}
				if (parkingTicket.length > 0) {
					let parkingTicketTime = parkingTicket[0].minTime;
					let parkingTicketValidityDay = parkingTicket[0].minDays;
					parkingTicket.map(item => {
						parkingTicketNum += item.periodCount;
						parkingTicketMoney += item.couponCount * item.denomination;
						if (parkingTicket.length === 1) {
							parkingTicketValidityDay = item.minDays;
						} else {
							if (util.timeComparison(parkingTicketTime, item.minTime) === 2) {
								parkingTicketTime = item.minTime;
								parkingTicketValidityDay = item.minDays;
							}
						}
					});
					this.setData({
						parkingTicket,
						parkingTicketCount: parkingTicketNum,
						parkingTicketMoney,
						parkingTicketValidityDay
					});
				}
				this.setData({
					mask: true,
					wrapper: true
				});
			} else {
				util.showToastNoIcon(result.message);
			}
		}

	}
});
