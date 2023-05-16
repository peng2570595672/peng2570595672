module.exports = {
  numberToHexString: numberToHexString,
  hexStringToBufferArray: hexStringToBufferArray,
  bufferArrayToHexString: bufferArrayToHexString,
  makeTLV: makeTLV,
  resolveTLV: resolveTLV
}

function numberToHexString(W1, gyCPO2, yh3) {
  let hex = W1['\x74\x6f\x53\x74\x72\x69\x6e\x67'](16);
  for (let i = hex['\x6c\x65\x6e\x67\x74\x68']; i < gyCPO2 * 2; i++) {
    hex = "\x30" + hex
  }
  if (hex['\x6c\x65\x6e\x67\x74\x68'] > gyCPO2 * 2) {
    hex = hex['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](hex['\x6c\x65\x6e\x67\x74\x68'] - gyCPO2 * 2)
  }
  if (yh3 == false) {
    let temp = "";
    for (let i = hex['\x6c\x65\x6e\x67\x74\x68'] - 2; i >= 0; i -= 2) {
      temp = temp + hex['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](i, i + 2)
    }
    hex = temp
  }
  return hex
}

function hexStringToBufferArray(zZyk1) {
  let bufferArray = new Uint8Array(zZyk1['\x6d\x61\x74\x63\x68'](/[\d\x61-f]{2}/gi)['\x6d\x61\x70'](function(h) {
    return parseInt(h, 16)
  }));
  return bufferArray['\x62\x75\x66\x66\x65\x72']
}

function bufferArrayToHexString(yfBG1) {
  let hex = Array.prototype.map.call(new Uint8Array(yfBG1), x => ('\x30\x30' + x['\x74\x6f\x53\x74\x72\x69\x6e\x67'](16))['\x73\x6c\x69\x63\x65'](-2))['\x6a\x6f\x69\x6e']('');
  return hex
}

function makeTLV(M_CQNjf1) {
  let tlv = "";
  for (let i = 0; i < M_CQNjf1['\x6c\x65\x6e\x67\x74\x68']; i++) {
    let temp = "" + M_CQNjf1[i];
    tlv = tlv + numberToHexString(i + 1, 1, true) + numberToHexString(parseInt(temp['\x6c\x65\x6e\x67\x74\x68'] / 2), 1, true) + temp
  }
  let tlvLen = tlv['\x6c\x65\x6e\x67\x74\x68'] / 2;
  let tlvLenHex = tlvLen['\x74\x6f\x53\x74\x72\x69\x6e\x67'](16);
  if (tlvLenHex['\x6c\x65\x6e\x67\x74\x68'] % 2 != 0) {
    tlvLenHex = "\x30" + tlvLenHex
  }
  if (tlvLen > 0x80) {
    tlvLenHex = (0x80 + parseInt(tlvLenHex['\x6c\x65\x6e\x67\x74\x68'] / 2))['\x74\x6f\x53\x74\x72\x69\x6e\x67'](16) + tlvLenHex
  }
  return "\x38\x30" + tlvLenHex + tlv
}

function resolveTLV(Qz1) {
  let tpdus = new Array();
  let lenc = parseInt(Qz1['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](2, 4), 16);
  let index = 4;
  if (lenc > 0x80) {
    index = index + (lenc - 0x80) * 2
  }
  let count = 1;
  while (index < Qz1['\x6c\x65\x6e\x67\x74\x68']) {
    let time = parseInt(Qz1['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](index, index + 2), 16);
    index += 2;
    let len = parseInt(Qz1['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](index, index + 2), 16);
    index += 2;
    let tpdu = Qz1['\x73\x75\x62\x73\x74\x72\x69\x6e\x67'](index, index + len * 2);
    tpdus['\x70\x75\x73\x68'](tpdu);
    index += len * 2
  }
  return tpdus
}