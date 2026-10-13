const {test,expect}=require('@playwright/test');
test('注册→登录→报名→取消→退出',async({page})=>{
  // 每次生成独立教学账户；不允许把E2E_BASE_URL设成生产网站。
  const base=new URL(process.env.E2E_BASE_URL||'http://127.0.0.1:8770');
  if(!['127.0.0.1','localhost'].includes(base.hostname))throw new Error('E2E只接受本机练习服务，拒绝写入线上');
  const name='e2e_'+Date.now(),password='Test-only-password-123';
  await page.goto('/');await page.getByLabel(/用户名/).fill(name);await page.getByLabel(/密码/).fill(password);await page.getByRole('button',{name:'注册普通成员'}).click();await expect(page.locator('#status')).toContainText('普通成员已创建');
  await page.getByLabel(/密码/).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.locator('#identity')).toContainText(name);
  await page.locator('#events').getByRole('button',{name:'报名',exact:true}).first().click();await expect(page.locator('#registrations')).toContainText('报名 #');
  await page.getByRole('button',{name:'取消报名',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#registrations')).toContainText('尚无报名');await expect(page.locator('#refresh')).toBeFocused();
  await page.getByRole('button',{name:'退出会话'}).click();await expect(page.locator('#identity')).toHaveText('未登录');
});
