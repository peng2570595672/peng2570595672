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
        qrUrl: 'https://file.cyzl.com/g001/M01/07/08/oYYBAF4DI1KAdQQAAABMmqEDnsc709.svg'
    },
    onLoad (options) {

    },
    onShow () {
        // this.getLocations();
        if (this.data.endTime) {
            this.expire();
        } else {
            this.draws(false);
        }
    },
    draws (obj) {
        const $this = this;
        let width = 300 / 750 * wx.getSystemInfoSync().windowWidth;
        const query = wx.createSelectorQuery();
        query.select('#canvas').fields({node: true,size: true}).exec(() => {
            // 调用方法drawQrcode生成二维码
            drawQrcode({
                width: width,
                height: width,
                canvasId: 'canvas',
                text: this.data.qrUrl,
                _this: $this
            });

            // 获取临时路径
            wx.canvasToTempFilePath({
                canvasId: 'canvas',
                success (res) {
                    console.log(res.tempFilePath);
                    $this.setData({
                        isExpire: false,
                        imgUrl: res.tempFilePath,
                        endTime: (new Date()).getTime() + 15 * 1000 // 以毫秒计算
                    });
                    $this.expire();
                    if (obj) $this.setData({isRefresh: false});
                },
                fail (res) {
                    console.error(res);
                }
            });
        });
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
            contant: e.currentTarget.dataset.phone,
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
        this.draws(true);
    },
    // 打开地址导航
    nav () {
        util.showToastNoIcon('功能正在维护中，敬请期待！');
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
        console.log('时间差：',this.data.endTime - (new Date()).getTime());
        let time = null;
        // let spaceTime = this.data.endTime - (new Date()).getTime(); // 时间差(毫秒)
        if (this.data.endTime - (new Date()).getTime() > 0) {
            setTimeout(() => {
                console.log('你好：',this.data.endTime - (new Date()).getTime());
                this.setData({isExpire: true});
            }, this.data.endTime - (new Date()).getTime());
        } else {
            this.setData({isExpire: true});
        }
    },
    onUnload () {
        console.log('dsadasd');
    }

});
