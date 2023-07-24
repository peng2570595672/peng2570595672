const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        loginInfo: undefined, // 登录信息
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
        roadRescueList: [] // 道路救援订单列表
    },

    onLoad (options) {
        if (app.globalData.userInfo.accessToken) {
            this.getOrderList();
		} else {
			// 公众号进入需要登录
			this.login();
		}
    },

    async onShow () {
        // 查询是否欠款
		await util.getIsArrearage();
    },

    // 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						await this.getOrderList();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},

    // 获取道路救援订单列表数据
    async getOrderList () {
        const result = await util.getDataFromServersV2('consumer/order/road-resue/order-list', {},'POST',true);
		if (!result) return;
		if (result.code === 0) {
			this.setData({
                roadRescueList: result.data
            });
		} else {
			util.showToastNoIcon(result.message);
		}
    },

    // 点击“申请补贴” 跳转至 “在线客服”
    btnLoad () {
        // /pages/web/web/web?type=online_customer_service
        // if (!app.globalData.userInfo?.accessToken) {
		// 	util.go('/pages/login/login/login');
		// }
        wx.uma.trackEvent('index_for_service');
		util.go(`/pages/web/web/web?type=online_customer_service`);
    },

    onUnload () {

    }
});
