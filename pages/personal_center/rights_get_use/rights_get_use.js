import drawQrcode from '../../../utils/qrcode.js';
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        isRefresh: false,
        isExpire: false,
        isLogout: false,
        endTime: 0, // 结束时间
        imgUrl: '', // canvas生成的二维码图片
        storeList: [],
        couponInfo: {} // 券信息
    },
    onLoad (options) {
        this.getStoreList();
        this.setData({couponInfo: app.globalData.serviceCardVoucherDetails});
        // console.log(app.globalData.serviceCardVoucherDetails);
    },
    onShow () {
        // this.getLocations();
        if (this.data.endTime) {
            this.expire();
        } else {
            this.getQrCodePath(false);
        }
    },
    // 商家自发券门店核销二维码
    getQrCodePath (obj) {
        let params = {
            recordId: app.globalData.serviceCardVoucherDetails.recordId
        };
        util.getDataFromServer('consumer/voucher/medicineDiagGetVerifyQrCode', params, () => {
            util.showToastNoIcon(res.message);
        }, (res) => {
            if (res.code === 0) {
                console.log(res.data.data.useState);

                if (res.data.data.useState === 2) {
                    this.setData({
                        isLogout: true,
                        isRefresh: false
                    });
                    return;
                }
                if (res.data.code === 200) {
                    let datas = this.parseBase64(res.data.data.qrCode);
                    this.setData({
                        isExpire: false,
                        imgUrl: datas.data,
                        endTime: (new Date()).getTime() + 30 * 60 * 1000 // 以毫秒计算
                    });
                    this.expire();
                    if (obj) this.setData({isRefresh: false});
                } else {
                    util.showToastNoIcon(res.data.msg);
                }
            } else {
                util.showToastNoIcon(res.message);
            }
        }, app.globalData.userInfo.accessToken, () => {});
    },
    // 从base64编码中解析图片信息
    parseBase64 (base64) {
        let re = new RegExp('data:(?<type>.*?);base64,(?<data>.*)');
        let res = re.exec(base64);
        if (res) {
            return {
                type: res.groups.type,
                ext: res.groups.type.split('/').slice(-1)[0],
                data: res.groups.data
            };
        }
    },

    // 查看全部
    showAll () {
        util.go(`/pages/personal_center/all_store/all_store`);
    },
    // 打电话
    phone (e) {
        this.selectComponent('#popTipComp').show({
            type: 'callPhone',
            title: '拨打电话',
            btnCancel: '取消',
            btnconfirm: '拨打',
            content: e.currentTarget.dataset.phone,
            callBack: () => {
                wx.makePhoneCall({
                    phoneNumber: e.currentTarget.dataset.phone
                });
            }
        });
    },
    // 刷新
    refresh () {
        this.setData({
            isRefresh: true
        });
        this.getQrCodePath(true);
    },
    // 打开地址导航
    nav (e) {
        util.showToastNoIcon('功能正在维护中，敬请期待！');
        // let item = e.currentTarget.dataset.item;
        // wx.openLocation({
        //     latitude: +item.latitude,
        //     longitude: +item.longitude,
        //     scale: 18,
        //     name: item.brandName,
        //     address: item.address,
        //     success (res) {
        //         console.log('成功：',res);
        //     },
        //     fail (res) {
        //         util.showToastNoIcon(errMsg);
        //     }
        // });
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
    },
    // 二维码有效期
    expire () {
        let time = null;
        if (this.data.endTime - (new Date()).getTime() > 0) {
            time = setTimeout(() => {
                // console.log('你好：',this.data.endTime - (new Date()).getTime());
                if (this.data.endTime - (new Date()).getTime() < 0) {
                    this.setData({isExpire: true});
                    clearTimeout(time);
                }
            }, this.data.endTime - (new Date()).getTime());
        } else {
            this.setData({isExpire: true});
        }
    },
    // 商家自发券适用门店列表
    getStoreList () {
        util.showLoading();
        let params = {
            pageNum: 1,
            pageSize: 1,
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
    onUnload () {}

});
