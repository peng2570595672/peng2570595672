const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
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
