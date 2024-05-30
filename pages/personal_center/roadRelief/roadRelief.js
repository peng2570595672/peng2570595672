// pages/personal_center/roadRelief/roadRelief.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        sourceOfServiceProvider: '1', // 服务商来源，举值:星星朗、天安保险，
        roadRescueList: [
            {
                roadRescueStatus: '1',
                details: [
                    {
                        label: '驾乘意外身故',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '驾乘意外医疗',
                        time: '广深高速',
                        highway: '贵州高速'
                    },
                    {
                        label: '权益服务费',
                        time: '',
                        highway: '580元'
                    },
                    {
                        label: '计算方式',
                        time: '',
                        highway: '通行费*6%'
                    }
                ]
            }, {
                roadRescueStatus: '1',
                details: [
                    {
                        label: '驾乘意外身故',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '驾乘意外医疗',
                        time: '广深高速',
                        highway: '贵州高速'
                    },
                    {
                        label: '住院津贴',
                        time: '1000元/天',
                        highway: ''
                    },
                    {
                        label: '免赔300元后',
                        time: '',
                        highway: '90%赔付'
                    },
                    {
                        label: '增值服务',
                        time: '',
                        highway: '免费拖车100公里'
                    }
                ]
            }
            // 更多道路救援项目...
        ]
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
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload () {

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
