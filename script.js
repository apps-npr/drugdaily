// URL ของ Google Apps Script Web App ของคุณ
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgpd3F4STzP210MfJcsQRHwZnLRLjp82w3sD7Efu2mNnyZ6h8dVE96j8TLGcp6YoDfMg/exec";

// ข้อมูลตั้งต้น
const wards = [
    "MICU", "Med พิเศษเดี่ยวชั้น 14", "Med พิเศษรวมชั้น 12", "Med ส.ชาย ชั้น 11",
    "SEMI ชาย ชั้น 11", "SEMI หญิง ชั้น 10", "Stroke unit ชั้น 10", 
    "อายุรกรรม หญิง ชั้น 10", "OBS ER", "ER med ชั้น 8", "AIIR"
];

const pharmacists = [
    "ภญ.เสาวภา ศิริกาญจน์ (แอน)", "ภญ.อรรถยา เปล่งสงวน (พี่แจน)", "ภญ.กนกพร ชูริกาวิทย์ (ใหม่)", "ภญ.รัตติยาพร แก้วสุ (แยม)",
    "ภญ.สุชญา ประเสริฐปั้น(ใบหม่อน)", "ภญ.วรางค์รัตน์ สุวรรณชาตรี (ตา)", "ภญ.จิราพร คำแก้ว (โอ๋)", "ภญ.ชญานิน กำลัง (ไหม)",
    "ภก.วีรพัชร พานทอง (กระต๊อบ)", "ภก.ธนณัฏฐ์ แสงอังคนาวิน (แบงค์)", "ภญ.สุกัลยา ยิตนรดิน (พี่สุ)", "ภญ.กนกกช บุศย์น้ำเพชร (พี่บีบ)",
    "ภญ.วราภรณ์ แสงวิเชียร (พี่ตุ๊ก)", "ภญ.ศุภานันท์ ปิงเจริญกิจกุล (โบว์)", "ภญ.ศศิธร มามีชัย (พี่กุ้ง)", "ภญ.อาทิตยา วงศาโรจน์ (พี่เก๋)",
    "ภญ.ปนัดดา ชูเย็น (ดิว)", "ภญ.ปัญญภรณ์ ทรงสุนทรวงศ์", "ภญ.ดาริกา อนุรักษ์ชนะพล (กุ๊ก)", "ภญ.อัชฌา เหมะจันทร (พี่ปลา)",
    "ภก.เทพนรินทร์ ช่างประเสริฐ", "ภญ.พรทิพย์ วรนัยพินิจ", "ภญ.วรมน พิเชียรโสภณ (แพร)", "ภญ.อัจฉรา ภัทรสมสกุล (อุ๊)",
    "ภก.สุทธิเกียรติ สำเภา (สุท)", "ภญ.จุติพร ร่วมใจ (จอย)", "ภญ.ชนม์นิภา กุมภคาม (ชนม์)", "ภก.ปัณณวิชญ์ เรืองพัฒนโกศล (ตีโต้)",
    "ภญ.ธนภรณ์ ล้อมมหาดไทย (อุ้ม)", "ภญ.นลินรัตน์ ลิ่วศรีวิไล (แพร)", "ภญ.ชนิดาภา ตันตินิยงคกุล (มิว)",
    "ภญ.แพรพลอย ดรุณวัติ", "ภก.กันตพงศ์ วงศ์เอกเกษม (ซัน)", "ภญ.ลลิตา แย้มสุริโยทัย (แจน)", "ภญ.มัญชุพร ยมศิริ (หมิว)",
    "ภญ.ภัทรานิษฐ์ หวังมีสรี (น้ำ)", "ภก.ฐาปกรณ์ เบี้ยกระโทก (ปป)", "ภญ.ธารญา โกฉัยพัฒน์ (พัชชา)", "ภก.วันเฉลิม มีมูซอ (อาร์ม)",
    "ภก.วิศรุต สมบูรณ์วงศ์ (มาร์ค)", "ภญ.ธนัชพร ชัยวัฒนกุล(นัท)"
];

// ตัวแปร State
let state = { pharmacist: "", startTime: null, endTime: null, wardData: {} };
let dashboardRawData = []; // เก็บข้อมูลประวัติ

// Elements ต่างๆ
const elDate = document.getElementById('currentDate');
const elSelect = document.getElementById('pharmacistSelect');
const dashSelectPhar = document.getElementById('dashFilterPharmacist');
const btnStart = document.getElementById('startShiftBtn');
const btnEnd = document.getElementById('endShiftBtn');
const wardGrid = document.getElementById('wardGrid');

// เริ่มต้นการทำงาน (แสดงวันที่ และ โหลดรายชื่อ)
function init() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', era: 'short' };
    elDate.innerText = new Date().toLocaleDateString('th-TH', options).replace('พ.ศ.', 'พ.ศ. ');

    // ใส่ชื่อลงใน Dropdown หน้าเริ่มงาน และ หน้า Dashboard
    pharmacists.forEach(name => {
        elSelect.add(new Option(name, name));
        dashSelectPhar.add(new Option(name, name));
    });

    loadState();
}

function saveState() { localStorage.setItem('shiftState', JSON.stringify(state)); }

function loadState() {
    const saved = localStorage.getItem('shiftState');
    if (saved) {
        state = JSON.parse(saved);
        if (state.pharmacist && state.startTime && !state.endTime) { 
            renderWorkUI(); 
        }
    }
}

function renderWards() {
    wardGrid.innerHTML = "";
    wards.forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        if (state.wardData[ward]) card.classList.add('completed');

        const title = document.createElement('h3'); 
        title.innerText = ward;
        
        const timeStr = document.createElement('div');
        timeStr.className = 'time-stamp';
        timeStr.innerText = state.wardData[ward] ? `✔️ รับยาเรียบร้อย` : 'ยังไม่รับยา';

        card.appendChild(title); 
        card.appendChild(timeStr);

        card.addEventListener('click', () => {
            if (!state.endTime) {
                if (!state.wardData[ward]) {
                    state.wardData[ward] = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                } else {
                    delete state.wardData[ward];
                }
                saveState(); 
                renderWards();
            }
        });
        wardGrid.appendChild(card);
    });
}

function renderWorkUI() {
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('workSection').classList.remove('hidden');
    document.getElementById('pharmacistBadge').classList.remove('hidden');
    
    // ดึงเฉพาะชื่อแรกมาโชว์ที่ป้าย จะได้ไม่ยาวเกินไป
    let shortName = state.pharmacist.split(' ')[0] || state.pharmacist;
    document.getElementById('badgeName').innerText = `ผู้ปฏิบัติงาน: ${shortName}`; 
    renderWards();
}

btnStart.addEventListener('click', () => {
    if (!elSelect.value) return alert("กรุณาเลือกชื่อเภสัชกรก่อนเริ่มงานครับ");
    state.pharmacist = elSelect.value;
    state.startTime = new Date().toISOString();
    state.endTime = null; 
    state.wardData = {};
    saveState(); 
    renderWorkUI();
});

btnEnd.addEventListener('click', async () => {
    if(confirm("ยืนยันการจบการทำงานและบันทึกข้อมูล?")) {
        state.endTime = new Date().toISOString();
        saveState();
        
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerText = "⏳ กำลังบันทึกข้อมูลลงระบบ...";
        syncStatus.style.color = "var(--primary-color)";

        const payload = {
            date: new Date().toLocaleDateString('th-TH'),
            pharmacist: state.pharmacist,
            startTime: new Date(state.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date(state.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            wardData: JSON.stringify(state.wardData)
        };

        try {
            await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            syncStatus.innerText = "✅ บันทึกข้อมูลสำเร็จ! กำลังรีเซ็ต...";
            syncStatus.style.color = "var(--success-color)";
            
            setTimeout(() => {
                localStorage.removeItem('shiftState'); 
                location.reload(); 
            }, 2000);
        } catch (error) {
            syncStatus.innerText = "❌ บันทึกไม่สำเร็จ โปรดลองใหม่";
            syncStatus.style.color = "var(--danger-color)";
        }
    }
});

/* =========================================
   ส่วนระบบ Login และ Dashboard สำหรับ Admin 
========================================= */
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

document.getElementById('loginBtn').addEventListener('click', async () => {
    const pass = document.getElementById('adminPass').value;
    if(!pass) return alert("กรุณาใส่รหัสผ่าน");
    
    const loginStatus = document.getElementById('loginStatus');
    loginStatus.innerText = "กำลังตรวจสอบและดึงข้อมูล...";
    loginStatus.style.color = "var(--primary-color)";

    try {
        const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?action=login&pass=${encodeURIComponent(pass)}`);
        const result = await response.json();

        if(result.status === "success") {
            dashboardRawData = result.data; 
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('adminPass').value = '';
            
            calculateDashboardStats(); 
        } else {
            loginStatus.innerText = "❌ " + result.message;
            loginStatus.style.color = "var(--danger-color)";
        }
    } catch(err) {
        loginStatus.innerText = "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ (อย่าลืม Deploy เป็น New Version นะครับ)";
        loginStatus.style.color = "var(--danger-color)";
    }
});

// Event เปลี่ยน Filter ในหน้า Dashboard
document.getElementById('dashFilterTime').addEventListener('change', calculateDashboardStats);
document.getElementById('dashFilterPharmacist').addEventListener('change', calculateDashboardStats);

// ฟังก์ชันคำนวณระยะเวลา (นาที) ข้ามคืนได้
function getDurationMins(startStr, endStr) {
    if(!startStr || !endStr || startStr === '-' || endStr === '-') return 0;
    try {
        let [sh, sm] = startStr.split(':').map(Number);
        let [eh, em] = endStr.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60; // กรณีเข้าเวรข้ามคืน
        return diff;
    } catch(e) { return 0; }
}

function calculateDashboardStats() {
    const daysLimit = parseInt(document.getElementById('dashFilterTime').value);
    const pharFilter = document.getElementById('dashFilterPharmacist').value;
    
    let filteredData = dashboardRawData.slice(1); // ข้ามแถว Header
    const now = new Date();
    
    // 1. กรองตามวันที่ และ ชื่อเภสัช
    filteredData = filteredData.filter(row => {
        if(!row[0]) return false;
        if(pharFilter !== 'all' && row[1] !== pharFilter) return false;

        const dateParts = row[0].split('/'); 
        if(dateParts.length === 3) {
            let rowDate = new Date(dateParts[2]-543, dateParts[1]-1, dateParts[0]);
            const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
            if(diffDays > daysLimit) return false;
        }
        return true;
    });

    const personalSec = document.getElementById('personalStatsSection');
    const wardSec = document.getElementById('wardStatsSection');
    
    if(pharFilter === 'all') {
        // ---- โหมดดูภาพรวม (จัดอันดับวอร์ด) ----
        personalSec.classList.add('hidden');
        wardSec.classList.remove('hidden');

        let wardStats = {};
        wards.forEach(w => wardStats[w] = { totalMins: 0, count: 0 });

        filteredData.forEach(row => {
            const startTimeStr = row[2];
            const wardJsonStr = row[4];
            if(startTimeStr && wardJsonStr) {
                try {
                    const wardData = JSON.parse(wardJsonStr);
                    let [sh, sm] = startTimeStr.split(':').map(Number);
                    let startMins = sh * 60 + sm;

                    for(let w in wardData) {
                        if(wardStats[w]) {
                            let [wh, wm] = wardData[w].split(':').map(Number);
                            let wardMins = wh * 60 + wm;
                            if (wardMins < startMins) wardMins += (24 * 60);
                            wardStats[w].totalMins += (wardMins - startMins);
                            wardStats[w].count += 1;
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
            ranking.slice(0, 3).forEach(r => fastList.innerHTML += `<li><strong>${r.ward}</strong> <span class="history-time">(${r.avgMins} นาที)</span></li>`);
            ranking.slice(-3).reverse().forEach(r => slowList.innerHTML += `<li><strong>${r.ward}</strong> <span class="history-time">(${r.avgMins} นาที)</span></li>`);
        }

    } else {
        // ---- โหมดดูรายบุคคล ----
        personalSec.classList.remove('hidden');
        wardSec.classList.add('hidden');
        
        document.getElementById('statTotalShifts').innerText = filteredData.length;
        
        let totalMins = 0;
        let historyHTML = '';
        
        // ประวัติเรียงจากใหม่สุดไปเก่าสุด
        filteredData.reverse().forEach(row => {
            const dateStr = row[0];
            const start = row[2] ? row[2].slice(0,5) : '-'; // ตัดเอาแค่ ชั่วโมง:นาที
            const end = row[3] ? row[3].slice(0,5) : '-';
            
            let mins = getDurationMins(row[2], row[3]);
            totalMins += mins;

            historyHTML += `
                <div class="history-item">
                    <span class="history-date">📅 ${dateStr}</span>
                    <span class="history-time">⏱️ ${start} - ${end}</span>
                </div>
            `;
        });
        
        document.getElementById('shiftHistoryList').innerHTML = historyHTML || '<p class="text-center">ไม่มีข้อมูลในระบบ</p>';
        
        if(filteredData.length > 0) {
            let avgMins = Math.round(totalMins / filteredData.length);
            let h = Math.floor(avgMins / 60);
            let m = avgMins % 60;
            document.getElementById('statAvgDuration').innerText = `${h} ชม. ${m} นาที`;
        } else {
            document.getElementById('statAvgDuration').innerText = "0 ชม. 0 นาที";
        }
    }
}

// เรียกฟังก์ชันเมื่อเปิดหน้าเว็บ
init();
