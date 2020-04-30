const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		title: '',
		content: '',
		phone: '',
		details: '',
		validResult: '',
		enabled: false
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
	},
	bindInputChange (e) {
		// 值名称
		let name = e.currentTarget.dataset['name'];
		let data = {};
		data[name] = e.detail.value;
		this.setData(data);
	},
	/**
	 * 校验数据
	 */
	validate (field) {
		let flag = true;
		let input = '';
		let tips = '';
		let value = this.data[field];
		if (field === 'title') {
			if (!value || value.trim() === '') {
				flag = false;
				input = field;
				tips = '请输入标题！';
			}
		}
		if (field === 'content') {
			if (!value || value.trim() === '') {
				flag = false;
				input = field;
				tips = '请描述您遇到的问题！';
			}
		}
		if (field === 'phone') {
			if (!value || value.trim() === '') {
				flag = false;
				input = field;
				tips = '输入您的手机号！';
			} else if (!/^1[0-9]{10}$/.test(value)) {
				flag = false;
				input = field;
				tips = '手机号格式错误！';
			}
		}
		if (!flag) {
			this.setData({
				validResult: tips
			});
		}
		return flag;
	},
	/**
	 * 校验数据
	 */
	checkData () {
		let fields = [
			'title',
			'content',
			'phone'
		].reverse();
		let flag = true;
		let i = 0;
		fields.forEach(item => {
			flag = this.validate(item);
			if (!flag) {
				i++;
			}
		});
		this.setData({
			enabled: i === 0
		});
	},
	// 提交
	go () {
		this.checkData();
		if (!this.data.enabled) {
			util.showToastNoIcon(this.data.validResult);
			return;
		}
		this.subscribe();
	},
	// ETC服务状态提醒（B）
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['rWHTLYmUdcuYw-wKU0QUyORLybWxcHb7rmu4gACAlYA'],
				success: (res) => {
					wx.hideLoading();
					if (res.errMsg === 'requestSubscribeMessage:ok') {
						let keys = Object.keys(res);
						// 是否存在部分未允许的订阅消息
						let isReject = false;
						for (let key of keys) {
							if (res[key] === 'reject') {
								isReject = true;
								break;
							}
						}
						// 有未允许的订阅消息
						if (isReject) {
							util.alert({
								content: '检查到当前订阅消息未授权接收，请授权',
								showCancel: true,
								confirmText: '授权',
								confirm: () => {
									wx.openSetting({
										success: (res) => {
										},
										fail: () => {
											util.showToastNoIcon('打开设置界面失败，请重试！');
										}
									});
								},
								cancel: () => { // 点击取消按钮
									this.submit();
								}
							});
						} else {
							this.submit();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.submit();
					} else {
						util.alert({
							content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
							showCancel: true,
							confirmText: '打开设置',
							confirm: () => {
								wx.openSetting({
									success: (res) => {
									},
									fail: () => {
										util.showToastNoIcon('打开设置界面失败，请重试！');
									}
								});
							},
							cancel: () => {
								this.submit();
							}
						});
					}
				}
			});
		} else {
			util.alert({
				title: '微信更新提示',
				content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
				confirmText: '继续使用',
				showCancel: true,
				confirm: () => {
					this.submit();
				}
			});
		}
	},
	submit () {
		util.showLoading();
		let params = {
			title: this.data.title,
			appContent: this.data.content,
			phone: this.data.phone,
			vehPlate: this.data.details.vehPlate,
			channel: this.data.details.channel,
			billId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/bill-complain', params, () => {
			util.showToastNoIcon('提交账单申诉失败！');
		}, (res) => {
			if (res.code === 0) {
				let model = this.data.details;
				util.go(`/pages/personal_center/complaint_details/complaint_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
