// URL ของ Google Apps Script Web App อันใหม่ของคุณ
const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgpd3F4STzP210MfJcsQRHwZnLRLjp82w3sD7Efu2mNnyZ6h8dVE96j8TLGcp6YoDfMg/exec"; // ถ้าแก้ Code.gs แล้ว Deploy ใหม่ ต้องอัปเดต URL นี้ด้วยนะครับ

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

let state = { pharmacist: "", startTime: null, endTime: null, wardData: {} };
let dashboardRawData = []; // เก็บข้อมูลประวัติ

// Elements
const elDate = document.getElementById('currentDate');
const elSelect = document.getElementById('pharmacistSelect');
const btnStart = document.getElementById('startShiftBtn');
const btnEnd = document.getElementById('endShiftBtn');
const wardGrid = document.getElementById('wardGrid');

function updateDateHeader() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', era: 'short' };
    elDate.innerText = new Date().toLocaleDateString('th-TH', options).replace('พ.ศ.', 'พ.ศ. ');
}

function loadPharmacists() {
    pharmacists.forEach(name => {
        const option = document.createElement('option');
        option.value = name; option.innerText = name;
        elSelect.appendChild(option);
    });
}

function saveState() { localStorage.setItem('shiftState', JSON.stringify(state)); }
function loadState() {
    const saved = localStorage.getItem('shiftState');
    if (saved) {
        state = JSON.parse(saved);
        if (state.pharmacist && state.startTime && !state.endTime) { renderWorkUI(); }
    }
}

function renderWards() {
    wardGrid.innerHTML = "";
    wards.forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        if (state.wardData[ward]) card.classList.add('completed');

        const title = document.createElement('h3'); title.innerText = ward;
        const timeStr = document.createElement('div');
        timeStr.className = 'time-stamp';
        // *** จุดที่แก้ไข: ไม่โชว์เวลาแล้ว โชว์แค่สถานะ ***
        timeStr.innerText = state.wardData[ward] ? `✔️ รับยาเรียบร้อย` : 'ยังไม่รับยา';

        card.appendChild(title); card.appendChild(timeStr);

        card.addEventListener('click', () => {
            if (!state.endTime) {
                if (!state.wardData[ward]) {
                    state.wardData[ward] = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                } else {
                    delete state.wardData[ward];
                }
                saveState(); renderWards();
            }
        });
        wardGrid.appendChild(card);
    });
}

function renderWorkUI() {
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('workSection').classList.remove('hidden');
    document.getElementById('pharmacistBadge').classList.remove('hidden');
    document.getElementById('badgeName').innerText = `ภก.เวร: ${state.pharmacist}`;
    renderWards();
}

btnStart.addEventListener('click', () => {
    if (!elSelect.value) return alert("กรุณาเลือกชื่อเภสัชกรก่อนเริ่มงานครับ");
    state.pharmacist = elSelect.value;
    state.startTime = new Date().toISOString();
    state.endTime = null; // Fix บัคเวลาเก่า
    state.wardData = {};
    saveState(); renderWorkUI();
});

btnEnd.addEventListener('click', async () => {
    if(confirm("ยืนยันการจบการทำงานและบันทึกข้อมูล?")) {
        state.endTime = new Date().toISOString();
        saveState();
        
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerText = "⏳ กำลังบันทึกข้อมูลลงระบบ...";
        syncStatus.style.color = "blue";

        const payload = {
            date: new Date().toLocaleDateString('th-TH'),
            pharmacist: state.pharmacist,
            startTime: new Date(state.startTime).toLocaleTimeString('th-TH'),
            endTime: new Date(state.endTime).toLocaleTimeString('th-TH'),
            wardData: JSON.stringify(state.wardData)
        };

        try {
            await fetch(GOOGLE_SHEET_WEB_APP_URL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            syncStatus.innerText = "✅ บันทึกข้อมูลสำเร็จ! กำลังรีเซ็ต...";
            syncStatus.style.color = "green";
            
            setTimeout(() => {
                localStorage.removeItem('shiftState'); // Fix บัคแคช
                location.reload(); // รีเฟรชหน้าเตรียมรับเวรใหม่
            }, 2000);
        } catch (error) {
            syncStatus.innerText = "❌ บันทึกไม่สำเร็จ โปรดลองใหม่";
            syncStatus.style.color = "red";
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
    loginStatus.style.color = "blue";

    try {
        // ดึงข้อมูลแบบ GET พร้อมแนบรหัสผ่าน
        const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?action=login&pass=${encodeURIComponent(pass)}`);
        const result = await response.json();

        if(result.status === "success") {
            dashboardRawData = result.data; // เก็บประวัติทั้งหมด
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('adminPass').value = '';
            
            // อัปเดตข้อมูลเวรปัจจุบัน
            document.getElementById('dashPharmacist').innerText = state.pharmacist || "-";
            document.getElementById('dashStartTime').innerText = state.startTime ? new Date(state.startTime).toLocaleTimeString('th-TH') : "-";
            document.getElementById('dashEndTime').innerText = state.endTime ? new Date(state.endTime).toLocaleTimeString('th-TH') : (state.startTime ? "กำลังปฏิบัติงาน" : "-");

            calculateDashboardStats(); // คำนวณอันดับ
        } else {
            loginStatus.innerText = "❌ " + result.message;
            loginStatus.style.color = "red";
        }
    } catch(err) {
        loginStatus.innerText = "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ";
        loginStatus.style.color = "red";
    }
});

// ดัก Event เปลี่ยน Filter
document.getElementById('filterTime').addEventListener('change', calculateDashboardStats);
document.getElementById('filterDay').addEventListener('change', calculateDashboardStats);

// ฟังก์ชันคำนวณและจัดอันดับ
function calculateDashboardStats() {
    const timeFilter = document.getElementById('filterTime').value;
    const dayFilter = document.getElementById('filterDay').value;
    
    // ข้ามแถวแรก (Header)
    let filteredData = dashboardRawData.slice(1);
    
    // 1. กรองตามเวลา (30 วัน, 1 ปี) และ วันหยุด/ธรรมดา
    const now = new Date();
    filteredData = filteredData.filter(row => {
        if(!row[0]) return false;
        
        // แยกส่วนวันที่ภาษาไทย (รูปแบบที่ถูกเซฟคือ ว/ด/ป เช่น 30/3/2569)
        // หมายเหตุ: โค้ดนี้ประเมินวันที่คร่าวๆ จากข้อมูลที่บันทึก
        // สร้างระบบ Date เพื่อเช็ควันหยุด
        const dateParts = row[0].split('/'); 
        let rowDate = new Date();
        if(dateParts.length === 3) {
            // แปลง พ.ศ. เป็น ค.ศ. (ลบ 543)
            rowDate = new Date(dateParts[2]-543, dateParts[1]-1, dateParts[0]);
        }
        
        // กรองระยะเวลา
        const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
        if(timeFilter === "30days" && diffDays > 30) return false;
        if(timeFilter === "1year" && diffDays > 365) return false;

        // กรองวันหยุด
        const dayOfWeek = rowDate.getDay(); // 0=Sun, 6=Sat
        if(dayFilter === "weekend" && (dayOfWeek !== 0 && dayOfWeek !== 6)) return false;
        if(dayFilter === "weekday" && (dayOfWeek === 0 || dayOfWeek === 6)) return false;

        return true;
    });

    document.getElementById('statTotalShifts').innerText = filteredData.length;

    // 2. คำนวณหาว่าวอร์ดไหนมารับไว/ช้า (วัดจาก ระยะเวลาตั้งแต่เริ่มเวร จนถึงเวลารับยา)
    let wardStats = {};
    wards.forEach(w => wardStats[w] = { totalMins: 0, count: 0 });

    filteredData.forEach(row => {
        const startTimeStr = row[2]; // เวลาเริ่ม เช่น "20:00:00"
        const wardJsonStr = row[4]; // JSON string
        if(startTimeStr && wardJsonStr) {
            try {
                const wardData = JSON.parse(wardJsonStr);
                // ดึงชั่วโมงและนาที ของเวลาเริ่ม
                let [startH, startM] = startTimeStr.split(':');
                let startMinutes = (parseInt(startH) * 60) + parseInt(startM);

                for(let ward in wardData) {
                    if(wardStats[ward]) {
                        let [wH, wM] = wardData[ward].split(':');
                        let wardMinutes = (parseInt(wH) * 60) + parseInt(wM);
                        
                        // ป้องกันกรณีข้ามคืน (เช่น เริ่ม 22:00 รับยา 02:00)
                        if (wardMinutes < startMinutes) wardMinutes += (24 * 60);
                        
                        wardStats[ward].totalMins += (wardMinutes - startMinutes);
                        wardStats[ward].count += 1;
                    }
                }
            } catch(e) {}
        }
    });

    // 3. จัดอันดับ
    let ranking = [];
    for(let w in wardStats) {
        if(wardStats[w].count > 0) {
            let avg = wardStats[w].totalMins / wardStats[w].count;
            ranking.push({ ward: w, avgMins: Math.round(avg) });
        }
    }
    
    // เรียงจากน้อยไปมาก (รับยาไวสุด -> ช้าสุด)
    ranking.sort((a, b) => a.avgMins - b.avgMins);

    // แสดงผล
    const fastList = document.getElementById('fastestWardsList');
    const slowList = document.getElementById('slowestWardsList');
    fastList.innerHTML = ''; slowList.innerHTML = '';

    if(ranking.length === 0) {
        fastList.innerHTML = '<li>ไม่มีข้อมูลในระบบ</li>';
        slowList.innerHTML = '<li>ไม่มีข้อมูลในระบบ</li>';
    } else {
        // ไวสุด 3 อันดับ
        ranking.slice(0, 3).forEach(r => {
            fastList.innerHTML += `<li><strong>${r.ward}</strong> (เฉลี่ย ${r.avgMins} นาทีหลังเริ่มเวร)</li>`;
        });
        // ช้าสุด 3 อันดับ (เรียงกลับด้าน)
        ranking.slice(-3).reverse().forEach(r => {
            slowList.innerHTML += `<li><strong>${r.ward}</strong> (เฉลี่ย ${r.avgMins} นาทีหลังเริ่มเวร)</li>`;
        });
    }
}

updateDateHeader(); loadPharmacists(); loadState();
