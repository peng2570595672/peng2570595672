const dataHandler = require("./etcDataHandler.js")
const dataUtil = require("./etcDataUtil.js")
module.exports = {
  sendDataToDevice: sendDataToDevice,
  connectBleDevice: connectBleDevice,
  scanBleDevice: scanBleDevice
}
const codeEnum = {
  successCode: 0,
  failureCode: 1,
  stopScanFailure: 2,
  creatConnectionFailure: 3,
  getServiceFailure: 4,
  noTargetServiceId: 5,
  getCharacteristicsFailure: 6,
  noTargetCharacteristic: 7,
  monitorNotificationFailure: 8,
  authResponseFailure: 9,
  initResponseFailure: 10,
  initDeviceFailure: 11,
  dataFrameTransboundary: 12,
  notPassBccCheck: 13,
  sendDataFailure: 14,
  timeout: 100
}
const FUNCTION = "\x66\x75\x6e\x63\x74\x69\x6f\x6e";
const serviceUUID = "\x30\x30\x30\x30\x46\x45\x45\x37\x2d\x30\x30\x30\x30\x2d\x31\x30\x30\x30\x2d\x38\x30\x30\x30\x2d\x30\x30\x38\x30\x35\x46\x39\x42\x33\x34\x46\x42";
const writeUUID = "\x30\x30\x30\x30\x46\x45\x43\x37\x2d\x30\x30\x30\x30\x2d\x31\x30\x30\x30\x2d\x38\x30\x30\x30\x2d\x30\x30\x38\x30\x35\x46\x39\x42\x33\x34\x46\x42";
const readUUID = "\x30\x30\x30\x30\x46\x45\x43\x38\x2d\x30\x30\x30\x30\x2d\x31\x30\x30\x30\x2d\x38\x30\x30\x30\x2d\x30\x30\x38\x30\x35\x46\x39\x42\x33\x34\x46\x42";
const connectTime = (100 * 1000);
const startA2Time = 240;
const waitA2ResponseTime = 2000;
const restrictionName = "\x45\x54\x43";
var haveFoundDevice = new Array(); var connectDeviceId; var connectCallback; var connectTimer; var startA2Timer; var waitA2ResponseTimer; var frame = ""; var frameLen = 0; var frames = new Array(); var framesLen = 0; var dataHandlerCallback; var sendBufferArray = new Array(); var sendIndex; var resendCount = 3;
function scanBleDevice(IAug1) { haveFoundDevice = new Array(); wx['\x73\x74\x61\x72\x74\x42\x6c\x75\x65\x74\x6f\x6f\x74\x68\x44\x65\x76\x69\x63\x65\x73\x44\x69\x73\x63\x6f\x76\x65\x72\x79']({ services: ["\x46\x45\x45\x37"], success: function (ieQZ2) { wx['\x6f\x6e\x42\x6c\x75\x65\x74\x6f\x6f\x74\x68\x44\x65\x76\x69\x63\x65\x46\x6f\x75\x6e\x64'](function (zsYJcwZfD3) { for (let i = 0; i < zsYJcwZfD3['\x64\x65\x76\x69\x63\x65\x73']['\x6c\x65\x6e\x67\x74\x68']; i++) { let device = zsYJcwZfD3['\x64\x65\x76\x69\x63\x65\x73'][i]; let ishave = false; for (let j = 0; j < haveFoundDevice['\x6c\x65\x6e\x67\x74\x68']; j++) { let foundDevice = haveFoundDevice[i]; if (device['\x64\x65\x76\x69\x63\x65\x49\x64'] == foundDevice['\x64\x65\x76\x69\x63\x65\x49\x64']) { ishave == true; break } } if (ishave == false) { haveFoundDevice['\x70\x75\x73\x68'](device); typeof IAug1 == FUNCTION && IAug1(codeEnum['\x73\x75\x63\x63\x65\x73\x73\x43\x6f\x64\x65'], device, "\u65b0\u8bbe\u5907") } } }) }, fail: function () { typeof IAug1 == FUNCTION && IAug1(codeEnum['\x66\x61\x69\x6c\x75\x72\x65\x43\x6f\x64\x65'], null, "\u641c\u7d22\u5931\u8d25") } }) }
function connectBleDevice($gpBWo$1, l2)
{
  let name = $gpBWo$1['\x6e\x61\x6d\x65'];
  if (name['\x6c\x65\x6e\x67\x74\x68'] == 0)
  {
    name = $gpBWo$1['\x6c\x6f\x63\x61\x6c\x4e\x61\x6d\x65']
  }
  else
  {
    name = $gpBWo$1['\x6e\x61\x6d\x65']
  }
  if (1)
  {
    connectDeviceId = $gpBWo$1['\x64\x65\x76\x69\x63\x65\x49\x64'];
    connectCallback = l2;
    if (typeof connectTimer != undefined)
    {
       clearTimeout(connectTimer)
    }
    if (typeof startA2Timer != undefined)
    {
      clearTimeout(startA2Timer)
    }
    if (typeof waitA2ResponseTimer != undefined)
    {
      clearTimeout(waitA2ResponseTimer)
    }
    connectTimer = setTimeout(() =>
    {
      typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x74\x69\x6d\x65\x6f\x75\x74'])
    }, connectTime);
    wx['\x73\x74\x6f\x70\x42\x6c\x75\x65\x74\x6f\x6f\x74\x68\x44\x65\x76\x69\x63\x65\x73\x44\x69\x73\x63\x6f\x76\x65\x72\x79']({
      success: function (Oz3)
      {
        console.log("startConnectBle:" + name)
        startConnectBle()
      },
      fail: function ()
      {
        if (typeof connectTimer != undefined)
        {
          clearTimeout(connectTimer)
        }
        typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x73\x74\x6f\x70\x53\x63\x61\x6e\x46\x61\x69\x6c\x75\x72\x65'])
      } })
    }
    else
    {
      typeof l2 == FUNCTION && l2(codeEnum['\x66\x61\x69\x6c\x75\x72\x65\x43\x6f\x64\x65'])
    }
  }
0
function startConnectBle()
{
  wx['\x63\x72\x65\x61\x74\x65\x42\x4c\x45\x43\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e']({
    deviceId: connectDeviceId,
    success: function (cjjKNR1)
    {
      console.log("startGetAndCheckService:" + connectDeviceId)
      startGetAndCheckService()
    },
    fail: function ()
    {
      if (typeof connectTimer != undefined)
      {
        clearTimeout(connectTimer)
      } typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x63\x72\x65\x61\x74\x43\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e\x46\x61\x69\x6c\x75\x72\x65'])
    }
  })
}
function startGetAndCheckService()
{
  console.log("startGetAndCheckService :" + connectDeviceId)
  wx['\x67\x65\x74\x42\x4c\x45\x44\x65\x76\x69\x63\x65\x53\x65\x72\x76\x69\x63\x65\x73']({
    deviceId: connectDeviceId,
    success: function (aLZKtMs1)
    {
      let haseTargetServiceId = false;
      for (let i = 0; i < aLZKtMs1['\x73\x65\x72\x76\x69\x63\x65\x73']['\x6c\x65\x6e\x67\x74\x68']; i++)
      {
        let itemServiceId = aLZKtMs1['\x73\x65\x72\x76\x69\x63\x65\x73'][i]['\x75\x75\x69\x64'];
        console.log("itemServiceId :" + itemServiceId + " serviceUUID :" + serviceUUID)
        if (itemServiceId == serviceUUID)
        {
          haseTargetServiceId = true;
          break
        }
      }
      if (haseTargetServiceId == true)
      {
        console.log("startGetAndCheckCharacterisitc:" + connectDeviceId)
        startGetAndCheckCharacterisitc()
      }
      else
      {
        if (typeof connectTimer != undefined)
        {
          clearTimeout(connectTimer)
        } typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x6e\x6f\x54\x61\x72\x67\x65\x74\x53\x65\x72\x76\x69\x63\x65\x49\x64'])
      }
    },
    fail: function ()
    {
      console.log("startGetAndCheckService fail:" + connectDeviceId)
      if (typeof connectTimer != undefined)
      {
        clearTimeout(connectTimer)
      } typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x67\x65\x74\x53\x65\x72\x76\x69\x63\x65\x46\x61\x69\x6c\x75\x72\x65'])
    }
  })
}
function startGetAndCheckCharacterisitc()
{
  wx['\x67\x65\x74\x42\x4c\x45\x44\x65\x76\x69\x63\x65\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x73']({
    deviceId: connectDeviceId, serviceId: serviceUUID,
    success: function (WXqgSAD1)
    {
      let haveRead = false; let haveWrite = false;
      for (let i = 0; i < WXqgSAD1['\x63\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x73']['\x6c\x65\x6e\x67\x74\x68']; i++)
      {
        let itemUUID = WXqgSAD1['\x63\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x73'][i]['\x75\x75\x69\x64'];
        if (itemUUID == readUUID) { haveRead = true } else if (itemUUID == writeUUID) { haveWrite = true }
        if (haveRead == true && haveWrite == true) { break }
      }
      if (haveRead == true && haveWrite == true)
      {
        console.log("monitorNotification:" + connectDeviceId)
        monitorNotification()
      }
      else { if (typeof connectTimer != undefined)
      {
        clearTimeout(connectTimer)
      }
      typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x6e\x6f\x54\x61\x72\x67\x65\x74\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63'])
      }
    },
    fail: function ()
    {
      if (typeof connectTimer != undefined) { clearTimeout(connectTimer) } typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x67\x65\x74\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x73\x46\x61\x69\x6c\x75\x72\x65'])
    }
  })
}
function monitorNotification()
{
  wx['\x6e\x6f\x74\x69\x66\x79\x42\x4c\x45\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x56\x61\x6c\x75\x65\x43\x68\x61\x6e\x67\x65'](
  {
    deviceId: connectDeviceId, serviceId: serviceUUID, characteristicId: readUUID, state: true,
    success: function (qD1) { },
    fail: function ()
    {
      if (typeof connectTimer != undefined)
      {
        clearTimeout(connectTimer)
      }
      typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x6d\x6f\x6e\x69\x74\x6f\x72\x4e\x6f\x74\x69\x66\x69\x63\x61\x74\x69\x6f\x6e\x46\x61\x69\x6c\x75\x72\x65'])     }
  });
  wx['\x6f\x6e\x42\x4c\x45\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x56\x61\x6c\x75\x65\x43\x68\x61\x6e\x67\x65'](
  function (ffyevz2)
  {
    if (ffyevz2['\x64\x65\x76\x69\x63\x65\x49\x64'] = connectDeviceId && ffyevz2['\x73\x65\x72\x76\x69\x63\x65\x49\x64'] == serviceUUID && ffyevz2['\x63\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x49\x64'] == readUUID)
    {
      console.log("analyticData:" + connectDeviceId)
      analyticData(ffyevz2['\x76\x61\x6c\x75\x65'])
    }
  });
}
function analyticData(klrLzc1)
{
  /* bufferArrayToHexString */
  let data = dataHandler['\x62\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](klrLzc1);
  console['\x6c\x6f\x67']("\u63a5\u6536\uff1a" + data);
  /* length == 0 */
  if (frame['\x6c\x65\x6e\x67\x74\x68'] == 0)
  {
    frameLen = parseInt(data['\x73\x6c\x69\x63\x65'](4, 8), 16) * 2 } frame += data;
    /* length >  frameLen */
    if (frame['\x6c\x65\x6e\x67\x74\x68'] > frameLen)
    {
      frame = ""; frameLen = 0;
      typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum['\x64\x61\x74\x61\x46\x72\x61\x6d\x65\x54\x72\x61\x6e\x73\x62\x6f\x75\x6e\x64\x61\x72\x79'], "", "\u6570\u636e\u957f\u5ea6\u8d8a\u754c")
    }
    else if (frame['\x6c\x65\x6e\x67\x74\x68'] == frameLen)
    {
      let bCmdId = frame['\x73\x6c\x69\x63\x65'](8, 12);
      /* 2711 */
      if (bCmdId === "\x32\x37\x31\x31")
      {
        frame = ""; frameLen = 0;
        /** makeAuthResponse */
        console.log("2711 sendDataToDevice makeAuthResponse" );
        sendDataToDevice(dataUtil['\x6d\x61\x6b\x65\x41\x75\x74\x68\x52\x65\x73\x70\x6f\x6e\x73\x65'](), (code, data, msg) =>
        {
          if (code != 0)
          {
            console.log("code != 0");
            if (typeof connectTimer != undefined) { clearTimeout(connectTimer) }
            typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x61\x75\x74\x68\x52\x65\x73\x70\x6f\x6e\x73\x65\x46\x61\x69\x6c\x75\x72\x65'])
          }
        })
      }
      /** 2713 */
      else if (bCmdId === "\x32\x37\x31\x33")
      {
        frame = ""; frameLen = 0;
        console.log("2713 sendDataToDevice makeInitResponse");
        sendDataToDevice(dataUtil['\x6d\x61\x6b\x65\x49\x6e\x69\x74\x52\x65\x73\x70\x6f\x6e\x73\x65'](), (code, data, msg) =>
        {
          if (code != 0)
          {
            if (typeof connectTimer != undefined) { clearTimeout(connectTimer) }
            if (typeof startA2Timer != undefined) { clearTimeout(startA2Timer) }
            typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x69\x6e\x69\x74\x52\x65\x73\x70\x6f\x6e\x73\x65\x46\x61\x69\x6c\x75\x72\x65'])
            }
          });
          startA2Timer = setTimeout(() =>
          {
            console.log("2713 initDevice");
            initDevice(); waitA2ResponseTimer = setTimeout(() => { initDevice() }, waitA2ResponseTime)
          }, startA2Time)
      }
      else if (bCmdId === "\x32\x37\x31\x32")
      {
        let outWechatFrame = frame['\x73\x6c\x69\x63\x65'](16);
        let outProtoFrame = outWechatFrame['\x73\x6c\x69\x63\x65'](8, -6);
        frame = ""; frameLen = 0;
        if (frames['\x6c\x65\x6e\x67\x74\x68'] == 0)
        {
          let ctl = parseInt(outProtoFrame['\x73\x6c\x69\x63\x65'](4, 6), 16);
          framesLen = ctl - 0x80 + 1
        }
        frames['\x70\x75\x73\x68'](outProtoFrame);
        if (frames['\x6c\x65\x6e\x67\x74\x68'] == framesLen)
        {
          let allPaseBCC = true;
          for (let i = 0; i < frames['\x6c\x65\x6e\x67\x74\x68']; i++)
          {
            let itemFrame = frames[i]; let bcc = 0;
            for (let j = 1; j < parseInt(itemFrame['\x6c\x65\x6e\x67\x74\x68'] / 2) - 1; j++)
            {
              let bit = parseInt(itemFrame['\x73\x6c\x69\x63\x65'](j * 2, (j + 1) * 2), 16); bcc ^= bit
            }
            if (bcc != parseInt(itemFrame['\x73\x6c\x69\x63\x65'](-2), 16)) { allPaseBCC = false; break }
          }
          if (allPaseBCC == false)
          {
            frames = new Array(); framesLen = 0;
            typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum['\x6e\x6f\x74\x50\x61\x73\x73\x42\x63\x63\x43\x68\x65\x63\x6b'], "", "\x62\x63\x63\u6821\u9a8c\u4e0d\u901a\u8fc7")
          }
          else
          {
            let completeData = "";
            for (let i = 0; i < frames['\x6c\x65\x6e\x67\x74\x68']; i++)
            {
              let itemFrame = frames[i]; completeData += itemFrame['\x73\x6c\x69\x63\x65'](8, -2)
            }
            frames = new Array(); framesLen = 0;
            typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum['\x73\x75\x63\x63\x65\x73\x73\x43\x6f\x64\x65'], completeData, "\u6210\u529f")
          }
        }
      }
      else
      {
        console['\x6c\x6f\x67']("\u5947\u5f02\u6570\u636e"); frame = ""; frameLen = 0
      }
    }
  }
function initDevice()
{
  console.log("initDevice makeA2SendData");
  sendDataToDevice(dataUtil['\x6d\x61\x6b\x65\x41\x32\x53\x65\x6e\x64\x44\x61\x74\x61'](), (code, data, msg) =>
  {
    if (typeof connectTimer != undefined) { clearTimeout(connectTimer) }
    if (typeof waitA2ResponseTimer != undefined) { clearTimeout(waitA2ResponseTimer) }
    if (code === 0 && data['\x73\x6c\x69\x63\x65'](2, 4) === "\x30\x30")
    {
      console.log("initDevice activeDevice");

      activeDevice()
    }
    else
    {
      console.log("initDevice fail code:" + code + " slice " + data['\x73\x6c\x69\x63\x65'](2, 4));
      typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x69\x6e\x69\x74\x44\x65\x76\x69\x63\x65\x46\x61\x69\x6c\x75\x72\x65'])
    }
  })
}
function activeDevice()
{
  console.log("activeDevice sendDataToDevice makeA5SendData C0");
  sendDataToDevice(dataUtil['\x6d\x61\x6b\x65\x41\x35\x53\x65\x6e\x64\x44\x61\x74\x61']("\x63\x30"), (code, data, msg) =>
  {
    console.log("makeA5SendData code " + code + " slice " + data['\x73\x6c\x69\x63\x65'](2, 4) );
    if (code === 0 && data['\x73\x6c\x69\x63\x65'](2, 4) === "\x30\x30")
    {
      let idInfo = data['\x73\x6c\x69\x63\x65'](8); let obuId = "";
      for (let i = 0; i < parseInt(idInfo['\x6c\x65\x6e\x67\x74\x68'] / 2); i++)
      {
        let bit = parseInt(idInfo['\x73\x6c\x69\x63\x65'](i * 2, (i + 1) * 2), 16);
        let num = +(bit ^ 0x30); obuId += num
      }

      console.log("makeA5SendData obuId " + obuId + " slice " + obuId['\x73\x6c\x69\x63\x65'](6, 7));


      if(1)//if (obuId['\x73\x6c\x69\x63\x65'](6, 7) === "\x31")
      {
        typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x73\x75\x63\x63\x65\x73\x73\x43\x6f\x64\x65'])
      }
      else
      {
        wx['\x63\x6c\x6f\x73\x65\x42\x4c\x45\x43\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e']({
          deviceId: connectDeviceId,
          success: function (kHpzRa1) { },
        });
        typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x66\x61\x69\x6c\x75\x72\x65\x43\x6f\x64\x65'])
      }
    }
    else
    {
      wx['\x63\x6c\x6f\x73\x65\x42\x4c\x45\x43\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e']({
        deviceId: connectDeviceId,
        success: function (TAkg2) { },
      });
      typeof connectCallback == FUNCTION && connectCallback(codeEnum['\x66\x61\x69\x6c\x75\x72\x65\x43\x6f\x64\x65'])
    }
  })
}
function sendDataToDevice(ir_zSF1, JN2)
{
  dataHandlerCallback = JN2; sendBufferArray = new Array()['\x63\x6f\x6e\x63\x61\x74'](ir_zSF1);
  sendIndex = 0; frame = ""; frameLen = 0; frames = new Array(); framesLen = 0;
  runningSendData()
}
function runningSendData()
{
  let value = sendBufferArray[sendIndex];
  let hex = dataHandler['\x62\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](value);
  console['\x6c\x6f\x67']("\u53d1\u9001\uff1a" + hex);
  wx['\x77\x72\x69\x74\x65\x42\x4c\x45\x43\x68\x61\x72\x61\x63\x74\x65\x72\x69\x73\x74\x69\x63\x56\x61\x6c\x75\x65']({ deviceId: connectDeviceId, serviceId: serviceUUID, characteristicId: writeUUID, value: value,
  success: function (hF1)
  {
    sendIndex++; resendCount = 3;
    if (sendIndex < sendBufferArray['\x6c\x65\x6e\x67\x74\x68']) { runningSendData() }
  },
  fail: function ()
  {
    if (resendCount > 0)
    {
      resendCount--; setTimeout(() =>
      {
        console['\x6c\x6f\x67']("\u7b2c" + (3 - resendCount) + "\u6b21\u91cd\u53d1"); runningSendData()
      }, 200)
    }
    else
    {
      typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum['\x73\x65\x6e\x64\x44\x61\x74\x61\x46\x61\x69\x6c\x75\x72\x65'], "", "\u53d1\u9001\u6570\u636e\u5931\u8d25")       }
  }
  })
}
