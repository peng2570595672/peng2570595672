/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
	},
	onClickHandle () {
		util.go('/pages/truck_handling/truck_receiving_address/truck_receiving_address');
	},
	onclickDetail () {
		this.selectComponent('#passTheDiscount').show();
	}
});
