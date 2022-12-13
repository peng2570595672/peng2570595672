const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		details: {
			type: Object,
			value: {}
		},
		isSelected: {
			type: Boolean,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false,
		viewObjId: undefined,
		parkingTicket: [],
		trafficTicket: [],
		parkingTicketCount: undefined,
		trafficTicketCount: undefined,
		trafficTicketMoney: undefined,
		parkingTicketMoney: undefined,
		parkingTicketValidityDay: undefined,
		trafficTicketValidityDay: undefined
	},
	methods: {
		// 显示或者隐藏
		switchDisplay: async function (isShow) {
			if (isShow) {
				if (this.data.viewObjId !== this.data.details.id) {
					this.setData({
						viewObjId: this.data.details.id,
						tabIndex: 0
					});
					await this.getPackageRelation();
				} else {
					// 之前已经加载了数据 不再进行加载
					this.setData({
						mask: true,
						wrapper: true
					});
				}
			} else {
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						mask: false
					});
				}, 400);
			}
		},
		getPackageRelation: async function () {
			const result = await util.getDataFromServersV2('consumer/voucher/rights/get-package-coupon-list-buy', {
				packageId: this.data.details.id
			});
			if (!result) return;
			if (result.code === 0) {
				// 测试数据
				// result.data = [
				// 	{
				// 		consumptionThreshold: 500,
				// 		couponCount: 15,
				// 		couponType: 1,
				// 		denomination: 1000,
				// 		validityDay: 50,
				// 		addTime: '2021-01-03 14:10:42'
				// 	},
				// 	{
				// 		consumptionThreshold: 3000,
				// 		couponCount: 15,
				// 		couponType: 1,
				// 		denomination: 5000,
				// 		validityDay: 30,
				// 		addTime: '2020-02-03 14:10:42'
				// 	},
				// 	{
				// 		consumptionThreshold: 1500,
				// 		couponCount: 8,
				// 		couponType: 1,
				// 		denomination: 2000,
				// 		validityDay: 10,
				// 		addTime: '2019-02-03 14:10:42'
				// 	},
				// 	{
				// 		consumptionThreshold: 1500,
				// 		couponCount: 8,
				// 		couponType: 1,
				// 		denomination: 3000,
				// 		validityDay: 10,
				// 		addTime: '2021-02-03 14:10:42'
				// 	},

				// 	{
				// 		consumptionThreshold: 500,
				// 		couponCount: 15,
				// 		couponType: 2,
				// 		denomination: 1000,
				// 		validityDay: 10,
				// 		addTime: '2021-02-03 14:10:45'
				// 	},
				// 	{
				// 		consumptionThreshold: 5000,
				// 		couponCount: 7,
				// 		couponType: 2,
				// 		denomination: 6000,
				// 		validityDay: 90,
				// 		addTime: '2021-02-03 14:10:42'
				// 	},
				// 	{
				// 		consumptionThreshold: 8000,
				// 		couponCount: 3,
				// 		couponType: 2,
				// 		denomination: 10000,
				// 		validityDay: 15,
				// 		addTime: '2021-02-03 14:10:43'
				// 	}
				// ];
				const trafficTicket = result.data.filter(item => item.couponType === 1);
				const parkingTicket = result.data.filter(item => item.couponType === 2);
				let trafficTicketNum = 0;
				let parkingTicketNum = 0;
				let trafficTicketMoney = 0;
				let parkingTicketMoney = 0;
				let trafficTicketTime = trafficTicket[0].addTime;
				let parkingTicketTime = parkingTicket[0].addTime;
				let parkingTicketValidityDay = parkingTicket[0].validityDay;
				let trafficTicketValidityDay = trafficTicket[0].validityDay;
				trafficTicket.map(item => {
					trafficTicketNum += item.couponCount;
					trafficTicketMoney += item.couponCount * item.denomination;
					if (trafficTicket.length === 1) {
						trafficTicketValidityDay = item.validityDay;
					} else {
						if (util.timeComparison(trafficTicketTime,item.addTime) === 2) {
							trafficTicketTime = item.addTime;
							trafficTicketValidityDay = item.validityDay;
						}
					}
				});
				parkingTicket.map(item => {
					parkingTicketNum += item.couponCount;
					parkingTicketMoney += item.couponCount * item.denomination;
					if (parkingTicket.length === 1) {
						parkingTicketValidityDay = item.validityDay;
					} else {
						if (util.timeComparison(parkingTicketTime,item.addTime) === 2) {
							parkingTicketTime = item.addTime;
							parkingTicketValidityDay = item.validityDay;
						}
					}
				});
				this.setData({
					trafficTicket,
					parkingTicket,
					mask: true,
					wrapper: true,
					trafficTicketCount: trafficTicketNum,
					parkingTicketCount: parkingTicketNum,
					parkingTicketMoney,
					trafficTicketMoney,
					parkingTicketValidityDay,
					trafficTicketValidityDay
				});
			} else {
				util.showToastNoIcon(result.message);
			}
		},
		// 点击半透明层
		onClickHandle () {
			this.triggerEvent('onClickHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {},
		// 立即选择
		onClickChoice () {
			this.triggerEvent('onClickDetailsHandle', {
				isSelected: this.data.isSelected
			});
		}
	}
});
