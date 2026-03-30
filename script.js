const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzgpd3F4STzP210MfJcsQRHwZnLRLjp82w3sD7Efu2mNnyZ6h8dVE96j8TLGcp6YoDfMg/exec"; // <--- ใส่ URL ของคุณตรงนี้

const wards = [ "MICU", "Med พิเศษเดี่ยวชั้น 14", "Med พิเศษรวมชั้น 12", "Med ส.ชาย ชั้น 11", "SEMI ชาย ชั้น 11", "SEMI หญิง ชั้น 10", "Stroke unit ชั้น 10", "อายุรกรรม หญิง ชั้น 10", "OBS ER", "ER med ชั้น 8", "AIIR" ];

const pharmacists = [ "ภญ.เสาวภา ศิริกาญจน์ (แอน)", "ภญ.อรรถยา เปล่งสงวน (พี่แจน)", "ภญ.กนกพร ชูริกาวิทย์ (ใหม่)", "ภญ.รัตติยาพร แก้วสุ (แยม)", "ภญ.สุชญา ประเสริฐปั้น(ใบหม่อน)", "ภญ.วรางค์รัตน์ สุวรรณชาตรี (ตา)", "ภญ.จิราพร คำแก้ว (โอ๋)", "ภญ.ชญานิน กำลัง (ไหม)", "ภก.วีรพัชร พานทอง (กระต๊อบ)", "ภก.ธนณัฏฐ์ แสงอังคนาวิน (แบงค์)", "ภญ.สุกัลยา ยิตนรดิน (พี่สุ)", "ภญ.กนกกช บุศย์น้ำเพชร (พี่บีบ)", "ภญ.วราภรณ์ แสงวิเชียร (พี่ตุ๊ก)", "ภญ.ศุภานันท์ ปิงเจริญกิจกุล (โบว์)", "ภญ.ศศิธร มามีชัย (พี่กุ้ง)", "ภญ.อาทิตยา วงศาโรจน์ (พี่เก๋)", "ภญ.ปนัดดา ชูเย็น (ดิว)", "ภญ.ปัญญภรณ์ ทรงสุนทรวงศ์", "ภญ.ดาริกา อนุรักษ์ชนะพล (กุ๊ก)", "ภญ.อัชฌา เหมะจันทร (พี่ปลา)", "ภก.เทพนรินทร์ ช่างประเสริฐ", "ภญ.พรทิพย์ วรนัยพินิจ", "ภญ.วรมน พิเชียรโสภณ (แพร)", "ภญ.อัจฉรา ภัทรสมสกุล (อุ๊)", "ภก.สุทธิเกียรติ สำเภา (สุท)", "ภญ.จุติพร ร่วมใจ (จอย)", "ภญ.ชนม์นิภา กุมภคาม (ชนม์)", "ภก.ปัณณวิชญ์ เรืองพัฒนโกศล (ตีโต้)", "ภญ.ธนภรณ์ ล้อมมหาดไทย (อุ้ม)", "ภญ.นลินรัตน์ ลิ่วศรีวิไล (แพร)", "ภญ.ชนิดาภา ตันตินิยงคกุล (มิว)", "ภญ.แพรพลอย ดรุณวัติ", "ภก.กันตพงศ์ วงศ์เอกเกษม (ซัน)", "ภญ.ลลิตา แย้มสุริโยทัย (แจน)", "ภญ.มัญชุพร ยมศิริ (หมิว)", "ภญ.ภัทรานิษฐ์ หวังมีสรี (น้ำ)", "ภก.ฐาปกรณ์ เบี้ยกระโทก (ปป)", "ภญ.ธารญา โกฉัยพัฒน์ (พัชชา)", "ภก.วันเฉลิม มีมูซอ (อาร์ม)", "ภก.วิศรุต สมบูรณ์วงศ์ (มาร์ค)", "ภญ.ธนัชพร ชัยวัฒนกุล(นัท)" ];

let state = { pharmacist: "", startTime: null, endTime: null, wardData: {} };
let dashboardRawData = []; 
let trendChartInstance = null;
let peakHourChartInstance = null;

const elDate = document.getElementById('currentDate');
const elSelect = document.getElementById('pharmacistSelect');
const dashSelectPhar = document.getElementById('dashFilterPharmacist');
const btnStart = document.getElementById('startShiftBtn');
const btnEnd = document.getElementById('endShiftBtn');
const wardGrid = document.getElementById('wardGrid');

function init() {
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', era: 'short' }).replace('พ.ศ.', 'พ.ศ. ');
    elDate.innerText = dateStr;
    pharmacists.forEach(name => { elSelect.add(new Option(name, name)); dashSelectPhar.add(new Option(name, name)); });

    const saved = localStorage.getItem('shiftState');
    if (saved) {
        state = JSON.parse(saved);
        if (state.pharmacist && state.startTime && !state.endTime) renderWorkUI();
    }
}

function saveState() { localStorage.setItem('shiftState', JSON.stringify(state)); }

function renderWards() {
    wardGrid.innerHTML = "";
    wards.forEach(ward => {
        const card = document.createElement('div');
        card.className = 'ward-card';
        if (state.wardData[ward]) card.classList.add('completed');

        const title = document.createElement('h3'); title.innerText = ward;
        const timeStr = document.createElement('div');
        timeStr.className = 'time-stamp';
        // ตัดวินาทีทิ้ง โชว์แค่ HH:mm
        let displayTime = state.wardData[ward] ? state.wardData[ward].match(/(\d+:\d+)/)?.[1] || "รับแล้ว" : "รอรับยา";
        timeStr.innerText = state.wardData[ward] ? `✔️ ${displayTime}` : 'รอรับยา';

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
    document.getElementById('badgeName').innerText = `ภก. ${state.pharmacist.split(' ')[0]}`;
    renderWards();
}

btnStart.addEventListener('click', () => {
    if (!elSelect.value) return alert("กรุณาเลือกชื่อเภสัชกรครับ");
    state.pharmacist = elSelect.value;
    state.startTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    state.endTime = null; 
    state.wardData = {};
    saveState(); renderWorkUI();
});

btnEnd.addEventListener('click', async () => {
    if(confirm("ยืนยันจบเวรและบันทึกข้อมูล?")) {
        state.endTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        saveState();
        
        const syncStatus = document.getElementById('syncStatus');
        syncStatus.innerText = "⏳ กำลังบันทึกข้อมูล...";

        const payload = {
            date: new Date().toLocaleDateString('th-TH'),
            pharmacist: state.pharmacist,
            startTime: state.startTime,
            endTime: state.endTime,
            wardData: JSON.stringify(state.wardData)
        };

        try {
            await fetch(GOOGLE_SHEET_WEB_APP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            syncStatus.innerText = "✅ บันทึกสำเร็จ!";
            setTimeout(() => { localStorage.removeItem('shiftState'); location.reload(); }, 2000);
        } catch (error) { syncStatus.innerText = "❌ บันทึกไม่สำเร็จ โปรดลองใหม่"; }
    }
});

/* ================= Dashboard Admin & Data Processing ================= */
['showLoginBtn', 'cancelLoginBtn', 'closeDashBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
        const isLogin = e.target.id === 'showLoginBtn';
        const isCancel = e.target.id === 'cancelLoginBtn';
        const isClose = e.target.id === 'closeDashBtn';
        
        if (isLogin) {
            document.getElementById('setupSection').classList.add('hidden');
            document.getElementById('loginSection').classList.remove('hidden');
        } else if (isCancel || isClose) {
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('setupSection').classList.remove('hidden');
        }
    });
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const pass = document.getElementById('adminPass').value;
    if(!pass) return alert("กรุณาใส่รหัสผ่าน");
    const loginStatus = document.getElementById('loginStatus');
    loginStatus.innerText = "⏳ กำลังดึงข้อมูล..."; loginStatus.style.color = "white";
    
    try {
        const response = await fetch(`${GOOGLE_SHEET_WEB_APP_URL}?action=login&pass=${encodeURIComponent(pass)}`);
        const result = await response.json();
        if(result.status === "success") {
            dashboardRawData = result.data;
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('adminPass').value = '';
            calculateDashboardStats();
        } else { loginStatus.innerText = "❌ รหัสผ่านไม่ถูกต้อง"; }
    } catch(err) { loginStatus.innerText = "❌ เชื่อมต่อล้มเหลว"; }
});

document.getElementById('dashFilterTime').addEventListener('change', calculateDashboardStats);
document.getElementById('dashFilterPharmacist').addEventListener('change', calculateDashboardStats);

// Helper: คำนวณนาทีจาก "HH:mm" (กันข้ามคืน และ ดัก Error)
function getDurationMins(startStr, endStr) {
    if(!startStr || !endStr || startStr === '-' || endStr === '-') return 0;
    try {
        let sMatch = startStr.toString().match(/(\d+):(\d+)/);
        let eMatch = endStr.toString().match(/(\d+):(\d+)/);
        if(!sMatch || !eMatch) return 0;
        let diff = (parseInt(eMatch[1], 10)*60 + parseInt(eMatch[2], 10)) - (parseInt(sMatch[1], 10)*60 + parseInt(sMatch[2], 10));
        if (diff < 0) diff += 24 * 60; // ข้ามเที่ยงคืน
        return diff;
    } catch(e) { return 0; }
}

// ตั้งค่าฟอนต์และสีกราฟ Chart.js 
Chart.defaults.color = '#064e3b';
Chart.defaults.font.family = "'Kanit', sans-serif";

function renderCharts(trendData, peakData) {
    if(trendChartInstance) trendChartInstance.destroy();
    if(peakHourChartInstance) peakHourChartInstance.destroy();

    const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
    if(ctxTrend) {
        trendChartInstance = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'เวลาเฉลี่ย (นาที)',
                    data: trendData.values,
                    borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2, fill: true, tension: 0.3
                }]
            },
            options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }

    const ctxPeak = document.getElementById('peakHourChart')?.getContext('2d');
    if(ctxPeak) {
        peakHourChartInstance = new Chart(ctxPeak, {
            type: 'bar',
            data: {
                labels: peakData.labels, // ชั่วโมง
                datasets: [{
                    label: 'จำนวนครั้งที่มารับยา',
                    data: peakData.values,
                    backgroundColor: 'rgba(5, 117, 230, 0.6)',
                    borderRadius: 5
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }
}

function calculateDashboardStats() {
    const daysLimit = parseInt(document.getElementById('dashFilterTime').value);
    const pharFilter = document.getElementById('dashFilterPharmacist').value;
    let filteredData = dashboardRawData.slice(1); // ข้าม Header
    const now = new Date();
    
    // 1. กรองข้อมูล
    filteredData = filteredData.filter(row => {
        if(!row[0]) return false;
        if(pharFilter !== 'all' && row[1] !== pharFilter) return false;
        const dateParts = row[0].toString().split('/'); 
        if(dateParts.length === 3) {
            let rowDate = new Date(dateParts[2]-543, dateParts[1]-1, dateParts[0]);
            if((now - rowDate) / (1000 * 60 * 60 * 24) > daysLimit) return false;
        }
        return true;
    });

    // 2. คำนวณภาพรวม (KPI)
    let totalShiftMins = 0;
    let pharStats = {}; // สำหรับ Leaderboard
    let wardStats = {}; // สำหรับเวลาวอร์ด
    wards.forEach(w => wardStats[w] = { totalMins: 0, count: 0 });
    
    let trendMap = {}; // สำหรับกราฟเส้น
    let peakHours = Array(24).fill(0); // สำหรับกราฟแท่ง (0-23 น.)
    let historyHTML = '';

    filteredData.forEach(row => {
        let dateStr = row[0]; let phar = row[1]; let start = row[2]; let end = row[3]; let wJson = row[4];
        
        let shiftMins = getDurationMins(start, end);
        totalShiftMins += shiftMins;

        if(!pharStats[phar]) pharStats[phar] = { shifts: 0, totalMins: 0 };
        pharStats[phar].shifts += 1;
        pharStats[phar].totalMins += shiftMins;

        if(pharFilter !== 'all') {
            historyHTML = `<div class="history-item"><span>📅 ${dateStr}</span><span style="color:#059669;">⏱️ ${start.toString().match(/(\d+:\d+)/)?.[1] || ''} - ${end.toString().match(/(\d+:\d+)/)?.[1] || ''}</span></div>` + historyHTML;
        }

        if(start && wJson) {
            try {
                const wardData = JSON.parse(wJson);
                let sMatch = start.toString().match(/(\d+):(\d+)/);
                if(sMatch) {
                    let startMinsRaw = parseInt(sMatch[1],10) * 60 + parseInt(sMatch[2],10);
                    let dailyTotalWardMins = 0; let wardCountInShift = 0;

                    for(let w in wardData) {
                        let wMatch = wardData[w].toString().match(/(\d+):(\d+)/);
                        if(wMatch) {
                            let wh = parseInt(wMatch[1],10);
                            let wm = parseInt(wMatch[2],10);
                            
                            peakHours[wh] += 1; // เก็บชั่วโมงที่มารับยา

                            let wardMinsRaw = wh * 60 + wm;
                            if (wardMinsRaw < startMinsRaw) wardMinsRaw += (24 * 60);
                            let duration = wardMinsRaw - startMinsRaw;

                            if(wardStats[w]) { wardStats[w].totalMins += duration; wardStats[w].count += 1; }
                            dailyTotalWardMins += duration; wardCountInShift += 1;
                        }
                    }
                    
                    if(wardCountInShift > 0) {
                        let shortDate = dateStr.split('/').slice(0,2).join('/');
                        if(!trendMap[shortDate]) trendMap[shortDate] = { total: 0, count: 0 };
                        trendMap[shortDate].total += dailyTotalWardMins / wardCountInShift;
                        trendMap[shortDate].count += 1;
                    }
                }
            } catch(e) {}
        }
    });

    // อัปเดตข้อมูลภาพรวม
    document.getElementById('statTotalShifts').innerText = filteredData.length;
    let avgTotal = filteredData.length > 0 ? Math.round(totalShiftMins / filteredData.length) : 0;
    document.getElementById('statAvgDuration').innerText = `${Math.floor(avgTotal/60)} ชม. ${avgTotal%60} นาที`;

    const isAll = (pharFilter === 'all');
    // ซ่อน/แสดง UI ตาม Filter
    ['chartsSection', 'wardStatsSection', 'pharmacistLeaderboard'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).style.display = isAll ? 'block' : 'none';
    });
    if(document.getElementById('personalHistorySection')) {
        document.getElementById('personalHistorySection').style.display = !isAll ? 'block' : 'none';
    }

    if(!isAll) {
        document.getElementById('shiftHistoryList').innerHTML = historyHTML || '<p class="text-center">ไม่มีข้อมูล</p>';
        return; 
    }

    // วาดกราฟ
    let tLabels = Object.keys(trendMap).slice(-14); 
    let tValues = tLabels.map(d => Math.round(trendMap[d].total / trendMap[d].count));
    
    let pLabels = []; let pValues = [];
    peakHours.forEach((count, hr) => {
        if(count > 0) { pLabels.push(`${hr}:00`); pValues.push(count); }
    });

    renderCharts({labels: tLabels, values: tValues}, {labels: pLabels, values: pValues});

    // จัดอันดับ Ward (Top 5)
    let ranking = [];
    for(let w in wardStats) {
        if(wardStats[w].count > 0) ranking.push({ ward: w, avgMins: Math.round(wardStats[w].totalMins / wardStats[w].count) });
    }
    ranking.sort((a, b) => a.avgMins - b.avgMins);
    
    if(document.getElementById('fastestWardsList')) {
        document.getElementById('fastestWardsList').innerHTML = ranking.slice(0, 5).map(r => `<li><strong>${r.ward}</strong> <span style="color:#059669;">(${r.avgMins} นาที)</span></li>`).join('');
    }
    if(document.getElementById('slowestWardsList')) {
        document.getElementById('slowestWardsList').innerHTML = ranking.slice(-5).reverse().map(r => `<li><strong>${r.ward}</strong> <span style="color:#dc2626;">(${r.avgMins} นาที)</span></li>`).join('');
    }

    // จัดอันดับ เภสัชกร (Leaderboard)
    let pharRanking = [];
    for(let p in pharStats) {
        let avgM = Math.round(pharStats[p].totalMins / pharStats[p].shifts);
        pharRanking.push({ name: p.split(' ')[0], shifts: pharStats[p].shifts, avgStr: `${Math.floor(avgM/60)}ช. ${avgM%60}น.` });
    }
    pharRanking.sort((a, b) => b.shifts - a.shifts); // เรียงตามจำนวนเวรที่เข้า

    if(document.getElementById('leaderboardList')) {
        document.getElementById('leaderboardList').innerHTML = pharRanking.map((p, index) => `
            <li class="leaderboard-item">
                <div><span class="rank-badge">${index+1}</span> <strong>${p.name}</strong></div>
                <div class="leaderboard-stats">${p.shifts} เวร <br><small>(เฉลี่ย ${p.avgStr})</small></div>
            </li>
        `).join('');
    }
}

init();
