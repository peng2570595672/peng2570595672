const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
	},
	// 去服务费扣除说明
	goInstructions () {
		util.go('/pages/personal_center/service_fee_description/service_fee_description');
	},
	// 补缴
	payment () {
		// 统计补缴成功
		// 统计点击事件
		mta.Event.stat('020',{});
	}
});
