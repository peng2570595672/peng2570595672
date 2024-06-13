import {isOpenBluetooth} from '../../../../utils/utils';
const app = getApp();
const util = require('../../../../utils/util.js');
Page({

	data: {
		wrapper: false,
		mask: false,
		baseInfo: undefined
	},

	onLoad (options) {

	},

	onReady () {

	},

	onShow () {

	},

	hide () {
		this.setData({
			wrapper: false
		});
		setTimeout(() => {
			this.setData({
				mask: false
			});
		}, 400);
	},

	async handleActivate () {
		if (!await isOpenBluetooth()) {
			this.setData({
				mask: true,
				wrapper: true
			});
			return;
		}
		util.go(`/pages/after_sales/device_switch_peocess/option_switch/option_switch`);
	}

});
