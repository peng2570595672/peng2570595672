const dataHandler = require("./etcDataHandler.js");
module.exports = {
  makeA2SendData: makeA2SendData,
  makeA3SendData: makeA3SendData,
  makeA4SendData: makeA4SendData,
  makeA5SendData: makeA5SendData,
  makeA6SendData: makeA6SendData,
  makeA7SendData: makeA7SendData,
  makeA8SendData: makeA8SendData,
  makeABSendData: makeABSendData,
  makeACSendData: makeACSendData,
  makeAuthResponse: makeAuthResponse,
  makeInitResponse: makeInitResponse
}
/**
 * 接口使用说明：
 *  makeA2SendData：
      app和蓝牙盒子建立握手
 *  makeA3SendData：
      PICC通道，参数传入：
        dataType:"00"=明文，"01"=密文
        cos指令：TLV格式(最大长度不超384)
 *  makeA4SendData：
      SE指令通道，参数传入：
        dataType:"00"=明文，"01"=密文
        cos指令：TLV格式(最大长度不超384)
 *  makeA5SendData：
      蓝牙盒子通道，参数传入：
        cmd：指令说明：
          "c0"=获取蓝牙盒子设备编号
          "c1"=获取蓝牙盒子版本号
          "c2"=获取蓝牙盒子电池电量
          "c3"=强制蓝牙盒子断电
          "c4"=对蓝牙盒子超时计数器清零
          "c5"=卡片物理编号
          "c6"=获取obu mac
 *  makeA6SendData:
      认证通道，参数传入：
        cmd：指令说明：
          "c0"=认证指令1
          "c1"+渠道证书号+渠道证书+Rnd2=认证指令2：渠道证书号（1bytes），0x01表示渠道证书1（001C文件），0x02表示渠道证书2（001D文件），0x03表示渠道证书3（001E文件）。渠道证书为证书明文（xx bytes）。Rnd2为随机数，长度为32bytes(其中前8字节为UTC时间) 。
          "c2"+F1信息=认证指令3：F1:20bytes
          "c3"+渠道证书号+Rnd2=认证指令4：渠道证书号（1bytes），0x01表示渠道证书1（001C文件），0x02表示渠道证书2（001D文件），0x03表示渠道证书3（001E文件）。Rnd2为随机数，长度为32bytes(其中前8字节为UTC时间) 。
          "c4"=新版认证指令1(国密)
          "c5"+工作密钥密文+工作密钥校验值（8字节）+MAC密钥密文+MAC密钥校验值（8字节）+Rnd2（16字节）+S2=新版认证指令2(国密)S2: 工作密钥密文 + 工作密钥校验码 + MAC密钥密文 + MAC密钥校验码 + 随机数的签名值（服务器私钥签名）注：设备端由SE完成验签、密钥校验、密钥解密操作
 *  makeA7SendData:
      ESAM指令通道，参数传入：
        dataType:"00"=明文，"01"=密文
        cos指令：TLV格式(最大长度不超384)
*  makeA8SendData:

 *  makeABSendData:
      获取记录指令通道，参数传入：
        cmd：指令说明：
          "c0"+索引=获取PICC通道指令记录索引（1bytes）:记录索引号，循环记录，最新的记录号为01，上一次的为02，依次类推……
 */
const frame_Len = (92 * 2);
const send_Len = (20 * 2);
const ST = "\x33\x33";
const pre_Proto = "\x30\x61\x30\x30\x31\x32";
const end_Proto = "\x31\x38\x30\x30";
const bMagic = "\x66\x65";
const bVer = "\x30\x31";
const bCmdId = "\x37\x35\x33\x31";
var SEQ = 3;

function makeFrame(oJAWe1) {
  let frameCount = parseInt(oJAWe1['\x6c\x65\x6e\x67\x74\x68'] / frame_Len);
  let frameBalance = oJAWe1['\x6c\x65\x6e\x67\x74\x68'] % frame_Len;
  let frames = new Array();
  for (let i = 0; i < frameCount; i++) {
    frames['\x70\x75\x73\x68'](oJAWe1['\x73\x6c\x69\x63\x65'](i * frame_Len, (i + 1) * frame_Len))
  }
  if (frameBalance > 0) {
    frames['\x70\x75\x73\x68'](oJAWe1['\x73\x6c\x69\x63\x65'](-frameBalance))
  }
  let manufacturerFrames = new Array();
  for (let i = 0; i < frames['\x6c\x65\x6e\x67\x74\x68']; i++) {
    let temp = frames[i];
    let SN = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](i + 1, 1, true);
    let CTL = "";
    if (i == 0) {
      CTL = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](0x80 + frames['\x6c\x65\x6e\x67\x74\x68'] - 1, 1, true)
    } else {
      CTL = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](frames['\x6c\x65\x6e\x67\x74\x68'] - i - 1, 1, true)
    }
    let LEN = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(temp['\x6c\x65\x6e\x67\x74\x68'] / 2), 1, true);
    let frame = ST + SN + CTL + LEN + temp;
    let bcc = 0;
    for (let j = 1; j < parseInt(frame['\x6c\x65\x6e\x67\x74\x68'] / 2); j++) {
      let bit = parseInt(frame['\x73\x6c\x69\x63\x65'](j * 2, (j + 1) * 2), 16);
      bcc = bcc ^ bit
    }
    frame += dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](bcc, 1, true);
    manufacturerFrames['\x70\x75\x73\x68'](frame)
  }
  let protoFrames = new Array();
  for (let i = 0; i < manufacturerFrames['\x6c\x65\x6e\x67\x74\x68']; i++) {
    let temp = manufacturerFrames[i];
    let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(temp['\x6c\x65\x6e\x67\x74\x68'] / 2), 1, true);
    let frame = pre_Proto + len + temp + end_Proto;
    protoFrames['\x70\x75\x73\x68'](frame)
  }
  let wechatFrames = new Array();
  for (let i = 0; i < protoFrames['\x6c\x65\x6e\x67\x74\x68']; i++) {
    let temp = protoFrames[i];
    let nLen = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(temp['\x6c\x65\x6e\x67\x74\x68'] / 2) + 8, 2, true);
    let nSeq = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](SEQ, 2, true);
    let frame = bMagic + bVer + nLen + bCmdId + nSeq + temp;
    wechatFrames['\x70\x75\x73\x68'](frame)
  }
  SEQ++;
  if (SEQ > 0xf) {
    SEQ = 1
  }
  let bufferArray = new Array();
  for (let i = 0; i < wechatFrames['\x6c\x65\x6e\x67\x74\x68']; i++) {
    let temp = wechatFrames[i];
    let bufferCount = parseInt(temp['\x6c\x65\x6e\x67\x74\x68'] / send_Len);
    let bufferBalance = temp['\x6c\x65\x6e\x67\x74\x68'] % send_Len;
    for (let j = 0; j < bufferCount; j++) {
      let item = temp['\x73\x6c\x69\x63\x65'](j * send_Len, (j + 1) * send_Len);
      bufferArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](item))
    }
    if (bufferBalance > 0) {
      let item = temp['\x73\x6c\x69\x63\x65'](-bufferBalance);
      bufferArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](item))
    }
  }
  return bufferArray
}

function makeAuthResponse() {
  let prefix = "\x66\x65\x30\x31\x30\x30\x31\x38\x34\x65\x32\x31\x30\x30\x30\x31\x30\x61\x30\x36\x30\x38\x30\x30\x31\x32\x30\x32\x34\x66\x34\x62\x31\x32\x30\x36\x33\x31\x33\x32";
  let endfix = "\x33\x33\x33\x31\x33\x32\x33\x34";
  let dataArray = new Array();
  dataArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](prefix));
  dataArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](endfix));
  return dataArray
}

function makeInitResponse() {
  let prefix = "\x66\x65\x30\x31\x30\x30\x31\x36\x34\x65\x32\x33\x30\x30\x30\x32\x30\x61\x30\x36\x30\x38\x30\x30\x31\x32\x30\x32\x34\x66\x34\x62\x31\x30\x30\x30\x31\x38\x30\x30";
  let endfix = "\x32\x30\x30\x30";
  let dataArray = new Array();
  dataArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](prefix));
  dataArray['\x70\x75\x73\x68'](dataHandler['\x68\x65\x78\x53\x74\x72\x69\x6e\x67\x54\x6f\x42\x75\x66\x66\x65\x72\x41\x72\x72\x61\x79'](endfix));
  return dataArray
}

function makeA2SendData() {
  let data = "\x61\x32";
  return makeFrame(data)
}

function makeA3SendData(c1, s2) {
  let data = "\x61\x33" + c1;
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(s2['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += s2;
  return makeFrame(data)
}

function makeA4SendData(QHJzV1, tA2) {
  let data = "\x61\x34" + QHJzV1;
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(tA2['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += tA2;
  return makeFrame(data)
}

function makeA5SendData(iqm1) {
  let data = "\x61\x35";
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(iqm1['\x6c\x65\x6e\x67\x74\x68'] / 2), 1, true);
  data += len;
  data += iqm1;
  return makeFrame(data)
}

function makeA6SendData(HXFD1) {
  let data = "\x61\x36";
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(HXFD1['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += HXFD1;
  return makeFrame(data)
}

function makeA7SendData(c1, s2) {
  let data = "\x61\x37" + c1;
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(s2['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += s2;
  return makeFrame(data)
}

function makeA8SendData(rssUNR1) {
  let data = "\x61\x38";
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(rssUNR1['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += rssUNR1;
  return makeFrame(data)
}

function makeABSendData(b1) {
  let data = "\x61\x62";
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(b1['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += b1;
  return makeFrame(data)
}

function makeACSendData($srGK2, datax) {
  let data = "\x61\x63" + $srGK2;
  let len = dataHandler['\x6e\x75\x6d\x62\x65\x72\x54\x6f\x48\x65\x78\x53\x74\x72\x69\x6e\x67'](parseInt(datax['\x6c\x65\x6e\x67\x74\x68'] / 2), 2, false);
  data += len;
  data += datax;
  return makeFrame(data)
}
