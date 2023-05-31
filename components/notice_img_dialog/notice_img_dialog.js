const util = require('../../utils/util.js');
const app = getApp();
/**
 * 可传参数
 * btnShadowHide: 控制点击阴影部分是否关闭弹窗
 * type：选择弹窗模块
 * title：弹窗标题
 * content：弹窗内容
 * btnCancel：弹窗返回按钮文本
 * btnconfirm：弹窗确认按钮文本
 * url: 图片路径或跳转页面路径
 */
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		// tipObj: {
		// 	type: Object,
		// 	value: {}
		// }
	},

	data: {
		tipObj: {},
		mask: false,
		wrapper: false
	},
	methods: {
		show (obj) {
			this.setData({
				mask: true,
				wrapper: true,
				tipObj: obj
			});
		},
		// 关闭弹窗
		hide (e) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
			}, 400);
		},
		handleNotice () {
			this.triggerEvent('onHandle', this.data.tipObj);
		}

	}
});
