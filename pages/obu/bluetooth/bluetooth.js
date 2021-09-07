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
    cardId:""
  },
  onLoad(){

  },
   /*
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    timer=setInterval(()=>{
         console.log(Bluetooth.BluetoothInfo.state,'------------当前状态-----------------')
          this.setData({
            state:Bluetooth.BluetoothInfo.state
        })
      },3000)
      isGetOBU=setInterval(()=>{ //处理获取卡号请求指令
        if(Bluetooth.BluetoothInfo.state==2) this.onGetOBU();
     },10000)
      this.onInIt();//连接蓝牙
  },
  onUnload(){
    clearInterval(timer); //清调请求
    clearInterval(isGetOBU);
  },
  onInIt(){ //开始蓝牙连接处理
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
           Bluetooth.gitObuId(["00B0810063"],res=>{
            console.log(res,"---------------obu号----------------------")
            this.setData({
              obuId:res
            })
            Bluetooth.transCmd([card[0]],10,catalogue=>{ //主目录
              Bluetooth.transCmd([card[1]],10,files=>{ //选择文件
                Bluetooth.gitCardId([card[2]],data=>{ //文卡
                  console.log(data,"=========卡号===================")
                  this.setData({
                    cardId:data
                  })
                  this.onWrittenInformation();
                  clearInterval(isGetOBU)
                })
              })
            })
      })
    }
  },
  /***
   * 发起写卡申请
   */
 async onWrittenInformation(){ //
    //const result = await util.getDataFromServersV2('consumer/member/icbcv2/open', params);
    if(result.card==this.data.cardId){
      Bluetooth.transCmd([card[0]],10,catalogue=>{ //写卡
        
      })
    }
     //util.go("pages/obu/audit_result/audit_result")
  },
  /**
   * 圈存检测
   */
async onQuancunCheck(){
  let params={
    cardId:"", //卡号
    preBalance:'',//圈存前卡内金额，单位：分
    fee:"" //充值金额，单位：分
  }
  const result = await util.getDataFromServersV2("/consumer/order/after-sale-record/quancunCheck", params); //圈存检测
  console.log(result,'===============圈存检测===================')
}

})