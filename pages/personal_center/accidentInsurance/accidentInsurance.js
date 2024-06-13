// pages/personal_center/valueAddedServices/valueAddedServices.js
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
                        label: '保障时间',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '通行路段',
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
                        label: '保障时间',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '通行路段',
                        time: '广深高速',
                        highway: '贵州高速'
                    },
                    {
                        label: '权益服务费',
                        time: '',
                        highway: '90%赔付'
                    },
                    {
                        label: '计算方式',
                        time: '',
                        highway: '免费拖车100公里'
                    }
                ]
            }, {
                roadRescueStatus: '1',
                details: [
                    {
                        label: '保障时间',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '通行路段',
                        time: '广深高速',
                        highway: '贵州高速'
                    },
                    {
                        label: '权益服务费',
                        time: '',
                        highway: '90%赔付'
                    },
                    {
                        label: '计算方式',
                        time: '',
                        highway: '免费拖车100公里'
                    }
                ]
            }, {
                roadRescueStatus: '1',
                details: [
                    {
                        label: '保障时间',
                        time: '2024-05-20 14:10:32',
                        highway: '2024-05-20 14:10:32'
                    },
                    {
                        label: '通行路段',
                        time: '广深高速',
                        highway: '贵州高速'
                    },
                    {
                        label: '权益服务费',
                        time: '',
                        highway: '90%赔付'
                    },
                    {
                        label: '计算方式',
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
    // 申请理赔入口
    btnLoad (e) {
        let item = e.currentTarget.dataset.item;
        console.log('item', item);
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
    }
});
