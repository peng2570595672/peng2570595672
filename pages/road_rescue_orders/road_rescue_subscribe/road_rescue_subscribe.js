const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({

    data: {
        roadRescueList: {}, // 救援订单
        dateTime: '',
        agreement: false, // 是否同意相关要求
        imgList: [ // 上传道路救援资料
            {
                title1: '高速故障照片',
                desc: '上传高速故障照片\n请打日期和地址水印',
                exampleImgUrl: 'https://file.cyzl.com/g001/M02/FB/CB/oYYBAGTRrr2AStsFAAGHWiNb6A0948.png', // 示例图路径
                uploadedUrl: '' // 已上传的图片路径
            },
            {
                title1: '车辆托起照片',
                desc: '上传车辆托起照片\n请打日期和地址水印',
                exampleImgUrl: 'https://file.cyzl.com/g001/M02/FB/CB/oYYBAGTRrqKAL6RcAAGgsQu3WHM874.png',
                uploadedUrl: ''
            },
            {
                title1: '高速救援发票照片',
                desc: '上传高速救援发票照片\n请打日期和地址水印',
                exampleImgUrl: 'https://file.cyzl.com/g001/M02/FB/CB/oYYBAGTRrtqAUnNfAAA18BaN6vM766.png',
                uploadedUrl: ''
            },
            {
                title1: 'ETC通行记录照片',
                desc: '上传ETC通行记录照片\n请打日期和地址水印',
                exampleImgUrl: 'https://file.cyzl.com/g001/M02/FB/CB/oYYBAGTRruuARW3jAACKhsnadAM962.png',
                uploadedUrl: ''
            }
        ],
        pictureWidth: 0,
        pictureHeight: 0,
        collectionObj: { // 收款对象
            name: '',
            price: '',
            cardNum: '',
            bank: ''
        }
    },

    onLoad (options) {
        this.getOrderInfo(options.orderId);
    },

    onShow () {

    },

    async getOrderInfo (orderId) {
        let subscribeInfo = wx.getStorageSync('subscribeInfo');
        const result = await util.getDataFromServersV2('consumer/order/single-road-rescue', {orderId: orderId},'POST',true);
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                roadRescueList: result.data,
                'collectionObj.name': result.data.owner
            });
            if (result.data.orderId === subscribeInfo.orderId) {
                this.setData({
                    imgList: subscribeInfo.imgList,
                    collectionObj: subscribeInfo.collectionObj,
                    dateTime: subscribeInfo.times
                });
            }
        } else { util.showToastNoIcon(result.message); }
    },

    cDPopup (obj) {
        console.log(obj);
        this.setData({
            dateTime: obj.detail.dataTime
        });
    },

    selectedTime () {
        this.selectComponent('#cdPopup').show({
            isBtnClose: true,
            argObj: {
                type: 'selectedTime',
                title: '请选择呼叫救援时间'
            }
        });
    },
    // 是否同意相关要求
    agreementFunc () {
        this.setData({agreement: !this.data.agreement});
    },
    // 上传图片(拍照/获取手机图片)
    uploadFunc (e) {
        util.showLoading();
        let that = this;
        let imgIndex = e.currentTarget.dataset.index;
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success (res) {
                // tempFilePath可以作为img标签的src属性显示图片
                if (res.errMsg === 'chooseImage:ok') {
                    const tempFilePaths = res.tempFilePaths;
                    that.progressPhoto(tempFilePaths,imgIndex);
                    // let imgFormat = ['jpg','png','jepg'];
                    // imgFormat.map(item => {
                    //     if (tempFilePaths[0].includes(item,-1)) {
                    //         that.progressPhoto(tempFilePaths,imgIndex);
                    //     }
                    // });
                    util.hideLoading();
                }
            },
            fail (res) {
                util.hideLoading();
            }
        });
    },
    // 处理图片
    progressPhoto (path,imgIndex) {
        console.log(path,imgIndex);
        if (wx.canIUse('compressImage')) {
            // 压缩图片
            wx.compressImage({
                src: path, // 图片路径
                quality: app.globalData.quality, // 压缩质量
                success: (res) => {
                    console.log(res);
                    path = res.tempFilePath;
                },
                complete: () => {
                    this.getPictureInfo(path[0], imgIndex);
                }
            });
        } else {
            this.getPictureInfo(path[0], imgIndex);
        }
    },
    getPictureInfo (path, imgIndex) {
        compressPicturesUtils.processingPictures(this, path, 'pressCanvas', 640, (res) => {
            if (res) { // 被处理
                this.uploadFunc1(res, imgIndex);
            } else { // 未被处理
                this.uploadFunc1(path, imgIndex);
            }
        });
    },
    // 上传图片(把图片上传服务器)
    uploadFunc1 (path,imgIndex) {
        // 上传文件
        util.uploadFile(path, () => {
            util.showToastNoIcon('上传失败！');
        }, (res) => {
            if (res) {
                res = JSON.parse(res);
                console.log(res);
                if (res.code === 0) { // 文件上传成功
                    util.showToastNoIcon('上传成功');
                    let imgList = this.data.imgList.map((item,index) => {
                        if (index === imgIndex) {
                            item.uploadedUrl = res.data[0].fileUrl;
                        }
                        return item;
                    });
                    this.setData({imgList});
                } else { // 文件上传失败
                    util.showToastNoIcon(res.message);
                }
            } else { // 文件上传失败
                util.showToastNoIcon('上传失败');
            }
        }, () => {
            util.hideLoading();
        });
    },

    // 展示示例图
    exampleFunc (e) {
        let item = e.currentTarget.dataset.item;
        this.selectComponent('#popTipComp').show({type: 'road_rescue',title: item.title1 + '示例',url: item.exampleImgUrl});
    },

    // 查看图片
    showImg (e) {
        let item = e.currentTarget.dataset.item;
        this.selectComponent('#popTipComp').show({type: 'seven',title: item.title1,url: item.uploadedUrl,btnShadowHide: true});
    },

    // 输入框
    bindInput (e) {
        let key = e.currentTarget.dataset.key;
        let cursor = e.detail.cursor;
        let value = e.detail.value;
        switch (key) {
            case 'price':
                if (cursor <= 2 && value >= 0) {
                    this.setData({'collectionObj.price': value});
                } else {
                    if (value <= 500 && value >= 0) {
                        this.setData({'collectionObj.price': value});
                    } else {
                        this.setData({'collectionObj.price': ''});
                        util.showToastNoIcon('超过限额，请重新输入');
                    }
                }
                break;
            case 'cardNum':
                this.setData({'collectionObj.cardNum': value});
                break;
            case 'bank':
                this.setData({'collectionObj.bank': value});
                break;
            default:
                break;
        }
    },
    // 立即提交
    async subcribe () {
        if (!this.data.agreement) {
            return util.showToastNoIcon('请同意协议');
        }
        if (!this.data.dateTime) {
            return util.showToastNoIcon('请填写救援时间');
        }
        if (this.data.imgList.map(item => !item.uploadedUrl).includes(true)) {
            return util.showToastNoIcon('请上传相关照片');
        }
        let collectionObj = this.data.collectionObj;
        if (!collectionObj.name || !collectionObj.price || !collectionObj.cardNum || !collectionObj.bank) {
            return util.showToastNoIcon('请完善收款信息');
        }
        wx.setStorageSync('subscribeInfo',{
            orderId: this.data.roadRescueList.orderId,
            times: this.data.dateTime,
            imgList: this.data.imgList,
            collectionObj: this.data.collectionObj
        });
        let params = {
            orderId: this.data.roadRescueList.orderId,
            rescueTime: this.data.dateTime,
            vehFaultPic: this.data.imgList[0].uploadedUrl,// 高速故障图片
            vehLiftPic: this.data.imgList[1].uploadedUrl,// 车牌托起图片
            rescuePic: this.data.imgList[2].uploadedUrl,// 救援发票图片
            passPic: this.data.imgList[3].uploadedUrl,// ETC通行记录图片
            receiveName: collectionObj.name,// 收款人姓名
            rescueMoney: collectionObj.price * 100,// 金额 单位分/
            cardNo: collectionObj.cardNum,// 卡号
            openAccountBank: collectionObj.bank // 开户行
        };
        const result = await util.getDataFromServersV2('consumer/order/apply/road-resue', params,'POST',true);
        if (!result) return;
        if (result.code === 0) {
            // 订阅消息
            util.subscribe(['IL7teM6zMDMLY159JmPNSYKoT8RztRpxpEx6lgjuz_k'], `/pages/road_rescue_orders/road_rescue_schedule/road_rescue_schedule?orderId=${this.data.roadRescueList.orderId}&applyId=${result.data.applyId}`);
        } else { util.showToastNoIcon(result.message); }
    }
});
