
Component({
	properties: {
		dropDownMenuTitle: {
			type: Array,
			value: []
		},
		dropDownMenuFilterData: {
			type: Array,
			value: []
		},
		dropDownMenuDistrictData: {
			type: Array,
			value: []
		},
		isOwe: {
			type: Boolean
		}
	},
	data: {
		// private properity
		district_open: false,
		district_open_wtapper: false,
		filter_open: false,
		filter_open_wtapper: false,
		shownavindex: '',
		dropDownMenuDistrictDataRight: {},
		district_left_select: '',
		district_right_select: '',
		district_right_select_name: '',
		selected_year_name: '',
		selected_filter_id: 0,
		year: '',
		chooseYear: '',
		month: '',
		selected_filter_name: ''
	},
	methods: {
		tapDistrictNav: function (e) {
			let date = new Date();
			const year = date.getFullYear();
			const month = date.getMonth();
			this.setData({
				year: year,
				month: month + 1
			});
			if (!this.data.district_right_select_name) {
				this.setData({
					dropDownMenuDistrictDataRight: this.data.dropDownMenuDistrictData[this.data.dropDownMenuDistrictData.length - 1].childModel,
					district_left_select: this.data.dropDownMenuDistrictData[this.data.dropDownMenuDistrictData.length - 1].id,
					district_right_select: this.data.dropDownMenuDistrictData[this.data.dropDownMenuDistrictData.length - 1].childModel[month].id,
					selected_year_name: this.data.dropDownMenuDistrictData[this.data.dropDownMenuDistrictData.length - 1].title,
					chooseYear: parseInt(this.data.dropDownMenuDistrictData[this.data.dropDownMenuDistrictData.length - 1].title)
				});
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
		tapFilterNav: function (e) {
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
		selectDistrictTop: function (e) {
			let model = e.target.dataset.model.childModel;
			let selectedId = e.target.dataset.model.id;
			let selectedTitle = e.target.dataset.model.title;
			this.setData({
				dropDownMenuDistrictDataRight: model == null ? '' : model,
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
		},
		selectDistrictBottom: function (e) {
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
		selectFilterItem: function (e) {
			let selectedTitle = e.target.dataset.model;
			this.closeHyFilter();
			this.setData({
				selected_filter_name: selectedTitle
			});
			this.triggerEvent('selectedItem', { index: this.data.shownavindex, selectedTitle: selectedTitle });
		},
		/** 关闭筛选 */
		closeHyFilter: function () {
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
	attached: function () {
	}
});
