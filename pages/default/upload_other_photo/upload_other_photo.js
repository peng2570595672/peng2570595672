/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isVerifyHeadshotVeh: true, // 是否校验车头照车牌 0-否 1-是
		headstock: {
			ocrObject: {}
		},// 车头照
		vehPlates: undefined
	},
	async onLoad (options) {
		this.setData({
			vehPlates: options.vehPlates
		});
		await this.getOrderInfo();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		// 身份证正面
		let path = wx.getStorageSync('passenger-car-101');
		if (path) {
			wx.removeStorageSync('passenger-car-101');
			if (app.globalData.handlingOCRType) this.uploadOcrFile(path);
		}
		if (!app.globalData.handlingOCRType) {
			// 没通过上传
			let headstock = wx.getStorageSync('passenger-car-headstock');
			if (headstock) {
				headstock = JSON.parse(headstock);
				this.setData({
					faceStatus: 4,
					headstock: headstock
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
		if (this.data.isVerifyHeadshotVeh) {
			if (this.data.headstock.ocrObject.plateNumber !== this.data.vehPlates) {
				if (isToast) util.showToastNoIcon(`当前车头照识别的车牌号与${this.data.vehPlates}不一致，请重新上传`);
				return;
			}
		}
		return true;
	},
	// 获取订单信息
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '7'
		});
		if (!result) return;
		if (result.code === 0) {
			let headstock = result.data.headstock;
			if (headstock) {
				headstock.ocrObject = {};
				headstock.ocrObject.plateNumber = headstock.vehPlate;
				this.setData({
					faceStatus: 4,
					headstock
				});
				this.setData({
					available: this.validateData(false)
				});
			}
			this.getProductOrderInfo();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 根据订单id获取套餐信息
	async getProductOrderInfo () {
        const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
            orderId: app.globalData.orderInfo.orderId
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                isVerifyHeadshotVeh: result.data.isVerifyHeadshotVeh === 1
            });
        }
    },
	// 下一步
	async next () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true
		});
		wx.uma.trackEvent('other_photo_next');
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '7', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			changeAuditStatus: 0,// 修改不计入待审核
			headstockInfo: {
				vehPlate: this.data.vehPlates,// 车牌号 【dataType包含7】
				fileName: this.data.headstock.fileName, // 文件名称 【dataType包含7】
				fileGroup: this.data.headstock.fileGroup, // 所在组 【dataType包含7】
				fileUrl: this.data.headstock.fileUrl // 访问地址 【dataType包含7】
			}
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];// 上一个页面
			prevPage.setData({
				isChangeHeadstock: true // 重置状态
			});
			wx.navigateBack({
				delta: 1
			});
		} else {
			util.showToastNoIcon(result.message);
		}
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
					// res.data[0].ocrObject.plateNumber = '贵ZQ0101';
					if (res.code === 0) { // 识别成功
						app.globalData.handlingOCRType = 0;
						try {
							if (this.data.isVerifyHeadshotVeh) { // 是否校验车头照车牌 0-否 1-是
								if (res.data[0].ocrObject.plateNumber !== this.data.vehPlates) {
									this.setData({
										faceStatus: 3
									});
									util.showToastNoIcon(`请上传与${this.data.vehPlates}一致的车头照片`);
									return;
								}
							}
							this.setData({
								faceStatus: 4,
								headstock: res.data[0]
							});
							this.setData({
								available: this.validateData(false)
							});
							wx.setStorageSync('passenger-car-headstock', JSON.stringify(res.data[0]));
						} catch (e) {
							this.setData({faceStatus: 3});
						}
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
		if (type === 101 && this.data.faceStatus === 2) return;
		util.go(`/pages/default/shot_other_photo/shot_other_photo?type=${type}&pathUrl=${this.data.headstock.fileUrl}`);
	}
});
