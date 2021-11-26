/**
 * @author 老刘
 * @desc 开户成功
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		info: undefined,
		bankCardInfo: undefined,
		type: 1,// 1 工行  2 交行
		isOk: false, // 是否将二类户绑卡到订单
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onLoad (options) {
		if (options.flowVersion && options.flowVersion === '7') {
			// 交行
			this.setData({
				type: 2,
				bankCardInfo: {
					accountNo: options.accountNo
				}
			});
		} else {
			const result = await util.getV2BankId();
			this.setData({
				bankCardInfo: result
			});
			const info = await util.getETCDetail();
			if (info[2]) {
				let isOk = true;
				if (!info[2].memberAccountId) isOk = await util.updateOrderContractMappingBankAccountId(info[2], app.globalData.bankCardInfo);
				this.setData({
					info: info[2],
					isOk
				});
			}
		}
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async onclickSign () {
		util.go('/pages/truck_handling/signed/signed');
	}
});
