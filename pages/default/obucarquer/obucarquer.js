const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		formData: {
			cpuId: '0052232100025414',
			obuId: '9901000300578396'
		},
		available: false
	},
	async onLoad (options) {

	},
	// is9901_Pre_inspection 接口 设备预检
	async is9901_Pre_inspection (orderId) {
		util.showLoading('设备预检中');
		const result = await util.getDataFromServersV2('consumer/activity/qtzl/xz/devicePreCheck', {
			orderId,
			cpuId: '0052232100025414',
			obuId: '9901000300578396'
		});
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			this.is9901_obtainingChannels(this.data.orderId);
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	},
	// is9901_obtainingChannels 调用获取可签约渠道列表接口
	async is9901_obtainingChannels (orderId) {
		util.showLoading('获取可签约渠道');
		const result = await util.getDataFromServersV2('consumer/activity/qtzl/xz/getAccountChannelList', {
			orderId,
			redirectUrl: `/pages/separate_interest_package/sing_9901_success/sing_9901_success`
		});
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			let arr = result.data.list.filter(item => item.channelId === '11');
			if (arr.length > 0) {
				app.globalData.orderInfo.signChannelId = arr[0].signChannelId;
				this.setData({
					signChannelId: arr[0].signChannelId
				});
				await this.is9901_signChannel(this.data.orderId, this.data.signChannelId, this.data.info.vehPlates);
			} else {
				util.showToastNoIcon('暂无可签约渠道');
			}
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	},
	// is9901_signChannel 接口 签约
	async is9901_signChannel (orderId, signChannelId, vehPlates) {
		const result = await util.getDataFromServersV2('consumer/activity/qtzl/xz/signChannel', {
			orderId,
			signChannelId: signChannelId || '11',
			redirectUrl: `/pages/separate_interest_package/sing_9901_success/sing_9901_success`
		});
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			const signUrl = result.data.signUrl;
			app.globalData.orderInfo.signUrl_9901 = signUrl;
			this.data.info.signUrl_9901 = signUrl;
			this.setData({
				info: this.data.info
			});
			const path = `pages/sign/auth?msgId=${signUrl}&plateNumber=${vehPlates}&bizNotifyUrl='DEFAULT'`; // 跳转目标小程序的页面路径
			const extraData = {
				msgId: signUrl,
				plateNumber: vehPlates,
				bizNotifyUrl: 'DEFAULT'
			};
			// 跳转九州签约
			wx.navigateToMiniProgram({
				appId: 'wx008c60533388527a',
				path,
				extraData,
				success (res) {
					// 打开成功
				},
				fail (e) {
					// 打开失败
					if (e.errMsg !== 'navigateToMiniProgram:fail cancel') {
						util.showToastNoIcon('打开签约小程序失败');
					}
				}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onShow () {

	},

	// 下一步
	async next () {
		if (this.data.available) {

		}
	},
	// 上传图片
	getEquipId (e) {
		let index = e.currentTarget.dataset.index;
		console.log(index);
	},

	onInputChangedHandle (e) {
		if (this.data.formData.obuId && this.data.formData.cpuId) {
			this.setData({
				available: true
			});
		}
	}
});
