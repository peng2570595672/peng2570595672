const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        alertMask: false, // 控制活动细则弹窗
        alertWrapper: false, // 控制活动细则弹窗
        loginInfo: undefined,
        topTitle: '', // 充值40元得60元
        topTips: '', // 高速通行券
        directions: '',
        promoteName: '', // 业务员姓名
        promotePlates: '', // 推广车牌
        couponAmount: 60,
        couponName: '',
        couponRestrictions: '',
        couponExpirationDate: '',
        footerTitle: ''
    },
    onLoad () {
        util.resetData();// 重置数据
        wx.hideHomeButton();
        this.setData({
            topTitle: '充值40元得60元',
            topTips: '高速通行券',
            promoteName: '小男孩',
            couponAmount: 60,
            couponName: '通行费抵扣券',
            couponRestrictions: '满0.01元可用',
            couponExpirationDate: '有效期至2020年12月31日',
            directions: '使用说明',
            promotePlates: '贵Z83HYN',
            footerTitle: '*仅该车高速通行可使用该券'
        });
        this.login();
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
                }, (res) => {
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
    // 获取手机号
    onGetPhoneNumber (e) {
        // 允许授权
        if (e.detail.errMsg === 'getPhoneNumber:ok') {
            let encryptedData = e.detail.encryptedData;
            let iv = e.detail.iv;
            util.showLoading({
                title: '绑定中...'
            });
            util.getDataFromServer('consumer/member/common/applet/bindingPhone', {
                sourceType: 5,// 用户来源类型 5-面对面引流 7-微信引流
                sourceId: app.globalData.otherPlatformsServiceProvidersId,// 来源标识 面对面引流时传服务商id，微信引流时，1-为城市服务
                certificate: this.data.loginInfo.certificate,
                encryptedData: encryptedData, // 微信加密数据
                iv: iv // 微信加密数据
            }, () => {
                util.hideLoading();
                util.showToastNoIcon('绑定手机号失败！');
            }, (res) => {
                // 绑定手机号成功
                if (res.code === 0) {
                    res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
                    app.globalData.userInfo = res.data; // 用户登录信息
                    app.globalData.openId = res.data.openId;
                    app.globalData.memberId = res.data.memberId;
                    app.globalData.mobilePhone = res.data.mobilePhone;
                    let loginInfo = this.data.loginInfo;
                    loginInfo['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
                    loginInfo.needBindingPhone = 0;
                    this.setData({
                        loginInfo
                    });
                } else {
                    util.hideLoading();
                    util.showToastNoIcon(res.message);
                }
            });
        }
    },
    butClick (e) {
        console.log(e);
    },
    goHome () {
        wx.reLaunch({
            url: '/pages/Home/Home'
        });
    },
    // 关闭验规则弹窗
    rulesWinHide () {
        this.setData({
            alertWrapper: false
        });
        setTimeout(() => {
            this.setData({
                alertMask: false
            });
        }, 400);
    },
    directionsClick (e) {
        console.log(e);
        this.setData({
            alertMask: true,
            alertWrapper: true
        });
    },
    freeProcessing (e) {
        util.go('/pages/default/receiving_address/receiving_address');
    }
});
