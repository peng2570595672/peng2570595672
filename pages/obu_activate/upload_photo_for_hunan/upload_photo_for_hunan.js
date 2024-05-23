/**
 *  湖南上传安装照片
 */
const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({
	data: {
		pic10: '',
		progress10: 0,
		picText10: '',
		pic11: '',
		progress11: 0,
		picText11: '',
		clickEnabled: false, // 是否可以点击按钮
		pictureWidth: 0,
		pictureHeight: 0,
		isSouci: true,
		isRequest: false
	},
	onLoad () {
		// 2984 7520
		// app.globalData.orderInfo.orderId = '648127997961830400';
		// 3382 7516
		// app.globalData.orderInfo.orderId = '656070623906234368';
		app.globalData.newOrderId = '';
		let baseInfo = wx.getStorageSync('baseInfo');
		if (baseInfo.obuStatus) {
			this.uploadOrderForObu();
		}
	},
	onShow () {
		let path = wx.getStorageSync('path-10');
		if (path) {
			wx.removeStorageSync('path-10');
			this.progressPhoto(path, 10);
		}
		path = wx.getStorageSync('path-11');
		if (path) {
			wx.removeStorageSync('path-11');
			this.progressPhoto(path, 11);
		}
	},
	// 更新订单（obu发行）
	async uploadOrderForObu (DeviceListNo) {
		this.setData({msg: '更新订单中...'});
		const res = await util.getDataFromServersV2('/consumer/etc/hunan/v2/common/getObuOrderId', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (res.code === 0) {
			if (res.data.obuOrderId) {
				app.globalData.newOrderId = res.data.obuOrderId;
			}
			this.setData({
				isSouci: !!res.data.obuOrderId
			});
		} else {}
	},
	// 压缩处理图片
	progressPhoto (path, type) {
		if (wx.canIUse('compressImage')) {
			// 压缩图片
			wx.compressImage({
				src: path, // 图片路径
				quality: app.globalData.quality, // 压缩质量
				success: (res) => {
					path = res.tempFilePath;
				},
				complete: () => {
					this.getPictureInfo(path, type);
				}
			});
		} else {
			this.getPictureInfo(path, type);
		}
	},
	getPictureInfo (path, type) {
		compressPicturesUtils.processingPictures(this, path, 'pressCanvas', 640, (res) => {
			if (res) { // 被处理
				this.upload(res, type);
			} else { // 未被处理
				this.upload(path, type);
			}
		});
	},
	// 上传
	upload (path, selfType) {
		let obj = {};
		obj[`pic${selfType}`] = '';
		obj[`picText${selfType}`] = '上传中...';
		obj[`progress${selfType}`] = 1;
		this.setData(obj);
		util.uploadFile(
			path,
			() => {
				obj = {};
				obj[`pic${selfType}`] = '';
				obj[`picText${selfType}`] = '上传失败';
				obj[`progress${selfType}`] = 0;
				this.setData(obj);
			},
			(res) => {
				res = JSON.parse(res);
				obj = {};
				if (res.code === 0) {
					obj[`picText${selfType}`] = '';
					obj[`pic${selfType}`] = res.data[0].fileUrl;
					obj[`progress${selfType}`] = 100;
					this.setData(obj);
				} else {
					obj[`pic${selfType}`] = '';
					obj[`picText${selfType}`] = res.message;
					obj[`progress${selfType}`] = 0;
					this.setData(obj);
				}
			},
			() => {
				this.setClickEnabled();
			},
			(res) => {
				obj = {};
				obj[`progress${selfType}`] = res.progress;
				obj[`picText${selfType}`] = res.progress === 100 ? '加载中...' : '上传中...';
				this.setData(obj);
				this.setClickEnabled();
			}
		);
	},
	// 选择图片 并压缩
	selectionPic (e) {
		let type = e.currentTarget.dataset['type'];
		console.log(type);
		wx.showActionSheet({
			itemList: ['拍照', '相册选择'],
			success: (res) => {
				if (res.tapIndex === 0) {
					util.go(`/pages/obu_activate/camera/camera?type=${type}&title=${parseInt(type) === 0 ? 'OBU车内照' : 'OBU车外安装照片，带车 牌号'}`);
				} else {
					wx.chooseImage({
						count: 1,
						sizeType: ['original', 'compressed'],
						sourceType: ['album'],
						success: (res) => {
							let path = res.tempFilePaths[0];
							this.progressPhoto(path, parseInt(type));
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
	// 是否可点击
	setClickEnabled () {
		this.setData({
			clickEnabled: this.data.pic10 && this.data.pic11
		});
	},
	// 提交图片
	async submit (type) {
		let res = await util.getDataFromServersV2('consumer/etc/hunan/common/vehicle',{
			orderId: app.globalData.orderInfo.orderId,
			type: type, // 二发
			imageType: 1,
			image: this.data.pic10
		});
		if (res.code === 0) {
			let result = await util.getDataFromServersV2('consumer/etc/hunan/common/vehicle',{
				orderId: app.globalData.orderInfo.orderId,
				type: type, // 二发
				imageType: 2,
				image: this.data.pic11
			});
			wx.hideLoading();
			this.setData({
				clickEnabled: true
			});
			if (result.code === 0) {
				const index = app.globalData.choiceDeviceIndex;
				switch (index) {
					case 0:
						// 握奇
						util.go('/pages/obu_activate/hunan/watchdata_plugn/watchdata_plugn');
						break;
					case 1:
						// 聚利
						util.go('/pages/obu_activate/hunan/juli/juli');
						break;
					case 2:
						// 金溢
						util.go('/pages/obu_activate/hunan/genvict/genvict');
						break;
					case 3:
						// 中路未来
						util.go('/pages/obu_activate/hunan/juli/juli');
						break;
					// case 4:
					// 	util.go('/pages/obu_activate/hunan/connect_bluetooth_for_hunanmc_new/connect_bluetooth_for_hunanmc_new');
					// 	break;
				}
			} else {
				this.isOver(result.message);
			}
		} else {
			this.isOver(res.message);
		}
	},
	// 下一步
	async next () {
		wx.showActionSheet({
			// , '铭创'
			itemList: ['握奇', '聚力', '金溢', '中路未来'],
			success: (res) => {
				switch (res.tapIndex) {
					case 0:
						// 握奇
						wx.uma.trackEvent('choice_hunan_woqi');
						util.go('/pages/obu_activate/hunan/watchdata_plugn/watchdata_plugn');
						break;
					case 1:
						// 聚利
						wx.uma.trackEvent('choice_hunan_juli');
						util.go('/pages/obu_activate/hunan/juli/juli');
						break;
					case 2:
						// 金溢
						wx.uma.trackEvent('choice_hunan_jinyi');
						util.go('/pages/obu_activate/hunan/genvict/genvict');
						break;
					case 3:
						// 中路未来 - 使用聚利
						wx.uma.trackEvent('choice_hunan_zlwl');
						// util.go('/online_distribution/pages/connect_bluetooth_for_hunanzhongluweilai/connect_bluetooth_for_hunanzhongluweilai');
						util.go('/pages/obu_activate/hunan/juli/juli');
						break;
					// case 4:
					// 	if (this.data.isSouci) {
					// 		util.go('/pages/obu_activate/connect_bluetooth_for_hunanmc_new/connect_bluetooth_for_hunanmc_new');
					// 	} else {
					// 		util.go('/pages/obu_activate/hunan/mc_new/mc_new');
					// 	}
					// 	break;
				}
			},
			fail (res) {
				if (res.errMsg !== 'showActionSheet:fail cancel') {
					util.showToastNoIcon('请重试！');
				}
			}
		});

		// if (!this.data.clickEnabled) {
		// 	return;
		// }
		// this.setData({
		// 	clickEnabled: false
		// });
		// wx.uma.trackEvent('hunan_upload_pictures_next');
		// util.showLoading({
		// 	title: '提交中...'
		// });
		// // 查询订单是否为二次激活
		// let params = {
		// 	currentUserId: app.globalData.memberId,
		// 	orderId: app.globalData.orderInfo.orderId
		// };
		// let res = await util.getDataFromServersV2('consumer/etc/hunan/common/hunanissueOrderQuery',params);
		// if (res.code === 0) {
		// 	let type = parseInt(res.data.order_status) === 7 ? 1 : 0;
		// 	this.submit(type);
		// } else {
		// 	wx.hideLoading();
		// 	this.setData({
		// 		clickEnabled: true
		// 	});
		// 	util.alert({
		// 		title: '提交失败',
		// 		content: res.message,
		// 		confirmText: '知道了',
		// 		showCancel: false,
		// 		confirm: () => {
		// 		},
		// 		cancel: () => {
		// 		}
		// 	});
		// }
	},
	isOver (msg) {
		wx.hideLoading();
		this.setData({
			clickEnabled: true
		});
		util.showToastNoIcon(msg);
	}
});
