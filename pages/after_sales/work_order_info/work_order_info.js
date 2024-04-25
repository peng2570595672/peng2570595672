import {wxApi2Promise} from '../../../utils/utils';

const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		afterSaleId: '',
		afterSaleInfo: {}
	},
	onLoad (options) {
		this.setData({
			afterSaleId: options.id
		});
		this.getDetail();
	},
	onShow () {
	},
	async getDetail () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/getById', {
			id: this.data.afterSaleId
		}, 'POST', true);
		result.data.deviceImgList = result.data.deviceImg.split(',');
		this.setData({
			afterSaleInfo: result.data
		});
	},
	handleApply () {
		util.go(`/pages/after_sales/device_logout/device_logout?afterSaleId=${this.data.afterSaleId}`);
	},
	handleCancel () {
		this.selectComponent('#popTipComp').show({
			type: 'tenth',
			title: '提示',
			content: '是否取消工单',
			btnCancel: '取消',
			btnconfirm: '确定',
			btnShadowHide: true,
			params: {
				type: 2
			}
		});
	},
	async handleUrgentProcessing () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/urge', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			util.showToastNoIcon('工单催办成功！');
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async handlePayOrder () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/pay', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			const res = await wxApi2Promise(wx.requestPayment, result.data.extraData, this);
			util.showToastNoIcon('支付成功！');
			this.getDetail();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async onHandle () {
		console.log('取消');
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/cancel', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			util.showToastNoIcon('取消成功！');
			this.getDetail();
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
