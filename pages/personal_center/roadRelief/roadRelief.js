// pages/personal_center/roadRelief/roadRelief.js
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
    // 点击“申请补贴” 跳转至 “在线客服”
    btnLoad (e) {
        let item = e.currentTarget.dataset.item;
        console.log('item', item);
    },
    validateCar () {
        wx.makePhoneCall({
            phoneNumber: '12122', // 需要拨打的电话号码
            success () {
                // 拉起拨打成功后的回调
            },
            fail () {
                // 拉起拨打失败的回调
            }
        });
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    }
});
