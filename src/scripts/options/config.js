var AutoLogger = AutoLogger || {};
AutoLogger.Config = function() {
    // DI
    this.configService_ = AutoLogger.ConfigService;
    this.config_;
    this.$parent_;
    this.$element_;
    this.initialize();
    this.children_ = [];
};

AutoLogger.Config.prototype.initialize = function() {
    return this.configService_.getAllConfig().then((config)=>{
        this.config_ = config;
        this.children_ = this.config_.items.map(item=>{
            return new AutoLogger.ConfigContainer(item);
        });
        return true;
    });
};

AutoLogger.Config.prototype.render = function($parent) {
    this.$parent_ = $parent;
    var div = AutoLogger.Config.TEMPLATE;
    this.$element_ = $(div);
    this.$parent_.append(this.$element_);

    this.children_.forEach(child=>{
        child.render(this.$element_.find('.auto-logger-items'));
    });
    this.enterDocument();
};

AutoLogger.Config.prototype.enterDocument = function() {
    this.bindEvents_();
};

AutoLogger.Config.prototype.bindEvents_ = function() {
    console.log('bind events stub');
}

AutoLogger.Config.TEMPLATE = `
<div>
    <div class="auto-logger-header">
        <span> autologger header. </span>
    </div>
    <div class="auto-logger-items">

    </div>
</div>
`;