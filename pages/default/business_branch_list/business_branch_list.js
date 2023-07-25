const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabStatus: [
			{name: '已支付1',id: 1},{name: '未支付2',id: 2},{name: '未支付3',id: 3},
			{name: '未支付4',id: 4},{name: '未支付5',id: 5},{name: '未支付6',id: 6},
			{name: '未支付7',id: 7},{name: '未支付8',id: 8},{name: '未支付9',id: 9}
		],
		currentTab: '贵州省',
		page: 0,
		nextpageFlag: false, // 是否向下翻页
		listData: []
	},
	async onLoad () {
		this.getListData();
		this.getProvinceData();
	},
	getProvinceData () {
		util.getDataFromServer('consumer/system/sysBussinessNodeInfo/provinceList', {}, () => {}, (res) => {
			if (res.code === 0) {
				this.setData({
					tabStatus: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	switchTab: function (e) {
		if (this.data.currentTab === e.target.dataset.current) {
			return false;
		}
		this.setData({
			currentTab: e.target.dataset.current
		});

		if (!this.data.currentTab) {
			return false;
		}
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
		if (!this.data.nextpageFlag) return;
		await this.getListData();
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
		if (this.data.listData.length >= result.data.total) {
			this.setData({
				nextpageFlag: true
			});
		}
	},
	customerService (e) {
		wx.makePhoneCall({
			phoneNumber: e.currentTarget.dataset.phone
		});
	}
});
