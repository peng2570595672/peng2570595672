const util = require('../../utils/util.js');
const app = getApp();
/**
 * btnShadowHide: 控制点击阴影部分是否关闭弹窗
 * type：选择弹窗模块
 * title：弹窗标题
 * content：弹窗内容
 * btnCancel：弹窗返回按钮文本
 * btnconfirm：弹窗确认按钮文本
 */
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		tipObj: {
			type: Object,
			value: {}
		}
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
		hide () {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('cancelHandle');
			}, 400);
		},
		// 小程序页面内部跳转	跳转 指定页面
		go (e) {
			let src = e.currentTarget.dataset.src;
			util.go(src);
			this.setData({
				mask: false,
				wrapper: false
			});
		},
		// 前去补缴
		supplementaryPayment () {
			this.hide();
			if (this.data.tipObj.params.isTruck) {
				util.go(`/pages/account_management/precharge_account_details/precharge_account_details?orderId=${app.globalData.isArrearageData.trucksOrderList[0]}`);
				return;
			}
			util.go('/pages/personal_center/arrears_bill/arrears_bill');
		},
		// 恢复签约
		resumeSigning () {
			this.triggerEvent('onHandle',this.data.tipObj.params);
			this.hide();
		}

	}
});
