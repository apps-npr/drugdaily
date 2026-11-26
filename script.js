const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgpd3F4STzP210MfJcsQRHwZnLRLjp82w3sD7Efu2mNnyZ6h8dVE96j8TLGcp6YoDfMg/exec"; 

const wards = [ "MICU", "CCU", "Med พิเศษเดี่ยวชั้น 14", "Med พิเศษรวมชั้น 12", "Med ส.ชาย ชั้น 11", "SEMI ชาย ชั้น 11", "SEMI หญิง ชั้น 10", "Stroke unit ชั้น 10", "อายุรกรรม หญิง ชั้น 10", "OBS ER", "OBS ER ช.11", "ER med ชั้น 8", "AIIR" ];

const wardPhones = {
    "อายุรกรรม หญิง ชั้น 10": "81020",
    "Med ส.ชาย ชั้น 11": "81115",
    "OBS ER": "80110",
    "OBS ER ช.11": "81120",
    "ER med ชั้น 8": "80809",
    "Stroke unit ชั้น 10": "81015",
    "SEMI ชาย ชั้น 11": "81105",
    "Med พิเศษเดี่ยวชั้น 14": "81410",
    "Med พิเศษรวมชั้น 12": "81205",
    "SEMI หญิง ชั้น 10": "81006",
    "MICU": "80407",
    "CCU": "80405",
    "AIIR": "4100"
};

const pharmacists = [ "ภญ.เสาวภา ศิริกาญจน์ (แอน)", "ภญ.อรรถยา เปล่งสงวน (พี่แจน)", "ภญ.กนกพร ชูริกาวิทย์ (ใหม่)", "ภญ.รัตติยาพร แก้วสุ (แยม)", "ภญ.สุชญา ประเสริฐปั้น(ใบหม่อน)", "ภญ.วรางค์รัตน์ สุวรรณชาตรี (ตา)", "ภญ.จิราพร คำแก้ว (โอ๋)", "ภญ.ชญานิน กำลัง (ไหม)", "ภก.วีรพัชร พานทอง (กระต๊อบ)", "ภก.ธนณัฏฐ์ แสงอังคนาวิน (แบงค์)", "ภญ.สุกัลยา ยิตนรดิน (พี่สุ)", "ภญ.กนกกช บุศย์น้ำเพชร (พี่บีบ)", "ภญ.วราภรณ์ แสงวิเชียร (พี่ตุ๊ก)", "ภญ.ศุภานันท์ ปิงเจริญกิจกุล (โบว์)", "ภญ.ศศิธร มามีชัย (พี่กุ้ง)", "ภญ.อาทิตยา วงศาโรจน์ (พี่เก๋)", "ภญ.ปนัดดา ชูเย็น (ดิว)", "ภญ.ปัญญภรณ์ ทรงสุนทรวงศ์", "ภญ.ดาริกา อนุรักษ์ชนะพล (กุ๊ก)", "ภญ.อัชฌา เหมะจันทร (พี่ปลา)", "ภก.เทพนรินทร์ ช่างประเสริฐ", "ภญ.พรทิพย์ วรนัยพินิจ", "ภญ.วรมน พิเชียรโสภณ (แพร)", "ภญ.อัจฉรา ภัทรสมสกุล (อุ๊)", "ภก.สุทธิเกียรติ สำเภา (สุท)", "ภญ.จุติพร ร่วมใจ (จอย)", "ภญ.ชนม์นิภา กุมภคาม (ชนม์)", "ภก.ปัณณวิชญ์ เรืองพัฒนโกศล (ตีโต้)", "ภญ.ธนภรณ์ ล้อมมหาดไทย (อุ้ม)", "ภญ.นลินรัตน์ ลิ่วศรีวิไล (แพร)", "ภญ.ชนิดาภา ตันตินิยงคกุล (มิว)", "ภญ.แพรพลอย ดรุณวัติ", "ภก.กันตพงศ์ วงศ์เอกเกษม (ซัน)", "ภญ.ลลิตา แย้มสุริโยทัย (แจน)", "ภญ.มัญชุพร ยมศิริ (หมิว)", "ภญ.ภัทรานิษฐ์ หวังมีสรี (น้ำ)", "ภก.ฐาปกรณ์ เบี้ยกระโทก (ปป)", "ภญ.ธารญา โกฉัยพัฒน์ (พัชชา)", "ภก.วันเฉลิม มีมูซอ (อาร์ม)", "ภก.วิศรุต สมบูรณ์วงศ์ (มาร์ค)", "ภญ.ธนัชพร ชัยวัฒนกุล(นัท)" ];

let state = { pharmacist: "", startTime: null, endTime: null, wardData: {}, coldMeds: {}, calledWards: {} };
let dashboardRawData = []; 
let trendChartInstance = null;
let peakHourChartInstance = null;
let midnightTimer = null; // ตัวแปรสำหรับจับเวลาเที่ยงคืน
let compactMode = localStorage.getItem('compactMode') === '1';
let deferredInstallPrompt = null;

const elDate = document.getElementById('currentDate');
const elSelect = document.getElementById('pharmacistSelect');
const dashSelectPhar = document.getElementById('dashFilterPharmacist');
const btnStart = document.getElementById('startShiftBtn');
const btnEnd = document.getElementById('endShiftBtn');
const btnCompact = document.getElementById('compactModeBtn');
const wardGrid = document.getElementById('wardGrid');

function isChecked(ward) { return !!(state.wardData && state.wardData[ward]); }
function isCold(ward) { return !!(state.coldMeds && state.coldMeds[ward]); }
function isCalled(ward) { return !!(state.calledWards && state.calledWards[ward]); }

/** ลำดับการ์ด: รับยาแล้ว+ยาเย็น, รับยาแล้ว, รอรับ+ยาเย็น, รอรับ — คงลำดับเดิมในกลุ่มเดียวกัน */
function wardSortKey(ward) {
    const checked = isChecked(ward);
    const cold = isCold(ward);
    if (checked && cold) return 0;
    if (checked) return 1;
    if (cold) return 2;
    return 3;
}

function sortedWards() {
    return wards
        .map((ward, index) => ({ ward, index }))
        .sort((a, b) => {
            const diff = wardSortKey(a.ward) - wardSortKey(b.ward);
            return diff !== 0 ? diff : a.index - b.index;
        })
        .map((item) => item.ward);
}

function applyCompactMode() {
    document.body.classList.toggle('compact-mode', compactMode);
    if (btnCompact) {
        btnCompact.textContent = compactMode ? 'โหมดเต็ม' : 'โหมดย่อ';
        btnCompact.classList.toggle('active-toggle', compactMode);
    }
    const hint = document.getElementById('compactHint');
    if (hint) hint.classList.toggle('hidden', !compactMode);
}

function init() {
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', era: 'short' }).replace('พ.ศ.', 'พ.ศ. ');
    elDate.innerText = dateStr;

    pharmacists.forEach(name => {
        elSelect.add(new Option(name, name));
        dashSelectPhar.add(new Option(name, name));
    });

    applyCompactMode();
    setupPwaInstall();

    const saved = localStorage.getItem('shiftState');
    if (saved) {
        state = JSON.parse(saved);
        if (!state.coldMeds) state.coldMeds = {};
        if (!state.calledWards) state.calledWards = {};
        
        if (state.pharmacist && state.startTime && !state.endTime) {
            // ระบบตรวจสอบการข้ามวัน (ถ้าเปิดเว็บมาแล้วพบว่าเวรถูกเริ่มตั้งแต่เมื่อวาน)
            const shiftDate = new Date(state.startTime).toDateString();
            const today = new Date().toDateString();
            
            if (shiftDate !== today) {
                // บังคับจบเวรของเมื่อวานอัตโนมัติทันที
                autoFinalizeShift();
            } else {
                renderWorkUI();
                setupMidnightTimer(); // เริ่มจับเวลาเที่ยงคืน
            }
        }
    }
}

// ฟังก์ชันบังคับจบเวรอัตโนมัติ (ใส่ 23:59 ให้วอร์ดที่เหลือ และส่งข้อมูล)
async function autoFinalizeShift() {
    // โชว์หน้าจอโหลดทับเพื่อไม่ให้คนสับสน
    document.body.innerHTML = '<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:linear-gradient(135deg, #00F260 0%, #0575E6 100%);"><h2 style="color:white; text-align:center; font-family:Kanit, sans-serif; background:rgba(255,255,255,0.2); padding:30px; border-radius:20px; backdrop-filter:blur(10px); box-shadow:0 8px 32px rgba(0,0,0,0.1);">⏳ ตรวจพบว่าข้ามวันแล้ว<br>กำลังบันทึกและเคลียร์เวรของเมื่อวานอัตโนมัติ...</h2></div>';
    
    // วอร์ดไหนยังไม่มารับ ให้เติม '23:59' ลงไป
    wards.forEach(w => {
        if (!state.wardData[w]) {
            state.wardData[w] = '23:59';
        }
    });

    const payload = {
        date: new Date(state.startTime).toLocaleDateString('th-TH'),
        pharmacist: state.pharmacist,
        startTime: new Date(state.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        endTime: '23:59',
        wardData: JSON.stringify(state.wardData)
    };

    try {
        await fetch(GOOGLE_SHEET_WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {}
    
    // เคลียร์ข้อมูลและรีเฟรชกลับสู่หน้าเริ่มงานปกติ
    localStorage.removeItem('shiftState');
    location.reload();
}

// ตั้งเวลาให้ฟังก์ชัน autoFinalizeShift() ทำงานตอนเที่ยงคืนเป๊ะๆ
function setupMidnightTimer() {
    if(midnightTimer) clearTimeout(midnightTimer);
    
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // ตั้งเป็น 00:00:00 ของวันพรุ่งนี้
    
    const msUntilMidnight = midnight - now; // เวลาที่เหลือจนถึงเที่ยงคืน (มิลลิวินาที)
    
    midnightTimer = setTimeout(() => {
        autoFinalizeShift();
    }, msUntilMidnight);
}

// บันทึกข้อมูลลงเครื่องอัตโนมัติทุกๆ 30 นาที เพื่อความอุ่นใจ (จริงๆ ระบบเซฟทุกการคลิกอยู่แล้ว)
setInterval(() => {
    if (state.pharmacist && state.startTime && !state.endTime) {
        saveState();
    }
}, 30 * 60 * 1000); 

function saveState() { localStorage.setItem('shiftState', JSON.stringify(state)); }

function captureCardPositions() {
    const map = {};
    [...wardGrid.children].forEach((el) => {
        if (!el.dataset.ward) return;
        map[el.dataset.ward] = el.getBoundingClientRect();
    });
    return map;
}

function animateCardMoves(prev) {
    if (!prev || !Object.keys(prev).length) return;
    [...wardGrid.children].forEach((el) => {
        const old = prev[el.dataset.ward];
        if (!old) return;
        const now = el.getBoundingClientRect();
        const dx = old.left - now.left;
        const dy = old.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            el.style.transition = 'transform 0.28s ease';
            el.style.transform = '';
        });
    });
}

function toggleReceived(ward) {
    if (state.endTime) return;
    if (!state.wardData[ward]) {
        state.wardData[ward] = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else {
        delete state.wardData[ward];
    }
    saveState();
    renderWards();
}

function toggleCold(ward) {
    if (state.endTime) return;
    if (!state.coldMeds) state.coldMeds = {};
    state.coldMeds[ward] = !state.coldMeds[ward];
    saveState();
    renderWards();
}

function toggleCalled(ward) {
    if (state.endTime) return;
    if (!state.calledWards) state.calledWards = {};
    state.calledWards[ward] = !state.calledWards[ward];
    saveState();
    renderWards();
}

function renderWards() {
    const prev = captureCardPositions();
    wardGrid.innerHTML = "";
    sortedWards().forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        card.dataset.ward = ward;
        card.dataset.checked = isChecked(ward) ? '1' : '0';
        card.dataset.cold = isCold(ward) ? '1' : '0';
        card.dataset.called = isCalled(ward) ? '1' : '0';
        
        if (isCold(ward)) card.classList.add('has-cold-med');
        if (isCalled(ward)) card.classList.add('called-ward');
        if (isChecked(ward)) card.classList.add('completed');

        const checkMark = document.createElement('span');
        checkMark.className = 'compact-check';
        checkMark.textContent = '✔';
        checkMark.setAttribute('aria-hidden', 'true');

        const title = document.createElement('h3'); title.innerText = ward;
        
        const timeStr = document.createElement('div');
        timeStr.className = 'time-stamp';
        timeStr.innerText = isChecked(ward) ? `✔️ ${state.wardData[ward]}` : 'รอรับยา';

        const phoneStr = document.createElement('div');
        phoneStr.className = 'ward-phone';
        phoneStr.innerText = `📞 ${wardPhones[ward] || '-'}`;
        
        phoneStr.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.endTime) toggleCalled(ward);
        });

        const coldBtn = document.createElement('button');
        coldBtn.type = 'button';
        coldBtn.className = 'cold-btn';
        coldBtn.innerHTML = isCold(ward) ? '❄️ มียาเย็น' : '➕ มียาเย็น';
        
        coldBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleCold(ward);
        });

        const compactColdBtn = document.createElement('button');
        compactColdBtn.type = 'button';
        compactColdBtn.className = 'compact-cold-btn';
        compactColdBtn.title = 'มียาเย็น';
        compactColdBtn.setAttribute('aria-label', `ยาเย็น ${ward}`);
        compactColdBtn.textContent = '❄️';
        compactColdBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCold(ward);
        });

        // โหมดย่อ: กดค้างเพื่อสลับสถานะโทรแจ้งแล้ว
        let pressTimer = null;
        let longPressed = false;
        const startPress = (e) => {
            if (e.target.closest('.compact-cold-btn, .cold-btn, .ward-phone')) return;
            longPressed = false;
            pressTimer = setTimeout(() => {
                longPressed = true;
                toggleCalled(ward);
            }, 550);
        };
        const cancelPress = () => {
            if (pressTimer) clearTimeout(pressTimer);
            pressTimer = null;
        };
        card.addEventListener('pointerdown', startPress);
        card.addEventListener('pointerup', cancelPress);
        card.addEventListener('pointerleave', cancelPress);
        card.addEventListener('pointercancel', cancelPress);

        card.addEventListener('click', (e) => {
            if (e.target.closest('.compact-cold-btn, .cold-btn, .ward-phone')) return;
            if (longPressed) {
                longPressed = false;
                return;
            }
            toggleReceived(ward);
        });
        
        card.appendChild(checkMark);
        card.appendChild(compactColdBtn);
        card.appendChild(title); 
        card.appendChild(timeStr);
        card.appendChild(phoneStr);
        card.appendChild(coldBtn);
        
        wardGrid.appendChild(card);
    });
    animateCardMoves(prev);
}

function renderWorkUI() {
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('workSection').classList.remove('hidden');
    document.getElementById('pharmacistBadge').classList.remove('hidden');
    document.getElementById('badgeName').innerText = `ผู้ปฏิบัติงาน ${state.pharmacist.split(' ')[0]}`;
    applyCompactMode();
    renderWards();
}

if (btnCompact) {
    btnCompact.addEventListener('click', () => {
        compactMode = !compactMode;
        localStorage.setItem('compactMode', compactMode ? '1' : '0');
        applyCompactMode();
        renderWards();
    });
}

btnStart.addEventListener('click', () => {
    if (!elSelect.value) return alert("กรุณาเลือกชื่อเภสัชกรครับ");
    state.pharmacist = elSelect.value;
    state.startTime = new Date().toISOString();
    state.endTime = null; 
    state.wardData = {};
    state.coldMeds = {}; 
    state.calledWards = {}; 
    saveState(); 
    renderWorkUI();
    setupMidnightTimer(); // จับเวลาเที่ยงคืนเมื่อเริ่มงาน
});

btnEnd.addEventListener('click', async () => {
    if(confirm("ยืนยันจบเวรและบันทึกข้อมูล?")) {
        state.endTime = new Date().toISOString();
        saveState();
        if(midnightTimer) clearTimeout(midnightTimer); // ยกเลิกการจับเวลาเที่ยงคืนเพราะกดจบงานเองแล้ว
        
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerText = "⏳ กำลังบันทึกข้อมูล...";

        const payload = {
            date: new Date().toLocaleDateString('th-TH'),
            pharmacist: state.pharmacist,
            startTime: new Date(state.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date(state.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            wardData: JSON.stringify(state.wardData)
        };

        try {
            await fetch(GOOGLE_SHEET_WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            syncStatus.innerText = "✅ บันทึกสำเร็จ!";
            setTimeout(() => { localStorage.removeItem('shiftState'); location.reload(); }, 2000);
        } catch (error) {
            syncStatus.innerText = "❌ บันทึกไม่สำเร็จ โปรดลองใหม่";
        }
    }
});

function setupPwaInstall() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    const installBtn = document.getElementById('installAppBtn');
    const iosHint = document.getElementById('iosInstallHint');
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installBtn && !isStandalone) installBtn.classList.remove('hidden');
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice.catch(() => {});
            deferredInstallPrompt = null;
            installBtn.classList.add('hidden');
        });
    }

    if (iosHint && isIos && !isStandalone) {
        iosHint.classList.remove('hidden');
    }

    window.addEventListener('appinstalled', () => {
        if (installBtn) installBtn.classList.add('hidden');
        deferredInstallPrompt = null;
    });
}


document.getElementById('adminPass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

/* ================= Dashboard Admin & Stats ================= */
document.getElementById('showLoginBtn').addEventListener('click', () => {
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
});
document.getElementById('cancelLoginBtn').addEventListener('click', () => {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('setupSection').classList.remove('hidden');
});
document.getElementById('closeDashBtn').addEventListener('click', () => {
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('setupSection').classList.remove('hidden');
});

const btnTabOverview = document.getElementById('tabOverview');
const btnTabDaily = document.getElementById('tabDaily');
const tabOverviewContent = document.getElementById('overviewTabContent');
const tabDailyContent = document.getElementById('dailyTabContent');

btnTabOverview.addEventListener('click', () => {
    btnTabOverview.classList.replace('outline', 'active-tab');
    btnTabDaily.classList.replace('active-tab', 'outline');
    tabOverviewContent.classList.remove('hidden');
    tabDailyContent.classList.add('hidden');
});

btnTabDaily.addEventListener('click', () => {
    btnTabDaily.classList.replace('outline', 'active-tab');
    btnTabOverview.classList.replace('active-tab', 'outline');
    tabDailyContent.classList.remove('hidden');
    tabOverviewContent.classList.add('hidden');
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const pass = document.getElementById('adminPass').value;
    if(!pass) return alert("กรุณาใส่รหัสผ่าน");
    const loginStatus = document.getElementById('loginStatus');
    loginStatus.innerText = "⏳ กำลังดึงข้อมูล...";
    
    try {
        const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?action=login&pass=${encodeURIComponent(pass)}`);
        const result = await response.json();

        if(result.status === "success") {
            dashboardRawData = result.data;
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('adminPass').value = '';
            
            calculateDashboardStats();
            populateDailySelect();
        } else {
            loginStatus.innerText = "❌ รหัสผ่านไม่ถูกต้อง";
        }
    } catch(err) {
        loginStatus.innerText = "❌ เชื่อมต่อล้มเหลว";
    }
});

document.getElementById('dashFilterTime').addEventListener('change', calculateDashboardStats);
document.getElementById('dashFilterPharmacist').addEventListener('change', calculateDashboardStats);

function extractTime(str) {
    if (!str) return null;
    const match = String(str).match(/(\d+):(\d+)/);
    return match ? { h: parseInt(match[1], 10), m: parseInt(match[2], 10), raw: `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}` } : null;
}

function calculateDashboardStats() {
    const daysLimit = parseInt(document.getElementById('dashFilterTime').value);
    const pharFilter = document.getElementById('dashFilterPharmacist').value;
    
    let filteredData = dashboardRawData.slice(1);
    const now = new Date();
    
    filteredData = filteredData.filter(row => {
        if(!row[0]) return false;
        if(pharFilter !== 'all' && row[1] !== pharFilter) return false;

        const dateParts = String(row[0]).split('/'); 
        if(dateParts.length === 3) {
            let rowDate = new Date(dateParts[2]-543, dateParts[1]-1, dateParts[0]);
            const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
            if(diffDays > daysLimit) return false;
        }
        return true;
    });

    const chartsSec = document.getElementById('chartsSection');
    const wardSec = document.getElementById('wardStatsSection');
    const leaderSec = document.getElementById('pharmacistLeaderboard');
    const personalSec = document.getElementById('personalHistorySection');
    
    document.getElementById('statTotalShifts').innerText = filteredData.length;

    if(pharFilter === 'all') {
        chartsSec.classList.remove('hidden');
        wardSec.classList.remove('hidden');
        leaderSec.classList.remove('hidden');
        personalSec.classList.add('hidden');
        
        let wardStats = {};
        wards.forEach(w => wardStats[w] = { totalMins: 0, count: 0 });
        let peakHours = {};
        let pharCounts = {};

        filteredData.forEach(row => {
            let pName = row[1];
            if(pName) { pharCounts[pName] = (pharCounts[pName] || 0) + 1; }

            const startObj = extractTime(row[2]);
            const wardJsonStr = row[4];
            if(startObj && wardJsonStr) {
                try {
                    const wardData = JSON.parse(wardJsonStr);
                    let startMins = startObj.h * 60 + startObj.m;

                    for(let w in wardData) {
                        const wObj = extractTime(wardData[w]);
                        if(wObj) {
                            if(wardStats[w]) {
                                let wardMins = wObj.h * 60 + wObj.m;
                                if (wardMins < startMins) wardMins += (24 * 60);
                                wardStats[w].totalMins += (wardMins - startMins);
                                wardStats[w].count += 1;
                            }
                            let hStr = `${wObj.h.toString().padStart(2, '0')}:00`;
                            peakHours[hStr] = (peakHours[hStr] || 0) + 1;
                        }
                    }
                } catch(e) {}
            }
        });

        let ranking = [];
        for(let w in wardStats) {
            if(wardStats[w].count > 0) {
                ranking.push({ ward: w, avgMins: Math.round(wardStats[w].totalMins / wardStats[w].count) });
            }
        }
        ranking.sort((a, b) => a.avgMins - b.avgMins);

        const fastList = document.getElementById('fastestWardsList');
        const slowList = document.getElementById('slowestWardsList');
        fastList.innerHTML = ''; slowList.innerHTML = '';

        if(ranking.length === 0) {
            fastList.innerHTML = '<li>ไม่มีข้อมูล</li>'; slowList.innerHTML = '<li>ไม่มีข้อมูล</li>';
        } else {
            ranking.slice(0, 5).forEach(r => fastList.innerHTML += `<li><strong>${r.ward}</strong> <span style="color:#059669;">(${r.avgMins} นาที)</span></li>`);
            ranking.slice(-5).reverse().forEach(r => slowList.innerHTML += `<li><strong>${r.ward}</strong> <span style="color:#dc2626;">(${r.avgMins} นาที)</span></li>`);
        }

        let lBoard = Object.entries(pharCounts).sort((a,b) => b[1] - a[1]);
        const lList = document.getElementById('leaderboardList');
        lList.innerHTML = '';
        lBoard.slice(0, 5).forEach((item, index) => {
            let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👏';
            lList.innerHTML += `<li class="leaderboard-item"><span>${medal} ${item[0]}</span> <strong>${item[1]} เวร</strong></li>`;
        });

        drawCharts(ranking, peakHours);

    } else {
        chartsSec.classList.add('hidden');
        wardSec.classList.add('hidden');
        leaderSec.classList.add('hidden');
        personalSec.classList.remove('hidden');

        let totalMins = 0;
        let historyHTML = '';
        
        filteredData.reverse().forEach(row => {
            const dateStr = row[0];
            const startObj = extractTime(row[2]);
            const endObj = extractTime(row[3]);
            const start = startObj ? startObj.raw : '-'; 
            const end = endObj ? endObj.raw : '-';
            
            if(startObj && endObj) {
                let diff = (endObj.h*60 + endObj.m) - (startObj.h*60 + startObj.m);
                if (diff < 0) diff += 24*60;
                totalMins += diff;
            }

            historyHTML += `<div class="history-item"><span>📅 ${dateStr}</span> <span style="color:#059669;">⏱️ ${start} - ${end}</span></div>`;
        });
        
        document.getElementById('shiftHistoryList').innerHTML = historyHTML || '<p class="text-center">ไม่มีข้อมูล</p>';
        
        if(filteredData.length > 0) {
            let avgMins = Math.round(totalMins / filteredData.length);
            document.getElementById('statAvgDuration').innerText = `${Math.floor(avgMins / 60)} ชม. ${avgMins % 60} นาที`;
        } else {
            document.getElementById('statAvgDuration').innerText = "0 ชม. 0 นาที";
        }
    }
}

function drawCharts(rankingData, peakHoursData) {
    if(trendChartInstance) trendChartInstance.destroy();
    if(peakHourChartInstance) peakHourChartInstance.destroy();

    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    const labels = rankingData.map(d => d.ward);
    const data = rankingData.map(d => d.avgMins);
    
    trendChartInstance = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'เวลาเฉลี่ย (นาที)',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxPeak = document.getElementById('peakHourChart').getContext('2d');
    const sortedHours = Object.keys(peakHoursData).sort();
    const peakCounts = sortedHours.map(h => peakHoursData[h]);

    peakHourChartInstance = new Chart(ctxPeak, {
        type: 'line',
        data: {
            labels: sortedHours,
            datasets: [{
                label: 'จำนวน Ward ที่มารับยา',
                data: peakCounts,
                backgroundColor: 'rgba(5, 117, 230, 0.2)',
                borderColor: 'rgba(5, 117, 230, 1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function populateDailySelect() {
    const select = document.getElementById('dailyDateSelect');
    select.innerHTML = '<option value="">-- เลือกเวรที่ต้องการดู --</option>';
    
    for (let i = dashboardRawData.length - 1; i > 0; i--) {
        const row = dashboardRawData[i];
        if (!row[0]) continue;
        const dateStr = row[0];
        const phar = row[1] ? String(row[1]).split(' ')[0] : 'ไม่ระบุ';
        const start = extractTime(row[2]) ? extractTime(row[2]).raw : '-';
        
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `📅 ${dateStr} | เภสัชกร: ${phar} (เริ่ม ${start})`;
        select.appendChild(option);
    }
}

document.getElementById('dailyDateSelect').addEventListener('change', (e) => {
    const rowIdx = e.target.value;
    const infoContainer = document.getElementById('dailyShiftInfo');
    const noDataMsg = document.getElementById('dailyNoDataMsg');
    const grid = document.getElementById('dailyWardGrid');

    if (!rowIdx) {
        infoContainer.classList.add('hidden');
        noDataMsg.classList.remove('hidden');
        return;
    }

    infoContainer.classList.remove('hidden');
    noDataMsg.classList.add('hidden');

    const row = dashboardRawData[rowIdx];
    document.getElementById('dailyPharName').innerText = `เภสัชกร: ${row[1] || '-'}`;
    
    const startObj = extractTime(row[2]);
    const endObj = extractTime(row[3]);
    const startStr = startObj ? startObj.raw : '-';
    const endStr = endObj ? endObj.raw : '-';
    document.getElementById('dailyShiftTime').innerText = `${startStr} ถึง ${endStr}`;

    let parsedWards = {};
    try { if (row[4]) parsedWards = JSON.parse(row[4]); } catch(err) {}

    grid.innerHTML = '';
    wards.forEach(w => {
        const isCompleted = parsedWards[w] ? true : false;
        const wTimeObj = isCompleted ? extractTime(parsedWards[w]) : null;
        const timeDisplay = wTimeObj ? wTimeObj.raw : 'ไม่มารับยา';
        
        const phoneDisplay = wardPhones[w] ? `📞 ${wardPhones[w]}` : `📞 -`;

        const card = document.createElement('div');
        card.className = `ward-card readonly ${isCompleted ? 'completed' : ''}`;
        card.innerHTML = `
            <h3 style="font-size:1.1rem; margin-bottom:5px;">${w}</h3>
            <div class="time-stamp" style="font-size:1rem; padding:4px; ${!isCompleted ? 'background:rgba(239,68,68,0.2); color:#dc2626;' : ''}">${timeDisplay}</div>
            <div class="ward-phone" style="font-size:0.85rem; margin-top:5px; color:var(--text-dark); opacity:0.7;">${phoneDisplay}</div>
        `;
        grid.appendChild(card);
    });
});

init();
