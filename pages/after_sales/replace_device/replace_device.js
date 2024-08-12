import {wxApi2Promise} from '../../../utils/utils';

const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		afterSaleId: '',
		afterSaleInfo: {},
		carIndex: -1,
		deviceTypeIndex: -1,
		changeIndex: -1,
		changeList: [
			{value: 0, label: '换全套'},
			{value: 1, label: '换卡、换设备'}
		],
		carList: [
			{value: 0, vehPlates: '京A12345'},
			{value: 1, vehPlates: '京A12348'},
			{value: 2, vehPlates: '京A12349'}
		],
		deviceTypeList: [
			{value: 0, label: '插卡式'},
			{value: 1, label: '单片式'}
		],
		formData: {
			reason: '',
			logisticsNo: ''
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						util.hideLoading();
						this.getDetail();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
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
	validateAvailable (isToast) {
		if (this.data.carIndex === -1) {
			if (isToast) util.showToastNoIcon('请选择车牌！');
			return false;
		}
		if (this.data.deviceTypeIndex === -1) {
			if (isToast) util.showToastNoIcon('请选择设备类型！');
			return false;
		}
		if (!this.data.changeIndex === -1) {
			if (isToast) util.showToastNoIcon('请选择更换选项！');
			return false;
		}
		if (!this.data.formData.reason) {
			if (isToast) util.showToastNoIcon('请输入更换原因！');
			return false;
		}
		if (!this.data.formData.deliveryAddress) {
			if (isToast) util.showToastNoIcon('请输入新设备的收货地址');
			return false;
		}
		if (!this.data.formData.name) {
			if (isToast) util.showToastNoIcon('请输入收货人名称');
			return false;
		}
		if (!this.data.formData.phoneNumber) {
			if (isToast) util.showToastNoIcon('请输入收货人手机号码');
			return false;
		}
		if (!this.data.formData.logisticsNo) {
			if (isToast) util.showToastNoIcon('请输入更换设备寄出的快递单号');
			return false;
		}
		return true;
	},
	onLoad (options) {
		this.setData({
			afterSaleId: options.id
		});
		// this.setData({
		// 	available: this.validateAvailable()
		// });
		this.login();
	},
	handleSelectChange (e) {
		console.log('this.data.deviceTypeIndex',this.data.deviceTypeIndex);

		let type = e.currentTarget.dataset['type'];
		if (type === 'deviceType') {
			this.setData({
				deviceTypeIndex: +e.detail.value
			});
			// 根据设备类型 对应设置 更换选项列表
			if (this.data.deviceTypeIndex === 0) {
				this.setData({
					changeList: [
						{value: 0, label: '换全套'}
					]
				});
			}
			if (this.data.deviceTypeIndex === 1) {
				this.setData({
					changeList: [
						{value: 1, label: '换卡、换设备'}
					]
				});
			}
		} else if (type === 'vehPlates') {
			this.setData({
				carIndex: +e.detail.value
			});
		} else if (type === 'changeDevice') {
			this.setData({
				changeIndex: +e.detail.value
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
		} else if (key === 'phoneNumber' && value.length < 18) {
			value = value.substring(0, 20);
		}
		if (key === 'phoneNumber') {
			// 不是数字就清空输入
			if (!/^\d+$/.test(value)) {
				value = '';
			}
			// 不是电话格式就清空
			if (value.length === 11 && !/^1[3456789]\d{9}$/.test(value)) {
				value = '';
			}
		}
		formData[key] = value;
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	async getDetail () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/getById', {
			id: this.data.afterSaleId
		}, 'POST', true);
		result.data.deviceImgList = result.data.deviceImg.split(',');
		this.setData({
			afterSaleInfo: result.data
		});
	},
	handleApply () {
		util.go(`/pages/after_sales/device_logout/device_logout?afterSaleId=${this.data.afterSaleId}`);
	},
	handleCancel () {
		this.selectComponent('#popTipComp').show({
			type: 'tenth',
			title: '提示',
			content: '是否取消工单',
			btnCancel: '取消',
			btnconfirm: '确定',
			btnShadowHide: true,
			params: {
				type: 2
			}
		});
	},
	// 提交
	async handleSubmit () {
		// 校检必填项
		if (!this.validateAvailable(true)) {
			return;
		}
		console.log('11');
	},
	async handleUrgentProcessing () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/urge', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			util.showToastNoIcon('工单催办成功！');
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async handlePayOrder () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/pay', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			const res = await wxApi2Promise(wx.requestPayment, result.data.extraData, this);
			util.showToastNoIcon('支付成功！');
			this.getDetail();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async onHandle () {
		console.log('取消');
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/cancel', {
			id: this.data.afterSaleId
		}, 'POST', true);
		if (result.code === 0) {
			util.showToastNoIcon('取消成功！');
			this.getDetail();
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
