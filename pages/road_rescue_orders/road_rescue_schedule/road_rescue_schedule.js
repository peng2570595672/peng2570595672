// pages/road_rescue_orders/road_rescue_schedule/road_rescue_schedule.js
Page({

    data: {
        applyInfo: {}, // 进度数据
        orderId: ''
    },

    onLoad (options) {
        this.setData({orderId: options.orderId});
    },

    onShow () {
        this.getApplyInfo();
    },

    // 获取申请进度以及申请信息
    async getApplyInfo () {
        // let applyInfo = {
        //     applyNo: '432432432432',// 申请补贴流水号
        //     roadRescueNo: '657657657575',// 领取流水号
        //     applyStatus: 3,// 申请补贴状态(0:待申请;1:审核中;2:已通过;3:未通过;)
        //     applyUpdatTime: '2023-01-24 12:23:22',// 补贴状态更新时间
        //     remark: '信息有误',// 未通过原因
        //     receiveTime: '',// 补贴领取时间
        //     applyInfoObj: {
        //         rescueTime: '2023-01-23 16:23:22',// 呼叫救援时间
        //         receiveName: '雨林',// 收款人姓名
        //         bankNo: '3243243432432432',// 卡号
        //         rescueMoney: 500 // 金额(分)
        //     }
        // };
        const result = await util.getDataFromServersV2('consumer/order/road-rescue/schedule', {orderId: this.data.orderId},'POST',true);
		if (!result) return;
		if (result.code === 0) {
            this.setData({applyInfo: result.data});
		} else {
			util.showToastNoIcon(result.message);
		}
    },

    // 道路救援申请请页
    goReceive () {
        util.go(`/pages/road_rescue_orders/road_rescue_subscribe/road_rescue_subscribe?orderId=${this.data.roadRescueList.orderId}`);
    }
});
