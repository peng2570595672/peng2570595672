// pages/personal_center/valueAddedServices/valueAddedServices.js
const util = require('../../../utils/util.js');
const { showToastNoIcon } = require('../../../utils/utils.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        roadRescueList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
        this.getOrderInformation();
    },
    // 跳转对应增值服务
    btnLoad (e) {
        let url = e.currentTarget.dataset.url;
        let insuranceStatus = e.currentTarget.dataset.status;
        if (url === 'road_rescue_orders') {
            // 旧流程 道路救援 跳转
            util.go(`/pages/road_rescue_orders/road_rescue/road_rescue`);
        } else {
             // 新流程
            if (insuranceStatus === 0 || insuranceStatus === 2) {
                // 保障申请中 //申请失败
                return;
            }
            if (insuranceStatus === 3 && url === 'roadRelief') {
                // 道路救援 保单失效
                util.showToastNoIcon('当前保单已失效',5000);
                return;
            }
            util.go(`/pages/personal_center/${url}/${url}`);
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },
    // 获取订单增值服务信息
    async getOrderInformation () {
        const result = await util.getDataFromServersV2('consumer/order/orderInsuranceList', {
        }, 'POST', false);
        if (result.code === 0) {
            if (result?.data.length) {
                let roadRescueRules = result?.data[0];
                console.log(roadRescueRules, 'getOrderInformation');
                const { orderId, insuranceNo, insuranceType, insuranceStatus, roadRescue, roadRescueService } = roadRescueRules;
                let roadRescueList = [
                    {
                        title: '驾乘意外险',
                        orderId,
                        orderName: '保单编号',
                        policyNumber: insuranceNo,
                        url: 'accidentInsurance',
                        insuranceStatus,
                        roadRescueService,
                        roadRescue,
                        insuranceType,
                        show: insuranceType ? true : false,
                        coverages: insuranceType === 1 ? [
                            { label: '驾乘意外身故', value: '20万/座' },
                            { label: '驾乘意外医疗', value: '2万/座' },
                            { label: '住院津贴', value: '50元/天' },
                            { label: '免赔300元后', value: '90%赔付' }
                        ] : insuranceType === 2 ? [
                            { label: '驾乘意外身故', value: '30万/座' },
                            { label: '驾乘意外医疗', value: '3万/座' },
                            { label: '住院津贴', value: '60元/天' },
                            { label: '免赔300元后', value: '90%赔付' }
                        ] : insuranceType === 3 ? [
                            { label: '驾乘意外身故残疾', value: '30万/座' },
                            { label: '驾乘意外医疗', value: '3万/座' },
                            { label: '住院津贴', value: '100元/天' },
                            { label: '免赔50元后', value: '90%赔付' }
                        ] : insuranceType === 4 ? [
                            { label: '驾乘意外身故残疾', value: '50万/座' },
                            { label: '驾乘意外医疗', value: '5万/座' },
                            { label: '住院津贴', value: '100元/天(最长180天)' },
                            { label: '免赔50元后', value: '90%赔付' }
                        ] : []
                    }, {
                        title: '道路救援',
                        orderId,
                        // orderName: '保单编号',
                        // policyNumber: '-',
                        insuranceStatus,
                        roadRescueService,
                        roadRescue,
                        insuranceType,
                        show: roadRescue === 1 ? true : false,
                        url: roadRescueService === 2 ? 'roadRelief' : 'road_rescue_orders',
                        coverages: roadRescueService === 2 ? [ // 开启了道路救援并且 =天安保险
                            { label: '7座及以下家庭自用私家车', value: '全年' },
                            { label: '提供非道路交通事故', value: '救援3次' },
                            { label: '每次救援费用不超过500元', value: '全年' },
                            { label: '累计救援服务费用1500元', value: '-' }
                        ] : []
                    }
                ];
                this.setData({
                    roadRescueList
                });
            }
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    }
});
