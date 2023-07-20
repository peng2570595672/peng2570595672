const util = require('../../utils/util.js');
const app = getApp();
Component({
    lifetimes: {},
    properties: {

    },

    data: {
        mask: false, // 控制遮罩层的显示/隐藏
        make: false, // 控制表示层的显示/隐藏
        isBtnClose: true, // 传递过来的参数
        argObj: [{
            title: ''
        }], // 传递过来的参数
        noSliding: false, // 是否禁止底层页面滑动

        // 设备激活 ---start ---
        passTicketList: [ // money: 金额/券额, num： 数量, isEquity：是否是券额
            {money: 10,num: 12,isEquity: false,content: '满40元可用'},
            {money: 100,num: 1,isEquity: true,content: '权益商城抵扣券'}
        ],
        carList: [], //
        activeOrder: [], // 已激活订单列表
        isHide: false, // 是否隐藏
        selectedIndex: -1, // 选中模块的索引
        isBtn: false, // 顶部按钮是否点击
        shopProductId: app.globalData.deviceUpgrade.shopProductId,
        rightsPackageId: app.globalData.deviceUpgrade.rightsPackageId,
        shopId: app.globalData.deviceUpgrade.shopId,
		shopProductInfo: {},	// 套餐信息
        equityListMap: {}, // 权益包信息
        orderList: [], // 存放符合设备升级条件的自定义订单列表
        relatedOrderId: '', // 原订单ID
        newOrderId: '', // 新订单ID
        isLoaded: false, // 是否加载完数据
        isRequest: false, // 是否请求中
        payStatus: 0, // 0: 表示未生成升级订单，1: 生成升级订单但未支付，2: 生成升级订单已支付
        // ---end------------------
        // ==================================默认权益包或加赠权益包或加购权益包========================
        giveEquityPackage: [ // 加赠权益包列表
            {
                title: '洗车65折起',
                img: 'https://file.cyzl.com/g001/M02/ED/30/oYYBAGStMHuABxnzAAAGoFnzlqA618.png'
            },
            {
                title: '通行券75折起',
                img: 'https://file.cyzl.com/g001/M02/ED/30/oYYBAGStMQuANUpwAAAE7u7s7Hs600.png'
            },
            {
                title: '影音会员5折起',
                img: 'https://file.cyzl.com/g001/M02/ED/31/oYYBAGStMTGAc8olAAAE-nSVpAI491.png'
            },
            {
                title: '米面粮油65折',
                img: 'https://file.cyzl.com/g001/M02/ED/31/oYYBAGStMUaAIVHlAAAGmyv_21k688.png'
            },
            {
                title: '大牌商品优惠购',
                img: 'https://file.cyzl.com/g001/M02/ED/31/oYYBAGStMV-AL4kAAAAFqpNPlh8474.png'
            },
            {
                title: '车主商品优惠购',
                img: 'https://file.cyzl.com/g001/M02/ED/31/oYYBAGStMXKANCRCAAAE1IPpLLg071.png'
            }
        ],
        isExpand: false, // 是否展开详情 false - 表示不展开
        couponList: [], // 券列表
        activeIndex: -1, // 选中权益包模块的索引(针对详情)
        choiceIndex: -1, // 选中权益包模块的索引(针对模块高亮)
        isHeightLight: false // 控制是否选中高亮
        // ==================================end =====================================================
    },

    methods: {
        show (obj) {
            let isBtnClose = obj.isBtnClose ? obj.isBtnClose : false;
            let argObj = obj.argObj || this.data.argObj;
            if (argObj.type === 'device_upgrade') {
                this.getActiveOrder();
                this.getProduct();
                this.getEquityInfo();
            };
            if (argObj.type === 'default_equity_package' || argObj.type === 'add_equity_package') {
                this.setData({couponList: []});
                let couponList = [];
                couponList = argObj.equityPackageInfo.filter(item => item);
                console.log(couponList);
                if (argObj.type === 'add_equity_package') {
                    this.setData({couponList,choiceIndex: argObj.aepIndex,isHeightLight: argObj.mustEquity === 1});
                    for (let index = 0; index < couponList.length; index++) {
                        this.getPackageRelation(couponList[index].id,index);
                    }
                } else {
                    this.setData({couponList});
                    for (let index = 0; index < couponList.length; index++) {
                        this.getPackageRelation(couponList[index].id,index);
                    }
                }
            }
            this.setData({
                mask: true,
                make: true,
                isBtnClose,
                argObj,
                noSliding: true
            });
        },
        hide () {
            let that = this;
            that.setData({
                mask: false
            });
            setTimeout(() => {
                that.setData({ make: false,isHide: false,isBtn: false,noSliding: false,isExpand: false,isHeightLight: false,activeIndex: -1,choiceIndex: -1 });
            }, 380);
        },
        noSliding () {},
        // --------------------设备升级 start--------------------------
        async getActiveOrder () { // 获取已激活订单
            let arr1 = []; // 存放已激活的订单
            let arr2 = []; // 存放已激活的订单
            let nmOrderList = []; // 存放蒙通卡已激活订单
            let devicePay = []; /// 存放升级订单来支付的列表
            this.setData({cardList: []});
            let list = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 5);
            for (let index = 0; index < list.length; index++) {
                arr1.push(await this.getOrderInfo(list[index].id,list[index]?.contractVersion));
            }
            nmOrderList = arr1.filter(item => item.obuCardType === 2).map((item,index) => {
                let rep = item.addTime.slice(0, 19).replace(new RegExp('-', 'g'), '/'); // 转换是为了iPhone
                let time = (new Date(rep)).getTime();
                return {
                    vehPlates: item.vehPlates,
                    mobilePhone: item.mobilePhone,
                    obuCardType: item.obuCardType,
                    id: item.id,
                    addTime: item.addTime,
                    sortTime: time,
                    vehColor: item.vehColor,
                    orderType: item.orderType,
                    contractVersion: item.contractVersion
                };
            });
            if (this.data.argObj?.orderId) { // 指定订单ID
                arr2.push(await this.getOrderInfo(this.data.argObj?.orderId));
                devicePay = arr2;
                arr2 = nmOrderList.filter(item => item.vehPlates === arr2[0].vehPlates);
            }
            nmOrderList.sort(this.compare('sortTime'));	// 排序
            console.log('已激活的蒙通卡:',nmOrderList);
            let normal = app.globalData.myEtcList.filter(item => (item.vehPlates === nmOrderList[0]?.vehPlates || item.vehPlates === arr2[0]?.vehPlates) && item.orderType === 81); // 原订单
            console.log(normal);
            this.setData({
                activeOrder: arr1,
                carList: arr2.length > 0 ? arr2 : new Array(nmOrderList[0]), // 优先展示指定订单
                isLoaded: true,
                payStatus: normal?.length > 0 ? normal[0].pledgeStatus === 0 ? 1 : normal[0].pledgeStatus === 1 ? 2 : 0 : 0
            });
        },
        selectFunc (e) { // 选中车辆
            let index = e.currentTarget.dataset.index;
            if (this.data.carList[index].obuCardType !== 2 || this.data.carList[index].contractVersion === 'v3') {
                this.setData({selectedIndex: -1,isBtn: false});
                return;
            }
            this.setData({selectedIndex: index,isBtn: true});
        },
        ok () { // 确认车牌号
            if (!this.data.isBtn || this.data.carList[this.data.selectedIndex].contractVersion === 'v3') {
                util.showToastNoIcon('此车牌暂不支持设备升级');
                return;
            }
            if (this.data.isHide && this.data.isBtn) { // 确认车牌号
                // 判断是不是新订单
                if (util.timeComparison(app.globalData.deviceUpgrade.addTime, this.data.carList[this.data.selectedIndex].addTime) === 1) {
                    util.alert({
                        title: `温馨提示`,
                        content: '该车牌已是最新设备，无需重新办理',
                        showCancel: false,
                        confirmText: '我知道了'
                    });
                    return;
                }
                let carList = new Array(this.data.carList[this.data.selectedIndex]);
                let deviceOrder = app.globalData.myEtcList.filter(item => item.vehPlates === this.data.carList[this.data.selectedIndex].vehPlates && item.orderType === 81);
                this.setData({
                    carList,
                    isHide: false,
                    payStatus: deviceOrder?.length > 0 ? deviceOrder[0].pledgeStatus === 0 ? 1 : deviceOrder[0].pledgeStatus === 1 ? 2 : 0 : 0
                });
            }
        },
        async queryCar () { // 选择其他车辆升级
            this.setData({
                isHide: true,
                carList: this.data.activeOrder,
                selectedIndex: -1
            });
        },
        async handle () { // 办理套餐
            // 判断是不是新订单
            if (util.timeComparison(app.globalData.deviceUpgrade.addTime, this.data.carList[0].addTime) === 1) {
                util.showToastNoIcon('提示该车牌已经是最新设备，无需重新办理');
                return;
            }
            if (this.data.carList[0].contractVersion === 'v3') {
                util.showToastNoIcon('此车牌暂不支持设备升级');
                return;
            }
            // 判断此车牌是否欠费
            if (await this.getFailBill(this.data.carList[0].vehPlates,this.data.carList[0].obuCardType)) {
                return;
            };
            let deviceOrder = app.globalData.myEtcList.filter(item => item.vehPlates === this.data.carList[0].vehPlates && item.orderType === 81);
            console.log(deviceOrder);
            if (deviceOrder[0]?.pledgeStatus === 1) { // 继续办理
                if (deviceOrder[0].obuStatus === 1 || deviceOrder[0].obuStatus === 5) {
                    util.showToastNoIcon('提示该车牌已经是最新设备，无需重新办理');
                    return;
                }
                if (deviceOrder[0]?.auditStatus !== 1 && deviceOrder[0]?.clipCardCert) {
                    util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${deviceOrder[0].id}`);
                    return;
                }
                util.go(`/pages/device_upgrade/fill_in_information/fill_in_information?orderId=${deviceOrder[0].id}`);
                return;
            }
            // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
            if (this.data.shopProductInfo.pledgeType === 4) {
                if (await this.handlEquityLimit(deviceOrder[0]?.id || this.data.carList[0]?.id)) {
                    return;
                }
            }
            util.alert({
                title: `提示`,
                content: `升级需注销您的原设备，原设备将不能使用`,
                confirmColor: '#576B95',
                cancelColor: '#000000',
                cancelText: '取消办理',
                confirmText: '继续办理',
                showCancel: true,
                confirm: async () => {
                    // 如果已有订单直接拉起支付或已支付跳转到下一个页面
                    if (deviceOrder?.length > 0 && (this.data.shopProductInfo.pledgePrice || this.data.equityListMap.payMoney) && deviceOrder[0].pledgeStatus === 0) {
                        await this.marginPayment(deviceOrder[0].pledgeType,deviceOrder[0].id);
                        return;
                    }
                    this.emptySaveOrder();
                },
                cancel: async () => {
                }
            });
        },

        async getOrderInfo (orderId,version) { // 根据订单ID 查询订单
            const result = await util.getDataFromServersV2('consumer/order/order-detail-for-update', {
                orderId: orderId
            },'post',false);
            if (!result) return;
            if (result.code === 0) {
                return {
                    vehPlates: result.data.orderInfo?.vehPlates,
                    mobilePhone: result.data.orderCardInfo?.cardMobilePhone ? result.data.orderCardInfo?.cardMobilePhone : app.globalData.mobilePhone,
                    obuCardType: result.data.orderInfo?.obuCardType,
                    id: result.data.orderInfo?.id,
                    addTime: result.data.orderInfo.addTime,
                    vehColor: result.data.orderInfo?.vehColor,
                    orderType: result.data.orderInfo.orderType,
                    contractVersion: version ? version : ''
                };
            } else {
                util.showToastNoIcon(result.message);
            }
        },
        compare (prop) { // 排序
            return function (obj1, obj2) {
                const val1 = +obj1[prop];
                const val2 = +obj2[prop];
                if (val1 < val2) {
                    return -1;
                } else if (val1 > val2) {
                    return 1;
                } else {
                    return 0;
                }
            };
        },
        // 根据套餐id获取套餐信息
        async getProduct () {
            const result = await util.getDataFromServersV2('consumer/system/get-product-by-id', {
                shopProductId: this.data.shopProductId
            });
            if (!result) return;
            if (result.code === 0) {
                console.log(result.data);
                try {
                    result.data.descriptionList = JSON.parse(result.data.description);
                } catch (e) {
                }
                this.setData({
                    shopProductInfo: result.data
                });
            } else {
                this.setData({isLoaded: false});
                util.showToastNoIcon(result.message);
            }
        },
        // 获取权益包信息
        async getEquityInfo () {
            const result = await util.getDataFromServersV2('consumer/voucher/rights/get-packages-by-package-ids', {
                packageIds: new Array(this.data.rightsPackageId)
            },'POST',false);
            if (!result) return;
            if (result.code === 0) {
                this.setData({equityListMap: result.data[0]});
            } else {
                this.setData({isLoaded: false});
                util.showToastNoIcon(result.message);
            }
        },
        // 提交订单
        async emptySaveOrder () {
            let that = this;
            if (!that.data.isLoaded) {
                util.showToastNoIcon('数据加载中,请稍后重试');
                return;
            }
            if (that.data.isRequest) {
                return;
            } else {
                that.setData({isRequest: true});
            }
            wx.uma.trackEvent('package_the_rights_and_interests_next');
            that.setData({isRequest: false});
            let params = {
                orderType: 81,
                mobilePhone: app.globalData.mobilePhone,	// 手机号码
                dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
                dataComplete: 0, // 订单资料是否已完善 1-是，0-否
                vehPlates: this.data.carList[0].vehPlates,
                vehColor: this.data.carList[0].vehColor,
                shopId: this.data.shopId,
                shopProductId: this.data.shopProductId,	// 套餐ID
                rightsPackageId: this.data.rightsPackageIds,	// 权益包ID
                areaCode: '0',	// 区域编码
                relatedOrderId: this.data.carList[0].id,	// 原订单ID
                orderId: this.data.newOrderId
            };
            const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
            that.setData({isRequest: false});
            if (!result) return;
            if (result.code === 0) {
                this.setData({newOrderId: result.data.orderId});
                app.globalData.orderInfo['orderId'] = result.data.orderId;
                // 添加协议记录
                const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
                    orderId: result.data.orderId // 订单id
                });
                if (!res) return;
                // // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理（ > 5个），如果有则弹窗提示，并且不执行后面流程
                if (this.data.carList[0].pledgeType === 4) {
                    if (await this.handlEquityLimit(result.data.orderId)) {
                        return;
                    }
                }
                // 支付
                if (that.data.shopProductInfo.pledgePrice || that.data.equityListMap.payMoney) {
                    await that.marginPayment(that.data.shopProductInfo.pledgeType, result.data.orderId);
                }
            } else {
                util.showToastNoIcon(result.message);
            }
        },
        // 支付
        async marginPayment (pledgeType, orderId) {
            if (this.data.isRequest) return;
            this.setData({isRequest: true});
            util.showLoading();
            let params = {};
            if (pledgeType === 4) {
                // 押金模式
                params = {
                    payVersion: 'v3',
                    tradeType: 1,
                    orderId: orderId,
                    openid: app.globalData.openId
                };
            } else {
                // 普通模式
                params = {
                    orderId: orderId
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
                            util.go(`/pages/device_upgrade/fill_in_information/fill_in_information?orderId=${orderId}`);
                            this.hide();
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
        // 办理权益套餐的限制
        async handlEquityLimit (orderId) {
            const result = await util.getDataFromServersV2('consumer/order/precharge/list',{
                orderId: orderId // 订单id
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
                    return true;
                } else {
                    return false;
                }
            } else {
                util.showToastNoIcon(result.message);
                return true;
            }
        },
        // 失败账单列表
        async getFailBill (vehPlates,obuCardType) {
            const res = await util.getDataFromServersV2('consumer/etc/get-fail-bill',{
                vehPlate: vehPlates,
                channel: obuCardType
            });
            if (!res) return;
            if (res.code === 0) {
                if (res.data.length > 0) {
                    let total = 0;
                    res.data.map(item => {
                        if (item.deductStatus === 2 || item.deductStatus === 10) {
                            total += item.totalMmout + (item.serviceMoney || 0) + (item.poundage || 0) - (item.splitDeductedMoney || 0) - (item.deductServiceMoney || 0) - (item.refundMoney || 0) - (item.wxDiscountAmount || 0) - (item.discountMount || 0);
                        }
                        if (item.passDeductStatus === 2 || item.passDeductStatus === 10) {
                            total += item.passServiceMoney || 0;
                        }
                    });

                    util.alertPayment(total,false);
                    return true;
                } else {
                    return false;
                }
            } else {
                util.showToastNoIcon(res.message);
                return true;
            }
        },
        // -------------------- 设备升级-end------------------------------------

        // 通通券
        btnExpand () {
            this.setData({isExpand: !this.data.isExpand});
        },
        // ------------------默认权益包（加赠）------------------------------
        // 控制详情的展示与收缩
        isExpand (e) {
            let index = e.currentTarget.dataset.index;
            let activeIndex = this.data.activeIndex;
            let isFade = index !== activeIndex; // 当前索引与选中索引不相等时展开
            this.setData({
                activeIndex: index,
                isExpand: index === activeIndex ? !this.data.isExpand : isFade
            });
        },
        // 点击是否高亮
        btnMd1 (e) {
            let index = e.currentTarget.dataset.index;
            let choiceIndex = this.data.choiceIndex;
            let isChoice = choiceIndex !== index;
            // if (this.data.argObj.mustEquity === 1 && !isChoice) return;
            this.setData({
                choiceIndex: index,
                isHeightLight: index === choiceIndex ? !this.data.isHeightLight : isChoice
            });
            this.triggerEvent('cDPopup',{choiceIndex: this.data.isHeightLight ? this.data.choiceIndex : -1});
        },
        /**
         * 券包详情
         * couponType 劵类型  1-通行劵 2-停车卷 3-加油券 4-充电券 5-洗车券 6-通用券 7-商品消费券
         * denomination 面额 单位: 分
         * consumptionThreshold 消费门槛 单位: 分
         * couponCount 券张数
         * periodCount 每期能领数量
         * minDays 领取后最小有效期
         * minTime 当前组最早的
         * @param {*} id // 权益包ID
         * @returns
         */
        async getPackageRelation (id,index) {
			const result = await util.getDataFromServersV2('consumer/voucher/rights/get-package-coupon-list-buy', {
				packageId: id
			},'POST',true);
			if (!result) return;
			if (result.code === 0) {
                if (result.data.length === 0) util.showToastNoIcon('没有券包');
                let couponList = this.data.couponList;
                couponList[index].detailList = result.data;
                couponList[index].detailList.sort(this.reorder('couponType')); // 排序
                this.setData({couponList});
			} else {
				util.showToastNoIcon(result.message);
			}
		},
        // 排序
        reorder (prop) {
            return function (obj1, obj2) {
                const val1 = +obj1[prop];
                const val2 = +obj2[prop];
                if (val1 < val2) {
                    return -1;
                } else if (val1 > val2) {
                    return 1;
                } else {
                    return 0;
                }
            };
        }
        // ------------------------------end----------------------------------------------
    }
});
