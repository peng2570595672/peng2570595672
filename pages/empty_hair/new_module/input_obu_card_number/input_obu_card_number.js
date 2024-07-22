const app = getApp();
const util = require('../../../../utils/util.js');
const compressPicturesUtils = require('../../../../utils/compress_pictures_utils.js');
Page({

	data: {
		available: false,
		obuNumber: '', // obu号码 sn
		kaNumber: '', // 卡签号码
		isNewTrucks: undefined,
		orderId: ''
	},

	onLoad (options) {
		this.setData({
			isNewTrucks: +options.isNewTrucks
		});
	},

	onShow () {

	},

	inputCode (e) {
		this.setData({
			obuNumber: e.detail.value.trim(),
			available: e.detail.value.trim().length > 0
		});
	},

	// 拍照或选择图片
	chooseImage (e) {
		let that = this;
		wx.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				that.uploadCardOrcFile(res.tempFilePaths[0]);
			},
			fail: (res) => {
				if (res.errMsg !== 'chooseImage:fail cancel') {
					util.showToastNoIcon('选择图片失败！');
					return;
				}
				util.showToastNoIcon(res.errMsg);
			}
		});
	},

	// 裁剪压缩图片 并缓存
	uploadCardOrcFile (path) {
		let that = this;
		let picPath = '';
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(that, path, 'pressCanvas', 640, (res) => {
			picPath = res ? res : path;
		});
		that.uploadOcrFile(picPath || path,14);
	},

	// 识别图片
	uploadOcrFile (path, type, selfType) {
		util.showLoading();
		let that = this;
		util.uploadOcrFile(path, type, () => {
		   util.showToastNoIcon('上传失败');
		}, (res) => {
			if (!res) {
				wx.hideLoading();
				util.showToastNoIcon('文件服务器异常');
				return;
			}
			res = JSON.parse(res);
			if (res.code === 0) {
				let ocrObject = res.data[0].ocrObject;
				console.log('数据：',Object.values(ocrObject));
				Object.values(ocrObject).map(item => {
					if (item.includes('SN号') || item.includes('S/N')) {
						that.setData({
							obuNumber: item.split(':')[1],
							available: true
						});
					}
					if (item.includes('卡号') || item.includes('卡')) {
						that.setData({
							kaNumber: item.split(':')[1]
						});
					}
					wx.hideLoading();
				});
			} else {
				wx.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, () => {}, (res) => {});
	},

	async next () {
		util.go(`/pages/default/receiving_address/receiving_address?isNewTrucks=${this.data.isNewTrucks}&perfect=0&isPost=1`);
		if (!this.data.available) return;
		this.setData({
			isRequest: true
		});
		await util.getDataFromServer('consumer/order/check-obu-no', {
			obuNo: this.data.obuNumber,
			mobilePhone: app.globalData.mobilePhone
		}, () => {
			util.showToastNoIcon('查询失败！');
		}, async (res) => {
			if (res.code === 0) {
				if (res.data?.orderId) { // 历史订单
					this.setData({orderId: res.data.orderId});
					await this.getOrderDetail();
				} else {
					// 去创建订单
					util.go(`/pages/default/receiving_address/receiving_address?isNewTrucks=${this.data.isNewTrucks}&perfect=0&isPost=1`);
				}
			} else {
				this.setData({
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
			this.setData({
				isRequest: false
			});
		});
	},
	async getOrderDetail () { // 根据订单ID 查询订单
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: this.data.orderId // 订单id
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			if (orderInfo.cardMobilePhone === app.globalData.mobilePhone) {
				// 跳转到"我的ETC"页
				util.go(`/pages/personal_center/my_etc/my_etc`);
			} else {
				util.showToastNoIcon('您输入的OBU号已被使用，请核对后重新输入');
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	onUnload () {

	}
});
