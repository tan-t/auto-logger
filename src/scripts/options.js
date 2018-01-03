var app = new AutoLogger.Config(AutoLogger.ConfigService);
app.initialize().then(()=>{
  app.render($('#app'));
});