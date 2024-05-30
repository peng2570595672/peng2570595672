const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        orderTabList: [
            {name: '日结', billingMethod: 1},
            {name: '周结', billingMethod: 2}
				],
        listOfPackagesTrucks: [], // 赛选后展示货车的套餐
        activeTypeIndex: 0, // 控制结算方式类型 按钮
        isFade: true,
        activeIndex: 0,
        isCloseUpperPart: false, // 控制 详情是否显示
        isCloseUpperPart1: false, // 控制 详情是否显示
        isCloseUpperPart2: false, // 控制 详情是否显示
        nodeHeightList: [], // 存储节点距离top 集合
        equityListMap: [],	// 权益列表集合
        isSalesmanOrder: false,// 是否是业务员端办理
        isRequest: false,// 是否请求中
        orderInfo: undefined,// 订单信息
        listOfPackages: undefined,
        CopylistOfPackages: undefined,
        choiceIndex: 0,// 当前选中套餐下标
        activeEquitiesIndex: -1,// 当前选中权益包
        rightsAndInterestsList: [],// 加购权益列表
        rightsPackageDetails: undefined,
        isLoaded: false, // 是否加载数据完成
        getAgreement: false // 是否接受协议
    },
    async onLoad (options) {
        if (!app.globalData.orderInfo.orderId) return;
        app.globalData.isTelemarketing = false;
        // !options.type 已选择套餐 && 未支付
        await this.getOrderInfo(!options.type);
        if (!options.type) {
            return;
        }
        const packages = app.globalData.newPackagePageData;
        this.setData({ // 复制一份所有套餐
            CopylistOfPackages: parseInt(options.type) === 1 ? packages.divideAndDivideList : packages.alwaysToAlwaysList
        });
        let listOfPackagesTrucks = this.data.CopylistOfPackages.filter((item) => { // 从复制的所有货车套餐中进行筛选 默认展示日结
            return item.billingMethod === 1;
        });
        this.setData({
            listOfPackages: listOfPackagesTrucks
        });
        // 获取 套餐模块的高度
        this.getNodeHeight(this.data.listOfPackages.length);
        // 查询是否欠款
        await util.getIsArrearage();
        // 进入套餐页面 调用车牌限制接口
        this.getLicensePlateRestrictions();
    },
    onShow (res) {
    },
    async getLicensePlateRestrictions () {
      const result = await util.getDataFromServersV2('consumer/system/veh/limit', {
        shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,
        vehPlates: this.data.vehPlates || this.data.orderInfo.base.vehPlates
      });
      if (!result) return;
      if (result.code === 0) {
        if (result.data.canHandle === 0) {
          util.alert({
            title: `套餐选择提醒`,
            content: `尊敬的用户，您选择的套餐不支持以${result.data.limitArea}地区车牌办理，请选择其他套餐或更改车牌信息`,
            confirmColor: '#576B95',
            cancelColor: '#000000',
            cancelText: '确定',
            confirm: () => {

            },
            cancel: async () => {
            }
        });
          this.setData({
            activeIndex: -1,
            choiceIndex: -1
          });
        }
    } else {
        util.showToastNoIcon(result.message);
    }
    },
    // 获取 套餐信息
    async getProductOrderInfo () {
        const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
            orderId: app.globalData.orderInfo.orderId,
            needRightsPackageIds: true
        });
        if (!result) return;
        if (result.code === 0) {
            try {
                result.data.descriptionList = JSON.parse(result.data.description);
            } catch (e) {
            }
            const orderTabList = this.data.orderTabList.filter(item => item.billingMethod === result.data.billingMethod);
            let activeTypeIndex = orderTabList[0].billingMethod - 1;
            let data = result.data;
            if (this.data.orderInfo.base.orderType === 31) {
                data['rightsPackageIds'] = this.data.orderInfo.base?.packageIdList;
            }
            this.setData({
                orderTabList,
                activeTypeIndex,
                listOfPackages: [data]
            });
            this.getNodeHeight(this.data.listOfPackages.length);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    async getOrderInfo (initProduct = true, isSearchPay = false) {
        const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
            orderId: app.globalData.orderInfo.orderId,
            dataType: '13'
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                isSalesmanOrder: result.data.base.orderType === 31,
                orderInfo: result.data
            });
            if (initProduct) {
                await this.getProductOrderInfo();
            }
            await util.getFollowRequestLog({
                orderInfo: JSON.stringify(result.data),
                source: '查询订单信息'
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 提交订单
    async submitOrder () {
        if (this.data.isRequest) {
            return;
        } else {
            this.setData({isRequest: true});
        }
        util.showLoading('加载中');
        let params = {
            dataComplete: 1,// 资料已完善
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            orderId: app.globalData.orderInfo.orderId
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        this.setData({isRequest: false});
        if (!result) return;
        if (result.code === 0) {
            util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}&type=main_process`);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 微信签约
    async signWeChat () {
        if (this.data.isRequest) {
            return;
        } else {
            this.setData({isRequest: true});
        }
        util.showLoading('加载中');
        let params = {
            dataComplete: 0, // 订单资料是否已完善 1-是，0-否,// 已完善资料,进入待审核
            orderId: app.globalData.orderInfo.orderId,// 订单id
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            needSignContract: true // 是否需要签约 true-是，false-否
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        this.setData({isRequest: false});
        if (!result) return;
        if (result.code === 0) {
            let res = result.data.contract;
            // 签约车主服务 2.0
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            app.globalData.isNeedReturnHome = false;
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 是否接受协议   点击同意协议并且跳转指定套餐模块
    onClickAgreementHandle () {
        if (this.data.activeIndex === -1) {
            return util.showToastNoIcon('亲，请选套餐哦');
        }
        let getAgreement = !this.data.getAgreement;
        this.setData({
            getAgreement
        });
        // 跳转指定套餐模块
        this.controllShopProductPosition(this.data.activeIndex);
    },
    // 选择结算分类套餐
	choosePackage (e) {
        if (this.data.orderTabList.length === 1) return;
        let index = e.currentTarget.dataset.index;
        if (!this.data.CopylistOfPackages) { // 存一份获取到的所有套餐
            this.setData({
                CopylistOfPackages: [...this.data.listOfPackages]
            });
        }
		let listOfPackagesTrucks = this.data.CopylistOfPackages.filter((item) => { // 从所有货车套餐中进行筛选
			return item.billingMethod === index;
        });
        let activeIndex = listOfPackagesTrucks.length === 1 ? 0 : -1; // 只有一个货车套餐时选中第一个
		this.setData({
			listOfPackages: listOfPackagesTrucks,// 将筛选的套餐展示出来
			activeTypeIndex: index - 1,
			activeIndex // 选中的重置
		});
	},
    // 获取权益列表
    async getList (obj) {
        if (!obj.rightsPackageIds?.length) return;
        const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
            packageIds: obj.rightsPackageIds
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                rightsAndInterestsList: result.data
            });
            const rightsPackageId = this.data.orderInfo?.base?.rightsPackageId;
            if (rightsPackageId) {
                // 已经加购权益包
                const activeEquitiesIndex = result.data.findIndex(item => item.id === rightsPackageId);
                if (this.data.isSalesmanOrder) {
                    // 只显示选购权益包 没加购权益包则影藏权益
                    const index = activeEquitiesIndex === -1 ? -1 : 0;
                    const list = activeEquitiesIndex === -1 ? [] : [result.data[activeEquitiesIndex]];
                    this.setData({
                        activeEquitiesIndex: index,
                        rightsAndInterestsList: list
                    });
                } else {
                    this.setData({
                        activeEquitiesIndex
                    });
                }
            } else {
                if (this.data.listOfPackages[0]?.mustChoiceRightsPackage === 1) {
                    const index = result.data.findIndex(item => item.id === this.data.listOfPackages[0]?.rightsPackageIds[0]);
                    if (index !== -1 && this.data.choiceIndex !== -1) {
                        this.setData({
                            activeEquitiesIndex: index
                        });
                    }
                }
            }
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    async next () {
        if (this.data.choiceIndex === -1) return;
        if (!this.data.getAgreement) {
            util.showToastNoIcon('请同意并勾选协议！');
            return;
        }
        let obj1 = this.data.listOfPackages[this.data.choiceIndex];
        if (obj1.mustChoiceRightsPackage === 1 && this.data.equityListMap.addEquityList[this.data.choiceIndex].aepIndex === -1) {
            util.showToastNoIcon('请选择一个权益包');
            return;
        }
        if (obj1.pledgeType === 4) {
            // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
            const result = await util.getDataFromServersV2('consumer/order/precharge/list',{
                orderId: app.globalData.orderInfo.orderId // 订单id
            });
            if (!result) return;
            if (result.code === 0) {
                if (result.data.length >= 5) {
                    util.alert({
                        title: `提示`,
                        content: `该套餐目前暂只支持单人办理五台车辆`,
                        confirmColor: '#576B95',
                        cancelColor: '#000000',
                        cancelText: '我知道了',
                        confirm: () => {
                        },
                        cancel: async () => {
                        }
                    });
                    return;
                }
            } else {
                util.showToastNoIcon(result.message);
                return;
            }
        }
        await this.saveOrderInfo();
    },
    // 提交订单
    async saveOrderInfo () {
        if (!this.data.isLoaded) {
            util.showToastNoIcon('数据加载中,请稍后重试');
            return;
        }
        if (this.data.isRequest) {
            return;
        } else {
            this.setData({isRequest: true});
        }
        wx.uma.trackEvent('package_the_rights_and_interests_next');
        const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
            orderId: app.globalData.orderInfo.orderId // 订单id
        });
        if (!res) return;
        this.setData({isRequest: false});
        let rightsPackageIdArray = [];
        let addEquity = this.data.equityListMap.addEquityList[this.data.choiceIndex];	// 加购权益包
        if (addEquity.aepIndex !== -1) { // 加购数组
            rightsPackageIdArray.push(addEquity.subData[addEquity.aepIndex].id);
        }
        let params = {
            orderId: app.globalData.orderInfo.orderId, // 订单id
            shopId: this.data.orderInfo?.base?.shopId || this.data.listOfPackages[this.data.choiceIndex].shopId || app.globalData.newPackagePageData.shopId, // 商户id
            dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
            dataComplete: 0, // 订单资料是否已完善 1-是，0-否
            shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,
            rightsPackageIdArray: rightsPackageIdArray, // 加购权益包
            areaCode: this.data.orderInfo ? (this.data.orderInfo.product.areaCode || '0') : app.globalData.newPackagePageData.areaCode
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        this.setData({isRequest: false});
        if (!result) return;
        if (result.code === 0) {
            if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice || addEquity.aepIndex !== -1) {
                await this.marginPayment(this.data.listOfPackages[this.data.choiceIndex].pledgeType);
                return;
            }
            if (this.data.isSalesmanOrder) {
                util.go('/pages/personal_center/signing_other_platforms/signing_other_platforms?type=main');
                return;
            }
            util.go(`/pages/truck_handling/information_list/information_list?type=1`);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    async perfectOrder () {
        app.globalData.isTelemarketing = true;
        let params = {
            dataComplete: 1,// 资料已完善
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            orderId: app.globalData.orderInfo.orderId,// 订单id
            changeAuditStatus: true,
            needSignContract: true // 是否需要签约 true-是，false-否
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        if (!result) return;
        if (result.code === 0) {
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            let res = result.data.contract;
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 微信签约
    async weChatSign () {
        let params = {
            orderId: app.globalData.orderInfo.orderId, // 订单id
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            needSignContract: true // 是否需要签约 true-是，false-否
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        if (!result) return;
        if (result.code === 0) {
            let res = result.data.contract;
            // 签约车主服务 2.0
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            app.globalData.isNeedReturnHome = true;
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 支付
    async marginPayment (pledgeType) {
        if (this.data.isRequest) return;
        this.setData({isRequest: true});
        util.showLoading();
        let params = {};
        if (pledgeType === 4) {
            // 押金模式
            params = {
                payVersion: 'v3',
                tradeType: 1,
                orderId: app.globalData.orderInfo.orderId,
                openid: app.globalData.openId
            };
        } else {
            // 普通模式
            params = {
                orderId: app.globalData.orderInfo.orderId
            };
        }
        const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
        if (!result) {
            this.setData({isRequest: false});
            return;
        }
        if (result.code === 0) {
            let extraData = result.data.extraData;
            wx.requestPayment({
                nonceStr: extraData.nonceStr,
                package: extraData.package,
                paySign: extraData.paySign,
                signType: extraData.signType,
                timeStamp: extraData.timeStamp,
                success: (res) => {
                    this.setData({isRequest: false});
                    if (res.errMsg === 'requestPayment:ok') {
                        try {
                            if (app.globalData.advertisementClickId) {
                              const price = this.data.activeIndex !== -1 ? (this.data.listOfPackages[this.data.activeIndex].pledgePrice + (this.data.equityListMap.addEquityList[this.data.activeIndex].aepIndex !== -1 ? this.data.equityListMap.addEquityList[this.data.activeIndex].subData[this.data.equityListMap.addEquityList[this.data.activeIndex].aepIndex].payMoney : 0) / 100) : this.data.listOfPackages[this.data.activeIndex].pledgePrice / 100;
                              util.getDatanexusAnalysis('COMPLETE_ORDER', price / 100);
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        if (this.data.isSalesmanOrder) {
                            util.go('/pages/personal_center/signing_other_platforms/signing_other_platforms?type=main');
                            return;
                        }
                        util.go(`/pages/truck_handling/information_list/information_list?type=1`);
                    } else {
                        util.showToastNoIcon('支付失败！');
                    }
                },
                fail: (res) => {
                    this.setData({isRequest: false});
                    if (res.errMsg !== 'requestPayment:fail cancel') {
                        util.showToastNoIcon('支付失败！');
                    }
                }
            });
        } else {
            this.setData({isRequest: false});
            util.showToastNoIcon(result.message);
        }
    },
    // 权益点击高亮，不用显示详情弹窗
    detailsBtn (e) {
        if (this.data.listOfPackages[this.data.activeIndex]?.mustChoiceRightsPackage === 1) {
            return;
        }
        const index = e.currentTarget.dataset.index;
        if (this.data.activeEquitiesIndex !== index) {
            this.setData({
                activeEquitiesIndex: index
            });
        } else {
            this.setData({
                activeEquitiesIndex: -1
            });
        }
    },
    // 点击高亮
    btnHeightLight (e) {
        if (this.data.orderTabList.length === 1) return;
        let that = this;
        let index = e.currentTarget.dataset.index;
        let billingmethod = e.currentTarget.dataset.billingmethod;
        let isFade = index !== that.data.activeIndex;
        let shopProductId = e.currentTarget.dataset.shopproductid;
        // 控制点击 套餐高亮
        that.setData({
            isFade,
            activeIndex: isFade ? index : -1,
            getAgreement: false,
            choiceIndex: isFade ? index : -1,
            activeTypeIndex: billingmethod === 1 ? 0 : 1
        });
        if (isFade) { // 当套餐高亮时，默认展开 详情
            this.setData({
                isCloseUpperPart1: shopProductId === app.globalData.currentEquity.shopProductId ? false : true,
                isCloseUpperPart2: false
            });
        } else {
            this.setData({
                isCloseUpperPart: index,
                isCloseUpperPart1: false,
                isCloseUpperPart2: false
            });
        }
        // 点击套餐 让套餐模块置顶 一定的距离
        if (!isFade) {
            return false;
        } else {
            this.controllShopProductPosition(index);
        }
        // 点击选择套餐 调用车牌限制接口
        this.getLicensePlateRestrictions();
    },
    btnOpenOrOff (e) { // 展开和收起
        let index = e.currentTarget.dataset.index[0];
        let activeIndex = e.currentTarget.dataset.index[2];
        let isCloseUpperPart = e.currentTarget.dataset.index[1];
        let flag = this.data.isCloseUpperPart1;
        let flag2 = this.data.isCloseUpperPart2;
        if (index === activeIndex) { // 选中套餐 点击 展开和收起 的控制
            this.setData({
                isCloseUpperPart1: !flag,
                isCloseUpperPart2: isCloseUpperPart !== index ? false : !flag2
            });
        } else { // 未选中套餐 点击 展开和收起 的控制
            this.setData({
                isCloseUpperPart: index,
                isCloseUpperPart1: false,
                isCloseUpperPart2: isCloseUpperPart !== index ? true : !flag2
            });
        }
    },
    // 获取权益包信息
    async getNodeHeight (num) {
        this.setData({
            isLoaded: false
        });
        util.showLoading({
            title: '加载中'
        });
        let equityListMap = {
            defaultEquityList: [],	// 默认权益包列表
            addEquityList: [],	// 加购权益包列表
            serviceEquityList: [],	// 综合权益包
            bankList: [] // 信用卡套餐列表
        };
        let currentIndex = 0;
        for (currentIndex; currentIndex < num; currentIndex++) {
            // 后台返回的协议，格式转换
            if (this.data.listOfPackages[currentIndex]?.agreements) {
                try {
                    this.setData({[`listOfPackages[${currentIndex}].agreements`]: JSON.parse(this.data.listOfPackages[currentIndex].agreements)});
                } catch (error) {}
            }
            // 加购权益包
            const packageIds = this.data.listOfPackages[currentIndex].rightsPackageIds && this.data.listOfPackages[currentIndex]?.rightsPackageIds.length !== 0;
            if (!packageIds) {
                equityListMap.addEquityList.push({index: currentIndex, packageName: '',payMoney: 0,aepIndex: -1});
            } else {
                const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
                    packageIds: this.data.listOfPackages[currentIndex]?.rightsPackageIds
                },'POST',false);
                if (result.code === 0) {
                    // this.data.listOfPackages[currentIndex].mustChoiceRightsPackage === 1 ? 0 : -1
                    let packageName = '';
                    result.data.map((item,index) => {
                        packageName += item.packageName;
                        packageName += index < result.data.length - 1 ? '+' : '';
                    });
                    equityListMap.addEquityList.push({index: currentIndex,packageName: packageName,subData: result.data,aepIndex: -1});
                } else {
                    // 占位
                    equityListMap.addEquityList.push({index: currentIndex, packageName: '',payMoney: 0,aepIndex: -1});
                }
            }
            // 默认权益包(只能有一个)
            let defaultPackages = [];
            let sevicePackages = this.data.listOfPackages[currentIndex].serviceFeePackageId;
            if (sevicePackages) defaultPackages = sevicePackages.split(',');
            if (defaultPackages.length === 0) {
                equityListMap.serviceEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
            } else {
                const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
                    packageIds: defaultPackages
                },'POST',false);
                if (result.code === 0) {
                    let packageName = '';
                    // let payMoney = 0;	// 综合服务权益包 金额
                    result.data.map((item,index) => {
                        packageName += item.packageName;
                        // payMoney += item.payMoney;
                        packageName += index < result.data.length - 1 ? '+' : '';
                    });
                    equityListMap.serviceEquityList.push({index: currentIndex,subData: result.data,packageName: packageName,payMoney: 0});
                } else {
                    // 占位
                    equityListMap.serviceEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
                }
            }
            // 2%综合服务费赠送的权益包
            let packageId = this.data.listOfPackages[currentIndex].rightsPackageId && this.data.listOfPackages[currentIndex].rightsPackageId !== 0;
            if (!packageId) {
                equityListMap.defaultEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
            } else {
                const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
                    packageIds: new Array(this.data.listOfPackages[currentIndex].rightsPackageId)
                },'POST',false);
                if (result.code === 0) {
                    equityListMap.defaultEquityList.push({index: currentIndex,subData: result.data});
                } else {
                    // 占位
                    equityListMap.defaultEquityList.push({index: currentIndex, packageName: '',payMoney: 0});
                }
            }
            // 占位
            equityListMap.bankList.push({index: currentIndex,isBank: false});
        }
        this.setData({
            isLoaded: true,
            equityListMap: equityListMap
        });
        this.getHeight(num);
    },
    // 获取节点的高度
    getHeight (num) {
        let that = this;
        let nodeHeightList = [];
        let currentIndex = 0;
        for (currentIndex; currentIndex < num; currentIndex++) {
            let allIndex = 'module' + currentIndex;
            wx.createSelectorQuery().select(`.${allIndex}`).boundingClientRect(function (rect) {
                nodeHeightList.push(rect.top);
                that.setData({
                    nodeHeightList
                });
            }).exec();
        }
        util.hideLoading();
    },
    // 控制 选中套餐 的位置
    controllShopProductPosition (eIndex) {
        let flags = 'module' + eIndex;
        let that = this;
        wx.pageScrollTo({
            selector: `.${flags}`,
            scrollTop: that.data.nodeHeightList[that.data.activeIndex] - (that.data.nodeHeightList[0] + 4),
            duration: 200
        });
    },

    // 弹窗详情
    popDetail (e) {
        let type = e.currentTarget.dataset.type;	// string
        let index = e.currentTarget.dataset.index;	// number
        let def = this.data.equityListMap.defaultEquityList[index];
        let service = this.data.equityListMap.serviceEquityList[index];
        switch (type) {
            case '1':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: 'new_device',
                        title: '第五代设备',
                        isSplit: index === this.data.activeIndex ? true : this.data.isFade
                    }
                });
                break;
            case '2':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: 'default_equity_package',
                        title: '加赠权益包',
                        bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
                        isSplit: index === this.data.activeIndex ? true : this.data.isFade,
                        equityPackageInfo: service.subData && service.subData.length > 0 ? service.subData.concat(def.subData) : def.subData
                    }
                });
                break;
            case '3':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: 'give_equity_package',
                        title: '权益商城',
                        bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
                        isSplit: index === this.data.activeIndex ? true : this.data.isFade
                    }
                });
                break;
            case '4':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: this.data.listOfPackages[index].shopProductId === this.data.roadRescueShopProductId ? 'road_rescue1' : 'sign_tt_coupon',
                        title: '通通券',
                        bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
                        isSplit: index === this.data.activeIndex ? true : this.data.isFade
                    }
                });
                break;
            case '5':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: 'add_equity_package',
                        title: '加购权益包',
                        isSplit: true,
                        bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)',
                        equityPackageInfo: this.data.equityListMap.addEquityList[index].subData,
                        mustEquity: this.data.listOfPackages[index].mustChoiceRightsPackage,
                        aepIndex: this.data.equityListMap.addEquityList[this.data.activeIndex].aepIndex
                    }
                });
                break;
            case '6':
                this.selectComponent('#cdPopup').show({
                    isBtnClose: true,
                    argObj: {
                        type: 'road_rescue',
                        title: '下单送500元道路救援服务',
                        isSplit: true,
                        bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)'
                    }
                });
                break;
            default:
                break;
        }
    },
    // 弹窗组件
    cDPopup (e) {
        let choiceIndex = parseInt(e.detail.choiceIndex);
        let equityListMap = this.data.equityListMap;
        equityListMap.addEquityList[this.data.activeIndex].aepIndex = choiceIndex;
        this.setData({equityListMap});
    },
    /**
     * 协议跳转
     * @param {*} e node 传来的数据
     */
    goAgreementPage (e) {
        let item5 = e.currentTarget.dataset.item;
        if (item5.contentType === 1) {
            wx.navigateTo({
                url: '/pages/agreement_documents/background_agreement/background_agreement',
                success: function (res) {
                    // 通过eventChannel向被打开页面传送数据
                    res.eventChannel.emit('acceptDataFromOpenerPage', { data: item5 });
                }
            });
        } else { // 打开pdf
            util.openPdf(item5.content,item5.category);
        }
    }
});
