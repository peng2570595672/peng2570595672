/**
 * @author 老刘
 * @desc 购买成功
 */
const util = require('../../../utils/util.js');
Page({
	next () {
		util.go(`/pages/personal_center/service_purchase_record/service_purchase_record`);
	}
});
