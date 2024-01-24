const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        // 申领条件
        condition: [
            '1、领取人驾驶或乘坐ETC绑定车牌号的7座及以下的小型客车时，因车辆自身机械或电子系统故障导致的非事故道路救援，或因驾驶员错误导致的非事故道路救援（如缺少燃油或车辆电力导致车辆无法正常行驶、爆胎等），可申请救援服务补贴报销；',
            '2、服务限定使用ETC高速通行期间，申请救援服务补贴时需要匹配ETC+的高速通行记录；',
            '3、救援权益补贴有效期为1年，高速道路救援权益自etc激活之日起的第三日零时生效，若发生了符合上诉申领条件的救援事项，请在次日收到通行记录后及时申请补贴报销；',
            '4、该权益仅针对etc激活时绑定的车牌生效，有效期内仅限报销1次，申请总额不超过人民币500元的道路救援服务补贴。超出费用有用户自行承担。'
        ],
        // 申领流程
        process: [
            '1、领取人驾驶或乘坐领取时填写的车牌号的车辆在使用ETC高速通行期间发生非事故的故障 ',
            '2、确保人身安全前提下，收集高速救援证明的现场图片及相关票据',
            '3、在线申报录入报销信息、相关资料及收款信息提交审核，审核结果将在3个工作日内完成并返回结果 ',
            '4、审核通过后，申报费用将在7个工作日内打款至申报时录入的收款账户。'
        ],
        // 申报材料
        material: [
            '1、高速故障现场照片',
            '2、故障现场拖起照片高速救援服务发票照片',
            '3、呼叫救援日期及时间',
            '4、ETC通行记录（需对应呼叫救援日期）',
            '5、收款信息：姓名、金额、银行卡号、开户行 ',
            '6、阅读知悉文案：\n 本人知悉并同意etc+将本人提交的补贴申请材料与救援津贴服务商共享，用于提供救援津贴参审核及给付服务。'
        ],
        roadRescueList: undefined,
        isShow: false
    },
    onLoad (options) {
        this.getOrderInfo(options.id);
    },

    onShow () {
        wx.removeStorageSync('dataTime');
    },

    async getOrderInfo (id) {
        const result = await util.getDataFromServersV2('consumer/order/single-road-rescue', {id: id},'POST',true);
        if (!result) return;
        if (result.code === 0) {
            let flag = result.data.roadRescueStatus;
            this.setData({
                roadRescueList: result.data,
                isShow: flag === 0 || flag === 1 || flag === 2 || flag === 7 ? false : true
            });
        } else { util.showToastNoIcon(result.message); }
    },

    // 跳转道路救援申请页
    subcribe (e) {
        let status = e.currentTarget.dataset.status;
        let url = 'road_rescue_schedule';
        if (status === 3) {
            url = 'road_rescue_subscribe';
        }
        util.go(`/pages/road_rescue_orders/${url}/${url}?id=${this.data.roadRescueList.roadId}&applyId=${this.data.roadRescueList.applyId}`);
    }
});
