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
        auditStatus: undefined,
        flag: false,
        vehPlates: '',
        obuStatus: undefined,
        count: 0 // 查询次数
    },
    onLoad (options) {
        this.setData({
            wxPhone: app.globalData.mobilePhone,
            orderId: app.globalData.orderInfo.orderId,
            obuCardType: +options.obuCardType,
            shopId: options.shopId,
            vehPlates: options.vehPlates,
            obuStatus: options.obuStatus,
            auditStatus: options.auditStatus,
            flag: options?.flag ? true : false
        });
        // this.queryApi(1);
    },
    onShow () {

    },
    // testInput (e) {
    //     this.setData({
    //         wxPhone: e.detail.value.substring(0, 11)
    //     });
    // },
    async btnFunc () {
        let that = this;
        if (that.data.status === 1) {
            await this.queryApi(3);
        } else if (that.data.status === 2) {
            this.queryApi(1);
        } else if (that.data.status === 4) { // 辽宁移动线下--去支付
            util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
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
            if (this.data.obuCardType === 4) {
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
            switch (this.data.obuCardType) {
                case 1: // 贵州 黔通卡
                case 21:
                    util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${this.data.auditStatus}`);
                    break;
                case 2: // 内蒙 蒙通卡
                case 23: // 河北交投
                    if (!this.data.choiceEquipment) {
                        this.setData({
                            choiceEquipment: this.selectComponent('#choiceEquipment')
                        });
                    }
                    this.selectComponent('#choiceEquipment').switchDisplay(true);
                    break;
                case 3: // 山东 鲁通卡
                case 9: // 山东 齐鲁通卡
                    util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${this.data.auditStatus}`);
                    break;
                case 4: // 青海 青通卡
                case 5: // 天津 速通卡
                case 10: // 湖南 湘通卡
                    util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${this.data.obuCardType}`);
                    break;
                case 8: // 辽宁 辽通卡
                    util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${this.data.auditStatus}`);
                    break;
            }
        }
    },
    // 拉起弹窗
    pop () {
        let that = this;
        that.selectComponent('#cdPopup').show({
            isBtnClose: false,
            argObj: {
                type: 'cheEBao',
                title: '办理产品',
                wxPhone: this.data.wxPhone,
                btnText: '确定办理',
                callback: async (code,key) => {
                    that.setData({
                        status: 2,
                        available: false
                    });
                    await that.activeHandleApi(code,key);
                }
            }
        });
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
            this.queryApi(2);
            wx.hideLoading();
        } else {
            wx.hideLoading();
            this.setData({status: 1,available: true});
            util.showToastNoIcon(result.message);
        }
    },
    // 查询接口 flag: 1-查询一次，2-查询多次，3-查询一次并调用一次"活动办理接口"
    async queryApi (flag) {
        if (flag === 2) {
            if (this.data.count >= 5) return;
            this.setData({
                count: ++this.data.count
            });
        }
        util.showLoading();
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
                that.setData({status: this.data.flag ? 4 : 3,available: true});
            } else if (result.data.status === 1) {
                that.setData({status: 2,available: false});
                if (flag === 2) {
                    that.queryApi(2);
                } else {
                    util.showToastNoIcon('存在该订单，该订单办理中');
                }
            } else if (result.data.status === 2) {
                that.setData({status: 2,available: false});
                if (flag === 2) {
                    that.queryApi(2);
                } else if (flag === 3) {
                    that.pop(); // 拉起弹窗
                } else {
                    util.showToastNoIcon('查询失败，稍后重试');
                }
            } else {
                that.setData({status: 1,available: true});
                if (flag === 2) {
                    that.queryApi(2);
                } else if (flag === 3) {
                    that.pop(); // 拉起弹窗
                } else {
                    util.showToastNoIcon('不存在该订单');
                }
            }
        } else {
            wx.hideLoading();
            if (flag === 3) {
                that.pop(); // 拉起弹窗
                util.showToastNoIcon(result.message);
                return;
            }
            if (flag === 2) {
                that.queryApi(2);
            }
            util.showToastNoIcon(result.message);
        }
    },
    onUnload () {

    }
});
