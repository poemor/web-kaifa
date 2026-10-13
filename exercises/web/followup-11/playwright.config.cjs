const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./e2e',use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:8770',headless:true,trace:'retain-on-failure'},projects:[{name:'chromium',use:{browserName:'chromium',...(process.env.E2E_EDGE?{channel:'msedge'}:{})}}]});
