var AutoLogger = AutoLogger || {};

AutoLogger.ConfigService = {
    mockDao: {
        updateConfig(config) {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.set({'autologger_config': config}, () =>{
                    resolve();
                });
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
            var defConfig = {
                enabled:false,
                items:[]
            };
            return new Promise((resolve, reject) => {
                chrome.storage.sync.get({'autologger_config':defConfig}, (res) =>{
                    resolve(res['autologger_config']);
                });
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
    getConfig(url,defaultOpt) {
        return this.mockDao.getConfigByUrl(url).then(resArr=>{
            if(resArr.length <= 0){
                return defaultOpt;
            }
            return resArr[0];
        });
    },
    updateAnOption(item) {
        return this.insertItem(item).then(()=>{
            console.log(item)
            console.log('inserted successfully')
        }).catch(()=>{
            return this.updateItem(item).then(()=>{
                console.log(item)
                console.log('updated successfully');
            });
        })
    },
};