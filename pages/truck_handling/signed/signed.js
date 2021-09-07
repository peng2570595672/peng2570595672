const util = require('../../../utils/util.js');
let timer;
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
      // 是否获取焦点
     focus: false,
    // 需要获取焦点的序号
    focusIndex: 0,
    value1:"",
    value2:"",
    value3:"",
    value4:"",
    value5:"",
    value6:"",
    identifyingCode: '获取验证码',
    time: 59,// 倒计时
    plateNumber:"",
    phone:"",
    isRequest:false,
    isGetIdentifyingCoding:1,
    isDisabled:true
  },
  onLoad(){
    console.log(app.globalData.userInfo.mobilePhone,'==============================')
    console.log(app.globalData.userInfo,'=============================')
    this.setData({
      phone:app.globalData.userInfo.mobilePhone
    })
    
  },
  // 输入时事件
  inputListener(event) {
    let currentIndex =parseInt(event.target.id);
    if(currentIndex<7){
      this.setData({
        focus:true,
        focusIndex: currentIndex + 1
      })
    }else{
      this.setData({
        focus: false
      })
    }
  },
  //失去焦点
  onBindblur(event){
     let currentIndex =parseInt(event.target.id);
     let val=event.detail.value
        switch(currentIndex){
            case 1:
            this.setData({value1:val})
            break;
            case 2:
              this.setData({value2:val})
              break;
            case 3:
              this.setData({value3:val})
            break;
            case 4:
              this.setData({value4:val})
              break;
            case 5:
              this.setData({value5:val})
              break;
            case 6:
              this.setData({value6:val})
              break;  
         }
         let smsCode=this.data.value1.toString()+this.data.value2.toString()+this.data.value3.toString()+this.data.value4.toString()+this.data.value6.toString(); 
         smsCode.trim() 
         console.log(smsCode,'============'+smsCode.length)
         if(smsCode.length>=5){
            this.setData({
              isDisabled:false
            })
         }
  },
  	// 倒计时
	startTimer () {
		// 设置状态
		this.setData({
			identifyingCode: `${this.data.time}s`
		});
		// 清倒计时
		clearInterval(timer);
		timer = setInterval(() => {
			this.setData({time: --this.data.time});
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 59,
					isGetIdentifyingCoding:2,
					identifyingCode: '重新获取'
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}s`
				});
			}
		}, 1000);
	},
  //获取验证码-签约短信验证码
 async getCode(){
      this.startTimer()
      let params = {
        phone:app.globalData.userInfo.mobilePhone,
        debug:true
      }
      const result = await util.getDataFromServersV2('/consumer/order/submitETCTradeDepositContract', params);
      console.log(result,'==============================')
      //const result = await util.getDataFromServersV2('/consumer/order/confirmETCTradeDepositContract', {smsCode:smsCode});
  },
 //贵州工行通行费签约短信超时重发
 async onResubmitETCTradeDepositContract(){
  this.startTimer()
  let params = {
    phone:app.globalData.userInfo.mobilePhone
  }
  const result = await util.getDataFromServersV2('/consumer/order/resubmitETCTradeDepositContract', params);
  console.log(result,'==============================')
 },
  //提交代码
  async onSubmit(){
    this.setData({isRequest:true});
    let smsCode=this.data.value1.toString()+this.data.value2.toString()+this.data.value3.toString()+this.data.value4.toString()+this.data.value6.toString();
    let params = {
			smsCode:smsCode
    }
		const result = await util.getDataFromServersV2('/consumer/order/submitETCTradeDepositContract', params);
    //util.go('/pages/default/processing_progress/processing_progress?type=main_process');
  }
})