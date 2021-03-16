const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		viewObj: {
			type: Object,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false,
		tabIndex: 0,// tab下标
		viewObjId: undefined,
		description: undefined,
		packageRelationList: []
	},
	methods: {
		// tab切换
		tab (e) {
			let index = e.currentTarget.dataset['index'];
			this.setData({
				tabIndex: index,
				description: this.data.packageRelationList[index].description.replace(/<img([\s\w"-=\/\.:;]+)/ig, '<img$1 class="img"')
			});
		},
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
				if (this.data.viewObjId !== this.data.viewObj.id) {
					this.setData({
						viewObjId: this.data.viewObj.id,
						tabIndex: 0
					});
					this.getPackageRelation();
				} else {
					// 之前已经加载了数据 不再进行加载
					this.setData({
						mask: true,
						wrapper: true
					});
				}
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
		getPackageRelation () {
			util.showLoading();
			util.getDataFromServer('consumer/voucher/rights/get-package-relation', {
				packageId: this.data.viewObj.id
			}, () => {
			}, (res) => {
				if (res.code === 0) {
					res.data = res.data.filter(item => item.isShow);
					this.setData({
						packageRelationList: res.data,
						description: res.data[0]?.description.replace(/<img([\s\w"-=\/\.:;]+)/ig, '<img$1 class="img"')
					});
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				util.hideLoading();
				this.setData({
					mask: true,
					wrapper: true
				});
			});
		},
		// 点击半透明层
		onClickTranslucentHandle () {
			this.triggerEvent('onClickTranslucentHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {
		},
		// 立即选择
		choice () {
			this.triggerEvent('onClickDetailsHandle');
		}
	}
});
