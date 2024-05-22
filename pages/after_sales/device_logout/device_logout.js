
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		uploaderList: [],// 保存上传图片url的数组
		imageList: [],// ETC图片
		cutCardImg: '', // 剪卡图片
		carList: [],
		carIndex: -1,
		deviceTypeList: [
			{value: 0, label: '单片式'},
			{value: 1, label: '插卡式'}
		],
		deviceTypeIndex: -1,
		available: false,
		afterSaleId: '',
		formData: {
			reason: '',
			logisticsNo: ''
		}
	},
	onLoad (options) {
		if (options.afterSaleId) {
			this.setData({
				afterSaleId: options.afterSaleId
			});
		} else {
			let logoutDeviceInfo = wx.getStorageSync('logoutDeviceInfo');
			if (logoutDeviceInfo) {
				logoutDeviceInfo = JSON.parse(logoutDeviceInfo);
				for (const key in logoutDeviceInfo) {
					this.setData({
						[key]: logoutDeviceInfo[key]
					});
				}
			}
		}
		this.getCarList();
	},
	onShow () {
	},
	async getDetail () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/getById', {
			id: this.data.afterSaleId
		}, 'POST', true);
		result.data.deviceImgList = result.data.deviceImg.split(',');
		const carIndex = this.data.carList.findIndex(item => item.vehPlates === result.data.vehPlates);
		this.setData({
			carIndex,
			deviceTypeIndex: result.data.devType,
			cutCardImg: result.data.cutCardImg,
			uploaderList: result.data.deviceImgList,
			imageList: result.data.deviceImgList,
			'formData.logisticsNo': result.data.logisticsNo,
			'formData.reason': result.data.reason
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	async getCarList () {
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', {openId: app.globalData.openId}, 'POST', true);
		if (result.code === 0) {
			// 过滤未激活订单 && 非 北京聚利科技有限公司-空发-1074713552820379648 非天津特微-624263265781809152 非青海高速卡种
			const carList = result.data.filter(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.obuCardType !== 4 && item.shopId !== '1074713552820379648' && item.shopId !== '624263265781809152');
			this.setData({
				carList
			});
			if (this.data.afterSaleId) {
				this.getDetail();
			}
		}
	},
	handleSelectChange (e) {
		let type = e.currentTarget.dataset['type'];
		if (type === 'deviceType') {
			this.setData({
				deviceTypeIndex: +e.detail.value
			});
		} else if (type === 'vehPlates') {
			this.setData({
				carIndex: +e.detail.value
			});
		}
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 输入项值变化
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let value = e.detail.value.trim();
		let formData = this.data.formData;
		if (key === 'reason' && value > 100) {
			value = value.substring(0, 100);
		} else if (key === 'logisticsNo' && value > 20) {
			value = value.substring(0, 20);
		}
		formData[key] = value;
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 删除剪卡图片
	handleDeleteCutCardImg () {
		this.setData({
			cutCardImg: ''
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 删除ETC图片
	handleDeleteImg (e) {
		let that = this;
		let nowList = [];// 新数据
		let uploaderList = that.data.uploaderList;// 原数据
		that.data.uploaderList.map((item, index) => {
			if (index === +e.currentTarget.dataset.index) {
			} else {
				nowList.push(uploaderList[index]);
			}
		});
		this.setData({
			uploaderList: nowList
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 上传ETC图片
	handleUpload (e) {
		const type = +e.currentTarget.dataset.type;
		let count = 9;
		// type: 1 剪卡图片 2 ETC图片
		if (type === 1) {
			count = 1;
		}
		let that = this;
		wx.showActionSheet({
			itemList: ['拍照', '相册选择'],
			success: (res) => {
				wx.chooseImage({
					count: type === 1 ? 1 : count - that.data.uploaderList.length,
					sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
					sourceType: res.tapIndex === 0 ? ['camera'] : ['album'],
					success (res) {
						if (type === 1) {
							that.setData({
								cutCardImg: res.tempFilePaths[0]
							});
							that.setData({
								available: that.validateAvailable()
							});
							return;
						}
						that.data.uploaderList.concat(res.tempFilePaths);
						that.setData({
							uploaderList: that.data.uploaderList.concat(res.tempFilePaths)
						});
						that.setData({
							available: that.validateAvailable()
						});
					}
				});
			}
		});
	},
	validateAvailable (isToast) {
		if (this.data.carIndex === -1) {
			if (isToast) util.showToastNoIcon('请选择车牌！');
			return false;
		}
		if (!this.data.formData.reason) {
			if (isToast) util.showToastNoIcon('请输入注销原因！');
			return false;
		}
		if (this.data.deviceTypeIndex === -1) {
			if (isToast) util.showToastNoIcon('请选择设备类型！');
			return false;
		}
		if (this.data.deviceTypeIndex && !this.data.cutCardImg) {
			if (isToast) util.showToastNoIcon('请上传剪卡图片！');
			return false;
		}
		if (!this.data.uploaderList.length) {
			if (isToast) util.showToastNoIcon('请上传ETC设备图片！');
			return false;
		}
		if (!this.data.formData.logisticsNo) {
			if (isToast) util.showToastNoIcon('请输入快递单号！');
			return false;
		}
		return true;
	},
	// 提交
	async handleSubmit () {
		// 校检必填项
		if (!this.validateAvailable(true)) {
			return;
		}
		for (let i = 0; i < this.data.uploaderList.length; i++) {
			const item = this.data.uploaderList[i];
			if (item.includes('https')) {
				this.setData({
					imageList: [...new Set(this.data.imageList.concat(item))]
				});
				if (this.data.imageList.length >= this.data.uploaderList.length) {
					if (this.data.deviceTypeIndex === 0 || (this.data.deviceTypeIndex && this.data.cutCardImg.includes('https'))) {
						// 单片式 || (插卡式&&剪卡图)
						this.handleApply();
						// 避免多次调用
						break;
					} else {
						this.uploadImgFile(this.data.cutCardImg, 1);
					}
				}
			} else {
				this.uploadImgFile(item);
			}
		}
	},
	// 上传图片
	uploadImgFile (imgPath, type = 2) {
		// 先上传ETC图片,再上传剪卡图片,再提交注销申请
		// type: 1 剪卡图片 2 ETC图片
		const that = this;
		util.uploadFile(imgPath, () => {
			util.hideLoading();
			util.showToastNoIcon('上传图片失败！');
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				console.log(res);
				util.hideLoading();
				if (res.code === 0) { // 上传图片成功
					if (type === 1) {
						that.setData({
							cutCardImg: res.data[0].fileUrl
						});
						that.handleApply();
					} else {
						that.setData({
							imageList: [...new Set(that.data.imageList.concat(res.data[0].fileUrl))]
						});
						if (that.data.imageList.length === that.data.uploaderList.length) {
							that.setData({
								uploaderList: that.data.imageList
							});
							if (that.data.deviceTypeIndex === 0 || (that.data.deviceTypeIndex && that.data.cutCardImg.includes('https'))) {
								// 单片式 || (插卡式&&剪卡图)
								that.handleApply();
							} else {
								that.uploadImgFile(that.data.cutCardImg, 1);
							}
						}
					}
				} else { // 上传图片失败
					util.showToastNoIcon(res.message);
				}
			} else { // 上传图片失败
				util.hideLoading();
				util.showToastNoIcon('上传图片失败');
			}
		}, () => {
		}, () => {
		});
	},
	// 提交申请
	async handleApply () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/apply', {
			orderId: this.data.carList[this.data.carIndex].id,
			reason: this.data.formData.reason,
			devType: this.data.deviceTypeIndex,
			orderType: 1, // 1-注销
			cutCardImg: this.data.deviceTypeIndex ? this.data.cutCardImg : '',
			deviceImg: this.data.imageList.slice(0, 9),
			logisticsNo: this.data.formData.logisticsNo
		}, 'POST', true);
		if (result.code === 0) {
			if (result.data.judgeFlag) {
				// 查询到欠费
				// 需要缓存数据
				wx.setStorageSync('logoutDeviceInfo', JSON.stringify(this.data));
				this.selectComponent('#popTipComp').show({
					type: 'tenth',
					title: '提示',
					content: '当前车牌存在欠费，请补缴后重新申请',
					btnCancel: '取消',
					btnconfirm: '去补缴',
					btnShadowHide: true,
					params: {
						type: 1
					}
				});
				return;
			}
			util.showToastNoIcon('提交申请成功！');
			// 提交申请成功
			wx.redirectTo({
				url: `/pages/after_sales/work_order/work_order`
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查看示例
	handleExample (e) {
		let type = +e.currentTarget.dataset.type;
		this.selectComponent('#logoutExample').show({type: this.data.deviceTypeIndex ? 1 : 2});
	}
});
