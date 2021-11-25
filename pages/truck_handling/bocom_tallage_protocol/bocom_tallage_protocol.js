// pages/truck_handling/bocom_tallage_protocol/bocom_tallage_protocol.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

	},
	copyLink () {
		wx.setClipboardData({
			data: 'http://www.chinatax.gov.cn/aeoi_index.html',
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log('===',res.data); // data 剪贴板的内容
					}
				});
			}
		});
	}
});
