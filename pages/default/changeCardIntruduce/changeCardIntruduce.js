// pages/default/changeCardIntruduce/changeCardIntruduce.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        available: true,
        once: true, // 接口开关
        listOfHistoricalList: [], // 申请记录
        nmOrderList: [] // 存放蒙通卡已激活订单
    },

    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad (options) {
        // let nmOrderList = app.globalData?.myEtcList?.filter(item => item.obuCardType === 2 && (item.obuStatus === 1 || item.obuStatus === 5));
        // if (nmOrderList) {
        //     this.setData({
        //         nmOrderList
        //     });
        // }
        if (!app.globalData.userInfo.accessToken) {
            this.login();
        } else {
            await this.getAListOfExchangeRecords();
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
                        util.hideLoading();
                        res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
                        this.setData({
                            loginInfo: res.data
                        });
                        // 已经绑定了手机号
                        if (res.data.needBindingPhone !== 1) {
                            app.globalData.userInfo = res.data;
                            app.globalData.openId = res.data.openId;
                            app.globalData.memberId = res.data.memberId;
                            app.globalData.mobilePhone = res.data.mobilePhone;
                        } else {
                            util.hideLoading();
                        }
                        await this.getAListOfExchangeRecords();
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
    async validateCar () {
        // 判断是否存在未完成的换牌申请
        await this.IsAnActivationOrder();// 查询已激活订单数量
        await this.getAMontonkaOrder();
    },
    viewHistory () {
        // 申请记录页面
        let url = 'swapRecord';
        util.go(`/pages/default/${url}/${url}`);
    },
    //  校验蒙通卡订单
    async getAMontonkaOrder (oldVehPlates, newVehPlates) {
        if (!this.data.nmOrderList.length) {
            util.showToastNoIcon('该功能仅限内蒙高速卡种使用');
            return;
        }
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
            if (result.data.verify) {
                if (this.data.nmOrderList.length === 1 && this.data.once) {
                    // 查询该车牌是否欠费
                    this.setData({
                        once: false // 一条订单差欠费 控制只查一次 // 防止递归
                    });
                    await this.getAMontonkaOrder(this.data.nmOrderList[0].vehPlates, '');
                } else {
                    util.go(`/pages/default/changeCarAndCard/changeCarAndCard`);
                }
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
        } else if (result.code === 104) {
            this.selectComponent('#popTipComp').show({
                type: 'shenfenyanzhifail',
                title: '提示',
                btnCancel: '好的',
                refundStatus: true,
                content: result.message,
                bgColor: 'rgba(0,0,0, 0.6)'
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 获取换牌申请记录列表
    async getAListOfExchangeRecords () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getList', {
        });
        if (!result) return;
        if (result.code === 0) {
            if (result.data) {
                this.setData({
                    listOfHistoricalList: result.data
                });
            }
        } else {
            util.showToastNoIcon(result.message);
        }
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
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {
        this.setData({
            once: true // 一条订单差欠费 控制只查一次 // 防止递归
        });
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage () {

    }
});
