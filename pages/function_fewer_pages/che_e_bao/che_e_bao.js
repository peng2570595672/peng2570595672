// pages/function_fewer_pages/che_e_bao/che_e_bao.js
Page({

    data: {
        available: true,
        orderId: '', // 订单ID
        status: 1, // 活动状态
        activityId: '' // 活动ID
    },
    onLoad (options) {
        this.setData({orderId: options.orderId});
    },
    onShow () {

    },
    btnFunc () {
        let that = this;
        if (that.data.status === 1) {
            that.selectComponent('#cdPopup').show({
                isBtnClose: false,
                argObj: {
                    type: 'cheEBao',
                    title: '办理产品',
                    wxPhone: app.globalData.mobilePhone,
                    btnText: '确定办理',
                    callback: async (code,key) => {
                        console.log('hahaha',code,key);
                        that.setData({status: 2,available: false});
                        // await that.activeHandleApi(code,key);
                    }
                }
            });
        } else if (that.data.status === 2) {
            // this.queryApi();
        } else { // 去激活
            util.go(``);
        }
    },
    // 活动办理接口
    async activeHandleApi (code,key) {
        util.showLoading({title: '办理中...'});
        const result = await util.getDataFromServersV2('/consumer/voucher/rights/recharge/hsh/car-protect-sendOrderActivity', {
            mobilePhone: app.globalData.mobilePhone,
            orderId: this.data.orderId,
            key: key,
            code: code
        },'POST',true);
        if (!result) return;
        if (result.code === 0) {
            this.setData({activityId: result.data.activityId});
            this.queryApi();
            wx.hideLoading();
        } else {
            wx.hideLoading();
            util.showToastNoIcon(result.message);
        }
    },
    // 查询接口
    async queryApi () {
        util.showLoading({title: '查询中,请稍等...'});
        const result = await util.getDataFromServersV2('', {
            activityId: this.data.activityId
        },'POST',true);
        if (!result) return;
        if (result.code === 0) {
            that.setData({status: 3});
            wx.hideLoading();
        } else {
            wx.hideLoading();
            util.showToastNoIcon(result.message);
        }
    },
    onUnload () {

    }
});
