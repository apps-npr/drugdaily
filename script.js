// URL ของ Google Apps Script Web App (ต้องเอา URL ที่ Deploy แล้วมาใส่ตรงนี้)
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgpd3F4STzP210MfJcsQRHwZnLRLjp82w3sD7Efu2mNnyZ6h8dVE96j8TLGcp6YoDfMg/exec";

// ข้อมูลตั้งต้น
const wards = [
    "MICU", "Med พิเศษเดี่ยวชั้น 14", "Med พิเศษรวมชั้น 12", "Med ส.ชาย ชั้น 11",
    "SEMI ชาย ชั้น 11", "SEMI หญิง ชั้น 10", "Stroke unit ชั้น 10", 
    "อายุรกรรม หญิง ชั้น 10", "OBS ER", "ER med ชั้น 8", "AIIR"
];

const pharmacists = [
    "ภญ.วรางค์รัตน์ สุวรรณชาตรี (ตา)", "ภญ.จิราพร คำแก้ว (โอ๋)", "ภญ.ชญานิน กำลัง (ไหม)", "ภ.ก.วีรพัชร พานทอง (กระต๊อบ)",
    "ภญ.เสาวภา ศิริกาญจน์ (แอน)", "ภ.ก.ธนณัฏฐ์ แสงอังคนาวิน (แบงค์)", "ภ.ก.สรรเสริญ มะลิทอง (พี่ชา)", "ภญ.สุกัลยา ยิตนรดิน (พี่สุ)",
    "ภญ.กนกพร ชูริกาวิทย์ (ใหม่)", "ภญ.กนกกช บุศย์น้ำเพชร (พี่บีบ)", "ภญ.วราภรณ์ แสงวิเชียร (พี่ตุ๊ก)", "ภญ.ศุภานันท์ ปิงเจริญกิจกุล (โบว์)",
    "ภญ.อรรถยา เปล่งสงวน (พี่แจง)", "ภญ.รัตติยาพร แก้วสุ (แยม)", "ภญ.ศศิธร มามีชัย (พี่กุ้ง)", "ภญ.อาทิตยา วงศาโรจน์",
    "ภญ.ปนัดดา ชูเย็น (ดิว)", "ภญ.ปัญญภรณ์ ทรงสุนทรวงศ์", "ภญ.ดาริกา อนุรักษ์ชนะพล (กุ๊ก)", "ภญ.อัชฌา เหมะจันทร (พี่ปลา)",
    "ภก.เทพนรินทร์ ช่างประเสริฐ", "ภญ.พรทิพย์ วรนัยพินิจ", "ภญ.วรมน พิเชียรโสภณ (แพร)", "ภญ.อัจฉรา ภัทรสมสกุล (อุ๊)",
    "ภญ.สุชญา ประเสริฐปั้น(ใบหม่อน)", "ภก.สุทธิเกียรติ สำเภา (สุท)", "ภญ.จุติพร ร่วมใจ (จอย)", "ภญ.ชนม์นิภา กุมภคาม (ชนม์)",
    "ภก.ปัณณวิชญ์ เรืองพัฒนโกศล", "ภ.ญ.ธนภรณ์ ล้อมมหาดไทย (อุ้ม)", "ภ.ญ.นลินรัตน์ ลิ่วศรีวิไล (แพร)", "ภ.ญ.ชนิดาภา ตันตินิยงคกุล (มิว)",
    "ภญ.แพรพลอย ดรุณวัติ", "ภก.กันตพงศ์ วงศ์เอกเกษม (ซัน)", "ภญ.ลลิตา แย้มสุริโยทัย (แจง)", "ภญ.มัญชุพร ยมศิริ (หมิว)",
    "ภญ.ภัทรานิษฐ์ หวังมีสรี (น้ำ)", "ภก.ฐาปกรณ์ เบี้ยกระโทก (ปป)", "ภญ.ธารญา โกฉัยพัฒน์ (พัชชา)", "ภก.วันเฉลิม มีมูซอ (อาร์ม)",
    "ภก.วิศรุต สมบูรณ์วงศ์ (มาร์ค)", "ภญ.ธนัชพร ชัยวัฒนกุล(นัท)", "ภญ.พรนภา (พีบี)"
];

// ตัวแปร State ของระบบ
let state = {
    pharmacist: "",
    startTime: null,
    endTime: null,
    wardData: {} // { "MICU": "10:30", "ER med ชั้น 8": "11:15" }
};

// Elements
const elDate = document.getElementById('currentDate');
const elSelect = document.getElementById('pharmacistSelect');
const btnStart = document.getElementById('startShiftBtn');
const btnEnd = document.getElementById('endShiftBtn');
const btnDashboard = document.getElementById('toggleDashboardBtn');
const btnSync = document.getElementById('syncDataBtn');
const sectionSetup = document.getElementById('setupSection');
const sectionWork = document.getElementById('workSection');
const sectionDash = document.getElementById('dashboardSection');
const badge = document.getElementById('pharmacistBadge');
const badgeName = document.getElementById('badgeName');
const wardGrid = document.getElementById('wardGrid');

// 1. กำหนดวันที่ (Default เป็นวันนี้ ภาษาไทย)
function updateDateHeader() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', era: 'short' };
    const dateStr = new Date().toLocaleDateString('th-TH', options).replace('พ.ศ.', 'พ.ศ. ');
    elDate.innerText = dateStr;
}

// 2. โหลดรายชื่อเภสัช
function loadPharmacists() {
    pharmacists.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        elSelect.appendChild(option);
    });
}

// 3. จัดการ LocalStorage (Cache)
function saveState() {
    localStorage.setItem('shiftState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('shiftState');
    if (saved) {
        state = JSON.parse(saved);
        if (state.pharmacist && state.startTime && !state.endTime) {
            // กำลังทำงานอยู่
            renderWorkUI();
            updateDashboard();
        }
    }
}

// 4. สร้างการ์ด Ward
function renderWards() {
    wardGrid.innerHTML = "";
    wards.forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        if (state.wardData[ward]) {
            card.classList.add('completed');
        }

        const title = document.createElement('h3');
        title.innerText = ward;
        
        const timeStr = document.createElement('div');
        timeStr.className = 'time-stamp';
        timeStr.innerText = state.wardData[ward] ? `รับแล้ว: ${state.wardData[ward]}` : 'ยังไม่รับยา';

        card.appendChild(title);
        card.appendChild(timeStr);

        // Event กดติ๊กวอร์ด
        card.addEventListener('click', () => {
            if (!state.endTime) {
                if (!state.wardData[ward]) {
                    // บันทึกเวลา
                    const now = new Date();
                    const timeText = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    state.wardData[ward] = timeText;
                } else {
                    // ยกเลิกการติ๊ก
                    delete state.wardData[ward];
                }
                saveState();
                renderWards();
            }
        });
        wardGrid.appendChild(card);
    });
}

// 5. ควบคุม UI (สลับหน้า)
function renderWorkUI() {
    sectionSetup.classList.add('hidden');
    sectionWork.classList.remove('hidden');
    badge.classList.remove('hidden');
    badgeName.innerText = `ภก.เวร: ${state.pharmacist}`;
    renderWards();
}

function resetUI() {
    sectionSetup.classList.remove('hidden');
    sectionWork.classList.add('hidden');
    sectionDash.classList.add('hidden');
    badge.classList.add('hidden');
    elSelect.value = "";
    state = { pharmacist: "", startTime: null, endTime: null, wardData: {} };
    saveState();
}

// 6. อัปเดตข้อมูล Dashboard
function updateDashboard() {
    document.getElementById('dashPharmacist').innerText = state.pharmacist || "-";
    document.getElementById('dashStartTime').innerText = state.startTime ? new Date(state.startTime).toLocaleTimeString('th-TH') : "-";
    document.getElementById('dashEndTime').innerText = state.endTime ? new Date(state.endTime).toLocaleTimeString('th-TH') : "กำลังปฏิบัติงาน";
    
    if (state.startTime && state.endTime) {
        const diffMs = new Date(state.endTime) - new Date(state.startTime);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.round(((diffMs % 3600000) / 60000));
        document.getElementById('dashTotalTime').innerText = `${diffHrs} ชั่วโมง ${diffMins} นาที`;
    } else {
        document.getElementById('dashTotalTime').innerText = "-";
    }
}

// Events Listener
btnStart.addEventListener('click', () => {
    if (!elSelect.value) {
        alert("กรุณาเลือกชื่อเภสัชกรก่อนเริ่มงานครับ");
        return;
    }
    state.pharmacist = elSelect.value;
    state.startTime = new Date().toISOString();
    state.wardData = {};
    saveState();
    renderWorkUI();
    updateDashboard();
});

btnEnd.addEventListener('click', () => {
    if(confirm("ยืนยันการจบการทำงานเวรนี้?")) {
        state.endTime = new Date().toISOString();
        saveState();
        updateDashboard();
        sectionDash.classList.remove('hidden');
        document.getElementById('syncStatus').innerText = "โปรดบันทึกข้อมูลลง Google Sheets";
        document.getElementById('syncStatus').style.color = "red";
    }
});

btnDashboard.addEventListener('click', () => {
    sectionDash.classList.toggle('hidden');
    updateDashboard();
});

btnSync.addEventListener('click', async () => {
    if (GOOGLE_SHEET_WEB_APP_URL === "YOUR_WEB_APP_URL_HERE") {
        alert("กรุณาใส่ URL ของ Google Sheets Web App ในโค้ด script.js ก่อนครับ");
        return;
    }

    const syncStatus = document.getElementById('syncStatus');
    syncStatus.innerText = "กำลังส่งข้อมูล...";
    syncStatus.style.color = "blue";

    const payload = {
        date: new Date().toLocaleDateString('th-TH'),
        pharmacist: state.pharmacist,
        startTime: new Date(state.startTime).toLocaleTimeString('th-TH'),
        endTime: new Date(state.endTime).toLocaleTimeString('th-TH'),
        wardData: JSON.stringify(state.wardData)
    };

    try {
        const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // ใช้ no-cors เลี่ยงปัญหา CORS ของ GAS
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        syncStatus.innerText = "บันทึกข้อมูลเรียบร้อยแล้ว!";
        syncStatus.style.color = "green";
        setTimeout(resetUI, 2000); // รีเซ็ตหน้าจอเตรียมรับเวรต่อไป

    } catch (error) {
        syncStatus.innerText = "เกิดข้อผิดพลาดในการส่งข้อมูล";
        syncStatus.style.color = "red";
    }
});

// Initialize
updateDateHeader();
loadPharmacists();
loadState();
