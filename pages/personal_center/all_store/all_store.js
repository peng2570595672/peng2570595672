const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        region: ['贵州省','遵义市','习水县'],
        storeList: []
    },

    onLoad (options) {

    },

    onShow () {
        this.getStoreList();
    },
    // 商家自发券适用门店列表
    getStoreList () {
        util.showLoading();
        let params = {
            pageNum: 1,
            pageSize: 10,
            recordId: app.globalData.serviceCardVoucherDetails.recordId
        };
        util.getDataFromServer('consumer/voucher/merchantCouponShopList', params, () => {
            util.showToastNoIcon(res.message);
        }, (res) => {
            if (res.code === 0) {
                if (res.data.code === 200) {
                    this.setData({storeList: res.data.data});
                } else {
                    util.showToastNoIcon(res.data.msg);
                }
            } else {
                util.showToastNoIcon(res.message);
            }
        }, app.globalData.userInfo.accessToken, () => {
            util.hideLoading();
        });
    },
    // 打电话
    phone (e) {
        this.selectComponent('#popTipComp').show({
            type: 'callPhone',
            title: '拨打电话',
            btnCancel: '取消',
            btnconfirm: '拨打',
            contant: e.currentTarget.dataset.phone,
            callBack: () => {
                wx.makePhoneCall({
                    phoneNumber: e.currentTarget.dataset.phone
                });
            }
        });
    },
    // 打开地址导航
    nav () {
        util.showToastNoIcon('功能正在维护中，敬请期待！');
    },
    bindRegionChange (e) {
        console.log(e);
        let regionInfo = e.detail;
        this.setData({region: regionInfo.value});
    }
});
