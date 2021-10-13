const util = require('../../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    imgPath:"./assets/app.npg",
    page:1,
    isLoding:true,
    pageSize:10,
    list:[],
    total:0, //总条数
    latitude:26.67865,
    longitude:106.62298,
    navData:[{title:"距离优先",value:""},{title:"低价优先",value:"price"}],
    navData2:["92#","95#","98#","0#"],
    navData3:[{title:"全部",value:""},{title:"中石油",value:1},{title:"中石化",value:2},{title:"壳牌",value:3},{title:"其他",value:4}],
    isShow:false,
    isShowID:0,
    distance:"距离优先",
    oilCode:"92#",
    stationType:"",
    stationTypeName:"全部",
    orderByField:"",  //price
    searchKey:"",
    todayCountryPrice:"0", //今日油加
    key:"6PEBZ-L5ZWU-72EV3-BAYUJ-ZQQY3-HSBA3", //腾讯地图KEY
    cityId:"",
    cityCode:""
  },
    /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    this.getLocation()
  
  },
  //显示table
  onShowTable(e){
    console.log(e)
    console.log(e.currentTarget.dataset.id)
    this.setData({
      isShow:true,
      isShowID:e.currentTarget.dataset.id
    })
  },
  //不显示table
  onHideTable(){
    this.setData({
      isShow:false
    })
  },
  onTableInde(e){
    console.log(e)
    let id=parseInt(e.currentTarget.dataset.id);
    this.setData({
      distance:id==0?e.currentTarget.dataset.name.title:this.data.distance,
      orderByField:id==0?e.currentTarget.dataset.name.value:this.data.orderByField,
      oilCode:id==1?e.currentTarget.dataset.name:this.data.oilCode,
      stationTypeName:id==2?e.currentTarget.dataset.name.title:this.data.stationTypeName,
      stationType:id==2?e.currentTarget.dataset.name.value:this.data.stationType,
      isShow:false,
      page:1,
      list:[],
    })
    if(this.data.orderByField=="price"){
      let cityCode=this.data.cityId.substring(0,4)+"00"
      this.setData({
        cityCode:cityCode
      })
    }else{
      this.setData({
        cityCode:""
      })
    }

    this.onGetList()
  },
  onScrolltolower(e){
    if(this.data.list.length>=this.data.total) return;
    this.setData({
			page:  this.data.page + 1
    });
    console.log(e,"99999999999999999")
    this.onGetList()
  },
  async onGetList(){
    console.log( this.data.page,'==================')
   util.showLoading({title: '加载中'});
   let params={
    userLng:this.data.longitude,
    userLat:this.data.latitude,
    pageSize:this.data.pageSize,
    page:this.data.page,
    cityId:this.data.cityCode,//this.data.cityId,//城市编码
    oilCode:this.data.oilCode,//油号，例如:95#
    stationType:this.data.stationType,//油站品牌
    orderByField:this.data.orderByField,//true就是价格
    searchKey:this.data.searchKey
   }
    const result = await util.getDataFromServersV2('consumer/order/oil/stationsList', params);
    if(result.code!=0) return;
    let list = result.data.list || [];
    console.log(this.data.list)
      this.setData({
          list:this.data.list.concat(list),
          total:result.data.total,
          isLoding:false
        })
        console.log(this.data.list,'================数据是多少呢==============')
  },
  //按地址查
  onSearch(e){
    console.log(e.detail.value)
    this.setData({
      page:1,
      list:[],
      searchKey:e.detail.value
    });
    this.onGetList()
  },
  onGetUrl(e){
  let url=e.target.dataset.url
    util.go(url)
  },
  //获取位置信息
  getLocation(){
    wx.getLocation({
      type: 'wgs84',
      success:(res)=>{
        console.log(res,'--------成功----------')
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        this.setData({
          latitude,
          longitude
        })
        this.getCity(latitude,longitude)
      },
      fail:(error)=>{
          console.log(error,'--------失败----------')
          this.showFail()
      }
     })
  },
  //当用户拒绝授权时，弹窗引导开启定位
  showFail(){
    wx.showModal({
      title:"使用加油服务需获取当前定位信息，请先开启位置授权",
      showCancel:false,
      confirmText:"设置",
      confirmColor:"#00B85C",
      success(){
         wx.openSetting({ //调起设置
          success (res) {
            console.log(res.authSetting)
          }
        })
      }
    })
  },
  //导航
  onNavigation(e){
    let itme=e.currentTarget.dataset.id;
      wx.openLocation({
        latitude:itme.latitude,
        longitude:itme.longitude,
        name:itme.stationName,//位置名
        address:itme.provinceName+itme.cityName+itme.location,//地址的详细说明
        scale: 18
      })
  },
  async onWebView(e){
    let item=e.currentTarget.dataset.id;
    console.log(app.globalData.userInfo)

     	wx.navigateToMiniProgram({
					appId: 'wx115b13ee3613ef26',
					path:`pages/details/details?stationId=${item.stationId}&phone=${app.globalData.mobilePhone}&platformName=${item.platformName}`,
					envVersion: 'release', // 正式版
					fail () {
						util.showToastNoIcon('调起小程序失败, 请重试！');
					}
				});

    // let params={
    //   userLng:this.data.longitude,// 	是 	string 	用户坐在位置经度，百度坐标系
    //   userLat:this.data.latitude,// 	是 	string 	用户坐在位置纬度，百度坐标系
    //   userPhone:app.globalData.mobilePhone,// 	是 	string 	手机号
    //   stationId:item.stationId// 	是 	string 	油站号码
    // }
    // console.log(params,'-----------油站号码---------------')
    // const result = await util.getDataFromServersV2('consumer/order/oil/getStationUrl', params);
    // console.log(result)
    // if(result.code==0){
    //   let url=encodeURIComponent(result.data.url)
    //   util.go(`/pages/ejiayou/webview/webview?url=${url}`)
    // }
  },
  async statisticsCountryPrice(adcode){ //今日油加
    let params={
        cityId:adcode.substring(0,4)+"00",
        oilCode: "92#"
    }
    const result = await util.getDataFromServersV2('consumer/order/oil/statisticsCountryPrice', params);
      if(result.data && result.code==0){
        this.setData({
          todayCountryPrice:parseFloat(result.data.stPrice)
        })
      }
  },
  getCity(latitude,longitude){
    let $this=this;
    wx.request({
      url:'https://apis.map.qq.com/ws/geocoder/v1/?location='+latitude+','+longitude+'&key='+this.data.key,
      data: {},
      header: { 'Content-Type': 'application/json' },
      success: function (ops) {
        console.log('定位城市：',ops)
        let adcode=ops.data.result.ad_info.adcode;
        $this.setData({
          cityId:adcode
        })
        $this.onGetList();
        $this.statisticsCountryPrice(adcode)
      },
      fail: function (resq) {
          wx.showModal({
                title: '信息提示',
                content: '请求失败',
                showCancel: false,
                confirmColor: '#f37938'
          });
      },
      complete: function () {
      }
      })
  }
})