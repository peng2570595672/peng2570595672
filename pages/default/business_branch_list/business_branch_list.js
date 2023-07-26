const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabStatus: [],
		currentTab: '贵州省',
		page: 0,
		nextPageFlag: false, // 是否向下翻页
		listData: []
	},

	onLoad () {
		this.getProvinceData();
	},
	async getProvinceData () {
		const result = await util.getDataFromServersV2('/consumer/system/sysBussinessNodeInfo/provinceList', {});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		this.setData({
			tabStatus: result.data
		});
		this.data.tabStatus.map(item => {
			if (this.data.currentTab === item.province_name) {
				this.setData({
					currentTab: item.province_name
				});
			} else {
				this.setData({
					currentTab: this.data.tabStatus[0].province_name
				});
			}
		});
		this.getListData();
	},
	switchTab: function (e) {
		if (this.data.currentTab === e.target.dataset.current) return false;
		this.setData({
			currentTab: e.target.dataset.current
		});
		if (!this.data.currentTab) return false;
		this.setData({
			listData: [],
			page: 0
		});
		this.getListData();
	},
	// 下拉刷新
	async onPullDownRefresh () {
		this.setData({
			listData: [],
			page: 0
		});
		await this.getListData(() => { wx.stopPullDownRefresh(); });
	},
	// 页面上拉触底事件的处理函数
	async onReachBottom () {
		if (this.data.nextPageFlag) await this.getListData();
	},
	async getListData () {
		if (!this.data.page) this.data.page = 0;
		this.setData({
			page: this.data.page + 1
		});
		util.showLoading({title: '加载中'});
		let params = {
			page: this.data.page,
			pageSize: 10,
			provinceName: this.data.currentTab
		};
		const result = await util.getDataFromServersV2('/consumer/system/sysBussinessNodeInfo/getList', params);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		let list = result.data.list || [];
		this.setData({
			listData: this.data.listData.concat(list)
		});
		if (this.data.listData.length <= result.data.total) {
			this.setData({
				nextPageFlag: true
			});
		}
	},
	customerService (e) {
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone
		});
	}
});
