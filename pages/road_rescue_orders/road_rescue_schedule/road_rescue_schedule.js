const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        applyInfo: undefined, // 进度数据
        id: '', // roadId
        applyId: '' // 道路救援申请id
    },

    onLoad (options) {
        this.setData({id: options.id,applyId: options.applyId});
    },

    onShow () {
        if (!app.globalData.userInfo.accessToken) {
            this.login();
        } else {
            if (!this.data.applyId) {
                this.getApplyInfo(this.data.applyId);
            } else {
                this.getOrderInfo();
            }
        }
    },
    // 自动登录
    login () {
        util.showLoading();
        // 调用微信接口获取code
        wx.login({
            success: (res) => {
                util.getDataFromServer('consumer/member/common/applet/code', {
                    platformId: app.globalData.platformId, // 平台id
                    code: res.code // 从微信获取的code
                }, () => {
                    util.hideLoading();
                    util.showToastNoIcon('登录失败！');
                }, async (res) => {
                    if (res.code === 0) {
                        res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
                        app.globalData.userInfo = res.data;
                        app.globalData.openId = res.data.openId;
                        app.globalData.memberId = res.data.memberId;
                        app.globalData.mobilePhone = res.data.mobilePhone;
                        if (this.data.applyId) {
                            this.getApplyInfo(this.data.applyId);
                        } else {
                            this.getOrderInfo();
                        }
                    } else {
                        util.hideLoading();
                        util.showToastNoIcon(res.message);
                    }
                });
            },
            fail: () => {
                util.hideLoading();
                util.showToastNoIcon('登录失败！');
            }
        });
    },
    // 获取订单信息
    async getOrderInfo () {
        const result = await util.getDataFromServersV2('consumer/order/single-road-rescue', {id: this.data.id},'POST',true);
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
        util.go(`/pages/road_rescue_orders/road_rescue_subscribe/road_rescue_subscribe?id=${this.data.id}`);
    },
    // 返回首页
    goHome () {
        wx.switchTab({
            url: '/pages/Home/Home'
        });
    }
});
