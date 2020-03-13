const app = getApp();
const util = require('../../../utils/util.js');
Page({
	data: {
		url: ''
	},
	onLoad(options) {
		let url = '';
		if (options.type === 'violation_enquiry'){
			url=`https://api.wesure.cn/app/h5-app-wedrive/index.html?checkIllegal=true&wtagid=116.75.3`;
		}else if (options.type === 'online_customer_service') {
			let businessType = encodeURIComponent('ETC+在线客服');
			url = `https://jimi3-chat.jd.com/bot?venderId=1563354131534&BusinessType=${businessType}&RegStatus=1`;
		} else {
		}
		this.setData({
			url: options.url ? decodeURIComponent(options.url) : encodeURI(url)
		});
	},
	loadHandle() {
		wx.setNavigationBarTitle({
			title: 'ETC+'
		});
	},
	getMessage(e) {
		console.log(e);
	}
});
