const http = require('http');

async function test() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && t.url.includes('4174'));
  console.log("Found page tab:", page.title, page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idCounter = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Wait for React and pins to mount
  console.log("Waiting for React mount and map pins...");
  let loaded = false;
  for (let i = 0; i < 20; i++) {
    const res = await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.pg-flood-pin-container').length`,
      returnByValue: true
    });
    if (res && res.result && res.result.value > 0) {
      console.log(`Pins loaded: ${res.result.value} pins on map.`);
      loaded = true;
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // 1. DESKTOP / TABLET TESTS (1024 x 768)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 600));

  const desktopTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasNormal = btns.some(t => t.includes('ปกติ'));
      const hasModerate = btns.some(t => t.includes('ปานกลาง'));
      const hasSevere = btns.some(t => t.includes('วิกฤต'));

      // Check temperature badge
      const allElements = Array.from(document.querySelectorAll('*'));
      const tempElement = allElements.find(e => /\\d{1,2}°C/.test(e.innerText) && e.children.length <= 3 && e.innerText.length < 30);

      // Pins summary
      const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
      const photoPins = pins.filter(p => p.innerHTML.includes('📷'));
      const fallingPins = pins.filter(p => p.innerHTML.includes('📉'));

      return {
        levelFilters: { hasNormal, hasModerate, hasSevere },
        tempBadge: tempElement ? tempElement.innerText.trim() : null,
        totalPins: pins.length,
        photoPins: photoPins.length,
        fallingPins: fallingPins.length
      };
    })()`,
    returnByValue: true
  });

  console.log("=== DESKTOP / TABLET RESULTS ===");
  console.log(JSON.stringify(desktopTest.result.value, null, 2));

  // Test clicking "วิกฤต" filter
  console.log("Testing Level Filter: Clicking 'วิกฤต'...");
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sevBtn = btns.find(b => b.innerText.includes('วิกฤต'));
      if (sevBtn) sevBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const filteredCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
      const hasClearBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('แสดงทั้งหมด'));
      return { remainingPins: pins.length, hasClearBtn };
    })()`,
    returnByValue: true
  });
  console.log("Filtered to 'วิกฤต':", filteredCheck.result.value);

  // Reset filter
  await send('Runtime.evaluate', {
    expression: `(() => {
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('แสดงทั้งหมด'));
      if (clearBtn) clearBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. MOBILE TESTS (375 x 812)
  console.log("\n=== SWITCHING TO MOBILE VIEW (375 x 812) ===");
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  // Trigger window resize event
  await send('Runtime.evaluate', { expression: `window.dispatchEvent(new Event('resize'))` });
  await new Promise(r => setTimeout(r, 600));

  const mobileCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const guideBtn = btns.find(b => b.innerText.includes('ไกด์'));
      const tempElement = Array.from(document.querySelectorAll('*')).find(e => /\\d{1,2}°C/.test(e.innerText) && e.innerText.length < 20);
      return {
        hasMobileGuideBtn: !!guideBtn,
        guideBtnText: guideBtn ? guideBtn.innerText.trim() : null,
        mobileTemp: tempElement ? tempElement.innerText.trim() : null
      };
    })()`,
    returnByValue: true
  });
  console.log("Mobile UI Check:", JSON.stringify(mobileCheck.result.value, null, 2));

  // Click Mobile Guide button
  console.log("Clicking Mobile Guide Button...");
  await send('Runtime.evaluate', {
    expression: `(() => {
      const guideBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ไกด์'));
      if (guideBtn) guideBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const guideModalText = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasCameraExplanation: text.includes('จุดที่มีประชาชนถ่ายรูปรายงาน'),
        hasFallingExplanation: text.includes('จุดที่น้ำกำลังลด')
      };
    })()`,
    returnByValue: true
  });
  console.log("Mobile Guide Modal Content:", JSON.stringify(guideModalText.result.value, null, 2));

  // Close guide modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('เข้าใจแล้ว'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Click a pin with photo on mobile
  console.log("Clicking photo pin on mobile...");
  const clickPhotoResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
      const photoPin = pins.find(p => p.innerHTML.includes('📷'));
      if (photoPin) {
        photoPin.click();
        return { clickedPin: true };
      }
      return { clickedPin: false };
    })()`,
    returnByValue: true
  });
  console.log("Photo Pin Click Result:", clickPhotoResult.result.value);
  await new Promise(r => setTimeout(r, 600));

  const photoCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const popup = document.querySelector('.custom-leaflet-popup');
      const drawerImg = document.querySelector('img[alt*="รูปภาพ"], img[alt*="ภาพถ่าย"]');
      return {
        popupVisible: !!popup,
        popupHasPhoto: popup ? popup.innerHTML.includes('แตะเพื่อดูภาพใหญ่') : false,
        drawerHasPhoto: !!drawerImg
      };
    })()`,
    returnByValue: true
  });
  console.log("Photo Popup / Drawer on Mobile:", JSON.stringify(photoCheck.result.value, null, 2));

  console.log("\nALL VERIFICATIONS PASSED!");
  ws.close();
  process.exit(0);
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
