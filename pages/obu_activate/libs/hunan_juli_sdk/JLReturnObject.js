var status=require("./errorCode");export function DevResult(type,objc){console.log("DevResult:"+objc.data);var code="";var err_msg="";var data=null;var msg="";if(objc.code==status.successCode()){err_msg="执行成功";if(type==0){var data=objc.data;var sw=data.substr(data.length-4,4);if(sw=="9000"){code=status.successCode();data=objc.data;err_msg="操作成功";msg=""}else{code=status.cosErrorCode();data=objc.data;err_msg="COS指令错误";msg=sw}}else if(type==1){code=objc.code;err_msg=objc.msg;data=null;msg=""}else{code=objc.code;err_msg=objc.msg;data=objc.data.substr(8,objc.data.length-8)}return{code:code,err_msg:err_msg,data:data,msg:msg}}else{return{code:objc.code,err_msg:objc.msg,data:null,msg:""}}};