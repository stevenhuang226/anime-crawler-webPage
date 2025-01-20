# 已經無法使用，搜尋功能以及集數名稱獲取器都無法有效工作



# 使用說明
## 設置config.json檔案
1. LOGPATH: 文字檔的路徑，用於log
2. VIDEOPATH: 下載後的影片檔儲存位置
3. CACHEPATH: 轉換影片檔所使用的緩存位置(ffmpeg)（每次執行server.js時會清空）
4. PORT: 伺服器所使用的端口號(http)
```
{
	"LOGPATH": "/path/to/log", 
	"VIDEOPATH": "/path/to/videos/",
	"CACHEPATH": "/path/to/cache/",
	"PORT": 80
}
```
## 執行伺服器後端
- 需要啟用websocket功能
```
node --experimental-websocket server.js
```
# 依賴
1. ffmpeg （最好是新版的）
2. nodejs v20.10 （20.10以後才有websocket功能）
## npm
3. fluent-ffmpeg （使用ffmpeg）
4. multiparty （提取表單數據）
# 相關專案
- [anime-crawler](https://github.com/stevenhuang226/anime-crawler)
- 在此專案的基礎上，所衍生的網頁版
# 支援的網站
1. myself-bbs.com
2. anime1.me
