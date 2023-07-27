import {isOpenBluetooth} from '../../../utils/utils';

const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../libs/obuMenu.js');
Page({
	data: {
		wrapper: false,
		mask: false
	},
	onLoad () {
	},
	onShow () {
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
		let baseInfo = wx.getStorageSync('baseInfo');
		if (!baseInfo) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');
		// if (!await isOpenBluetooth()) {
		// 	this.setData({
		// 		mask: true,
		// 		wrapper: true
		// 	});
		// 	return;
		// }
		if (baseInfo.obuStatus === 1 || baseInfo.obuStatus === 5) {
			// 已发行，前往二次激活页面
			wx.setStorageSync('activate-info', JSON.stringify({
				carNo: baseInfo.carNoStr
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
