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
		dataMessage: {
			htmlStr: '',
			available: false,
			isOpen: false,
			isViewDetails: true,
			activeIndex: -1,
			viewObj: {},
			listOfPackages: [],
			choicePackagesObj: undefined,
			choiceRightsAndInterestsObj: undefined,
			rightsAndInterestsList: [],
			regionCode: [],// 区域编码
			activePackageIndex: -1,
			viewRightsAndInterests: undefined // 选择查看权益详情
		},
		chooseTheDetails: false
	},
	onLoad (options) {
		this.mySetData({
			regionCode: JSON.parse(options.regionCode)
		});
		if (app.globalData.packagePageData) {
			this.setData({
				dataMessage: app.globalData.packagePageData
			});
			return;
		}
		this.getListOfPackages();
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
		this.mySetData({
			rightsAndInterestsList: [],
			choicePackagesObj: this.data.dataMessage.listOfPackages[index],
			activePackageIndex: index,
			choiceRightsAndInterestsObj: undefined,
			activeIndex: -1
		});
		this.mySetData({
			available: this.validateAvailable()
		});
		if (this.data.dataMessage.choicePackagesObj?.rightsPackageIds.length) {
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
