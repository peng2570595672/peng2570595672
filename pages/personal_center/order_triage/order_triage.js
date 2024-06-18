const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		modules: [
			{ moduleClass: 'moduleOne', url: 'my_etc', typeName: 'ETC办理订单' },
			{ moduleClass: 'moduleTwo', url: 'service_purchase_record', typeName: '权益包购买订单' },
			// { moduleClass: 'moduleTwo', url: 'valueAddedServices', typeName: '增值服务' },
			{ moduleClass: 'moduleTwo', url: 'road_rescue', typeName: '道路救援' }
		]
	},
	onLoad (options) {

	},
	onShow () {

	},
	handleModuleTap (e) {
		let that = this;
		let url = e.currentTarget.dataset.url;
		if (url === 'road_rescue') {
			util.go(`/pages/road_rescue_orders/road_rescue/road_rescue`);
			return;
		}
		// 避免重复点击触发
		util.go(`/pages/personal_center/${url}/${url}?test=${that.data.test}`);
	}
});
