const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../libs/obuMenu.js');
Page({
	data: {// deviceType 0-插卡 1-单片
		list: [// 内蒙 蒙通卡
			{name: '铭创（无卡式）', deviceType: 1,subTitle: '质保3年/高速通行95折', img: 'https://file.cyzl.com/g001/M01/DD/02/oYYBAGRd25yAePUUAAACak0wmzQ186.png'},
			{name: '埃特斯（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
			{name: '天地融（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
			// {name: '万集 OBU', subTitle: '质保3年/高速通行95折', img: '/images/etc.png'},
			{name: '铭创（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'}
		],
		obuActive_upDate: false,
		obuCardType: 2,// 默认蒙通卡
		activeIndex: -1
	},
	onLoad (options) {
		if (options.obuActive_upDate) {
			app.globalData.obuActive_upDate = options.obuActive_upDate;
			this.setData({
				obuActive_upDate: options.obuActive_upDate // 是否属于重写激活
			});
			wx.setNavigationBarTitle({title: '设备更新'});
		}
		if (options.obuCardType) {
			const obuCardType = +options.obuCardType;
			this.setData({
				obuCardType: obuCardType
			});
			if (obuCardType === 10) {
				// 湖南 湘通卡
				this.setData({
					list: [
						{name: '握奇（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '聚利（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '金溢（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '中路未来（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'}
						// {name: '铭创（无卡式）', deviceType: 1,subTitle: '质保3年/高速通行95折', img: 'https://file.cyzl.com/g001/M01/DD/02/oYYBAGRd25yAePUUAAACak0wmzQ186.png'}
					]
				});
			} else if (obuCardType === 4) {
				// 青海 青通卡
				this.setData({
					list: [
						{name: '聚利（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '万集（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '埃特斯（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '金溢（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'}
					]
				});
			} else if (obuCardType === 5) {
				// 天津 速通卡
				this.setData({
					list: [
						{name: '金溢（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '埃特斯（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '万集（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
						{name: '万集ONE9（插卡式）', deviceType: 0,subTitle: '质保3年/高速通行95折', img: '../images/etc.png'}
					]
				});
			} else if (obuCardType === 23) {
				// 河北交投 太行通
				this.setData({list: [{name: '金溢（无卡式）', deviceType: 1,subTitle: '质保3年/高速通行95折', img: 'https://file.cyzl.com/g001/M01/DD/02/oYYBAGRd25yAePUUAAACak0wmzQ186.png'}]});
			}
		}
	},
	onShow () {
	},
	handleDeviceType (e) {
		const index = +e.currentTarget.dataset.index;
		this.setData({
			activeIndex: index
		});
		wx.setStorageSync('installGuid', this.data.list[index].name);
		app.globalData.choiceDeviceIndex = index;
		if (!this.data.list[index].deviceType) {	// 插卡式
			if (app.globalData.obuActive_upDate) { // obuActive_upDate 重写激活 直接跳到激活页
				util.go('/pages/obu_activate/instructions/index');
				return;
			}
			util.go('/pages/obu_activate/guide/index');
		} else {	// 无卡式
			if (app.globalData.obuActive_upDate) { // obuActive_upDate 重写激活 直接跳到激活页
				util.go('/pages/obu_activate/neimeng_introduce/neimeng_introduce');
				return;
			}
			util.go('/pages/obu_activate/neimeng_guide/neimeng_guide');
		}
	}
});
