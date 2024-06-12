// pages/default/terminationAndReSigning/terminationAndReSigning.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        oldVehContractStatus: '',
        newVehContractStatus: '',
        newUpDataStatus: '',
        finishReContract: false // 是否已完成
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
        if (options.id) {
            this.setData({
                id: options.id
            });
        }
        this.queryContract();
    },

    /**
     * 旧车牌的解约
     */
    goAndCancelTheContract () {
        this.selectComponent('#popTipComp').show({
            type: 'oneBtn',
            title: '温馨提示',
            btnconfirm: '我知道了',
            content: '请使用微信搜索微信车主服务公众号，选择车主服务，选择需要解约的车牌并完成解约',
            center: true,
            callBack: () => {
            }
        });
        if (this.data.oldVehContractStatus !== 2 && this.data.oldVehContractStatus !== 0) { // 当前旧车牌待解约
        }
    },
    // 新车牌签约之前
    async weChatSignBefore () {
        if (this.data.oldVehContractStatus === 2 || this.data.oldVehContractStatus === 0) {
            this.weChatSign();
            return;
        }
        this.selectComponent('#popTipComp').show({
            type: 'oneBtn',
            title: '提示',
            btnconfirm: '好的',
            content: '请先完成旧车牌解约操作',
            center: true,
            callBack: () => {
            }
        });
    },
    // 微信签约
    async weChatSign () {
        let params = {
            orderId: app.globalData.orderInfo.orderId, // 订单id
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            needSignContract: true // 是否需要签约 true-是，false-否
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        if (!result) return;
        if (result.code === 0) {
            let res = result.data.contract;
            // 签约车主服务 2.0
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 查询车主新旧车牌订单服务签约
    async queryContract () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/queryApplyContract', {
            id: this.data.id
        });
        if (!result) return;
        if (result.code === 0) {
            app.globalData.signAContract = 3;
            const {oldVehContractStatus,newVehContractStatus,status} = result.data;
            this.setData({
                oldVehContractStatus, // 1 签约状态 ， 0 未签约， 2 解约状态
                newVehContractStatus, // 1 签约状态， 0 未签约， 2 解约状态
                newUpDataStatus: status,
                finishReContract: newVehContractStatus === 1 && (oldVehContractStatus === 2 || oldVehContractStatus === 0) && status === 5
            });
            util.showToastNoIcon('车牌信息已刷新');
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    /**
     * 返回
     */
    finish () {
        if (this.data.finishReContract) {
            this.backPage('swapRecord'); // 返回指定页面
            // this.selectComponent('#popTipComp').show({
            //     type: 'oneBtn',
            //     title: '提示',
            //     btnconfirm: '好的',
            //     content: '请使用微信搜索“内蒙古etc服务”小程序，注册登录后点击卡签重写功能，并按照指引完成ETC设备重写，完成后可在本小程序换牌记录处查看换牌是否成功!如有不解之处，请联系客服4006680996处理!!',
            //     callBack: () => {
            //         this.backPage('changeCardIntruduce');
            //     }
            // });
        }
    },
    /**
     * 生命周期函数--监听页面出现
     */
    onShow () {
        if (app.globalData.signAContract === -1) {
            this.queryContract();
        }
    },
    refresh () { // 回调较慢情况 刷新按钮
        this.queryContract();
    },
    backPage (url) {
        wx.reLaunch({
            url: `/pages/default/${url}/${url}`
          });
    },
    goUpDate () {
        if (this.data.newVehContractStatus !== 1 && this.data.newUpDataStatus !== 5) {
            this.selectComponent('#popTipComp').show({
                type: 'oneBtn',
                title: '温馨提示',
                btnconfirm: '我知道了',
                content: '请先完成新车牌的签约操作',
                center: true,
                callBack: () => {
                }
            });
            return;
        }
        // 重写激活 设备选择页
        util.go('/pages/obu_activate/neimeng_choice/neimeng_choice?obuActive_upDate=true'); // 重写激活引导
    }
});
