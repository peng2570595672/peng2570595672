Component({
	properties: {
		// 这里定义了innerText属性，属性值可以在组件使用时指定
		index: {
			type: Number,
			value: 0
		},
		show: {
			type: Boolean,
			value: false
		},
		myNumber: {
			type: Array,
			default: []
		}
	},
	data: {
		// 这里是一些组件内部数据
		letters: [],
		currentDatas: [],
		numberNo: ['', '', '', '', '', ''],
		numberNoLength: 0,
		myShow: false,
		wrapper: false
	},
	methods: {
		clickKeyboard (e) {
			let index = parseInt(e.currentTarget.dataset['index']);
			if (this.data.currentDatas[index] === '完成') {
				if (this.data.numberNoLength !== 0 && this.data.numberNoLength !== 6) {
					return;
				}
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						myShow: false
					});
					this.triggerEvent('valueChange', {
						numberNo: this.data.numberNo,
						index: this.data.index,
						status: 'end',
						show: this.data.myShow
					});
				}, 400);
				return;
			}
			if (this.data.currentDatas[index] === 'b' || !this.data.currentDatas[index]) {
				return;
			} else if (this.data.currentDatas[index] === 'del') {
				let arr = this.data.numberNo;
				arr[this.data.index] = '';
				this.setData({
					numberNo: arr,
					index: --this.data.index
				});
				if (this.data.index === -1) {
					this.setData({
						index: 0
					});
				}
			} else {
				let arr = this.data.numberNo;
				arr[this.data.index] = this.data.currentDatas[index];
				this.setData({
					numberNo: arr,
					index: ++this.data.index
				});
			}
			this.triggerEvent('valueChange', {
				numberNo: this.data.numberNo,
				index: this.data.index,
				show: this.data.myShow
			});
			if (this.data.index === this.data.numberNo.length) {
				this.setData({
					wrapper: false
				});
				this.triggerEvent('valueChange', {
					numberNo: this.data.numberNo,
					index: this.data.index,
					show: false
				});
			}

			wx.canIUse('vibrateShort') && wx.vibrateShort();
		},
		showMethod (isShow) {
			let arr = this.data.myNumber;
			if (arr && arr.length !== 0) {
				if (arr.length === 6) {
					arr.push('');
				}
				this.setData({
					numberNo: arr,
					numberNoLength: arr.join('').length
				});
			}
			if (isShow) {
				this.setData({
					myShow: isShow,
					wrapper: true
				});
			} else {
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						myShow: false
					});
				}, 400);
			}
		},
		indexMethod (currentIndex, OldIndex) {
			if (currentIndex === OldIndex) {
				return;
			}
			this.setData({
				letters: '1234567890'.split('')
			});
			let datas = [];
			for (let i = 0; i < 10; i++) {
				if (this.data.letters[i] !== undefined) {
					datas.push(this.data.letters[i]);
				} else {
					datas.push('');
				}
			}
			// datas.push('b');
			datas.push('del');
			datas.push('完成');
			this.setData({
				currentDatas: datas
			});
		}
	},
	lifetimes: {
		attached () {
		}
	},
	observers: {
		show: function (isShow) {
			this.showMethod(isShow);
		},
		index: function (currentIndex, OldIndex) {
			this.indexMethod(currentIndex, OldIndex);
		}
	}
});
