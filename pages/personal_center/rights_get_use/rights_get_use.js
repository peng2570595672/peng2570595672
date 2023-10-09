const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        isRefresh: false
    },
    onLoad (options) {

    },
    onShow () {
        // this.getLocations();
    },
    // 查看全部
    showAll () {
        util.go(`/pages/personal_center/all_store/all_store`);
    },
    // 打电话
    phone () {
        wx.makePhoneCall({
            phoneNumber: '1111111111'
        });
    },
    // 刷新
    refresh () {
        this.setData({
            isRefresh: true
        });
    },
    // 复制 “我的券码”
    copy () {
        wx.setClipboardData({
            data: 'data1234567890',
            success (res) {
                wx.getClipboardData({
                    success (res) {
                        let time = setTimeout(() => {
                            util.showToastNoIcon(`复制成功`);
                            clearTimeout(time);
                        }, 1000);
                    }
                });
            }
        });
    },
    // 获取当前地理位置
    getLocations () {
        util.showLoading();
        wx.getLocation({
            type: 'wgs84',
            success: (res) => {
                console.log('定位信息：', res);
                wx.hideLoading();
                wx.setStorageSync('locationInfo', {
                    latitude: res.latitude,
                    longitude: res.longitude
                });
            },
            fail: (res) => {
                console.log(res);
                wx.hideLoading();
                if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === 'getLocation:fail authorize no response') {
                    util.alert({
                        content: '由于您拒绝了定位授权，导致无法进行后续操作，请允许定位授权！',
                        showCancel: true,
                        confirmText: '允许授权',
                        confirm: () => {
                            wx.openSetting();
                        }
                    });
                } else if (res.errMsg === 'getLocation:fail:ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' || res.errMsg === 'getLocation:fail system permission denied') {
                    util.showToastNoIcon('请开启手机或微信定位功能！');
                }
            }
        });
    }

});
