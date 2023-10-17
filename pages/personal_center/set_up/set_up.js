const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        content: '为了保障您的权益，我们在此提醒您，您的账号应满足：（1）不存在未了结的权利义务、或任何其他因注销ETC+会员账号（根据平台调整）会产生的纠纷或争议的情况；（2）不存在任何未完结的交易或订单或通行账单；（3）账号下的资产或虚拟权益已结清，包括但不限于任何ETC设备、积分、优惠券、兑换券、卡券余额等任何与ETC+会员账号关联的ETC设备、兑换代码、卡券等，或您自行选择放弃该账号下所有资产或虚拟权益。',
        content1: '如您以确认上述信息无异议，请自行注销。',
        content2: '您当前账号存在未完结的权利义务，包括但不限于注销ETC设备、缴清通行流水费用，请确确认完结后再注销',
        content3: '提交注销申请后，我们将在15个工作日内注销您的所有信息，确认注销吗？'
    },

    async onLoad (options) {
        // 查询是否欠款
        await util.getIsArrearage();
    },
    onShow () {

    },

    // 授权管理
    handleAuth () {
        wx.openSetting({
            success: () => {},
            fail: () => {
                util.showToastNoIcon('打开设置界面失败，请重试！');
            }
        });
    },

    // 注销账号须知
    logOff () {
        this.selectComponent('#popTipComp').show({
            type: 'logOffTip',
            title: '注销账号须知',
            btnCancel: '取消',
            btnconfirm: '继续注销',
            content: this.data.content,
            content1: this.data.content1,
            callBack: () => {
                setTimeout(async () => { await this.orderOperate(); },1000);
            }
        });
    },

    // 查询订单
    async orderOperate () {
        console.log(app.globalData.myEtcList);
        if (app.globalData.myEtcList && app.globalData.myEtcList.length > 0) { // 有订单
            this.pubFunc1(app.globalData.myEtcList);
        } else { // 无订单时，则查询订单列表
            const result = await util.getDataFromServersV2('consumer/order/my-etc-list', {openId: app.globalData.openId}, 'POST', false);
            if (!result) return;
            if (result.code === 0) {
                app.globalData.myEtcList = result.data;
                this.pubFunc1(app.globalData.myEtcList);
            } else { util.showToastNoIcon(result.message); }
        }
    },

    // 共用方法1
    pubFunc1 (obj) {
        if (obj.length > 0) {
            this.selectComponent('#popTipComp').show({
                type: 'logOffTip1',
                title: '注销提醒',
                btnconfirm: '知道了',
                content: this.data.content2
            });
        } else {
            this.selectComponent('#popTipComp').show({
                type: 'logOffTip2',
                title: '注销提醒',
                btnCancel: '确认注销',
                btnconfirm: '再想想',
                content: this.data.content3,
                callBack: () => {

                }
            });
        }
    }

});
