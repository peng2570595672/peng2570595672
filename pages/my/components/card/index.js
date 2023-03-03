const app = getApp();
const util = require('../../../../utils/util.js');
Component({
  /**
   * 组件的属性列表
   */
	properties: {
		cardData: {
			type: Object,
			value: {}
		},
		isVip: {
			type: Boolean,
			value: true
		}
	},

  /**
   * 组件的初始数据
   */
  data: {

  },
	observers: {
		'cardData': function (cardData) {
			// console.log('cardData');
			// console.log(cardData);
		}
	},
  /**
   * 组件的方法列表
   */
	methods: {
		handleDetails () {
			console.log(this.data.cardData);
			const info = this.data.cardData;
			// 1-权益账户   2-货车预充值 3-交行 4-工行
			if (info.accountType === 1) {
				util.go(`/pages/account_management/deposit_account_details/deposit_account_details?id=${info.id}`);
			} else if (info.accountType === 2) {
				util.go(`/pages/account_management/precharge_account_details/precharge_account_details?Id=${info.orderId}`);
			} else if (info.accountType === 3) {
				app.globalData.accountChannelInfo = {
					type: 2,
					orderId: info.id,
					money: info.total_amount || 0,
					vehPlates: info.vehPlates || ''
				};
				util.go(`/pages/account_management/bocom_account_details/bocom_account_details`);
			}
		}
	}
});
