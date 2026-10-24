/** Optional checks: requires an already-installed Playwright and Chromium. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/reference');
const app = process.env.UI_APP_DIR || path.join(root, 'assets/template');
const port = process.env.UI_TEST_PORT || '4175';
const origin = `http://127.0.0.1:${port}`;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const server = spawn(process.execPath, ['serve.cjs'], { cwd: app, env: {...process.env, PORT:port} });
  await new Promise((resolve,reject) => {
    server.stdout.once('data',resolve);
    server.once('error',reject);
    server.once('exit',code => reject(new Error(`Server exited ${code}`)));
  });
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || undefined, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    const context = await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,locale:'en-GB',reducedMotion:'reduce'});
    const external=[], errors=[];
    await context.route('**/*', route => {
      const url=route.request().url();
      if (/^https?:/.test(url) && new URL(url).origin !== origin) {external.push(url);return route.abort();}
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const goto=async route => {await page.goto(`${origin}/#${route}`);await page.evaluate(()=>document.fonts.ready);};
    const snap=async name => {await page.locator('.toast').waitFor({state:'hidden'});return page.screenshot({path:path.join(output,name+'.png')});};
    const select=async (label,option) => {await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();};

    await goto('metrics');
    assert.equal(await page.locator('.chart').count(),4);
    assert.equal(await page.locator('.nav-rail').evaluate(e=>e.getBoundingClientRect().width),75);
    assert.equal(await page.locator('.app-bar').evaluate(e=>e.getBoundingClientRect().height),40);
    assert.ok(await page.evaluate(()=>document.fonts.check('14px Inter')));
    await snap('metrics');
    await page.getByRole('textbox',{name:'Search metrics',exact:true}).fill('10d');
    assert.equal(await page.locator('.metric-option').count(),8);
    await page.getByRole('textbox',{name:'Search metrics',exact:true}).fill('not-a-real-metric');
    assert.ok(await page.getByText('No matching metrics',{exact:true}).isVisible());
    await page.getByRole('textbox',{name:'Search metrics',exact:true}).fill('');
    await page.getByRole('button',{name:'Save view',exact:true}).click();
    await page.getByRole('checkbox',{name:'Show Total PnL',exact:true}).uncheck();
    assert.equal(await page.locator('.chart').count(),3);
    await page.getByRole('button',{name:'Load view',exact:true}).click();
    assert.equal(await page.locator('.chart').count(),4);
    const legend=page.locator('.chart').first().getByRole('button',{name:'BT-2602',exact:true});
    await legend.click();assert.equal(await legend.getAttribute('aria-pressed'),'false');await legend.click();
    await page.getByRole('button',{name:'Zoom Total PnL',exact:true}).click();
    await page.getByRole('button',{name:'Reset zoom Total PnL',exact:true}).click();
    await select('Baseline run','BT-2602');
    assert.ok(await page.getByText('Comparison to BT-2602',{exact:false}).isVisible());
    await select('Baseline run','BT-2601');
    await page.getByRole('button',{name:'Select runs',exact:true}).click();
    assert.ok(await page.getByRole('dialog',{name:'Select experiments'}).isVisible());
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Select runs',exact:true}).evaluate(e=>document.activeElement===e),true);

    await goto('runs');await snap('runs');
    await page.getByRole('textbox',{name:'Search runs',exact:true}).fill('BT-2601');
    assert.equal(await page.locator('.aim-table tbody tr').count(),1);
    await page.getByRole('textbox',{name:'Search runs',exact:true}).fill('');
    await select('Table density','Compact · 22px');
    assert.equal(await page.locator('.aim-table tbody tr').first().evaluate(e=>e.getBoundingClientRect().height),22);
    await select('Table density','Default · 28px');
    await page.getByRole('button',{name:'Columns',exact:true}).click();
    await page.getByRole('textbox',{name:'Search metric columns'}).fill('loss');
    await page.getByRole('checkbox',{name:'Validation loss',exact:true}).check();
    await page.getByRole('button',{name:'Done',exact:true}).click();
    await page.getByRole('columnheader',{name:'Validation loss',exact:true}).waitFor({state:'visible'});
    const csv=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();assert.equal((await csv).suggestedFilename(),'runs.csv');

    await goto('rfqs');await snap('rfqs');
    const detailTitle=()=>page.locator('.rfq-layout > .panel').nth(1).locator('h2').innerText();
    const before=await detailTitle();await page.getByRole('button',{name:'Next RFQ',exact:true}).click();assert.notEqual(await detailTitle(),before);
    await page.keyboard.press('k');assert.equal(await detailTitle(),before);
    await page.getByRole('textbox',{name:'Search RFQs',exact:true}).fill('no-such-rfq');assert.ok(await page.getByText('No matching RFQs',{exact:true}).isVisible());
    await page.getByRole('textbox',{name:'Search RFQs',exact:true}).fill('');
    await select('Comparison population','Present in any run');
    await page.getByRole('tab',{name:'Summary comparison',exact:true}).click();
    assert.equal(await page.getByRole('table',{name:'RFQ summary comparison'}).locator('tbody tr').count(),3);
    await snap('rfq-summary');
    await page.getByRole('tab',{name:'Summary comparison',exact:true}).press('ArrowLeft');
    assert.equal(await page.getByRole('tab',{name:/Individual RFQs/}).getAttribute('aria-selected'),'true');

    await goto('training');await snap('training');
    await page.getByRole('spinbutton',{name:'Lookback',exact:true}).fill('0');
    await page.getByRole('button',{name:'Export configuration',exact:true}).click();assert.ok(await page.getByRole('alert').isVisible());
    await page.getByRole('spinbutton',{name:'Lookback',exact:true}).fill('120');
    const config=page.waitForEvent('download');await page.getByRole('button',{name:'Export configuration',exact:true}).click();assert.equal((await config).suggestedFilename(),'training-config.json');

    await goto('gallery');await snap('gallery');
    await page.getByRole('button',{name:'Outlined',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    await page.getByRole('tab',{name:/^Overview/}).press('End');assert.equal(await page.getByRole('tab',{name:'Parameters',exact:true}).getAttribute('aria-selected'),'true');

    await page.setViewportSize({width:1920,height:1080});await goto('metrics');await snap('metrics-wide');
    await page.setViewportSize({width:900,height:800});await goto('rfqs');await snap('rfqs-narrow');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(external.length,0,`External requests: ${external}`);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify({browser:await browser.version(),viewports:['1440x960','1920x1080','900x800'],externalRequests:external,pageErrors:errors,status:'passed'},null,2)+'\n');
    console.log('Browser interactions, layout checks, exports and no-network checks passed.');
  } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
