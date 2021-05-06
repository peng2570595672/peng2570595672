const app = getApp();
Component({
	options: {
		// multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	/**
	 * 组件的属性列表
	 */
	properties: {
	},
	/**
	 * 组件的初始数据
	 */
	data: {
		startX: undefined, // 滑动开始位置
		startY: undefined, // 滑动开始位置
		excursionX: undefined, // 偏移
		excursionY: undefined, // 偏移
		screenWidth: app.globalData.screenWindowAttribute.windowWidth // 屏幕宽度
	},
	/**
	 * 组件生命周期
	 */
	lifetimes: {
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		// 滑动开始
		touchStart (e) {
			if (e.touches.length === 1) {
				this.setData({
					startX: e.touches[0].clientX,
					startY: e.touches[0].clientY
				});
			}
		},
		// 滑动
		touchMove (e) {
			if (e.touches.length === 1) {
				const moveX = e.touches[0].clientX;
				const moveY = e.touches[0].clientY;
				const excursionX = this.data.startX - moveX;
				const excursionY = this.data.startY - moveY;
				this.setData({
					excursionX,
					excursionY
				});
			}
		},
		// 滑动结束
		touchEnd (e) {
			let that = this;
			if (that.data.excursionX !== '') {
				// 计算水平偏移大于垂直偏移的,就是左右滑动,反之就是上下滑动
				if (Math.abs(that.data.excursionX) < Math.abs(that.data.excursionY)) {
					// 上下滑动
					// console.log('上下');
					if (Math.abs(that.data.excursionY) < 50) return;// 避免防误触
					const slidingState = that.data.excursionY > 0 ? 1 : -1;
					that.triggerEvent('onClickSlidingState', {slidingState});
				}
			}
			that.setData({
				excursionX: '',
				excursionY: ''
			});
		}
	}
});
