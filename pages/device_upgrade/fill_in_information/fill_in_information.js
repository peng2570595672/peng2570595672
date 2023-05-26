const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        orderId: '', // 新订单ID
		related_order_id: '',	// 原订单ID
        formData: { // 基础信息
			currentCarNoColor: 0, // 0 蓝色 1 渐变绿 2黄色
			region: [], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '' // 收货地址详细信息
		}, // 提交数据
        paper: { // 证件信息
            idName: '', // 身份证姓名
            idNum: '', // 身份证号码
            handlePhone: '', // 办理手机号
            licenseInformation: '', // 行驶证信息
            carPlateColor: '' // 车牌颜色
        },
        sim: '', // 剪卡
         // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
        carPlateColorList: ['蓝牌','黄牌','黑牌','白牌','渐变绿牌','黄绿双拼牌','蓝白渐变'],
        tip1: '',	// 经办人电话号码校验提示
		tip2: '',	// 收件人姓名校验
		tip3: '',	// 校验收件人电话号码提示
		isName: true,	// 控制收货人名称是否合格
		size: 30,
        available: false,	// 控制底部悬浮按钮的颜色变化
        pictureWidth: 0, // 压缩图片
		pictureHeight: 0,
		shopProductId: app.globalData.test ? '' : '',
		shopProductInfo: {}	// 套餐信息
    },

    onLoad (options) {
        if (options?.orderId) {
            this.setData({related_order_id: options.orderId});
            this.queryOrder(options.orderId);
        }
    },

    onShow () {

    },
    // 根据订单ID查询订单信息
    async queryOrder (orderId) {
        const result = await util.getDataFromServersV2('consumer/order/order-detail-for-update', {
            orderId: orderId
        },'post',false);
        if (!result) return;
        if (result.code === 0) {
            console.log(result.data);
            let res = result.data.orderReceive;
            let info = result.data.memberCardInfo;
            let orderInfo = result.data.orderInfo;
            let formData = this.data.formData;
            formData.userName = res.receiveMan; // 姓名
            formData.telNumber = res.receivePhone; // 电话
            formData.region = [res.receiveProvince, res.receiveCity, res.receiveCounty]; // 省市区
            formData.detailInfo = res.receiveAddress; // 详细地址
            let paper = this.data.paper;
            paper.idName = info.trueName;// 身份证姓名
            paper.idNum = info.idNumber;// 身份证号码
            paper.handlePhone = res.receivePhone;// 办理手机号
            paper.licenseInformation = orderInfo.vehPlates;// 行驶证信息
            paper.carPlateColor = this.data.carPlateColorList[parseInt(orderInfo.vehColor)];// 车牌颜色
            this.setData({
                formData,
                paper
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 上传剪卡凭证
    uploadPictures () {
        let that = this;
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            maxDuration: 30,
            camera: 'back',
            success (res) {
                if (res.errMsg === 'chooseMedia:ok') {
                    console.log(res);
                    let path = res.tempFiles[0].tempFilePath;
                    compressPicturesUtils.processingPictures(that, path, 'pressCanvas', 640, (res) => {
                        if (res) { // 被处理
                            that.upload(res);
                        } else { // 未被处理
                            that.upload(path);
                        }
                    });
                }
            },
            fail: (res) => {
				if (res.errMsg !== 'chooseImage:fail cancel') {
					util.showToastNoIcon('选择图片失败！');
				}
			}
        });
    },
	// 上传文件
    upload (path) {
        util.uploadFile(path, () => {
            util.showToastNoIcon('文件上传失败');
        }, (res) => {
            if (res) {
                res = JSON.parse(res);
                if (res.code === 0) { // 文件上传成功
                    util.showToastNoIcon('文件上传成功');
                    this.setData({
                        sim: '已上传'
                    });
                    this.fangDou('',500);
                } else { // 文件上传失败
                    util.showToastNoIcon(res.message);
                }
            } else { // 文件上传失败
                util.showToastNoIcon('文件上传失败');
            }
        }, () => {});
    },

    // 省市区选择
	onPickerChangedHandle (e) {
		console.log(e);
		let formData = this.data.formData;
		formData.region = e.detail.value;
		if (e.detail.code && e.detail.code.length === 3) {
			formData.regionCode = e.detail.code;
		}
		this.setData({
			formData,
			available: this.validateAvailable(true)
		});
	},

    // 从微信选择地址
	onClickAutoFillHandle () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_wechat_address');
		wx.chooseAddress({
			success: (res) => {
				console.log(res);
				let formData = this.data.formData;
				formData.userName = res.userName; // 姓名
				formData.telNumber = res.telNumber; // 电话
				formData.region = [res.provinceName, res.cityName, res.countyName]; // 省市区
				formData.detailInfo = res.detailInfo; // 详细地址
				this.setData({
					formData,
					tip2: '',
					tip3: '',
					mobilePhoneIsOk: /^1[0-9]{10}$/.test(res.telNumber.substring(0, 11))
				});
				this.setData({
					available: this.validateAvailable(true)
				});
			},
			fail: (e) => {
				if (e.errMsg === 'chooseAddress:fail auth deny' || e.errMsg === 'chooseAddress:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了访问您的收货地址授权，导致无法正常获取收货地址信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseAddress:fail cancel') {
					util.showToastNoIcon('选择收货地址失败！');
				}
			}
		});
	},
    // 选择当前地址
	onClickChooseLocationHandle () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_address');
		wx.chooseLocation({
			success: (res) => {
				let address = res.address;
				let name = res.name;
				if (address) {
					// 根据地理位置信息获取经纬度
					util.getInfoByAddress(address, (res) => {
						let result = res.result;
						if (result) {
							let location = result.location;
							name = result.title + name;
							// 根据经纬度信息 反查详细地址信息
							this.getAddressInfo(location, name);
							this.setData({
								available: this.validateAvailable(true)
							});
						}
					}, () => {
						util.showToastNoIcon('获取地理位置信息失败！');
					});
				}
			},
			fail: (e) => {
				// 选择地址未允许授权
				if (e.errMsg === 'chooseLocation:fail auth deny' || e.errMsg === 'getLocation:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了获取您的地理位置授权，导致无法正常获取地理位置信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseLocation:fail cancel') {
					util.showToastNoIcon('获取地理位置信息失败！');
				}
			}
		});
	},
	//  根据经纬度信息查地址
	getAddressInfo (location, name) {
		util.getAddressInfo(location.lat, location.lng, (res) => {
			if (res.result) {
				let info = res.result.ad_info;
				let formData = this.data.formData;
				formData.region = [info.province, info.city, info.district]; // 省市区
				formData.regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode]; // 省市区区域编码
				formData.detailInfo = name; // 详细地址
				this.setData({
					formData
				});
				// 校验数据
				this.setData({
					available: this.validateAvailable()
				});
			} else {
				util.showToastNoIcon('获取地理位置信息失败！');
			}
		}, () => {
			util.showToastNoIcon('获取地理位置信息失败！');
		});
	},
    // 校验字段是否满足
	validateAvailable (checkLicensePlate) {
		// 是否接受协议
		let isOk = true;
		let formData = this.data.formData;
		// 校验经办人手机号码
		// isOk = isOk && this.data.formData.operator && /^1[0-9]{10}$/.test(this.data.formData.operator);
		// 校验姓名
		isOk = isOk && formData.userName && formData.userName.length >= 1;
		// 校验省市区
		isOk = isOk && formData.region && formData.region.length === 3 && formData.region[0] !== '省';
		// 校验省市区编码
		isOk = isOk && formData.regionCode && formData.region.length === 3;
		// 校验详细地址
		isOk = isOk && formData.detailInfo && formData.detailInfo.length >= 2;
		// 检验手机号码
		isOk = isOk && formData.telNumber && /^1[0-9]{10}$/.test(formData.telNumber);
        // 校验剪卡凭证是否上传
        isOk = isOk && this.data.sim === '已上传';
		return isOk;
	},

    focus () {
		// 拉起下面输入框键盘时关闭 输入车牌号键盘
		this.selectComponent('#keyboard').hide();
	},
    // 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.name;	//
		let len = e.detail.cursor;	// 输入值的长度
		let value = e.detail.value;
		let formData = this.data.formData;
		let tip1 = '';	// 办理人手机号提示
		let tip2 = '';	// 收货姓名提示
		let tip3 = '';	// 收获人手机号提示
		// 手机号 校验
		if (key === 'telNumber' || key === 'operator') {
			let value = e.detail.value;
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			if (value.substring(0,1) !== '1' || value.substring(1,2) === '0') {
				if (key === 'telNumber') {
					this.setData({
						'formData.telNumber': ''
					});
				} else {
					this.setData({
						'formData.operator': ''
					});
				}
				return util.showToastNoIcon('非法号码');
			} else if (len < 11) {
				tip1 = key === 'operator' ? '*手机号未满11位，请检查' : '';
				tip3 = key === 'telNumber' ? '*手机号未满11位，请检查' : '';
			} else if (len === 11 && !flag) {
				util.showToastNoIcon('非法号码');
			}
		}
		// 收货人姓名 校验
		if (key === 'userName') {
			let patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im;	// 校验非法字符
			let patrn1 = /^[A-Za-z]+$/;	// 校验英文
			let patrn2 = /^[\u4e00-\u9fa5]{0,}$/;	// 校验汉字
			if (len < 1) {
				tip2 = '姓名不可为空';
			} else if (patrn.test(value)) {
				value = '';
				tip2 = '非法字符';
				util.showToastNoIcon('非法字符');
			} else if (patrn2.test(value)) {
				tip2 = len > 13 ? '超出可输入最大数' : '';
				this.setData({
					size: 13
				});
			} else if (patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			} else if (!patrn2.test(value) && !patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			}
		}
		formData[key] = value;
		this.setData({
			formData,
			tip1,
			tip2,
			tip3
		});
		this.fangDou('',500);
	},
	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					available: that.validateAvailable(true)
				});
			}, time);
		})();
	},
	// 按钮“确定”
    async next () {
        console.log('确定');
    }

});
