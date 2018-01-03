var AutoLogger = AutoLogger || {};

AutoLogger.ConfigService = {
    mockDao: {
        updateConfig(config) {
            return new Promise((resolve, reject) => {
                localStorage.setItem('autologger_config', JSON.stringify(config));
                resolve();
            });
        },
        validateDuplication(url) {
            return this.getConfig().then((res) => {
                var items = res.items;
                return new Promise((resolve, reject) => {
                    var rs = alasql('select * FROM ? where url = ?', [items, url]);
                    if (rs.length > 0) return reject();
                    return resolve(res);
                });
            });
        },
        getConfig() {
            return new Promise((resolve, reject) => {
                // resolve(JSON.parse(localStorage.getItem('autologger_config')));
                resolve(
                    {
                        enabled: false, items: [{
                            url: 'hoge',
                            dtls: []
                        },
                        {
                            url: 'fuga',
                            dtls: []
                        },
                        ]
                    }
                )
            });
        },
        getConfigByUrl(url) {
            return this.getConfig().then(res=>alasql('select * from ? where url = ? ',[res.items,url]));
        }
    },
    getAllConfig() {
        return this.mockDao.getConfig();
    },
    insertItem(item) {
        return this.mockDao.validateDuplication(item.url).then((res) => {
            res.items.push(item);
            return this.mockDao.updateConfig(res);
        });
    },
    updateItem(item) {
        return this.mockDao.getConfig().then((res) => {
            $.extend(res.items.find(i => { return i.url === item.url }), item);
            return this.mockDao.updateConfig(res);
        });
    },
    getEventDef() {
        return {
            'click':'クリック',
            'focusout':'フォーカスアウト'
        }
    },
    getOptionFromContentScript(url,defaultOpt) {
        return this.mockDao.getConfigByUrl(url).then(resArr=>{
            if(resArr.length <= 0){
                return defaultOpt;
            }
            var res = resArr[0];
            res.matcher = res.url;
            var listenTargetItemIds = {};
            res.dtls.forEach((dtl)=>{
                if(dtl.event in listenTargetItemIds){
                    listenTargetItemIds[dtl.event].push(dtl);
                } else {
                    listenTargetItemIds[dtl.event] = [dtl];
                }
            });
            res.listenTargetItemIds = listenTargetItemIds;
            var ret = {};
            ret[url] = res;
            return ret;
        });
    },
    updateOptionFromContentScript(option) {
        var listenTargetItemIds = option.listenTargetItemIds;
        var dtls = [];
        Object.keys(listenTargetItemIds).forEach(key=>{
            listenTargetItemIds[key].forEach((dtl)=>{
              dtls.push($.extend(dtl,{event:key}));
            });
          });
          var item = {url:option.matcher,dtls};
        return this.insertItem(item).then(()=>{
            console.log('inserted successfully')
        }).catch(()=>{
            return this.updateItem(item).then(()=>{
                console.log('updated successfully');
            });
        })
    }
};