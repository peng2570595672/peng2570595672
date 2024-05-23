const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        available: true,
        orderId: '', // 订单ID
        status: 1, // 活动状态
        activityId: '', // 活动ID
        wxPhone: '',
        obuCardType: undefined,
        vehPlates: '',
        obuStatus: undefined
    },
    onLoad (options) {
        this.setData({
            wxPhone: app.globalData.mobilePhone,
            orderId: app.globalData.orderInfo.orderId,
            obuCardType: options.obuCardType,
            shopId: options.shopId,
            vehPlates: options.vehPlates,
            obuStatus: options.obuStatus
        });
        this.queryApi();
    },
    onShow () {

    },
    async btnFunc () {
        let that = this;
        if (that.data.status === 1) {
            that.selectComponent('#cdPopup').show({
                isBtnClose: false,
                argObj: {
                    type: 'cheEBao',
                    title: '办理产品',
                    wxPhone: this.data.wxPhone,
                    btnText: '确定办理',
                    callback: async (code,key) => {
                        that.setData({status: 2,available: false});
                        await that.activeHandleApi(code,key);
                    }
                }
            });
        } else if (that.data.status === 2) {
            this.queryApi();
        } else { // 去激活
            app.globalData.orderInfo.orderId = this.data.orderId;
            const result = await util.getDataFromServersV2('consumer/order/order-detail', {
                orderId: this.data.orderId
            });
            let res = await util.getDataFromServersV2('consumer/order/common/get-member-by-carno', {
                carNo: result.data.vehPlates,
                vehColor: result.data.vehColor
            });
            let qtLimit = '';
            if (obj.obuCardType === 4) {
                qtLimit = JSON.stringify(res.data.qtLimit);
            }
            wx.setStorageSync('baseInfo', {
                orderId: this.data.orderId,
                mobilePhone: this.data.wxPhone,
                channel: this.data.obuCardType,
                qtLimit: qtLimit, // 青通卡激活所需
                serverId: this.data.shopId,
                carNoStr: this.data.vehPlates,
                obuStatus: this.data.obuStatus
            });
            switch (obj.obuCardType) {
                case 1: // 贵州 黔通卡
                case 21:
                    util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${obj.auditStatus}`);
                    break;
                case 2: // 内蒙 蒙通卡
                case 23: // 河北交投
                    if (!this.data.choiceEquipment) {
                        this.setData({
                            choiceEquipment: this.selectComponent('#choiceEquipment')
                        });
                    }
                    this.data.choiceEquipment.switchDisplay(true);
                    break;
                case 3: // 山东 鲁通卡
                case 9: // 山东 齐鲁通卡
                    util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${obj.auditStatus}`);
                    break;
                case 4: // 青海 青通卡
                case 5: // 天津 速通卡
                case 10: // 湖南 湘通卡
                    util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${obj.obuCardType}`);
                    break;
                case 8: // 辽宁 辽通卡
                    util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${obj.auditStatus}`);
                    break;
            }
        }
    },
    onClickTranslucentHandle () {
        this.data.choiceEquipment.switchDisplay(false);
    },
    // 活动办理接口
    async activeHandleApi (code,key) {
        util.showLoading({title: '办理中...'});
        const result = await util.getDataFromServersV2('/consumer/voucher/rights/recharge/hsh/car-protect-sendOrderActivity', {
            mobilePhone: this.data.wxPhone,
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
            this.setData({status: 1,available: true});
            util.showToastNoIcon(result.message);
        }
    },
    // 查询接口
    async queryApi () {
        util.showLoading({title: '查询中,请稍等...'});
        let that = this;
        const result = await util.getDataFromServersV2('/consumer/voucher/rights/recharge/hsh/car-protect-queryOrderActivity', {
            activityId: that.data.activityId,
            orderId: this.data.orderId
        },'POST',true);
        if (!result) return;
        if (result.code === 0) {
            wx.hideLoading();
            if (!result.data.status) {
                util.showToastNoIcon('存在该订单，且该订单办理成功');
                that.setData({status: 3,available: true});
            } else if (result.data.status === 1) {
                that.setData({status: 2,available: false});
                util.showToastNoIcon('存在该订单，该订单办理中');
            } else if (result.data.status === 2) {
                that.setData({status: 2,available: false});
                util.showToastNoIcon('查询失败，稍后重试');
            } else if (result.data.status === 3) {
                util.showToastNoIcon('存在该订单但该订单办理失败');
                that.setData({status: 1,available: true});
            } else {
                util.showToastNoIcon('不存在该订单');
                that.setData({status: 1,available: true});
            }
        } else {
            wx.hideLoading();
            that.setData({status: 1,available: true});
            util.showToastNoIcon(result.message);
        }
    },
    onUnload () {

    }
});
