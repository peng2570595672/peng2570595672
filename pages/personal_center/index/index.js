const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		showDetailWrapper: false,
		showDetailMask: false
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	// 扫码
	scan () {
		// 统计点击事件
		mta.Event.stat('023',{});
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				console.log(res);
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && val[1].length === 18 && key[1] === 'orderId') {
					util.getDataFromServer('consumer/member/bind-order', {
						orderId: val[1]
					}, () => {
						util.hideLoading();
					}, (res) => {
						util.hideLoading();
						if (res.code === 0) {
							// 判断状态
						} else {
							util.showToastNoIcon(res.message);
						}
					}, app.globalData.userInfo.accessToken);
				} else {
					util.showToastNoIcon('不支持的数据格式');
				}
			},
			fail: (res) => {
				util.showToastNoIcon('扫码失败');
			}
		});
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 0);
	}
});
