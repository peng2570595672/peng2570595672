const wjUtils = require('../etc/WJAPI/wjUtils.js');
const Bluetooth = require('./util/index.js')
const util = require('../../../utils/util.js');
let timer;
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
    orderId:'', //订单ID
    payOrders:"", //圈存检测返回的订单号
    rechargeId:"",
    applyType:"1",
    orderType:"0"
  },
  onLoad(opents){
    console.log(opents,'《=======================参数数据信息')
      this.setData({
        rechargeBalance:opents.rechargeBalance,
        orderId:opents.orderId
      })
      this.onStart()
  },
  onStart(){ 
      console.log('=================================重新连接蓝牙======================================================')
      clearInterval(timer); //清调请求
      timer=setInterval(()=>{
          console.log(Bluetooth.BluetoothInfo.state,'------------当前状态--------')
          if(Bluetooth.BluetoothInfo.state==1){
            this.setData({
              errMsg:"正在搜索设备"
            })
          }
          if(Bluetooth.BluetoothInfo.state==2){
            this.setData({
              errMsg:"正在写入设备"
            })
          }
          this.setData({
            state:Bluetooth.BluetoothInfo.state
          })
       },500);
    Bluetooth.openBluetoothAdapter(res=>{ //初始化蓝牙模块
      console.log(res,'-------------初始化蓝牙模块------------------')
      if(res==2){
         this.onGetOBU();//执照
         this.setData({errMsg:"正在写入设备"})
      }
   })
  },
  onRetry(){ //重新连接
    if(this.data.cardId){
      Bluetooth.BluetoothInfo.state==1;
      this.setData({
        errMsg:"正在搜索设备"
      })
      Bluetooth.openBluetoothAdapter(res=>{ //初始化蓝牙模块
        if(res==2){
           this.setData({errMsg:"正在写入设备"})
           this.onQuancunCheck();
        }
     })
    }else{
      this.onStart()
    }
  },
  onUnload(){
    clearInterval(timer); //清调请求
  },
  /**
   * 获取卡号和OBU号 
   * 拿到卡号和obu号是让你判断用的，判断车辆信息的卡号和你读取的卡号是否一致
   * 圈存指令是接口给你的
   * 00A40000023F00 主目录
   * 00A40000021001 选择文件
   * 00B0950000 选择文件
   * 805C000204  查有多钱
   */
  onGetOBU(){
    console.log("======================获取卡号和OBU号 获取卡号和OBU号===================================")
    if(Bluetooth.BluetoothInfo.state===2){
      let card=["00A40000023F00","00A40000021001","00B0950000",'805C000204']
      console.log(card,'--------------指令---------------')
      Bluetooth.transCmd(card,10,res=>{ //主目录
      console.log(res,'------------主目录主目录----------------------')
      let cardId=Bluetooth.getCardId(res[2]);
      let strPreBalance=parseInt(res[3].substring(0,res[3].length-4)) //获取余额
      console.log(cardId,'---------------卡号----------------',strPreBalance)
        this.setData({
          cardId:cardId,
          preBalance:strPreBalance
        })
        this.quancunCreateOrder()
      })
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
  this.setData({
    payOrders:result.data.payOrders
  })
  if(result.data.chargeStatus==1){ //无异常,可以继续圈存
    this.quancunApply(result.data) //圈存申请
  }else{//存在异常流水
    console.log("圈存修复开始了")
    let command=result.data.command.split(",");
     Bluetooth.transCmd(command,10,res=>{
       console.log(res,'------------圈存修复执行指令结果----------------')
        this.quancunRepair(result.data,res)//圈存修复
     })
  }
},
  /***
   * 圈存申请指令
   */
   quancunApply(obj){ 
    let command=obj.command.split(",");
      console.log(command,'-----------------圈存申请指令------------------')
      Bluetooth.transCmd(command,10,res=>{
        console.log(res,'<============================圈存初始化指令结果-----------')
        this.getQuancunApply(command,res)
    });
  },
    /***
   * 圈存申请
   */
  async getQuancunApply(command,cosResponse){
    let params={
      cardId:this.data.cardId,//卡号
      fee:this.data.rechargeBalance, //充值金额，单位：分
      preBalance:this.data.preBalance,//充值前金额，单位：分
      command:command.join(),//	圈存初始化指令
      cosResponse:cosResponse.join(),//	圈存初始化指令结果
      orderId:this.data.orderId,
      rechargeId:this.data.rechargeId, //圈存修复时候如果需要修复返回了需修复圈存订单号
      applyType:this.data.applyType, //圈存类型,1圈存申请，2半流水修复申请
      orderType:this.data.orderType//圈存订单类型,0-圈存,1-补卡额
    }
    const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunApply', params);
    console.log(result,'圈存申请----------')
    if(result.code==0){
       this.quancunConfirm(result.data);
    }else{
       this.wonError(1)
     }
  },
  /***
   * 圈存确认
   */
 quancunConfirm(obj){
        
          Bluetooth.transCmd([obj.command],10,res=>{
            console.log(res,'-----------------圈存确认9999999999------------------')
              let params={
                rechargeId:obj.rechargeId, //圈存订单号
                command:obj.command,//圈存初始化指令
                cosResponse:res.join(),//圈存初始化指令结果
            }
              this.getQuancun(params)
          })
  },
  //圈存确认接口
  async getQuancun(params){
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
  async quancunRepair(obj,cosResponse){ 
    console.log("圈存修复------------------------------")
    let command=obj.command.split(",");
    let params={
      rechargeId:obj.rechargeId, //圈存订单号
      command:command.join(),//圈存初始化指令
      cosResponse:cosResponse.join(),//圈存初始化指令结果
    }
    const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/quancunRepair', params);
    console.log(result,'<======================圈存修复结果')
    if(!result.data) return false;
    this.setData({
      rechargeId:result.data.rechargeId,
      applyType:2,
    })
    if(result.data.fixStatus===1){//1重新修复初始化，再次修复
      console.log("1重新修复初始化，再次修复")
      this.onQuancunCheck();//圈存检测
    }else if(result.data.fixStatus===2){// 2–修复完成，进行确认
      console.log("2–修复完成，进行确认")
      this.quancunConfirm(result.data) //圈存确认
    }else if(result.data.fixStatus===3){//3–写卡失败,重新圈存，进行申请
     let command=result.data.command.split(",")
     console.log(command,"写卡失败,重新圈存，进行申请")
      Bluetooth.transCmd(command,10,res=>{
        console.log(res,"000000000000000000000000")
          this.getQuancunApply(command,res)
      });
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
    Bluetooth.disconnectDevice()//释放资源
   return util.go(`/pages/obu/audit_result/audit_result?state=${state}`);
  }

})