const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		details: {
			type: Object,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false,
		viewObjId: undefined,
		parkingTicket: [],
		trafficTicket: []
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
				const trafficTicket = result.data.filter(item => item.couponType === 1);
				const parkingTicket = result.data.filter(item => item.couponType === 2);
				this.setData({
					trafficTicket,
					parkingTicket,
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
		onClickCatchHandle () {
		},
		// 立即选择
		onClickChoice () {
			this.triggerEvent('onClickDetailsHandle');
		}
	}
});
