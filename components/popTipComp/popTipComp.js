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
		wrapper: false,
		paramsList: [],
		noSliding: false // 是否禁止底层页面滑动
	},
	methods: {
		show (obj) {
			this.data.paramsList.push(obj);
			this.fangDou(() => {
				// 扣款失败 > 恢复签约 > 普通
				let kkIndex = this.data.paramsList.findIndex(item => item.title === '请尽快补缴欠款');	// 扣款失败
				let qyIndex = this.data.paramsList.findIndex(item => item.title === '无法正常扣款');	// 恢复签约
				this.setData({
					mask: true,
					wrapper: true,
					tipObj: kkIndex !== -1 ? this.data.paramsList[kkIndex] : qyIndex !== -1 ? this.data.paramsList[qyIndex] : this.data.paramsList[0],
					paramsList: this.data.paramsList,
					noSliding: true
				});
				console.log('传参：',this.data.paramsList);
			},400);
		},
		noSliding () {},
		// 防抖
		fangDou (fn, time) {
			let that = this;
			return (function () {
				if (that.data.timeout) {
					clearTimeout(that.data.timeout);
				}
				that.data.timeout = setTimeout(() => {
					fn.apply(this, arguments);
				}, time);
			})();
		},
		// 关闭弹窗
		hide (e) {
			app.globalData.isShowDeviceUpgradePop = true;

			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('cancelHandle');
				if (e) {	// 判断点击此方法关闭
					let title = e.currentTarget.dataset.title;
					let paramsList = this.data.paramsList.filter(item => item.title !== title);
					if (paramsList?.length !== 0) {
						this.setData({paramsList});
						this.show(paramsList[0]);
					} else {
						this.setData({paramsList: []});
					}
				} else {
					this.setData({paramsList: []});
				}
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
		// 中信 办理提醒
		citicBank () {
			// 跳转保证金支付页
			util.go(`/pages/default/new_pay/new_pay?pledgeType=${this.data.tipObj.pledgeType}&money=${this.data.tipObj.money}&equityMoney=${this.data.tipObj.equityMoney}`);
			this.hide(false);
		},
		// 前去补缴
		supplementaryPayment () {
			this.hide(false);
			if (this.data.tipObj.params.isTruck) {
				util.go(`/pages/account_management/precharge_account_details/precharge_account_details?Id=${app.globalData.isArrearageData.trucksOrderList[0]}`);
				return;
			}
			util.go('/pages/personal_center/arrears_bill/arrears_bill');
		},
		// 恢复签约
		resumeSigning () {
			this.triggerEvent('onHandle',this.data.tipObj.params);
			this.hide(false);
		},
		// 设备升级
		deviceUpgrade () {
			this.fangDou(() => {
				util.go(`/pages/device_upgrade/package/package`);
				this.hide(false);
			},300);
		}

	}
});
