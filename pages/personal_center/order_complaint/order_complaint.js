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
		util.showLoading();
		let params = {
			title: this.data.title,
			appContent: this.data.content,
			phone: this.data.phone,
			vehPlate: this.data.details.vehPlate,
			billId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/bill-complain', params, () => {
			util.showToastNoIcon('提交账单申诉失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/personal_center/complaint_details/complaint_details?details=' + JSON.stringify(this.data.details));
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
