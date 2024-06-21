const app = getApp();
const util = require('../../../../utils/util.js');
const compressPicturesUtils = require('../../../../utils/compress_pictures_utils.js');
Page({

    data: {
        available: false,
        obuNumber: '', // obu号码 sn
        kaNumber: '' // 卡签号码
    },

    onLoad (options) {

    },

    onShow () {

    },

    inputCode (e) {
        this.setData({
            obuNumber: e.detail.value.trim(),
            available: e.detail.value.trim().length > 0
        });
    },

    // 拍照或选择图片
    chooseImage (e) {
        let that = this;
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                that.uploadCardOrcFile(res.tempFilePaths[0]);
            },
            fail: (res) => {
                if (res.errMsg !== 'chooseImage:fail cancel') {
                    util.showToastNoIcon('选择图片失败！');
                }
            }
        });
    },

    // 裁剪压缩图片 并缓存
    uploadCardOrcFile (path) {
        let that = this;
        let picPath = '';
        // 裁剪压缩图片
        compressPicturesUtils.processingPictures(that, path, 'pressCanvas', 640, (res) => {
            picPath = res ? res : path;
        });
        that.uploadOcrFile(picPath || path,14);
    },

    // 识别图片
    uploadOcrFile (path, type, selfType) {
        util.showLoading();
        let that = this;
        util.uploadOcrFile(path, type, () => {
           util.showToastNoIcon('上传失败');
        }, (res) => {
            if (!res) {
                wx.hideLoading();
                util.showToastNoIcon('文件服务器异常');
                return;
            }
            res = JSON.parse(res);
            if (res.code === 0) {
                let ocrObject = res.data[0].ocrObject;
                console.log('数据：',Object.values(ocrObject));
                Object.values(ocrObject).map(item => {
                    if (item.includes('SN号')) {
                        that.setData({
                            obuNumber: item.split(':')[1],
                            available: true
                        });
                    }
                    if (item.includes('卡号')) {
                        that.setData({
                            kaNumber: item.split(':')[1]
                        });
                    }
                    wx.hideLoading();
                });
            } else {
                wx.hideLoading();
                util.showToastNoIcon(res.message);
            }
        }, () => {}, (res) => {});
    },

    async next () {
        if (!this.data.available) return;
        let result = await util.getDataFromServersV2('salesman/order/check-obu-no', {
            obuNo: this.data.obuNumber,
            mobilePhone: app.globalData.mobilePhone
        });
        if (!result) return;
        if (result.code === 0) {
            wx.hideLoading();
            that.liaoNingMovepay1(result.data.response.respInfo.payUrl);
        } else {
            wx.hideLoading();
            util.showToastNoIcon(result.message);
        }
    },

    onUnload () {

    }
});
