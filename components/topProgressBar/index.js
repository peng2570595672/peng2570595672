Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		progressStage: {
			type: Number,
			value: 0,
			observer: function (newVal, oldVal) {
				newVal = parseInt(newVal * 100);
				oldVal = parseInt(oldVal * 100);
				this.dataChange(newVal,oldVal);
			}
		},
		progressColor: {
			type: String,
			value: '#ECECEC'
		}
	},

	/**
	 * 组件的初始数据
	 */
	data: {
		mmm: 0
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		dataChange (newVal,oldVal) {
			if (oldVal === 0) {
				this.setData({
					mmm: newVal / 100
				});
				return;
			}
			let num = oldVal;
			if (newVal > oldVal) {
				setInterval(() => {
					if (num === newVal || num > newVal) {
						return;
					}
					num += 1;
					this.setData({
						mmm: num / 100
					});
				},10);
			} else {
				setInterval(() => {
					if (num === newVal || num < newVal) {
						return;
					}
					num -= 1;
					this.setData({
						mmm: num / 100
					});
				},10);
			}
		}
	}
});
