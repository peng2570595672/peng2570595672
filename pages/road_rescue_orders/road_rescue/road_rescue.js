const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        loginInfo: undefined, // 登录信息
        roadRescueList: [], // 道路救援订单列表
        isNoData: false // 是否没有数据
    },

    onLoad (options) {

    },

    async onShow () {
        if (app.globalData.userInfo.accessToken) {
            this.getOrderList();
        } else {
            // 公众号进入需要登录
            this.login();
        }
        // 查询是否欠款
        await util.getIsArrearage();
    },

    // 自动登录
    login () {
        util.showLoading();
        // 调用微信接口获取code
        wx.login({
            success: async (res) => {
                const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
                    platformId: app.globalData.platformId, // 平台id
                    code: res.code // 从微信获取的code
                });
                if (result.code === 0) {
                    result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
                    this.setData({
                        loginInfo: result.data
                    });
                    // 已经绑定了手机号
                    if (result.data.needBindingPhone !== 1) {
                        app.globalData.userInfo = result.data;
                        app.globalData.openId = result.data.openId;
                        app.globalData.memberId = result.data.memberId;
                        app.globalData.mobilePhone = result.data.mobilePhone;
                        await this.getOrderList();
                    } else {
                        wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
                        util.go('/pages/login/login/login');
                        util.hideLoading();
                    }
                } else {
                    util.hideLoading();
                    util.showToastNoIcon(result.message);
                }
            },
            fail: () => {
                util.hideLoading();
                util.showToastNoIcon('登录失败！');
            }
        });
    },

    // 获取道路救援订单列表数据
    async getOrderList () {
        const result = await util.getDataFromServersV2('consumer/order/road-resue/order-list', {},'POST',true);
        if (!result) return;
        if (result.code === 0) {
            let roadRescueList = [
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: null,
                    applicationStatus: null,
                    vehPlates: '贵ZQ0101',
                    roadRescueStatus: 0,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 0,
                    applicationStatus: 0,
                    vehPlates: '贵ZQ0102',
                    roadRescueStatus: 1,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 1,
                    applicationStatus: 0,
                    vehPlates: '贵ZQ0103',
                    roadRescueStatus: 2,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 1,
                    applicationStatus: 0,
                    vehPlates: '贵ZQ0104',
                    roadRescueStatus: 3,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 1,
                    applicationStatus: 4,
                    vehPlates: '贵ZQ0105',
                    roadRescueStatus: 4,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 1,
                    applicationStatus: 5,
                    vehPlates: '贵ZQ0106',
                    roadRescueStatus: 5,
                    rescueMoney: 50000,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: 1,
                    applicationStatus: 6,
                    vehPlates: '贵ZQ0107',
                    roadRescueStatus: 6,
                    orderId: '3213231321313'
                },
                {
                    receiveTime: '2023.07.03 12:12:12',// 领取时间
                    expirationTime: '2024.07.03 12:12:12',// 到期时间
                    isReceive: null,
                    applicationStatus: null,
                    vehPlates: '贵ZQ0108',
                    roadRescueStatus: 7,
                    orderId: '3213231321313'
                }
            ];
            roadRescueList = roadRescueList.concat(result.data);
            let isNoData = !result.data || result.data.length === 0;
            this.setData({roadRescueList,isNoData});
        } else {
            util.showToastNoIcon(result.message);
        }
    },

    // 点击“申请补贴” 跳转至 “在线客服”
    btnLoad (e) {
        let item = e.currentTarget.dataset.item;
        let url = '';
        if (item.roadRescueStatus === 1) {
            url = 'road_rescue_receive';
        } else if (item.roadRescueStatus === 2 || item.roadRescueStatus === 3 || item.roadRescueStatus === 7) {
            url = 'road_rescue_detail';
        } else if (item.roadRescueStatus === 4 || item.roadRescueStatus === 5 || item.roadRescueStatus === 6) {
            url = 'road_rescue_schedule';
        }
        util.go(`/pages/road_rescue_orders/${url}/${url}?id=${item.roadId}&applyId=${item.applyId}`);
    }
});
