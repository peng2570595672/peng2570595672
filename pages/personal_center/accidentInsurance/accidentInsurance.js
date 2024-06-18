const util = require('../../../utils/util.js');
const app = getApp();
// pages/personal_center/valueAddedServices/valueAddedServices.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        roadRescueList: [
            // 更多道路救援项目...
        ]
    },
    // 获取保障记录
    async getStoreList () {
        // util.showLoading();
        let params = {
            insuranceNo: this.data.insuranceNo
        };
        await util.getDataFromServer('consumer/etc/getInsuranceList', params, () => {
            util.showToastNoIcon(res.message);
        }, (res) => {
            if (res.code === 0) {
                let storeList = res.data;
                this.setData({
                    roadRescueList: storeList
                });
                console.log('storeList', storeList);
            } else {
                util.showToastNoIcon(res.message);
            }
        }, app.globalData.userInfo.accessToken, () => {
            util.hideLoading();
        });
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
        this.setData({
            insuranceNo: options.insuranceNo
        });
        this.getStoreList();
    },
    openFullScreenImage (e) {
        const current = e.currentTarget.dataset.src; // 获取当前点击图片的URL
        const urls = [current];// 多张时可以滑动预览
        wx.previewImage({
            current,
            urls,
            fail: (err) => {
                console.error('打开图片失败:', err);
            }
        });
    },
    // 申请理赔入口
    btnLoad (e) {
        let status = e.currentTarget.dataset.item.status;
        switch (status) {
            case 1:	// 跳转拨号入口
                // this.next();
                break;
            case 2:
                util.showToastNoIcon('该笔保障欠费中，请完成补缴后保障服务商才能受案并最终理赔',5000);
                break;
            case 3:
                util.showToastNoIcon('该笔保障理赔受理中，请耐心等待或咨询保障服务商客服',5000);
                break;
            case 5:
                util.showToastNoIcon('当前保单已失效，不可申请理赔',5000);
                break;
            default:
                break;
        }
    },
    cancelHandle () {
        console.log('拨号弹框的回调');
    },
    // 申请理赔入口
    next () {
        this.selectComponent('#popTipComp').show({ // 提示弹窗组件的标题和内容
            type: 'accidentInsurance',
            imgSrc: 'https://file.cyzl.com/g001/M03/74/60/oYYBAGZYI7yATbgwAAECL_t3M08089.png', // 展示图
            viewImgSrc: 'https://file.cyzl.com/g001/M03/74/5D/oYYBAGZYHliAeOAPAANHTQ7Mxd8021.png',// 放大预览图
            title: '驾乘意外险',
            btncancel: '关闭',
            btnconfirm: '拨打保险电话',
            content: '系统将为您呼叫驾乘意外险保障服务商的电话请根据服务商的坐席电话指引，完成理赔流程，确认呼叫请点击下方【拨打理赔电话】。'
        });
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    // 监听用户上拉触底事件
    onReachBottom (e) {
        util.showToastNoIcon('只能展示最近半年的保障记录');
    }
});
