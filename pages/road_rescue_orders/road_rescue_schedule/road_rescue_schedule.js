const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        applyInfo: undefined, // 进度数据
        orderId: '',
        applyId: '' // 道路救援申请id
    },

    onLoad (options) {
        this.setData({orderId: options.orderId,applyId: options.applyId});
    },

    onShow () {
        if (this.data.applyId) {
            this.getApplyInfo(this.data.applyId);
        } else {
            this.getOrderInfo();
        }
    },
    // 获取订单信息
    async getOrderInfo () {
        const result = await util.getDataFromServersV2('consumer/order/single-road-rescue', {orderId: this.data.orderId},'POST',true);
		if (!result) return;
		if (result.code === 0) {
            this.getApplyInfo(result.data.applyId);
		} else {
			util.showToastNoIcon(result.message);
		}
    },

    // 获取申请进度以及申请信息
    async getApplyInfo (obj) {
        const result = await util.getDataFromServersV2('consumer/order/road-rescue/schedule', {id: obj},'POST',true);
		if (!result) return;
		if (result.code === 0) {
            this.setData({applyInfo: result.data});
		} else {
			util.showToastNoIcon(result.message);
		}
    },

    // 道路救援申请请页
    goReceive () {
        util.go(`/pages/road_rescue_orders/road_rescue_subscribe/road_rescue_subscribe?orderId=${this.data.orderId}`);
    },
    // 返回首页
    goHome () {
        wx.switchTab({
            url: '/pages/Home/Home'
        });
    }
});
