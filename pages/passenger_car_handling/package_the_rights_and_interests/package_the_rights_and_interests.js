/**
 * @author 老刘
 * @desc 选择套餐
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		listOfPackages: undefined,
		showListOfPackages: undefined,// 展示套餐列表
		choicePackages: undefined,// 选中套餐
		type: undefined,
		activeIndex: 0,
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
			{title: 'ETC设备与卡片', tips: '包邮'},
			{title: '设备质保两年'},
			{title: 'ETC设备与卡片'},
			{title: 'ETC设备与卡片'}
		],
		otherServiceList: [
			{title: '车主服务享便捷', subTitle: '价值168元'},
			{title: '生活服务享精彩', subTitle: '价值100元+'}
		],
		characteristicServiceList: [
			{title: '中国石油特惠加油'},
			{title: '高速通行享2倍积分'}
		]
	},
	onLoad (options) {
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
			item.productName = item.productName.slice(0, 4);
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
	// 获取套餐列表
	getListOfPackages (notList) {
		let shopId;
		if (notList) {
			shopId = app.globalData.miniProgramServiceProvidersId;
		} else {
			shopId = app.globalData.otherPlatformsServiceProvidersId ? app.globalData.otherPlatformsServiceProvidersId : app.globalData.miniProgramServiceProvidersId;
		}
		if (app.globalData.isSalesmanPromotion) {
			// 业务员推广&会员券进入
			shopId = app.globalData.salesmanMerchant;
		}
		util.showLoading();
		let params = {
			needRightsPackageIds: true,
			areaCode: this.data.dataMessage.regionCode[0],
			productType: 2,
			vehType: 1,
			platformId: app.globalData.platformId,
			shopId: shopId
		};
		util.getDataFromServer('consumer/system/get-usable-product', params, () => {
			util.showToastNoIcon('获取套餐失败!');
		}, (res) => {
			if (res.code === 0) {
				if (res.data.length === 0) {
					// 如果其他服务商过来办理 没有查询到套餐. 1.面对面活动,不处理  2.其他服务商过来,重新加载小程序自带套餐
					if ((app.globalData.isFaceToFaceCCB || app.globalData.isFaceToFaceICBC || app.globalData.isFaceToFaceWeChat) && app.globalData.faceToFacePromotionId) {
						return;
					}
					if (app.globalData.isSalesmanPromotion) {
						util.showToastNoIcon('未查询到套餐，请联系工作人员处理！');
						return;
					}
					if (app.globalData.isJinYiXing) {
						return;
					}
					if (shopId === app.globalData.miniProgramServiceProvidersId) {
						return;
					}
					app.globalData.isServiceProvidersPackage = false; // 该服务商没有套餐
					this.getListOfPackages(true);
				}
				let list = res.data;
				// 面对面活动过滤套餐
				if (app.globalData.faceToFacePromotionId) {
					let faceToFaceList = [];
					list = [];
					faceToFaceList = res.data.find((item) => {
						if (app.globalData.isFaceToFaceCCB) {
							return item.shopProductId === '746500057456570395';
						} else if (app.globalData.isFaceToFaceICBC) {
							return item.shopProductId === '746500057456570393';
						} else {
							return item.shopProductId === '746500057456570394';
						}
					});
					list.push(faceToFaceList);
				}
				if (shopId === app.globalData.miniProgramServiceProvidersId) {
					// 小程序普通入口 - 排序
					const sortBy = ['816378665509593088', '746500057456570391', '752966728193286144', '750381409908301824'];
					const customSort = ({ data, sortBy, sortField }) => {
						const sortByObject = sortBy.reduce(
							(obj, item, index) => ({
								...obj,
								[item]: index
							}),
							{}
						);
						return data.sort(
							(a, b) => sortByObject[a[sortField]] - sortByObject[b[sortField]]
						);
					};
					const listWithDefault = list.map(item => ({
						...item,
						sortStatus: sortBy.includes(item.shopProductId) ? item.shopProductId : 'other'
					}));
					list = customSort({
						data: listWithDefault,
						sortBy: [...sortBy, 'other'],
						sortField: 'sortStatus'
					});
				}
				this.mySetData({
					listOfPackages: list
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
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
			packageIds: this.data.choicePackagesObj?.rightsPackageIds
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
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
		this.mySetData({
			isOpen: false,
			isViewDetails: !this.data.chooseTheDetails,
			activeIndex: -1,
			viewObj: {},
			choicePackagesObj: undefined,
			choiceRightsAndInterestsObj: undefined,
			rightsAndInterestsList: [],
			activePackageIndex: -1,
			available: false,
			viewRightsAndInterests: undefined // 选择查看权益详情
		});
	},
	// 点击轮播图
	onClickSwiper (e) {
		let index = e.currentTarget.dataset['index'];
		this.setData({
			rightsAndInterestsList: [],
			choicePackagesObj: this.data.listOfPackages[index],
			activePackageIndex: index,
			choiceRightsAndInterestsObj: undefined,
			activeIndex: -1
		});
		if (this.data.choicePackagesObj?.rightsPackageIds.length) {
			// 获取权益
			this.getList();
		}
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
