import {wxApi2Promise} from '../../../utils/utils';

const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		jumpList: [
			{icon: '',title: '售后工单',url: 'work_order',img: '',show: false},
			{icon: '',title: '设备注销',url: 'device_logout',img: '',show: true},
			{icon: '',title: 'ETC开关',url: 'select_device',img: '',show: true},
			{icon: '',title: '更换设备',url: 'replace_device',img: '',show: true}
		]
	},
	onLoad () {
	},
	async onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		}
	},
	goPath (e) {
		let index = +e.currentTarget.dataset['index'];
		const item = this.data.jumpList[index];
		switch (item.url) {
			case 'select_device':
				util.go(`/pages/after_sales/device_switch_peocess/${item.url}/${item.url}`);
				break;
			default:
				util.go(`/pages/after_sales/${item.url}/${item.url}`);
		}
	},
	async login () {
		const res = await wxApi2Promise(wx.login, {}, this.data);
		const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
			platformId: app.globalData.platformId, // 平台id
			code: res.code // 从微信获取的code
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
		// 已经绑定了手机号
		if (result.data.needBindingPhone !== 1) {
			app.globalData.userInfo = result.data;
			app.globalData.openId = result.data.openId;
			app.globalData.memberId = result.data.memberId;
			app.globalData.mobilePhone = result.data.mobilePhone;
			this.getOrderList();
		} else {
			wx.setStorageSync('login_info', JSON.stringify(result.data));
			util.go('/pages/login/login/login');
		}
	},
	async getOrderList () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params, 'POST', true);
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	}
});
