const wjUtils = require('../etc/WJAPI/wjUtils.js');
const Bluetooth = require('./util/index.js')
const util = require('../../../utils/util.js');
let timer;
let isGetOBU;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    state:'1',
    errMsg:'正在搜索设备',
    obuId:"",
    cardId:"",
    rechargeBalance:'', //价格
    orderId:'' //订单ID
  },
  onLoad(opents){
   this.setData({
    rechargeBalance:opents.rechargeBalance,
    orderId:opents.orderId
   })
  },
   /*
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.onReady()
  },
  onReady(){
      timer=setInterval(()=>{
        console.log(Bluetooth.BluetoothInfo.state,'------------当前状态-----------------')
        this.setData({
          state:Bluetooth.BluetoothInfo.state
      })
    },3000)
    isGetOBU=setInterval(()=>{ //处理获取卡号请求指令
      console.log("获取卡号请求指令000000000000000000000000000000")
      if(Bluetooth.BluetoothInfo.state==2) this.onGetOBU();
    },10000)
    this.onInIt();//连接蓝牙
  },
  onUnload(){
    clearInterval(timer); //清调请求
    clearInterval(isGetOBU);
  },
  //重视
  onRetry(){
    clearInterval(timer); //清调请求
    clearInterval(isGetOBU);
    this.onReady();
  },
  onInIt(){ //开始蓝牙连接处理
     Bluetooth.BluetoothInfo.state==1;
      Bluetooth.openBluetoothAdapter(res=>{ //初始化
        if(res.errMsg=="openBluetoothAdapter:ok"){
          this.onStartBluetoothDevicesDiscovery() //找蓝牙设备
        }else{
          wx.showToast({
            title:res.errMsg,
            icon:"none"
          })
        }
    })
  },
  onStartBluetoothDevicesDiscovery(){ //找蓝牙
    Bluetooth.startBluetoothDevicesDiscovery((res)=>{
              if(res.isShow && res.deviceArr.length>0){ //找到设备---连接蓝牙
                res.deviceArr.forEach((itme,index)=>{
                   if(index==0){ //处理当前配配的蓝牙
                    Bluetooth.connectDevice(itme,data=>{
                          this.setData({
                            state:data,
                            errMsg:"正在写入设备…"
                          })
                    });
                   }
                })
              }
    },res=>{ //没有找到蓝牙-失败
       this.setData({
         state:res
       })
    });  
  },
  /**
   * 获取卡号和OBU号 
   * 拿到卡号和obu号是让你判断用的，判断车辆信息的卡号和你读取的卡号是否一致
   * 圈存指令是接口给你的
   */
  onGetOBU(){
    if(Bluetooth.BluetoothInfo.state===2){
      let card=["00A40000023F00","00A40000021001","00B0950000"]
      Bluetooth.transCmd([card[0]],10,catalogue=>{ //主目录
        console.log(catalogue,'----------------------主目录')
        Bluetooth.transCmd([card[1]],10,files=>{ //选择文件
          console.log(files,'----------------------选择文件')
          Bluetooth.getCardId([card[2]],data=>{ //文卡
            console.log(data,"=========卡号===================")
            this.setData({
              cardId:data
            })
            Bluetooth.transCmd(["805C000204"],10,preBalance=>{
              console.log(preBalance,'查有多钱')
              let strPreBalance=parseInt(preBalance[0].substring(0,preBalance[0].length-4)) //获取余额
              console.log(strPreBalance,'---------------')
              this.setData({
                preBalance:strPreBalance
              })
               this.quancunCreateOrder()
               clearInterval(isGetOBU)
            })
          })
        })
      })
      //      Bluetooth.getObuId(["00B0810063"],res=>{
      //       console.log(res,"---------------obu号----------------------")
      //       this.setData({
      //         obuId:res
      //       })
      //       Bluetooth.transCmd([card[0]],10,catalogue=>{ //主目录
      //         Bluetooth.transCmd([card[1]],10,files=>{ //选择文件
      //           Bluetooth.getCardId([card[2]],data=>{ //文卡
      //             console.log(data,"=========卡号===================")
      //             this.setData({
      //               cardId:data
      //             })
      //             Bluetooth.transCmd(["805C000204"],10,preBalance=>{
      //               console.log(preBalance,'查有多钱')
      //               let strPreBalance=parseInt(preBalance[0].substring(0,preBalance[0].length-4)) //获取余额
      //               console.log(strPreBalance,'---------------')
      //               this.setData({
      //                 preBalance:strPreBalance
      //               })
      //                this.quancunCreateOrder()
      //                clearInterval(isGetOBU)
      //             })
      //           })
      //         })
      //       })
      // })
    }
  },
  /**
   * 圈存检测
   */
async onQuancunCheck(){
  let params={
    cardId:this.data.cardId, //卡号
    preBalance:this.data.preBalance,//圈存前卡内金额，单位：分
    fee:this.data.rechargeBalance //充值金额，单位：分
  }
  const result = await util.getDataFromServersV2("/consumer/order/after-sale-record/quancunCheck", params); //圈存检测
  console.log(result,'===============圈存检测===================')
  if(result.code!=0) this.wonError(1)
  if(result.data.chargeStatus==1){ //无异常,可以继续圈存
    this.quancunApply(result.data) //圈存申请
  }else{//存在异常流水
     this.quancunRepair(result.data)//圈存修复
  }
},
  /***
   * 圈存申请
   */
   quancunApply(obj){ 
    let command=obj.command.split(",");
      Bluetooth.getCosResponse(command,res=>{
        console.log(res,'-----------圈存初始化指令结果-----------')
        getQuancunApply(res)
    });
    async function getQuancunApply(cosResponse){
            let params={
              cardId:this.data.cardId,//卡号
              fee:this.data.rechargeBalance, //充值金额，单位：分
              preBalance:this.data.preBalance,//充值前金额，单位：分
              command:command,//	圈存初始化指令
              cosResponse:cosResponse//	圈存初始化指令结果
            }
            const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunApply', params);
            console.log(result,'圈存申请----------')
            if(result.code==0){
               this.quancunConfirm(result);
            }else{
               this.wonError(1)
             }
        }
  },
  /***
   * 圈存确认
   */
  async quancunConfirm(obj){
    let params={
      rechargeId:"", //圈存订单号
      command:"",//圈存初始化指令
      cosResponse:"",//圈存初始化指令结果
    }
    const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunConfirm', params);
    console.log(result,'圈存申请确定')
    if(result.code==0){
      this.wonError(2)//成功失败
    }else{
      this.wonError(1)
    }
  },
    /***
   * 圈存修复
   */
  async quancunRepair(obj){ //
    let params={
      rechargeId:"", //圈存订单号
      command:"",//圈存初始化指令
      cosResponse:"",//圈存初始化指令结果
    }
    const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunRepair', params);
    console.log(result,'圈存修复结果')
    if(res.code!=0) this.wonError(1);
    if(result.fixStatus===2){//修复完成
      this.quancunConfirm(result) //圈存检测
    }else{
      //this.quancunRepair(obj) //再修复
      this.wonError(1);
    }
 },
   /***
   * 圈存创建充值订单
   */
  async quancunCreateOrder(){ 
    let params={
      cardId:this.data.cardId, //卡号
      fee:this.data.rechargeBalance, //充值金额，单位：分
      orderId:this.data.orderId //订单ID
    }
    const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunCreateOrder', params);
    console.log(result,'================圈存创建充值订单====================')
    if(result.code==0){
      this.onQuancunCheck(result); //圈存检测
    }else{
       wx.showToast({
        title:result.message,
        icon:"none"
      })
       this.wonError(1)
    }
  },
  //失败跳转1失败、2成功
  wonError(state){
    clearInterval(timer); //清调请求
    clearInterval(isGetOBU);
   return util.go(`/pages/obu/audit_result/audit_result?state=${state}`);
  }

})