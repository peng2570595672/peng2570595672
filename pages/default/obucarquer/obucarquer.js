const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		compressionUrl: '',
		signUrl: '',
		formData: {
			cpuId: null,
			obuId: null
		},
		available: false
	},
	async onLoad (options) {
		if (options.vehPlates) {
			this.setData({
				vehPlates: options.vehPlates
			});
		}
	},
	async onShow () {
		if (!app.globalData.orderInfo.orderId) return;
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		console.log(currPage.__data__);
		if (currPage.__data__.pathUrl) {
			this.getPictureInfo(currPage.__data__.pathUrl);
		}
		if (app.globalData.signAContract === -1) {
			await util.getDataFromServersV2('consumer/order/query-contract', { // 查询车主服务签约
				orderId: app.globalData.orderInfo.orderId
			});
			this.handleGetSignInfo();
		}
	},
	async handleGetSignInfo () {
		util.showLoading('签约查询中');
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/xz/getSignedChannelList', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (result.code) {
			util.hideLoading();
			util.showToastNoIcon(result.message);
			return;
		}
		if (!result.data.list?.length) {
			util.hideLoading();
			util.showToastNoIcon('获取已签约渠道列表返回为空');
			return;
		}
		const index = result.data.list.findIndex(item => item.signChannelId === this.data.signUrl);
		if (index === -1) {
			util.hideLoading();
			util.showToastNoIcon('获取已签约渠道列表返回为空!');
			return;
		}
		let obj = {
			orderId: app.globalData.orderInfo.orderId,
			mobile: app.globalData.mobile
		};
		// 支付关联渠道
		const result2 = await util.getDataFromServersV2('consumer/etc/qtzl/xz/carChannelRel', {
			orderId: obj.orderId,
			signChannelId: this.data.signUrl
		});
		util.hideLoading();
		if (result2.code === 0) {
			app.globalData.mobile = '';
			app.globalData.signAContract = 3;
			util.showToastNoIcon('签约已完成');
			wx.switchTab({
				url: '/pages/Home/Home'
			});
		} else {
			util.showToastNoIcon(result2.message);
		}
	},
	// is9901_Pre_inspection 接口 设备预检
	async is9901_Pre_inspection (params) {
		util.showLoading('设备预检中');
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/xz/devicePreCheck', {
			orderId: app.globalData.orderInfo.orderId,
			cpuId: params.cpuId,
			obuId: params.obuId
		});
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			this.is9901_obtainingChannels();
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	},
	// is9901_obtainingChannels 调用获取可签约渠道列表接口
	async is9901_obtainingChannels () {
		util.showLoading('获取可签约渠道');
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/xz/getAccountChannelList', {
			orderId: app.globalData.orderInfo.orderId,
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
				await this.is9901_signChannel(this.data.signChannelId, this.data.vehPlates);
			} else {
				util.showToastNoIcon('暂无可签约渠道');
			}
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	},
	// is9901_signChannel 接口 签约
	async is9901_signChannel (signChannelId, vehPlates) {
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/xz/signChannel', {
			orderId: app.globalData.orderInfo.orderId,
			signChannelId: signChannelId || '11',
			redirectUrl: `/pages/separate_interest_package/sing_9901_success/sing_9901_success`
		});
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			const signUrl = result.data.signUrl;
			this.setData({
				signUrl
			});
			const path = `pages/sign/auth?msgId=${signUrl}&plateNumber=${vehPlates}&bizNotifyUrl='DEFAULT'`; // 跳转目标小程序的页面路径
			const extraData = {
				msgId: signUrl,
				plateNumber: vehPlates,
				bizNotifyUrl: 'DEFAULT'
			};
			app.globalData.signAContract = -1;
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
	// 下一步
	async next () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({
				isRequest: true
			});
		}
		if (this.data.available) {
			this.is9901_Pre_inspection(this.data.formData);
		} else {

		}
	},
	// 选择图片
	selectionPic () {
		let type = '14';
		wx.showActionSheet({
			itemList: ['拍照', '相册选择'],
			success: (res) => {
				if (res.tapIndex === 0) {
					let typeTip = '录入OBU和卡签号';
					util.go(`/pages/default/camera/camera?type=${type}&title=${typeTip}`);
				} else {
					wx.chooseImage({
						count: 1,
						sizeType: ['original', 'compressed'],
						sourceType: ['album'],
						success: (res) => {
							let path = res.tempFilePaths[0];
							this.getPictureInfo(path);
						},
						fail: (res) => {
							if (res.errMsg !== 'chooseImage:fail cancel') {
								util.showToastNoIcon('选择图片失败！');
							}
						}
					});
				}
			}
		});
	},
	// 上传图片
	getPictureInfo (path) {
		util.showLoading({
			title: '正在识别中'
		});
		const that = this;
		// 上传并识别图片
		util.uploadOcrFile(path, 14, () => {
			util.showToastNoIcon('文件服务器异常！');
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			try {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						console.log(res.data);
						try {
							const info = res.data[0].ocrObject;
							that.data.formData.cpuId = info.DetectedText0.split(':')[1];
							that.data.formData.obuId = info.DetectedText1.split(':')[1];
							that.setData({
								formData: that.data.formData,
								available: true
							});
						} catch (e) {
							util.showToastNoIcon('OCR数据解析异常');
						}
					} else { // 识别失败
						util.showToastNoIcon('OCR识别失败，请重新上传');
					}
				} else { // 识别失败
					util.showToastNoIcon('OCR识别失败，请重新上传');
				}
			} catch (e) {
				util.showToastNoIcon('文件服务器异常！');
			}
		}, () => {
		});
	},
	onInputChangedHandle (e) {
		// console.log(e.detail.value);
		let index = e.currentTarget.dataset['index'];
		const value = e.detail.value.replace(/\D/g, '');
		if (+index === 1) {
			this.setData({
				'formData.obuId': value
			});
		}
		if (+index === 2) {
			this.setData({
				'formData.cpuId': value
			});
		}
		if (this.data.formData?.obuId?.length > 8 && this.data.formData?.cpuId?.length > 8) {
			this.setData({
				available: true
			});
		}
	}
});
