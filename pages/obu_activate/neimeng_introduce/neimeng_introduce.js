import {isOpenBluetooth} from '../../../utils/utils';

const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../libs/obuMenu.js');
Page({
	data: {
		wrapper: false,
		mask: false,
		baseInfo: undefined
	},
	onLoad () {
	},
	onShow () {
		let baseInfo = wx.getStorageSync('baseInfo');
		let installGuid = wx.getStorageSync('installGuid');
		if (!baseInfo || !installGuid) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');

		let endIndex = installGuid.indexOf('（') !== -1 ? installGuid.indexOf('（') : installGuid.indexOf('(');
		wx.setNavigationBarTitle({title: `安装指引-${installGuid.substring(0,endIndex).trim()}`});
		this.setData({baseInfo: baseInfo});
	},
	hide () {
		this.setData({
			wrapper: false
		});
		setTimeout(() => {
			this.setData({
				mask: false
			});
		}, 400);
	},
	async handleActivate () {
		// if (!await isOpenBluetooth()) {
		// 	this.setData({
		// 		mask: true,
		// 		wrapper: true
		// 	});
		// 	return;
		// }
		// 河北交投
		if (this.data.baseInfo.channel === 23) {
			util.go('/pages/obu_activate/connect_bluetooth_for_hebeigenvict/connect_bluetooth_for_hebeigenvict');
			return;
		}
		// 湖南
		// if (this.data.baseInfo.channel === 10) {
		// 	if (this.data.baseInfo.obuStatus === 1 || this.data.baseInfo.obuStatus === 5) {
		// 		util.go('/pages/obu_activate/hunan/mc_new/mc_new');	// 二次激活
		// 	} else {	// 首次激活
		// 		const res = await util.getDataFromServersV2('/consumer/etc/hunan/v2/common/getObuOrderId', {
		// 			orderId: this.data.baseInfo.orderId
		// 		});
		// 		if (res.code === 0) {
		// 			if (res.data.obuOrderId) {
		// 				app.globalData.newOrderId = res.data.obuOrderId;
		// 			}
		// 		} else {}
		// 		util.go('/pages/obu_activate/hunan/connect_bluetooth_for_hunanmc_new/connect_bluetooth_for_hunanmc_new');
		// 	}
		// 	return;
		// }
		if (this.data.baseInfo.obuStatus === 1 || this.data.baseInfo.obuStatus === 5) {
			// 已发行，前往二次激活页面
			wx.setStorageSync('activate-info', JSON.stringify({
				carNo: this.data.baseInfo.carNoStr
			}));
			// 铭创
			util.go('/pages/obu_activate/neimeng_secondary/mc_new/mc_new');
		} else {
			// 未发行，继续二发流程
			// 铭创
			util.go('/pages/obu_activate/neimeng_first/mc_new/mc_new');
		}
	}
});
// "first_activation/neimeng/artc/artc",
// 	"first_activation/neimeng/mc/mc",
// 	"first_activation/neimeng/mc_new/mc_new",
// 	"first_activation/neimeng/mc_new/mc_new",
// 	"first_activation/neimeng/wjone8/wjone8",
// 	"secondary_activation/neimeng/artc/artc",
// 	"secondary_activation/neimeng/mc/mc",
// 	"secondary_activation/neimeng/mc_new/mc_new",
// 	"secondary_activation/neimeng/mc_new/mc_new",
// 	"secondary_activation/neimeng/wjone8/wjone8"
