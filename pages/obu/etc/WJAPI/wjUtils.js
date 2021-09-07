"use strict";var PROTOCOL_TYPE=0,PAGLENMAX=255,TRANSFER_TYPE=0,DATA_TYPE=0,CMD_TYPE=0;function showLog(){if(!(arguments.length<1)){for(var r=arguments[0],t=1;t<arguments.length;t++)r+=" "+arguments[t];console.log(r)}}function showError(){if(!(arguments.length<1)){for(var r=arguments[0],t=1;t<arguments.length;t++)r+=" "+arguments[t];console.error(r)}}function byteArray2hexStr(r){return Array.prototype.map.call(new Uint8Array(r),function(r){return("00"+r.toString(16)).slice(-2)}).join("")}function hexStr2byteArray(r){return new Uint8Array(r.match(/[\da-f]{2}/gi).map(function(r){return parseInt(r,16)}))}function byte2hexStr(r){var t="0123456789abcdef",e="";return e+=t.charAt(r>>4),e+=t.charAt(15&r)}function getProtocolType(){return PROTOCOL_TYPE}function getPagLenMax(){return PAGLENMAX}function getTRANSFER_TYPE(){return TRANSFER_TYPE}function getDATA_TYPE(){return DATA_TYPE}function getCMD_TYPE(){return CMD_TYPE}function APDU2TPDU(r){var t=hexStr2byteArray(r),e="";if("01"==r.substring(0,2))e=r;else{for(var n=new Array,o=0,A=0;A<t[0];A++){var a=o+2,P=o+2+t[o+1];o+=1+t[o+1],n[A]=r.substring(2*a,2*P)}for(A=0;A<t[0];A++){var T=n[A].length/2;e+=byte2hexStr(A+1&255)+byte2hexStr(255&T)+n[A]}}return e}function TPDU2APDU(r){for(var t=hexStr2byteArray(r),e="",n=new Array,o=0,A=t.byteLength;o<A;){var a=t[o++],P=t[o++];n[a-1]=r.substring(2*o,2*(o+P)),o+=P}e=byte2hexStr(255&n.length);for(var T=0;T<n.length;T++)e+=byte2hexStr(n[T].length/2&255)+n[T];return e}module.exports={showLog:showLog,byteArray2hexStr:byteArray2hexStr,hexStr2byteArray:hexStr2byteArray,showError:showError,byte2hexStr:byte2hexStr,getProtocolType:getProtocolType,getPagLenMax:getPagLenMax,getTRANSFER_TYPE:getTRANSFER_TYPE,getDATA_TYPE:getDATA_TYPE,getCMD_TYPE:getCMD_TYPE,APDU2TPDU:APDU2TPDU,TPDU2APDU:TPDU2APDU};