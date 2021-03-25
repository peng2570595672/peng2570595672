const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		current: {
			type: Number,
			value: 0
		},
		listOfPackages: {
			type: Array,
			value: []
		},
		regionCode: {
			type: Array,
			value: []
		}
	},
	data: {
		mask: false,
		wrapper: false
	},
	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
				if (this.data.listOfPackages.length === 0) {
					util.showToastNoIcon('未查询到套餐，请联系工作人员处理！');
					return;
				}
				this.setData({
					mask: true,
					wrapper: true
				});
			} else {
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						mask: false
					});
				}, 400);
			}
		},
		// 点击半透明层
		onClickTranslucentHandle () {
			this.triggerEvent('onClickTranslucentHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {
		},
		// 点击具体支付方式
		onClickItemHandle (e) {
			let index = e.currentTarget.dataset.index;
			index = parseInt(index);
			this.setData({
				current: index
			});
			let obj = this.data.listOfPackages[index];
			obj['areaCode'] = this.data.regionCode[0];
			this.triggerEvent('onClickItemHandle', {
				targetObj: obj
			});
		}
	}
});
