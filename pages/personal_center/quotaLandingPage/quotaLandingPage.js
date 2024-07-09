// pages/personal_center/quotaLandingPage/quotaLandingPage.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        carList: [],
        messageL: '',
        lines_1: '5',
        number_1: '2',
        lines_2: '15',
        number_2: '1'
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
        this.whetherItIsMeasurable();
    },
    // 立即测额
    onClickCommit (e) {
        const content = '一、您即将通过该链接跳转至第三方页面，在第三方页面中提交信息将由第三方按照其相关用户服务协议及隐私协议正常执行并负责，服务及责任均由第三方提供或承担，如有疑问请致电第三方客服电话';
        const content2 = '二、仅支持以下车牌测额成功后返券';
        if (this.data.carList.length > 0 && this.data.LicensePlate) {
            const LicensePlate = this.data.LicensePlate;
            this.selectComponent('#popTipComp').show({
                type: 'tenth',
                title: '温馨提示',
                content,
                content2,
                LicensePlate,
                btnCancel: '不再参与',
                btnconfirm: '继续测额'
            });
        } else {
            util.showToastNoIcon(this.data.message || '请刷新后重新进入该页面!', 3000);
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {
    },
    // 检查是否可测额 以及指定车牌
    async whetherItIsMeasurable () {
        const result = await util.getDataFromServersV2('consumer/order/check-pa-evaluate-result', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            const LicensePlate = [];
            result.data.forEach(item => {
                LicensePlate.push(item.vehPlates);
            });
            this.setData({
                carList: result.data,
                LicensePlate
            });
        } else {
            this.setData({
                message: result.message
            });
            // util.showToastNoIcon(result.message, 3000);
        }
    },

    rules () {
        let popUpBoxProtocol = {
            name: '活动规则',
            content: '1、本活动由车主贷全程策划及赞助，ETC+仅提供技术跳转及奖励发放，且本活动仅支持在{小程序平台}签约代扣通行费的车辆使用。 2、当点击【立即测额】后，在获得您的授权同意下 ETC+将协助跳转到活动参与小程序页面，并以加密形式同步您的基础信息及车辆信息至活动平台，以便您更快捷完成测额流程。 3、通行券奖励仅绑定首次在车主贷平台认证且测额成功车牌信息。 4、活动奖励以单个用户的首台测额成功的车辆进行发放。活动奖励以通行券组合包形式发放，内含 5 元高速通行券 2 张和 15 元高速通行券 1 张，总价值 25 元用户可在【个人中心-服务券】中查看。'
        };
        this.selectComponent('#popTipComp').showCountdownPopupBox({
            btnShadowHide: true,
            title: popUpBoxProtocol.name,
            btnconfirm: '我知道了',
            type: 'noCountdownRequired',
            content: popUpBoxProtocol.content
        });
    },
    // 有卡券
    thereAreCoupons () {
        const that = this;
        const LicensePlate = that.data.LicensePlate || [];
        // 卡券额度待完善---可配置
        this.selectComponent('#popTipComp').show({
            type: 'coupons',
            title: '查看奖励',
            content: '测额活动奖励已发放，通行券核销情况可前往小程序【个人中心 - 领券中心 - 服务卡券】查看。',
            btnCancel: '关闭',
            btnconfirm: '前往我的卡券',
            pic: true,
            coupons: [{
                lines: '5',
                number: '2',
                startTime: '2021-01-01',
                endTime: '2021-12-01',
                LicensePlate
            },{
                lines: '15',
                number: '1',
                startTime: '2022-01-01',
                endTime: '2022-08-01',
                LicensePlate
            }]
        });
    },
    // 没有卡券
    thereAreNoCoupons () {
        this.selectComponent('#popTipComp').show({
            NoIcon: true,
            type: 'one',
            title: '查看奖励',
            content: '暂无奖励发放,请先参与测额活动后继续查看!'
        });
    },

    async eventAwards () {
        // 判断有无获取卡券奖励
        const result = await util.getDataFromServersV2('consumer/order/check-pa-evaluate-result', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            // 已经参与
            this.thereAreCoupons();
            // 暂未参与
            // this.thereAreNoCoupons();
        } else {
            util.showToastNoIcon(result.message, 3000);
        }
    },
    async checkTheCouponDetails () {
        // 查看券额详情配置
        const result = await util.getDataFromServersV2('consumer/order/check-pa-evaluate-result', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            console.log('33');
        } else {
            util.showToastNoIcon(result.message, 3000);
        }
    },
    onHandle (e) {
        // 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
        wx.openEmbeddedMiniProgram({
            appId: 'wx06a561655ab8f5b2',
            path: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10',
            envVersion: 'release',
            fail () {
                util.showToastNoIcon('调起小程序失败, 请重试！');
            }
        });
    },
    cancelHandle (e) {
        console.log('00');
    },
    confirmHandle (e) {
        console.log('11', e);
    }
});
