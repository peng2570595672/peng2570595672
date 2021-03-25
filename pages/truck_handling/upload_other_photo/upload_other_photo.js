/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		backStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		truckHeadstock: {
			ocrObject: {}
		},// 车头照
		truckSidePhoto: {
		},// 侧身照
		promptObject: {
			content: '',
			isOk: true,
			isHide: false
		},
		vehPlates: undefined
	},
	onLoad (options) {
		this.setData({
			vehPlates: options.vehPlates
		});
		this.getOrderInfo();
	},
	onShow () {
		// 身份证正面
		let truck = wx.getStorageSync('truck-101');
		if (truck) {
			wx.removeStorageSync('truck-101');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		// 身份证反面
		truck = wx.getStorageSync('truck-102');
		if (truck) {
			wx.removeStorageSync('truck-102');
			if (app.globalData.truckHandlingOCRType) this.uploadFile(truck);
		}
		if (!app.globalData.truckHandlingOCRType) {
			// 没通过上传
			let truckHeadstock = wx.getStorageSync('truck-headstock');
			if (truckHeadstock) {
				truckHeadstock = JSON.parse(truckHeadstock);
				this.setData({
					faceStatus: 4,
					truckHeadstock: truckHeadstock
				});
				this.setData({
					available: this.validateData(false)
				});
			}
			let truckSidePhoto = wx.getStorageSync('truck-side-photo');
			if (truckSidePhoto) {
				truckSidePhoto = JSON.parse(truckSidePhoto);
				this.setData({
					backStatus: 4,
					truckSidePhoto: truckSidePhoto
				});
				this.setData({
					available: this.validateData(false)
				});
			}
		}
	},
	// 校验数据
	validateData (isToast) {
		if (this.data.faceStatus !== 4) {
			if (isToast) util.showToastNoIcon('请上传车头照！');
			return false;
		}
		if (this.data.truckHeadstock.ocrObject.plateNumber !== this.data.vehPlates) {
			if (isToast) util.showToastNoIcon(`当前车头照识别的车牌号与${this.data.vehPlates}不一致，请重新上传`);
			return;
		}
		if (!this.data.truckSidePhoto.fileUrl) {
			if (isToast) util.showToastNoIcon('请上传补充角度照！');
			return false;
		}
		return true;
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '7'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				let truckHeadstock = res.data.headstock;
				if (truckHeadstock) {
					truckHeadstock.ocrObject = {};
					truckHeadstock.ocrObject.plateNumber = truckHeadstock.vehPlate;
					this.setData({
						faceStatus: 4,
						truckHeadstock
					});
					if (truckHeadstock.sidewaysFileUrl) {
						this.setData({
							backStatus: 4,
							[`truckSidePhoto.fileUrl`]: truckHeadstock.sidewaysFileUrl
						});
					}
					this.setData({
						available: this.validateData(false)
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 下一步
	next () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true
		});
		mta.Event.stat('truck_for_other_photo_next',{});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '7', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			changeAuditStatus: false,// 修改不计入待审核
			headstockInfo: {
				vehPlate: this.data.truckHeadstock.ocrObject.plateNumber,// 车牌号 【dataType包含7】
				fileName: this.data.truckHeadstock.fileName, // 文件名称 【dataType包含7】
				fileGroup: this.data.truckHeadstock.fileGroup, // 所在组 【dataType包含7】
				fileUrl: this.data.truckHeadstock.fileUrl, // 访问地址 【dataType包含7】
				sidewaysFileUrl: this.data.truckSidePhoto.fileUrl // 侧身照
			}
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				const pages = getCurrentPages();
				const prevPage = pages[pages.length - 2];// 上一个页面
				prevPage.setData({
					isChangeHeadstock: true // 重置状态
				});
				wx.navigateBack({
					delta: 1
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				isRequest: false
			});
		});
	},
	uploadFile (path) {
		this.setData({backStatus: 2});
		// 上传文件
		util.uploadFile(path, () => {
			this.setData({backStatus: 3});
			util.showToastNoIcon('上传补充角度照失败！');
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 文件上传成功
					this.setData({
						backStatus: 4,
						truckSidePhoto: res.data[0]
					});
					wx.setStorageSync('truck-side-photo', JSON.stringify(res.data[0]));
					this.setData({
						available: this.validateData(false)
					});
				} else { // 文件上传失败
					this.setData({backStatus: 3});
					util.showToastNoIcon(res.message);
				}
			} else { // 文件上传失败
				this.setData({backStatus: 3});
				util.showToastNoIcon('上传补充角度照失败');
			}
		}, () => {
			util.hideLoading();
		});
	},
	// 上传图片
	uploadOcrFile (path) {
		this.setData({faceStatus: 2});
		// 上传并识别图片
		util.uploadOcrFile(path, 8, () => {
			this.setData({faceStatus: 3});
		}, (res) => {
			try {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRTyp = 0;
						if (res.data[0].ocrObject.plateNumber !== this.data.vehPlates) {
							this.setData({
								faceStatus: 3,
								[`promptObject.content`]: `当前车头照识别的车牌号与${this.data.vehPlates}不一致，请重新上传`
							});
							this.selectComponent('#notFinishedOrder').show();
							return;
						}
						this.setData({
							faceStatus: 4,
							truckHeadstock: res.data[0]
						});
						wx.setStorageSync('truck-headstock', JSON.stringify(res.data[0]));
					} else { // 识别失败
						this.setData({faceStatus: 3});
					}
				} else { // 识别失败
					this.setData({faceStatus: 3});
				}
			} catch (e) {
				this.setData({faceStatus: 3});
				util.showToastNoIcon('文件服务器异常！');
			}
		}, () => {
		});
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		// 识别中禁止修改
		if ((type === 101 && this.data.faceStatus === 2) || (type === 102 && this.data.backStatus === 2)) return;
		util.go(`/pages/truck_handling/shot_other_photo/shot_other_photo?type=${type}&pathUrl=${type === 101 ? this.data.truckHeadstock.fileUrl : this.data.truckSidePhoto.fileUrl}`);
	}
});
