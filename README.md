# etc_plus_2.0 小程序文件说明
```
    需使用cnpm 或者 npm安装依赖，开发过程需严格遵守eslint代码格式约束
    
```
# 注意事项
```
    1. 所有文件命名统一采用小写，若文件名为组合词，则用下划线连接。如a_b
    2. 文件夹和文件需同名，如/pages/hello_word/hello_word
    3. 样式统一使用stylus编写
    4. 所有子包皆写在pages下、默认一个default子包
    5. 图片文件优先上传到图片文件服务器、且先压缩在上传，压缩地址 https://tinypng.com/
    6. 上传身份证是需要原始图片进行尺寸压缩，宽度640，使用utils下compress_pictures_utils.js工具类
```
##注：pages下第一级文件夹为子包
