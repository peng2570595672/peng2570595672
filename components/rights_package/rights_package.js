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
			this.setData({
				parkingTicket: [],
				trafficTicket: []
			});
			const result = await util.getDataFromServersV2('consumer/voucher/rights/get-package-coupon-list-buy', {
				packageId: this.data.details.id
			});
			if (!result) return;
			if (result.code === 0) {
				const trafficTicket = result.data.filter(item => item.couponType === 1);
				const parkingTicket = result.data.filter(item => item.couponType === 2);
				let trafficTicketNum = 0;
				let parkingTicketNum = 0;
				let trafficTicketMoney = 0;
				let parkingTicketMoney = 0;
				if (trafficTicket.length > 0) {
					let trafficTicketTime = trafficTicket[0].addTime;
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
					this.setData({
						trafficTicket,
						trafficTicketCount: trafficTicketNum,
						trafficTicketMoney,
						trafficTicketValidityDay
					});
				}
				if (parkingTicket.length > 0) {
					let parkingTicketTime = parkingTicket[0].addTime;
					let parkingTicketValidityDay = parkingTicket[0].validityDay;
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
