const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        roadRescueList: {},
        carNo: [],
        carNoStr: ['贵', 'Z', 'Q', '0', '1', '0', '2'], // 车牌对应的数组
        isSelf1: false, // 是否选中"是"
        isSelf2: false, // 是否选中"否"
        agreement: false,
        isOwner: 0
    },

    onLoad (options) {
        this.getOrderInfo(options.orderId);
    },

    async getOrderInfo (orderId) {
        const result = await util.getDataFromServersV2('consumer/order/single-road-rescue', {orderId: orderId},'POST',true);
		if (!result) return;
		if (result.code === 0) {
            let vehPlates = '' + result.data.vehPlates;
            let carNoStr = vehPlates.split('');
            this.setData({
                roadRescueList: result.data,
                carNoStr,
                carNo: carNoStr
            });
        } else { util.showToastNoIcon(result.message); }
    },

    // 车辆是否在本人名下
    isSelf (e) {
        let index = parseInt(e.currentTarget.dataset.index);
        if (index === 1) {
            this.setData({isSelf1: true,isSelf2: false,isOwner: 1});
        } else {
            this.setData({isSelf1: false,isSelf2: true,isOwner: 0});
        }
    },

    // 是否同意相关要求
    agreementFunc () {
        this.setData({agreement: !this.data.agreement});
    },

    // 立即办理
    async handle () {
        if (!this.data.agreement) {
            return util.showToastNoIcon('请阅读用户告知');
        }
        if (!this.data.isSelf1 && !this.data.isSelf2) {
            return util.showToastNoIcon('车辆是否在本人名下必选');
        }
        let params = {
            orderId: this.data.roadRescueList.orderId,// 订单id，
            vehPlates: this.data.roadRescueList.vehPlates,// 车牌号:
            vehColor: this.data.roadRescueList.vehPlateColor,// 车牌颜色,
            owner: this.data.roadRescueList.owner,// 姓名
            idNumber: this.data.roadRescueList.idNumber,// 身份证
            isOwner: this.data.isOwner,// 是否本人名下(0:否;1:是;)
            serveName: '高速道路救援险'// 服务名称
        };
        const result = await util.getDataFromServersV2('consumer/order/receive/road-resue', params,'POST',true);
		if (!result) return;
		if (result.code === 0) {
            util.go(`/pages/road_rescue_orders/road_rescue_detail/road_rescue_detail?orderId=${this.data.roadRescueList.orderId}`);
        } else { util.showToastNoIcon(result.message); }
    }
});
