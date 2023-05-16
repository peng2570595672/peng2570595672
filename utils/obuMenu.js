/**
 *
 * @param app 全局应用实例
 * @param util 工具类
 * @param channel 渠道 如黔通 1 蒙通 2
 * @param serverId 服务商id
 * @param qtLimit 之前对青海农信设备做的限制
 * @param carNoStr 车牌
 * @param obuStatus 是否已激活（东旭说可以把这个字段当做已二发来用
 */
function show ({app, util, channel, serverId, qtLimit, carNoStr, obuStatus}) {
	console.log(channel)
	if (channel === 1) { // 黔通
		// TODO 已经在前面拦截了，不会走到这里
		wx.hideLoading();
		wx.navigateToMiniProgram({
			appId: 'wx008c60533388527a',
			extraData: {},
			envVersion: 'release',
			fail: (e) => {
				if (e.errMsg !== 'navigateToMiniProgram:fail cancel') {
					util.showToastNoIcon('打开激活小程序失败');
				}
			}
		});
	} else if (channel === 2) { // 内蒙
		const index = app.globalData.choiceDeviceIndex - 1;
		if (obuStatus === 1 || obuStatus === 5) {
			// 已发行，前往二次激活页面
			wx.setStorageSync('activate-info', JSON.stringify({
				carNo: carNoStr
			}));
			switch (index) {
				case 0:
					// 埃特斯
					util.go('/pages/obu_activate/neimeng_secondary/artc/artc');
					break;
				case 1:
					// 天地融
					util.go('/pages/obu_activate/neimeng_secondary/tendyron/tendyron');
					break;
				case 2:
					// 铭创
					util.go('/pages/obu_activate/neimeng_secondary/mc/mc');
					break;
				// case 2:
				// 	// 万集
				// 	util.go('/activate_obu/neimeng/wj_one8/wj_one8');
				// 	break;
			}
		} else {
			// 未发行，继续二发流程
			switch (index) {
				case 0:
					// 埃特斯
					util.go('/pages/obu_activate/neimeng_first/artc/artc');
					break;
				case 1:
					// 天地融
					util.go('/pages/obu_activate/neimeng_first/tendyron/tendyron');
					break;
				case 2:
					// 铭创
					util.go('/pages/obu_activate/neimeng_first/mc/mc');
					break;
				// case 2:
				// 	// 万集
				// 	util.go('/online_distribution/pages/connect_bluetooth_for_neimengwjone8/connect_bluetooth_for_neimengwjone8');
				// 	break;
			}
		}
	} else if (channel === 10) { // 湘通卡
		wx.hideLoading();
		util.go('/pages/obu_activate/upload_photo_for_hunan/upload_photo_for_hunan');
	} else {
		wx.hideLoading();
		util.showToastNoIcon('办理渠道暂不支持一键激活，敬请期待！');
	}
}

module.exports = {
	show
};
