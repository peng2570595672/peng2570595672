const app = getApp();
const util = require('../../../utils/util');
Page({
    data: {
        nmOrderList: []
    },
    onLoad () {
        this.IsAnActivationOrder();
    },
    onShow () {
    },
    // 是否存在多个已激活订单
    async IsAnActivationOrder () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getNmgActOrder', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            this.setData({
                // 保存已激活订单 至少有一条
                nmOrderList: result.data
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    //  校验蒙通卡订单
    async getAMontonkaOrder (oldVehPlates, newVehPlates) {
        // 参数：不传检验是否有未完成的换牌申请，
        // oldVehPlates-旧车牌，传了校验是否该车牌有欠费，
        // newVehPlates-传了校验新车牌是否可用
        let params = {};
        if (oldVehPlates) {
            params.oldVehPlates = oldVehPlates;
        }
        if (newVehPlates) {
            params.newVehPlates = newVehPlates;
        }
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/verify', params);
        if (!result) return;
        if (result.code === 0) {
            if (result.data.verify && this.data.nmOrderList[this.data.activeIndex].vehPlates) {
                app.globalData.chooseOrderList = [this.data.nmOrderList[this.data.activeIndex]];
                // 不存在欠费 跳转
                util.go(`/pages/default/changeCarAndCard/changeCarAndCard`);
            } else {
                // 有欠费订单 中断办理
                this.selectComponent('#popTipComp').show({
                    type: 'shenfenyanzhifail',
                    title: '提示',
                    btnCancel: '好的',
                    refundStatus: true,
                    content: result.message,
                    bgColor: 'rgba(0,0,0, 0.6)'
                });
            }
        } else {
            this.selectComponent('#popTipComp').show({
                type: 'shenfenyanzhifail',
                title: '提示',
                btnCancel: '好的',
                refundStatus: true,
                content: result.message,
                bgColor: 'rgba(0,0,0, 0.6)'
            });
        }
    },
    async handleVehicle (e) {
        const index = +e.currentTarget.dataset.index;
        this.setData({
            activeIndex: index
        });
        this.getAMontonkaOrder(this.data.nmOrderList[index].vehPlates);
    }
});
