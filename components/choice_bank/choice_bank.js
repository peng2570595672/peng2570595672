Component({
	properties: {

	},
	data: {
		mask: false,
		wrapper: false
	},

	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
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
		onClickItemHandle () {
			this.triggerEvent('onClickItemHandle', {});
		}
	}
});
