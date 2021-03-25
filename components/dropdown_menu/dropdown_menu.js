const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		initializationDate: {
			type: String,
			value: undefined
		},
		initializationVehPlates: {
			type: String,
			value: undefined
		},
		dropDownMenuTitle: {
			type: Array,
			value: []
		},
		vehicleList: {
			type: Array,
			value: []
		},
		passengerCarList: {
			type: Array,
			value: []
		},
		truckList: {
			type: Array,
			value: []
		},
		timeList: {
			type: Array,
			value: []
		},
		isOwe: {
			type: Boolean
		},
		isOweService: {
			type: Boolean
		}
	},
	data: {
		// private properity
		district_open: false,
		district_open_wtapper: false,
		filter_open: false,
		filter_open_wtapper: false,// 车辆选择是否开启
		shownavindex: '',
		timeListRight: {},
		district_left_select: '',
		district_right_select: '',
		district_right_select_name: '',
		selected_year_name: '',
		selected_filter_id: 0,
		year: '',
		chooseYear: '',
		month: '',
		selected_filter_name: '',// 选择车辆选项
		vehicleType: '全部车辆'
	},
	methods: {
		// ETC月结单提醒
		subscribe (e) {
			let index = e.currentTarget.dataset.nav;
			// 判断版本，兼容处理
			let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
			if (result >= 0) {
				util.showLoading({
					title: '加载中...'
				});
				wx.requestSubscribeMessage({
					tmplIds: ['nvT4xzj5ireqDxMBS_bjHtrpENs5JrWjiIAlMtcSFuI'],
					success: (res) => {
						wx.hideLoading();
						if (res.errMsg === 'requestSubscribeMessage:ok') {
							let keys = Object.keys(res);
							// 是否存在部分未允许的订阅消息
							let isReject = false;
							for (let key of keys) {
								if (res[key] === 'reject') {
									isReject = true;
									break;
								}
							}
							// 有未允许的订阅消息
							if (isReject) {
								util.alert({
									content: '检查到当前订阅消息未授权接收，请授权',
									showCancel: true,
									confirmText: '授权',
									confirm: () => {
										wx.openSetting({
											success: (res) => {
											},
											fail: () => {
												util.showToastNoIcon('打开设置界面失败，请重试！');
											}
										});
									},
									cancel: () => { // 点击取消按钮
										this.selectTap(e,index);
									}
								});
							} else {
								this.selectTap(e,index);
							}
						}
					},
					fail: (res) => {
						wx.hideLoading();
						// 不是点击的取消按钮
						if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
							this.selectTap(e,index);
						} else {
							util.alert({
								content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
								showCancel: true,
								confirmText: '打开设置',
								confirm: () => {
									wx.openSetting({
										success: (res) => {
										},
										fail: () => {
											util.showToastNoIcon('打开设置界面失败，请重试！');
										}
									});
								},
								cancel: () => {
									this.selectTap(e,index);
								}
							});
						}
					}
				});
			} else {
				util.alert({
					title: '微信更新提示',
					content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
					confirmText: '继续使用',
					showCancel: true,
					confirm: () => {
						this.selectTap(e,index);
					}
				});
			}
		},
		selectTap (e, index) {
			if (parseInt(index) === 0) {
				this.tapFilterNav(e);
			} else {
				this.tapDistrictNav(e);
			}
		},
		tapDistrictNav (e) {
			let date = new Date();
			const year = date.getFullYear();
			const month = date.getMonth();
			this.setData({
				year: year,
				month: month + 1
			});
			if (!this.data.district_right_select_name) {
				if (this.data.initializationDate) {
					// 月账单推送进入
					let setData = this.data.timeList.filter(item => {
						if (item.title.includes(this.data.initializationDate.slice(0, 4))) {
							return item;
						}
					});
					this.setData({
						district_left_select: setData[0].id,
						district_right_select: setData[0].childModel[parseInt(this.data.initializationDate.slice(4, 6)) - 1].id,
						timeListRight: setData[0].childModel,
						selected_year_name: setData[0].title,
						chooseYear: parseInt(setData[0].title)
					});
				} else {
					this.setData({
						timeListRight: this.data.timeList[this.data.timeList.length - 1].childModel,
						district_left_select: this.data.timeList[this.data.timeList.length - 1].id,
						district_right_select: this.data.timeList[this.data.timeList.length - 1].childModel[month].id,
						selected_year_name: this.data.timeList[this.data.timeList.length - 1].title,
						chooseYear: parseInt(this.data.timeList[this.data.timeList.length - 1].title)
					});
				}
			}
			if (this.data.district_open) {
				this.setData({
					district_open: false,
					district_open_wtapper: false,
					filter_open: false,
					filter_open_wtapper: false,
					shownavindex: 0
				});
			} else {
				this.setData({
					district_open: true,
					district_open_wtapper: true,
					filter_open: false,
					filter_open_wtapper: false,
					shownavindex: e.currentTarget.dataset.nav
				});
			}
			this.setData({
				toview: 'year0'
			});
		},
		tapFilterNav (e) {
			if (!this.data.selected_filter_name) {
				this.setData({
					selected_filter_name: this.data.dropDownMenuTitle[0]
				});
			}
			if (this.data.filter_open) {
				this.setData({
					district_open: false,
					district_open_wtapper: false,
					filter_open: false,
					filter_open_wtapper: false,
					shownavindex: 0
				});
			} else {
				this.setData({
					district_open: false,
					district_open_wtapper: false,
					filter_open: true,
					filter_open_wtapper: true,
					shownavindex: e.currentTarget.dataset.nav
				});
			}
		},
		selectDistrictTop (e) {
			let model = e.target.dataset.model.childModel;
			let selectedId = e.target.dataset.model.id;
			let selectedTitle = e.target.dataset.model.title;
			this.setData({
				timeListRight: model == null ? '' : model,
				district_left_select: selectedId,
				district_right_select: '',
				selected_year_name: selectedTitle,
				chooseYear: parseInt(selectedTitle)
			});
			if (model == null || model.length === 0) {
				this.closeHyFilter();
				this.triggerEvent('selectedItem', { index: this.data.shownavindex, selectedId: selectedId, selectedTitle: selectedTitle });
			}
		},
		hide () {
			const isChoice = this.data.district_open_wtapper;
			this.setData({
				district_open_wtapper: false,
				filter_open_wtapper: false
			});
			setTimeout(() => {
				this.setData({
					district_open: false,
					filter_open: false
				});
			}, 400);
			if (!isChoice) {
				this.triggerEvent('selectedItem', {
					index: this.data.shownavindex,
					selectedTitle: this.data.selected_filter_name || this.data.vehicleType
				});
			}
		},
		selectDistrictBottom (e) {
			let date = new Date();
			let selectedId = e.target.dataset.model.id;
			let selectedTitle = e.target.dataset.model.title;
			if (parseInt(this.data.selected_year_name) === this.data.year && parseInt(selectedTitle) > this.data.month) {
				return;
			}
			this.closeHyFilter();
			this.setData({
				district_right_select: selectedId,
				district_right_select_name: this.data.selected_year_name + selectedTitle + '月'
			});
			this.triggerEvent('selectedItem', { index: this.data.shownavindex, selectedId: selectedId, selectedTitle: selectedTitle });
		},
		selectFilterItem (e) {
			let selectedTitle = e.target.dataset.model;
			this.closeHyFilter();
			this.setData({
				selected_filter_name: selectedTitle
			});
			this.triggerEvent('selectedItem', { index: this.data.shownavindex, selectedTitle: selectedTitle });
		},
		choiceVehicleType (e) {
			let vehicleType = e.target.dataset.model;
			this.setData({
				vehicleType
			});
		},
		/** 关闭筛选 */
		closeHyFilter () {
			if (this.data.district_open) {
				this.setData({
					district_open_wtapper: false,
					filter_open_wtapper: false,
					filter_open: false
				});
				setTimeout(() => {
					this.setData({
						district_open: false
					});
				}, 400);
			} else if (this.data.filter_open) {
				this.setData({
					district_open: false,
					district_open_wtapper: false,
					filter_open_wtapper: false
				});
				setTimeout(() => {
					this.setData({
						filter_open: false
					});
				}, 400);
			}
		}
	},
	// 组件生命周期函数，在组件实例进入页面节点树时执行
	attached () {
	}
});
