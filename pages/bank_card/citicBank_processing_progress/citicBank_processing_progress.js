const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        transactScheduleData: undefined	// 中信银行信用卡申请进度查询结果
    },

    async onLoad (options) {
        console.log(options);
        await this.query(options.orderId);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    },
    // 中信银行信用卡申请进度查询
    async query (orderId) {
        const result = await util.getDataFromServersV2('consumer/order/zx/transact-schedule', {
			orderId: orderId
		});
		if (!result) return;
		if (result.code === 0) {
			console.log(result);
            this.setData({
                transactScheduleData: result.data[0]
            });
		} else {
			util.showToastNoIcon(result.message);
		}
    }

});
