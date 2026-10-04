const puppeteer = require('puppeteer-core');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {};

  try {
    // TEST 1: Mobile View (375 x 812)
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    
    // Set mock GPS outside Samut Prakan (e.g. Bangkok center 13.7563, 100.5018)
    await page.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:4174', ['geolocation']);

    await page.goto('http://localhost:4174', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // 1.1 Verify out of province banner shows initially
    const bannerInitial = await page.evaluate(() => {
      const el = document.querySelector('span');
      const allText = document.body.innerText;
      return allText.includes('ตำแหน่งท่านไม่ได้อยู่ในจังหวัดสมุทรปราการ');
    });
    results.outOfProvinceBannerInitial = bannerInitial;

    // 1.2 Wait 5.5 seconds and verify out of province banner disappears automatically!
    await new Promise(r => setTimeout(r, 5500));
    const bannerAfter5s = await page.evaluate(() => {
      return document.body.innerText.includes('ตำแหน่งท่านไม่ได้อยู่ในจังหวัดสมุทรปราการ');
    });
    results.outOfProvinceBannerDismissedAfter5s = !bannerAfter5s;

    // 1.3 Check mobile guide button [📷📉 ไกด์]
    const guideBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('ไกด์') && (x.innerText.includes('📷') || x.innerText.includes('📉')));
      return b ? b.innerText : null;
    });
    results.guideBtnFound = !!guideBtnText;

    // 1.4 Click the mobile guide button and verify modal content
    const guideModalContent = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('ไกด์') && (x.innerText.includes('📷') || x.innerText.includes('📉')));
      if (b) b.click();
      return true;
    });
    await new Promise(r => setTimeout(r, 600));

    const guideDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCameraExplanation: text.includes('จุดที่มีประชาชนถ่ายรูปรายงาน') || text.includes('รูปกล้อง'),
        hasFallingExplanation: text.includes('จุดที่น้ำกำลังลด') || text.includes('เส้นกราฟ')
      };
    });
    results.guideModal = guideDetails;

    // Close guide modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const understandBtn = btns.find(x => x.innerText.includes('เข้าใจแล้ว'));
      if (understandBtn) understandBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 1.5 Check photo pins on the map (pins with 📷)
    const photoPins = await page.evaluate(() => {
      const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
      const withPhoto = pins.filter(p => p.innerHTML.includes('📷'));
      const withFalling = pins.filter(p => p.innerHTML.includes('📉'));
      return {
        totalPins: pins.length,
        pinsWithPhoto: withPhoto.length,
        pinsWithFalling: withFalling.length
      };
    });
    results.pinsOnMap = photoPins;

    // 1.6 Click a pin with photo and check popup / drawer
    const clickPhotoPinResult = await page.evaluate(() => {
      const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
      const targetPin = pins.find(p => p.innerHTML.includes('📷'));
      if (targetPin) {
        targetPin.click();
        return { clicked: true, pinHtml: targetPin.outerHTML.substring(0, 100) };
      }
      return { clicked: false };
    });
    results.pinClicked = clickPhotoPinResult;
    await new Promise(r => setTimeout(r, 800));

    // 1.7 Check if photo thumbnail appears and can open lightbox
    const photoPreviewInDrawer = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const floodImgs = imgs.filter(img => img.src && (img.src.startsWith('data:image') || img.src.includes('unsplash')));
      return {
        count: floodImgs.length,
        srcPrefix: floodImgs[0] ? floodImgs[0].src.substring(0, 40) : null
      };
    });
    results.photoPreviewInDrawer = photoPreviewInDrawer;

    // TEST 2: Tablet / PC View (1024 x 768)
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1024, height: 768 });
    await pageDesktop.goto('http://localhost:4174', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // 2.1 Check level filter buttons in navbar (ปกติ, ปานกลาง, วิกฤต)
    const levelFilters = await pageDesktop.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const minorBtn = btns.find(b => b.innerText.includes('ปกติ'));
      const modBtn = btns.find(b => b.innerText.includes('ปานกลาง'));
      const sevBtn = btns.find(b => b.innerText.includes('วิกฤต'));
      return {
        minorFound: !!minorBtn,
        modFound: !!modBtn,
        sevFound: !!sevBtn
      };
    });
    results.desktopLevelFilters = levelFilters;

    // 2.2 Click "วิกฤต" filter and check that it filters
    await pageDesktop.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sevBtn = btns.find(b => b.innerText.includes('วิกฤต'));
      if (sevBtn) sevBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const filterActiveState = await pageDesktop.evaluate(() => {
      const text = document.body.innerText;
      const hasClearBtn = text.includes('แสดงทั้งหมด ✕') || text.includes('✕');
      return { hasClearBtn };
    });
    results.filterActiveState = filterActiveState;

    // 2.3 Check real-time temperature badge
    const tempBadge = await pageDesktop.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, span'));
      const badge = els.find(e => /^\d{1,2}°C$/.test(e.innerText.trim()) || e.innerText.includes('°C'));
      return badge ? badge.innerText.trim() : null;
    });
    results.temperatureBadge = tempBadge;

    console.log("TEST RESULTS:", JSON.stringify(results, null, 2));

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();
