# cloud_function 云函数说明
```
    project.config.json配置
    "cloudfunctionRoot": "cloud_function/",
```
# 注意事项
```
    1. 所有云函数写在cloud_function下,如public模块就是云函数名称为public
    2. 调用方式参照h5 -> etc_plus_wxcloud (也可使用小程序调用)
    3. 调用云函数需要在对应模块下安装sdk:wx-server-sdk
    4. 上传云函数: 开发者工具云函数名称点击右键 -> 上传并部署:云端安装依赖
```
##注：wx-server-sdk 必须安装在云函数名称下,否则上传部署会调用失败

# 短信打开小程序说明
```
    1. 短信打开小程序: 短信 -> 浏览器 -> 小程序
    2. 控制台需开启 - 未登录用户访问权限
    3. 环境配置 - 按量付费
```
