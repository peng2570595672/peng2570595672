/**
 * @author 老刘
 * @desc 首页
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		showIndex: 0,
		listOfPackages: undefined,
		showListOfPackages: undefined,// 展示套餐列表
		choicePackages: undefined,// 选中套餐
		type: undefined,
		animationLsi: undefined,
		animationLsi1: undefined,
		animationLsi2: undefined,
		equitiesList: [
			{title: '80元通行券', price: '30'},
			{title: '800元通行券', price: '30'},
			{title: '800元通行券', price: '30'},
			// {title: '800元通行券', price: '30'},
			// {title: '800元通行券', price: '30'},
			// {title: '800元通行券', price: '30'},
			// {title: '800元通行券', price: '30'},
			// {title: '800元通行券', price: '30'},
		],
		basicServiceList: [
			{title: 'ETC设备与卡片'},
			{title: '设备质保两年'},
			{title: 'ETC设备与卡片'},
			{title: 'ETC设备与卡片'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		]
	},
	onLoad (options) {
		console.log(options);
		if (!options.type) {
			// 已选择套餐 && 未支付
			return;
		}
		const packages = app.globalData.newPackagePageData;
		this.setData({
			type: parseInt(options.type),
			listOfPackages: parseInt(options.type) === 1 ? packages.divideAndDivideList : packages.alwaysToAlwaysList
		});
		this.setData({
			listOfPackages: this.data.listOfPackages.reverse()
		});
		this.data.listOfPackages.map((item, index) => {
			item.top = 600 - index * 300;
		});
		this.setData({
			listOfPackages: this.data.listOfPackages
		});
		this.setData({
			showListOfPackages: this.data.equitiesList
		});
	},
	onShow () {
	},
	onClickSlidingState (e) {
		if (e.detail.slidingState === 1) {
			console.log('-------------上滑-----------');
		} else {
			console.log('-------------下滑-----------');
			this.data.showListOfPackages.map((item, index) => {
				let site = 0;
				// if (index === 2) {
				// 	site = 1000;
				// } else {
				// 	if (item.animationLsi) {
				// 		site = item.animationLsi.actions[0].animates[0].args[0] + this.getPx(100);
				// 	} else {
				// 		site = this.getPx(300);
				// 	}
				// }
				if (item.animationLsi) {
					site = item.animationLsi.actions[0].animates[0].args[0] + this.getPx(300);
				} else {
					if (this.data.showIndex !== 2) {
						site = this.getPx(800);
					} else {
						site = this.getPx(300);
					}
				}
				item.animationLsi = util.wxAnimation((this.data.showListOfPackages.length - 1 - index) * 100, site, 'translateY');
			});
			this.setData({
				showIndex: this.data.showIndex + 1,
				showListOfPackages: this.data.showListOfPackages
			});
			// 向数组后面插入对象
			// let obj = this.data.listOfPackages.shift();
			// this.data.listOfPackages.push(obj);
			let obj = this.data.listOfPackages.pop();
			this.data.listOfPackages.unshift(obj);
			this.data.listOfPackages[this.data.listOfPackages.length - 1].animationLsi = undefined;
			setTimeout(() => {
				this.setData({
					listOfPackages: this.data.listOfPackages
				});
			}, 200);
		}
	},
	// px转rpx-wxAnimation方法使用的是px
	getPx (size) {
		return size / 750 * wx.getSystemInfoSync().windowWidth;
	},
	onclickMorePackage () {
		this.data.equitiesList.map((item, index) => {
			item.animationLsi = util.wxAnimation((this.data.equitiesList.length - 1 - index) * 100 + 100, -500, 'translateX');
		});
		this.setData({
			animationBtn: util.wxAnimation(0, 500, 'translateY'),
			animationTitle: util.wxAnimation(this.data.equitiesList.length * 100 + 100, -500, 'translateX'),
			equitiesList: this.data.equitiesList
		});
	},
	leftSlideOut () {
		this.data.equitiesList.map((item, index) => {
			item.animationLsi = util.wxAnimation((this.data.equitiesList.length - 1 - index) * 100, 0);
		});
		this.setData({
			animationBtn: util.wxAnimation(0, 0, 'translateY'),
			animationTitle: util.wxAnimation(this.data.equitiesList.length * 100 + 100, 0),
			equitiesList: this.data.equitiesList
		});
	},
	// 选择权益
	onClickDetailsHandle (e) {
		this.mySetData({
			choiceRightsAndInterestsObj: this.data.dataMessage.viewObj,
			activeIndex: this.data.dataMessage.viewObj.index
		});
		this.mySetData({
			available: this.validateAvailable()
		});
		this.data.dataMessage.viewRightsAndInterests.switchDisplay(false);
	},
	// 属性值不能为undefined
	mySetData (obj) {
		let dataMessageList = [
			'htmlStr',
			'available',
			'isOpen',
			'isViewDetails',
			'activeIndex',
			'viewObj',
			'listOfPackages',
			'choicePackagesObj',
			'choiceRightsAndInterestsObj',
			'rightsAndInterestsList',
			'regionCode',
			'activePackageIndex',
			'viewRightsAndInterests'
		];
		let tergetKeys = Object.keys(obj);
		let dataMessage = this.data.dataMessage;
		let tempObj = {};
		for (let key of tergetKeys) {
			if (dataMessageList.indexOf(key) !== -1) {
				dataMessage[key] = obj[key];
			} else {
				tempObj[key] = obj[key];
			}
		}
		tempObj['dataMessage'] = dataMessage;
		this.setData(tempObj);
	},
	viewDetails (e) {
		let index = e.currentTarget.dataset['index'];
		this.mySetData({
			isViewDetails: false,
			isOpen: !this.data.dataMessage.isOpen,
			htmlStr: this.data.dataMessage.listOfPackages[index].description
		});
		this.data.chooseTheDetails = true;
	},
	// 查看权益详情
	viewRightsAndInterests (e) {
		let index = e.currentTarget.dataset['index'];
		let viewObj = this.data.dataMessage.rightsAndInterestsList[index];
		viewObj.index = index;
		this.mySetData({
			viewRightsAndInterests: this.selectComponent('#viewRightsAndInterests'),
			viewObj: viewObj
		});
		this.data.dataMessage.viewRightsAndInterests.switchDisplay(true);
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.dataMessage.viewRightsAndInterests.switchDisplay(false);
	},
	// 选择权益
	choiceRightsAndInterests (e) {
		let index = e.currentTarget.dataset['index'];
		this.mySetData({
			activeIndex: index,
			choiceRightsAndInterestsObj: this.data.dataMessage.rightsAndInterestsList[index]
		});
		this.mySetData({
			available: this.validateAvailable()
		});
	},
	// 校验字段是否满足
	validateAvailable () {
		let isOk = true;
		isOk = isOk && this.data.dataMessage.choicePackagesObj;
		if (this.data.dataMessage.choicePackagesObj?.mustChoiceRightsPackage === 1) {
			isOk = isOk && this.data.dataMessage.choiceRightsAndInterestsObj;
		}
		return isOk;
	},
	// 获取权益列表
	getList () {
		util.showLoading();
		util.getDataFromServer('consumer/voucher/rights/get-packages-by-package-ids', {
			packageIds: this.data.dataMessage.choicePackagesObj?.rightsPackageIds
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.mySetData({
					rightsAndInterestsList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 轮播图滚动后回调
	currentChange (e) {
		// this.mySetData({
		// 	isOpen: false,
		// 	isViewDetails: !this.data.chooseTheDetails,
		// 	activeIndex: -1,
		// 	viewObj: {},
		// 	choicePackagesObj: undefined,
		// 	choiceRightsAndInterestsObj: undefined,
		// 	rightsAndInterestsList: [],
		// 	activePackageIndex: -1,
		// 	available: false,
		// 	viewRightsAndInterests: undefined // 选择查看权益详情
		// });
	},
	// 点击轮播图
	onClickSwiper (e) {
		// let index = e.currentTarget.dataset['index'];
		// this.mySetData({
		// 	rightsAndInterestsList: [],
		// 	choicePackagesObj: this.data.dataMessage.listOfPackages[index],
		// 	activePackageIndex: index,
		// 	choiceRightsAndInterestsObj: undefined,
		// 	activeIndex: -1
		// });
		// this.mySetData({
		// 	available: this.validateAvailable()
		// });
		// if (this.data.dataMessage.choicePackagesObj?.rightsPackageIds.length) {
		// 	// 获取权益
		// 	this.getList();
		// }
	},
	next () {
		if (!this.data.dataMessage.available) return;
		app.globalData.packagePageData = this.data.dataMessage;
		wx.navigateBack({
			delta: 1
		});
	},
	onUnload () {
		app.globalData.packagePageData = this.data.dataMessage;
	}
});
