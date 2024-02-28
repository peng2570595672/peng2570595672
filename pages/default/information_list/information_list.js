/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        topProgressBar: 3, // 进度条展示的长度 ，再此页面的取值范围 [3,4),默认为3,保留一位小数
        fenCheck: false, // 是否1分钱校验 1 是   默认0
        contractStatus: 0, // 1已签约
        orderInfo: undefined,
        orderDetails: undefined,
        vehicleInfo: undefined,
        isRequest: false,
        available: false,
        isIdCardError: false, // 是否身份证错误
        isDrivingLicenseError: false, // 是否行驶证错误
        isHeadstockError: false, // 是否车头照错误
        isModifiedData: false, // 是否是修改资料
        isEtcContractId: true, // 是否需要签约微信
        requestNum: 0,
        isReturn: false,
        ownerIdCard: {}, // 实名身份信息
        vehicle: {}, // 车辆信息
        tips: '', // 审核失败返回的结果
        citicBank: false, // 是否是中信银行联名套餐
        openSheet: false
    },
    async onLoad (options) {
        app.globalData.isCheckCarChargeType = false;
        if (options.isModifiedData) {
            this.setData({
                isModifiedData: true
            });
        }
        if (options.type) {
            this.setData({
                isReturn: +options.type === 1
            });
        }
        // 空发平安激活 是否补充信息激活
        if (options.orderId && options.vehPlates) {
            this.setData({
                vehPlates: options.vehPlates,
                orderId: options.orderId
            });
            app.globalData.orderInfo.orderId = this.data.orderId;
        }
        // 查询是否欠款
        await util.getIsArrearage();
    },
    async onShow () {
        const pages = getCurrentPages();
        const currPage = pages[pages.length - 1];
        console.log(currPage.__data__);
        // 修改资料不需要查询订单详情
        if (currPage.__data__.isChangeHeadstock) {
            this.setData({
                isHeadstockError: false
            });
            this.availableCheck();
        }
        if (currPage.__data__.isChangeIdCard) {
            this.setData({
                isIdCardError: false
            });
            this.availableCheck();
        }
        if (currPage.__data__.isChangeDrivingLicenseError) {
            this.setData({
                isDrivingLicenseError: false
            });
            this.availableCheck();
        }
        await this.getETCDetail();
        if (!this.data.isModifiedData) {
            await this.queryContract();
            await this.getProductOrderInfo();
        }
    },
    async getProductOrderInfo () {
        const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
            orderId: app.globalData.orderInfo.orderId
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                fenCheck: result.data.fenCheck === 1
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 查询车主服务签约
    async queryContract () {
        const result = await util.getDataFromServersV2('consumer/order/query-contract', {
            orderId: app.globalData.orderInfo.orderId
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                contractStatus: result.data.contractStatus
            });
        } else {
            if (this.data.citicBank) {
                return;
            }
            util.showToastNoIcon(result.message);
        }
    },
    // 加载订单详情
    async getETCDetail () {
        const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
            orderId: app.globalData.orderInfo.orderId,
            dataType: '168',
            needAllInfo: true
        });
        if (!result) return;
        if (result.code === 0) {
            let res = result.data.base;
            let orderInfo = res.orderInfo;
            let vehPlates = res.vehPlates;
            let vehicle = result.data.vehicle;
            let ownerIdCard = result.data.ownerIdCard;
            if (this.data.isModifiedData && res.orderAudit?.errNums?.length && this.data.requestNum === 0) {
                // errNums
                this.getErrorStatus(res.orderAudit);
            }

            this.setData({
                vehicle: vehicle,
                ownerIdCard: ownerIdCard,
                requestNum: 1,
                orderInfo: orderInfo,
                isEtcContractId: orderInfo.etcContractId !== -1,
                orderDetails: res,
                vehicleInfo: res.vehPlates,
                vehPlates: vehPlates,
                tips: res.orderAudit ? res.orderAudit.remark : '',
                topProgressBar: orderInfo.isOwner && orderInfo.isVehicle ? 4 : orderInfo.isOwner || orderInfo.isVehicle ? 3.3 : 3
            });
            // 中信银行
            if (app.globalData.cictBankObj.citicBankshopProductIds.includes(orderInfo.shopProductId)) {
                this.setData({
                    citicBank: true,
                    isEtcContractId: false,
                    contractStatus: false,
                    isCiticBankPlatinum: res.orderInfo.shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId || res.orderInfo.shopProductId === app.globalData.cictBankObj.cictBankNmPlatinumCard, // 判断是不是白金卡套餐
                    isWellBank: orderInfo.shopProductId === app.globalData.cictBankObj.wellBankShopProductId, // 判断是否为平安信用卡套餐
                    isMinShenBank: orderInfo.shopProductId === app.globalData.cictBankObj.minshenBank // 判断是否为民生银行卡套餐
                });
            }
            this.availableCheck();
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 获取错误状态
    getErrorStatus (info) {
        console.log(info);
        // 101 身份证  102 行驶证  103 营业执照  104 车头照  105 银行卡  106 无资料  201 邮寄地址  301 已办理过其他ETC
        // 106 道路运输证  107 车辆侧身照  302 暂不支持企业用户  303 不支持车型  304 特殊情况  401 通用回复
        let errNums = [];
        let newArr = [];
        if (info.errNums.length > 5) {
            // 多个审核失败条件
            errNums = info.errNums.split(';');
        } else {
            errNums[0] = info.errNums;
        }
        errNums.map(item => {
            newArr.push(parseInt(item.slice(0, 3)));
        });
        if (newArr.includes(101)) {
            this.setData({
                isIdCardError: true
            });
        }
        if (newArr.includes(102)) {
            this.setData({
                isDrivingLicenseError: true
            });
        }
        if (newArr.includes(104) || newArr.includes(107)) {
            this.setData({
                isHeadstockError: true
            });
        }
    },
    availableCheck () {
        // if (this.data.orderInfo && this.data.orderInfo.isOwner === 1 && this.data.orderInfo.isVehicle === 1 && this.data.ownerIdCard?.ownerIdCardTrueName !== this.data.vehicle?.owner) {
        // 	util.showToastNoIcon('身份证与行驶证必须为同一持有人');
        // 	this.setData({
        // 		available: false
        // 	});
        // 	return false;
        // }
        if (this.data.orderInfo && this.data.orderInfo.isOwner === 1 && this.data.orderInfo.isVehicle === 1 && ((this.data.orderInfo.isHeadstock === 1 && this.data.orderInfo.obuCardType !== 1) || (this.data.orderInfo.obuCardType === 1))) {
            this.setData({
                available: true
            });
        }
        if (this.data.isModifiedData) {
            if (this.data.isIdCardError || this.data.isDrivingLicenseError || this.data.isHeadstockError || this.data.requestNum === 0) {
                this.setData({
                    available: false
                });
            } else {
                this.setData({
                    available: true
                });
            }
        }
    },
    // 跳转
    go (e) {
        let topProgressBar = 3;
        let url = e.currentTarget.dataset['url'];
        if (this.data.orderInfo.isOwner || this.data.orderInfo.isVehicle) {
            topProgressBar = 3.3;
        }
        if (url === 'information_validation' && !this.data.orderInfo.isOwner) {
            return util.showToastNoIcon('请先上传身份证');
        }
        util.go(`/pages/default/${url}/${url}?vehPlates=${this.data.orderInfo.vehPlates}&vehColor=${this.data.orderInfo.vehColor}&topProgressBar=${topProgressBar}&obuCardType=${this.data.orderInfo.obuCardType}`);
    },
    // ETC申办审核结果通知、ETC发货提示、ETC服务状态提醒
    async subscribe () {
        // if (this.data.orderInfo && this.data.orderInfo?.isOwner === 1 && this.data.orderInfo?.isVehicle === 1 && this.data.ownerIdCard?.ownerIdCardTrueName !== this.data.vehicle?.owner) {
        // 	util.showToastNoIcon('身份证与行驶证必须为同一持有人');
        // 	return;
        // }
        if (!this.data.available) return;
        // 判断版本，兼容处理
        let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
        if (result >= 0) {
            util.showLoading({
                title: '加载中...'
            });
            wx.requestSubscribeMessage({
                tmplIds: ['aHsjeWaJ0RRU08Uc-OeLs2OyxLxBd_ta3zweXloC66U', 'K6gUmq_RSjfR1Hm_F8ORAzlpZZDVaDhuRDE6JoVvsuo', 'Tz71gtuo8XI6BCqb0L8yktgHtgG2OyRSYLffaPUdJU8'],
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
                                        success: (res) => {},
                                        fail: () => {
                                            util.showToastNoIcon('打开设置界面失败，请重试！');
                                        }
                                    });
                                },
                                cancel: () => { // 点击取消按钮
                                    this.onclickSign();
                                }
                            });
                        } else {
                            this.onclickSign();
                        }
                    }
                },
                fail: (res) => {
                    wx.hideLoading();
                    // 不是点击的取消按钮
                    if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
                        this.onclickSign();
                    } else {
                        util.alert({
                            content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
                            showCancel: true,
                            confirmText: '打开设置',
                            confirm: () => {
                                wx.openSetting({
                                    success: (res) => {},
                                    fail: () => {
                                        util.showToastNoIcon('打开设置界面失败，请重试！');
                                    }
                                });
                            },
                            cancel: () => {
                                this.onclickSign();
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
                    this.onclickSign();
                }
            });
        }
    },
    // 微信签约
    async onclickSign () {
        if (this.data.isRequest) {
            return;
        } else {
            this.setData({
                isRequest: true
            });
        }
        wx.uma.trackEvent('information_list_next');
        util.showLoading('加载中');
        let params = {
            dataComplete: 1, // 资料已完善
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            orderId: app.globalData.orderInfo.orderId, // 订单id
            changeAuditStatus: true,
            needSignContract: this.data.citicBank ? false : true // 是否需要签约 true-是，false-否
        };
        if (this.data.contractStatus === 1 || this.data.isModifiedData || !this.data.isEtcContractId) {
            delete params.needSignContract;
            delete params.clientMobilePhone;
            delete params.clientOpenid;
        }

        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        this.setData({
            isRequest: false
        });
        if (!result) return;
        if (result.code === 0) {
            app.globalData.isNeedReturnHome = true;
            app.globalData.isCheckCarChargeType = this.data.orderInfo.obuCardType === 1 && (this.data.orderInfo.orderType === 11 || this.data.orderInfo.orderType === 12 || this.data.orderInfo.orderType === 21 || this.data.orderInfo.orderType === 71 || this.data.orderInfo.promoterType === 41) && !this.data.isModifiedData;
            if (this.data.citicBank) {
                if (this.data.citicBank) { // 拉起中信弹窗
                    this.setData({
                        openSheet: true
                    });
                }
                return;
            }
            if (this.data.orderInfo.flowVersion === 2 || this.data.orderInfo.flowVersion === 3) {
                util.go(`/pages/historical_pattern/order_audit/order_audit`);
                return;
            }
            if (this.data.contractStatus === 1 || this.data.isModifiedData) {
                //  已签约  或者 修改资料
                util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
                return;
            }
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            let res = result.data.contract;
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 中信银行的 提交 按钮
    submitCiticBank () {
        if (!this.data.available) return;
        this.subscribe();
    },
    skip () {
        let that = this;
        util.alert({
            title: `办理提醒`,
            content: `本优惠套餐仅限于办理成功银行信用卡之后，可进行保证金退还，如跳过办理流程，保证金将不予退回`,
            showCancel: true,
            confirmColor: '#576b95',
            cancelText: '我再想想',
            confirmText: '我知道了',
            confirm: async () => {
                that.setData({
                    openSheet: false
                });
                // 中信银行在没收到设备时是不需要签约的
                util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
            }
        });
    },
    async onclickhandel () {
        // 未登录
        if (!app.globalData.userInfo?.accessToken) {
            wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
            util.go('/pages/login/login/login');
            return;
        }
        this.setData({
            openSheet: false
        });
        let url = '';
        if (this.data.isWellBank) { // 平安银行
            let res = await util.getDataFromServersV2('/consumer/order/pingan/get-apply-credit-card-url', {
                orderId: app.globalData.orderInfo.orderId
            });
            if (!res) return;
            if (res.code === 0) {
                // 跳转 h5
                util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data)}`);
            } else {
                util.showToastNoIcon(res.message);
            }
        } else if (this.data.isMinShenBank) { // 民生银行
            let res = await util.getDataFromServersV2('consumer/order/apply/ms/bank-card', {
                orderId: app.globalData.orderInfo.orderId
            });
            if (!res) return;
            if (res.code === 0) {
                wx.navigateToMiniProgram({
                    appId: 'wx8212297b23aff0ff',
                    path: `pages/home/sc-ws/sc-ws?params=${'https://' + encodeURIComponent(res.data.applyUrl.slice(8))}`,
                    envVersion: 'release',
                    success () {},
                    fail () {
                        // 拉起小程序失败
                        util.showToastNoIcon('拉起小程序失败, 请重试！');
                    }
                });
                // 跳转 h5
                // util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data.applyUrl)}`);
            } else {
                util.showToastNoIcon(res.message);
            }
        } else { // 中信银行
            if (this.data.isCiticBankPlatinum) {
                url = `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?sid=SJCSJHT01&paId=${this.data.orderDetails.orderId}&partnerId=SJHT&pid=CS0840`;
            } else {
                url = `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?pid=CS0207&sid=SJCSJHT01&paId=${this.data.orderDetails.orderId}&partnerId=SJHT`;
            }
            util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
        }
    },
    onUnload () {
        if (app.globalData.isQingHaiHighSpeedOnlineProcessing) {
            wx.navigateBackMiniProgram({
                extraData: {},
                success (res) { // 返回成功
                }
            });
            return;
        }
        if (this.data.isReturn) {
            wx.switchTab({
                url: '/pages/Home/Home'
            });
        }
    }
});
