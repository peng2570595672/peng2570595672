const util = require('../../../utils/util.js');
Page({
	data: {
		stepArr: [
			{
				selected: true
			},
			{
				selected: false
			},
			{
				selected: false
			}
		], // 步骤导航
		drivingLicenseFace: {}
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		let drivingLicenseFace = wx.getStorageSync('international-driving-license-face');
		if (drivingLicenseFace) {
			drivingLicenseFace = JSON.parse(drivingLicenseFace);
			this.setData({
				drivingLicenseFace
			});
		}
	},
	selectionPic () {
		util.go(`/pages/international_driving_document/upload_shot_card/upload_shot_card?pathUrl=${this.data.drivingLicenseFace.fileUrl ? this.data.drivingLicenseFace.fileUrl : ''}`);
	},
	next () {
		wx.uma.trackEvent('IDL_for_upload_license_to_next');
		util.go('/pages/international_driving_document/license_information/license_information');
	}
});
