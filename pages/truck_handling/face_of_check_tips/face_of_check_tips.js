const util = require('../../../utils/util.js');
Page({
	onHandleUploadVideo () {
		util.go(`/pages/truck_handling/recording_user_information/recording_user_information`);
	}
});
