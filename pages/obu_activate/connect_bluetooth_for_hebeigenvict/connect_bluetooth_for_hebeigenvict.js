/*
 * 河北交投-金溢OBU
 */
const util = require('../../../utils/util.js');
const bleUtil = require('../libs/hebei_jy_sdk/jy-bluetooth-obu-wechatmp.js');
const app = getApp();
let timer;
const SUCCESS_CODE = '0';
const FAILED_CODE = '1';
Page({
    data: {
        ui: {
            showLoading: true, // 是否显示搜索中
            getListFailed: false, // 获取obu设备
            deviceName: undefined, // 设备名称
            connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
            isActivating: false, // 是否激活中
            errMsg: '',
            msg: '',
            activated: false, // 是否已经激活
            returnMiniProgram: 'returnMiniProgram',
            clickHandle: 'retry',
            cardNo: '',
            obuNo: '',
            isForce: false
        },
        idInfo: 'FFFFFFFF',
        host: '',
        device: undefined,
        cardNo: '', // 卡号
        obuNo: '', // obu号
        alertNum: 0,
        type: 0,
        isWriteObu: false,
        isUnload: 0,
        cardInfo: {}, // obu设备卡信息
        systemInfo: {}, // obu系统信息
        newOrderNo: '', // 二次激活返回的订单号
        handleCount: 0, // 执行次数
        timeout: undefined,
        obuStatus: undefined
    },
    onLoad (options) {
        /*
            激活流程
            1-读取设备卡片信息 2-读取设备obu信息 2.1-根据obuStatus判断是否进行二次激活；是则调用二次激活接口
            3-订单开始发行
            4-进入写OBU车辆信息文件 5-读取obu车辆随机数 6-调用高速接口获取写车辆信息指令 7-向车辆信息文件进行写入指令
            8-进入写OBU系统信息文件 9-读取obu系统随机数 10-调用高速接口获取写系统信息指令 11-向系统信息文件进行写入指令
            12-写标签系统信息确认(OBU车辆 | OBU系统)
            13-进入写0016信息文件 14-读取0016随机数 15-调用高速接口获取写0016信息指令 16-向0016信息文件进行写入指令
            17-进入写0015信息文件 18-读取0015随机数 19-调用高速接口获取写0015信息指令 20-向0015信息文件进行写入指令
            21-写设备结果通知
        */
        wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
            backgroundColor: '#ffffff',
            backgroundColorBottom: '#ffffff'
        });
        this.mySetData({
            urlPrefix: 'consumer/etc/hb/v2/interior/common'
        });
        this.start();
    },
    start () {
        this.openBluetooth();
        // 搜索倒计时
        timer = setTimeout(() => {
            wx.closeBluetoothAdapter();
            this.mySetData({
                showLoading: false,
                getListFailed: true
            });
        }, 15000);
    },
    returnMiniProgram () {
        util.returnMiniProgram();
    },
    // 封装自己的mySetData
    // 属性值不能为undefined
    mySetData (obj) {
        let uiArr = [
            'showLoading',
            'getListFailed',
            'deviceName',
            'connectState',
            'isActivating',
            'errMsg',
            'msg',
            'activated',
            'cardNo',
            'obuNo'
        ];
        let tergetKeys = Object.keys(obj);
        let ui = this.data.ui;
        let tempObj = {};
        for (let key of tergetKeys) {
            if (uiArr.indexOf(key) !== -1) {
                ui[key] = obj[key];
            } else {
                tempObj[key] = obj[key];
            }
        }
        tempObj['ui'] = ui;
        this.setData(tempObj);
    },

    // 开启蓝牙
    openBluetooth () {
        this.setData({
            msg: '搜索过程中请勿关闭小程序'
        });
        // 所有操作失败的回调
        const failed = () => {
            console.log('所有操作失败的回调');
            this.mySetData({
                showLoading: 0,
                getListFailed: 1
            });
        };
        // 打开蓝牙适配器
        const openBle = () => {
            console.log('打开蓝牙适配器');
            this.openBle(code => {
                console.log('code',+code);
                if (+code) {
                    failed();
                } else {
                    scanBle();
                } // 搜索 OBU 设备
            });
        };
        // 搜索 OBU 设备
        const scanBle = () => {
            this.scanBle(device => {
                if (+device === 1) return failed();
                console.log('搜索到设备：', device);
                this.mySetData({
                    deviceName: device.name,
                    showLoading: 0,
                    getListFailed: 0
                });
                clearTimeout(timer);
                connectBle(device); // 连接 OBU 设备
            });
        };
        // 连接 OBU 设备
        const connectBle = device => {
            wx.stopBluetoothDevicesDiscovery({
                success: res => {
                    console.log('停止搜索');
                    const that = this;
                    bleUtil.connectBle(device, function (code) {
                        console.log('code',code);
                        if (code.code === '0') {
                            console.log('蓝牙已连接：' + device.name + ' ' + device.deviceId);
                            that.mySetData({
                                connectState: 1,
                                getListFailed: 0
                            });
                            that.setData({
                                msg: 'OBU连接成功'
                            });
                            wx.onBLEConnectionStateChange(function (res) {
                                if (that.data.activated || that.data.isUnload || res.connected) {
                                    return;
                                }
                                that.setData({
                                    alertNum: that.data.alertNum + 1
                                });
                            });
                        } else {
                            console.warn('连接 & 部署设备失败: ', code);
                            that.mySetData({
                                connectState: 2,
                                getListFailed: 0
                            });
                            that.mySetData({
                                errMsg: 'OBU连接失败'
                            });
                        }
                    });
                }
            });
        };
        wx.openBluetoothAdapter({
            fail: failed,
            success: openBle
        });
    },
    openBle (callback) {
        wx.openBluetoothAdapter({
            success (res) {
                typeof callback === 'function' && callback(SUCCESS_CODE);
            },
            fail () {
                typeof callback === 'function' && callback(FAILED_CODE);
            }
        });
    },
    scanBle (callback) {
        let list = [];
        wx.startBluetoothDevicesDiscovery({
            success (res) {
                wx.onBluetoothDeviceFound((res) => {
                    console.log('找设备');
                    console.log(res);
                    for (let i = 0; i < res.devices.length; i++) {
                        let isHave = false;
                        for (let j = 0; j < list.length; j++) {
                            if (res.devices[i].deviceId === list[j].deviceId) {
                                isHave = true;
                                break;
                            }
                        };
                        if (!isHave) {
                            console.log(res.devices[i].localName);
                            if (new RegExp('^ETC.*$').test(res.devices[i].name)) {
                                console.log('数据：',list);
                                list.push(res.devices[i]);
                                callback(res.devices[i]);
                            }
                        }
                    }
                });
            },
            fail () {
                typeof callback === 'function' && callback(FAILED_CODE);
            }
        });
    },
    handleRetry () {
        this.setData({
            ui: {
                showLoading: true, // 是否显示搜索中
                getListFailed: false, // 获取obu设备
                deviceName: undefined, // 设备名称
                connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
                isActivating: false, // 是否激活中
                errMsg: '',
                msg: '',
                activated: false, // 是否已经激活
                returnMiniProgram: 'returnMiniProgram',
                clickHandle: 'retry',
                cardNo: '',
                obuNo: '',
                isForce: false
            },
            host: '',
            device: undefined,
            cardNo: '', // 卡号
            obuNo: '', // obu号
            type: 0,
            alertNum: 0,
            isUnload: 0
        });
        this.start();
    },
    // 点击按钮
    retry () {
        // 激活
        if (this.data.ui.connectState !== 1 && this.data.ui.getListFailed) {
            wx.uma.trackEvent('activation_failed_retry');
        }
        if (this.data.ui.connectState === 1) {
            if (this.data.ui.isActivating) {
                return;
            }
            this.mySetData({
                isActivating: true,
                errMsg: '',
                msg: ''
            });
            // 读取设备卡信息
            this.readCardNoFromDevice();
        } else {
            this.mySetData({
                showLoading: true,
                getListFailed: false,
                connectState: -1,
                errMsg: '',
                msg: ''
            });
            this.openBluetooth();
            timer = setTimeout(() => {
                wx.closeBluetoothAdapter();
                this.mySetData({
                    showLoading: false,
                    getListFailed: true
                });
            }, 15000);
        }
    },
    // 从设备读取卡信息
    readCardNoFromDevice () {
        // true
        this.mySetData({
            msg: '正在读取卡号...'
        });
        const that = this;
        bleUtil.getCardInfo(function (res) {
            console.log('卡片信息',res);
            if (res.code === '0') {
                console.log(res);
                that.mySetData({
                    cardNo: res.cardInfo.cardId
                });
                that.setData({
                    cardNo: res.cardInfo.cardId,
                    cardType: parseInt(res.cardInfo.cardType, 16), // 16进制转有符号的10进制整数
                    version: parseInt(res.cardInfo.cardVersion, 16),
                    cardInfo: res.cardInfo
                });
                that.readObuNoFromDevice();
            } else {
                that.isOver(`读取卡片信息失败 {code:${res.code},data:${res.data}}`);
            }
          });
    },
    // 从设备读取系统信息
    readObuNoFromDevice () {
        this.mySetData({
            msg: '正在读取OBU号...'
        });
        const that = this;
        bleUtil.getSystemInfo(function (res) {
            console.log('系统信息',res);
            if (res.code === '0') {
                var systemInfo = res.systemInfo;
                that.mySetData({
                    obuNo: systemInfo.serialNumber
                });
                that.setData({
                    contractVersion: parseInt(systemInfo.version, 16), // 16进制转有符号的10进制整数,
                    serialNumber: systemInfo.serialNumber,
                    contractType: systemInfo.type,
                    systemInfo: systemInfo
                });
                let baseInfo = wx.getStorageSync('baseInfo');
                if (!baseInfo) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');
                that.setData({obuStatus: baseInfo.obuStatus});
                if (baseInfo.obuStatus === 1 || baseInfo.obuStatus === 5) {
                    that.secondActive(baseInfo.obuStatus); // 二次激活
                } else {
                    that.orderOnline(baseInfo.obuStatus); // 第一次激活
                }
            } else {
                that.isOver(`读取系统信息失败 {code:${res.code},data:${res.data}}`);
            }
        });
    },
    /**
     * 二次激活
     * @param {*} obuStatus obu状态
     */
    secondActive (obuStatus) {
        const that = this;
        let params = {
            orderId: app.globalData.orderInfo.orderId // 订单ID
        };
        let endUrl = 'secondActive';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver('二次激活失败');
        }, (res) => {
            if (res.code === 0) {
                that.setData({
                    newOrderNo: res.data.thirdOrderNo
                });
                that.orderOnline(obuStatus);
            } else {
                that.isOver(res.message);
            }
        });
    },
    /**
     * 订单开始发行
     */
    orderOnline (obuStatus) {
        const that = this;
        let params = {
            orderType: obuStatus === 1 || obuStatus === 5 ? '2' : '1', // 1:设备二发;2:标签二次激活 ;3:标签注销;4:更换标签;11:更换车辆信息;12:注销清户;13:更换发行卡
            obuNo: that.data.ui.obuNo,
            cardNo: that.data.ui.cardNo,
            orderId: that.data.newOrderNo || app.globalData.orderInfo.orderId // 订单号
        };
        let endUrl = 'orderOnline';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver('订单开始发行失败');
        }, (res) => {
            if (res.code === 0) {
                that.pubFunc2(1,3);
                that.setData({handleCount: 0});
            } else if (res.code === 105) {
                if (++that.data.handleCount > 4) {
                    that.isOver(res.message);
                    that.setData({handleCount: 0});
                    clearTimeout(that.data.timeout);
                    return;
                }
                that.data.timeout = setTimeout(() => {
                    that.orderOnline(obuStatus);
                },5000);
            } else {
                that.isOver(res.message);
                that.setData({handleCount: 0});
            }
        });
    },
    /**
     * ESAM通道指令 | 卡片通道指令
     * 金溢：进文件目录-》获取随机数-》调用发行方接口获取写文件指令-》执行写文件
     * @param {*} type 1-进入目录文件；2-获取随机数；3-执行写文件；4-读取OBU设备已经写入的文件
     * @param {*} fileType  1-卡0015数据 2-卡0016数据 3-obu车辆数据 4-系统数据
     * @param {*} commands  要写入的指令（如：写签）
     * @param {*} callback  回调函数
     */
    pubFunc2 (type,fileType,commands = '',callback) {
        console.log('类型：',fileType + '步骤：' + type);
        let command = '';
        if (type === 1) { // 选择目录
            if (fileType === 1) {
                command = '00A40000021001';
            } else if (fileType === 2 || fileType === 4) {
                command = '00A40000023F00';
            } else if (fileType === 3) {
                command = '00A4000002DF01';
            }
        } else if (type === 2) { // 是否获取随机数
            command = '0084000004';
        } else if (type === 4) { // 获取obu设备写入的车辆信息
            // 00B400000A+8字节随机数+1字节期望读取的明文长度+00 ;
            // 8字节随机数，你可以自己随机生成，1字节长度就是你要读多少个字节;
            // 车辆信息文件总共79字节，如果你要读79字节，也就是转成16进制：4F; 其中后面20字节是保留字段，你也可以读59字节，那就是3B;单片式改成4F40,双片是4F00
            let arr3 = this.data.writeObuVehObj.transArr.map(item => { return item.toString(16).length === 1 ? '0' + item.toString(16) : item.toString(16); }).join('');
            command = '00B400000A' + arr3 + '4F' + '40';
            command = command.toLocaleUpperCase();
        } else {
            command = commands;
        }
        console.log('指令：',command);
        const that = this;
        if (fileType === 3 || fileType === 4) {
            console.log('进入写签-----------------------------------------');
            bleUtil.esamCommand(command, function (res) {
                console.log('esamCommand指令返回值：',res);
                if (res.code === '0') {
                    if (type === 1) {
                        console.log('已进目录');
                        that.pubFunc2(2,fileType);
                    } else if (type === 2) { // 获取随机数
                        console.log('已获取随机数');
                        that.setData({
                            random: res.data
                        });
                        switch (fileType) {
                            case 3:
                                that.handleWriteObu(fileType);
                                break;
                            case 4:
                                that.handleWriteObu(fileType);
                                break;
                        }
                    } else {
                        if (type === 4) {
                            that.setData({strCommand: res.data});
                            that.mySetData({msg: '读取OBU设备车辆信息'});
                        } else {
                            console.log('写签成功----------------------------------------------------------------------------------------');
                            that.mySetData({msg: fileType === 3 ? '车辆写签成功' : '系统写签成功'});
                        }
                        callback();
                    }
                } else {
                    const list = ['0015', '0016', 'obu', '系统信息'];
                    const list1 = ['进文件目录', '获取随机数', '执行写文件', '读取OBU设备已经写入的文件'];
                    const tips = list[fileType - 1];
                    const tips1 = list1[type - 1];
                    that.isOver(`${tips}-ESAM通道指令"${tips1}"失败：{code:${res.code},data:${res.data}}`);
                }
            });
        } else {
            console.log('进入写卡-----------------------------------------');
            bleUtil.cardCommand(command, function (res) {
                console.log('cardCommand指令返回值：',res);
                if (res.code === '0') {
                    if (type === 1) {
                        console.log('已进目录');
                        that.pubFunc2(2,fileType);
                    } else if (type === 2) { // 获取随机数
                        console.log('已获取随机数');
                        that.setData({
                            random: res.data
                        });
                        switch (fileType) {
                            case 1:
                                that.handleWriteEtc(fileType);
                                break;
                            case 2:
                                that.handleWriteEtc(fileType);
                                break;
                        }
                    } else {
                        console.log('写卡成功-------------------------------------------------------------------------------------------');
                        that.mySetData({msg: fileType === 1 ? '0015写卡成功' : '0016写卡成功'});
                        callback();
                    }
                } else {
                    const list = ['0015', '0016', 'obu', '系统信息'];
                    const list1 = ['进文件目录', '获取随机数', '执行写文件', '读取OBU设备已经写入的文件'];
                    const tips = list[fileType - 1];
                    const tips1 = list1[type - 1];
                    that.isOver(`${tips}-卡片通道指令"${tips1}"失败：{code:${res.code},data:${res.data}}`);
                }
            });
        }
    },

    /**
     * 写签 (车辆 | obu)
     * @param {*} fileType
     */
    handleWriteObu (fileType) {
        const that = this;
        that.mySetData({ msg: fileType === 3 ? '获取车辆信息中...' : '获取系统信息中...' });
        console.log('数据：',that.data);
        let params = {};
        if (fileType === 3) { // 写OBU车辆信息
            params.DataOfObuVehInfo = {
                posTSN: that.data.serialNumber.substring(that.data.serialNumber.length - 9,that.data.serialNumber.length),
                obuNo: that.data.ui.obuNo,
                randomForMAC: that.data.random
            };
        } else { // 写OBU系统信息
            console.log(that.data.strCommand);
            let [arr,index] = [[],0];
            let str = that.data.strCommand.substring(0,that.data.strCommand.length - 4);
            do { arr.push(parseInt('0x' + str.substring(index,index + 2))); index += 2; } while (index < str.length); // 转换成整形数组
            params.DataOfObuSysInfo = {
                posTSN: that.data.serialNumber.substring(that.data.serialNumber.length - 9,that.data.serialNumber.length),
                obuNo: that.data.ui.obuNo,
                randomForMAC: that.data.random,
                randomOfTrans: that.data.writeObuVehObj.randomOfTrans,
                vehicleInfoOfEncrypt: str
            };
            params.macArr2 = arr;
        }

        let str = that.data.random.toLocaleUpperCase();
        let arr = ['0x' + str.substring(0,2),'0x' + str.substring(2,4),'0x' + str.substring(4,6),'0x' + str.substring(6,8),0x00,0x00,0x00,0x00];
        let arr4 = [];
        for (let index = 0; index < arr.length; index++) {
            arr4.push(parseInt(arr[index]));
        }
        params.macArr = arr4;
        let endUrl = fileType === 3 ? 'writeObuVeh' : 'writeObuSys';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver(fileType === 3 ? '获取车辆信息失败！' : '获取系统信息失败！');
        }, (res) => {
            if (res.code === 0) {
                console.log(res);
                that.setData({isWriteObu: fileType === 3});
                if (fileType === 3) {
                    that.setData({writeObuVehObj: res.data.DataOfResponseForWriteVehicleInfo}); // 存放从发行方获取的车辆信息
                    that.pubFunc2(3,fileType,res.data.DataOfResponseForWriteVehicleInfo.cmdOfWriteVehicleInfo,() => {
                        that.pubFunc2(4,3,'',() => {
                            that.pubFunc2(1,4); // 开始系统写签
                        });
                    });
                } else {
                    that.setData({writeObuSysObj: res.data.DataOfResponseForWriteSystemInfo}); // 存放从发行方获取的系统信息
                    that.pubFunc2(3,fileType,res.data.DataOfResponseForWriteSystemInfo.cmdOfWriteSystemInfo,() => {
                        that.getTamperStatus();
                    });
                }
            } else {
                that.isOver(res.message);
            }
        });
    },
    /**
     * 获取防拆状态
     */
    getTamperStatus () {
        const that = this;
        bleUtil.getTamperStatus(function (res) {
            console.log('获取防拆状态',res);
            if (res.code === '0') {
              that.writeObuSysConfirm(res.temperStatus); // 写标签系统信息确认
            } else {
              message = '获取防拆状态失败：' + res.code;
            }
        });
    },
    /**
     * 写标签系统信息确认(写签)
     * @param {*} temperStatus 防拆状态
     */
    writeObuSysConfirm (temperStatus) {
        const that = this;
        let params = {
            DataOfObuSysInfoCompare: {
                posTSN: that.data.serialNumber.substring(that.data.serialNumber.length - 9,that.data.serialNumber.length),
                obuNo: that.data.ui.obuNo,
                signedDate: that.data.systemInfo.signedDate, // 标签起始日期
                expiredDate: that.data.systemInfo.expiredDate, // 标签到期日期
                disassemblyState: '0' + temperStatus // 标签拆卸标志位,00：已拆卸;01：未拆卸
            }
        };
        let endUrl = 'writeObuSysConfirm';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver('写标签系统信息确认');
        }, (res) => {
            if (res.code === 0) {
                if (that.data.obuStatus === 1 || that.data.obuStatus === 5) { // 如果二次激活不用再执行写卡操作
                    that.writeDeviceResult(); // 写设备结果通知
                } else {
                    that.pubFunc2(1,2); // 开始0016写卡
                }
            } else {
                that.isOver(res.message);
            }
        });
    },
    /**
     * 写卡 (0015 | 0016)
     * @param {*} fileType
     */
    handleWriteEtc (fileType) {
        this.mySetData({ msg: fileType === 1 ? '获取卡片0015信息中...' : '获取卡片0016信息中...' });
        console.log('数据：',this.data);
        let params = {
            cardNo: this.data.ui.cardNo,
            randomNum: this.data.random.substring(0,8)
        };
        const that = this;
        let endUrl = fileType === 1 ? 'writeCard0015' : 'writeCard0016';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver(fileType === 1 ? '获取卡片0015信息失败' : '获取卡片0016信息失败');
        }, (res) => {
            console.log(res);
            if (res.code === 0) {
                if (fileType === 1) {
                    that.pubFunc2(3,fileType,res.data.dataAndMAC,() => {
                        that.writeDeviceResult();
                    });
                } else {
                    that.pubFunc2(3,fileType,res.data.dataAndMAC,() => {
                        that.pubFunc2(1,1); // 开始0015写卡
                    });
                }
            } else {
                that.isOver(res.message);
            }
        });
    },
    /**
     * 写设备结果通知
     */
    writeDeviceResult () {
        const that = this;
        let params = {
            obuNo: that.data.ui.obuNo,
            cardNo: that.data.ui.cardNo,
            orderNo: that.data.newOrderNo || app.globalData.orderInfo.orderId, // 订单号
            orderId: app.globalData.orderId,
            result: true // 是否写设备成功，true：写卡签成功；fasle：写卡签失败
        };
        let endUrl = 'writeDeviceResult';
        util.getDataFromServer(`${that.data.urlPrefix}/${endUrl}`, params, () => {
            that.isOver('通知失败');
        }, (res) => {
            if (res.code === 0) {
                that.mySetData({
                    isActivating: false,
                    activated: 1,
                    errMsg: '',
                    msg: ''
                });
            } else {
                that.isOver(res.message);
            }
        });
    },
    // 重置
    isOver (msg) {
        // this.disonnectDevice();
        this.mySetData({
            device: 0,
            isActivating: false,
            getListFailed: true,
            errMsg: msg
        });
    },
    // 断开设备连接
    disonnectDevice () {
        obuSdk.disConnect({
            success: (res) => {
                wx.closeBluetoothAdapter();
            },
            fail: (res) => {
                wx.closeBluetoothAdapter();
            }
        });
    },
    // 停止扫描蓝牙设备
    stopScanDevice () {
        wx.stopBluetoothDevicesDiscovery({
            success: () => { },
            fail: () => { }
        });
    },
    // 是否强制发行
    forceHandle () {
        let ui = this.data.ui;
        ui.isForce = !ui.isForce;
        this.setData({
            ui
        });
    },
    onUnload () {
        this.setData({
            isUnload: 1
        });
        // this.disonnectDevice();
    }
});
