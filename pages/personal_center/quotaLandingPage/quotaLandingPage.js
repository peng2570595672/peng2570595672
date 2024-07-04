// pages/personal_center/quotaLandingPage/quotaLandingPage.js
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {

    },

    onClickCommit (e) {
         this.selectComponent('#popTipComp').show({
            type: 'tenth',
            title: '温馨提示',
            content: '您已测过额度，重新测额不再发放通行券，是否继续前往测额',
            btnCancel: '不再参与',
            btnconfirm: '继续测额'
        });
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    },

    rules () {
        let popUpBoxProtocol = {
            name: '活动规则',
            content: '1、本活动由车主贷全程策划及赞助，ETC+仅提供技术跳转及奖励发放，且本活动仅支持在{小程序平台}签约代扣通行费的车辆使用。 2、当点击【立即测额】后，在获得您的授权同意下 ETC+将协助跳转到活动参与小程序页面，并以加密形式同步您的基础信息及车辆信息至活动平台，以便您更快捷完成测额流程。 3、通行券奖励仅绑定首次在车主贷平台认证且测额成功车牌信息。 4、活动奖励以单个用户的首台测额成功的车辆进行发放。活动奖励以通行券组合包形式发放，内含 5 元高速通行券 2 张和 15 元高速通行券 1 张，总价值 25 元用户可在【个人中心-服务券】中查看。',
            btnText: '我知道了'
        };
        this.selectComponent('#popTipComp').showCountdownPopupBox({
            btnShadowHide: true,
            title: popUpBoxProtocol.name,
            btnconfirm: '关闭',
            type: 'noCountdownRequired',
            content: popUpBoxProtocol.content
        });
    },

    eventAwards () {
        this.selectComponent('#popTipComp').show({
            type: 'coupons',
            title: '驾乘意外险',
            content: '测额活动奖励已发放，通行券核销情况可前往小程序【个人中心 - 领券中心 - 服务卡券】查看。',
            btnCancel: '关闭',
            btnconfirm: '前往我的卡券',
            pic: true
        });
    },
    onHandle (e) {
        const content = '您即将通过该链接跳转至第三方页面，在第三方页面中提交信息将由第三方按照其相关用户服务协议及隐私协议正常执行并负责，服务及责任均由第三方提供或承担，如有疑问请致电第三方客服电话';
        this.selectComponent('#popTipComp').show({
            type: 'oneBtn',
            title: '免责声明',
            content,
            btnconfirm: '我知道了',
            callBack: () => {
                console.log('点击了确认');
            }
        });
    },
    cancelHandle (e) {
        console.log('11');
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
