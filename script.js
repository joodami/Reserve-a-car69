// =====================================================
// 1. จัดการการแสดงผลฟอร์ม (Smooth & Auto Scroll)
// =====================================================
const showFormBtn = document.getElementById("showFormBtn");
const formSection = document.getElementById("formSection");
const cancelBtn = document.getElementById("cancelBookingBtn");
const carForm = document.getElementById("carForm");

showFormBtn.addEventListener("click", () => {
    formSection.style.display = "block";
    showFormBtn.parentElement.style.display = "none"; // ซ่อนพื้นที่ปุ่มเดิม
    formSection.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
    carForm.reset();
    formSection.style.display = "none";
    showFormBtn.parentElement.style.display = "block";
    updatePassengerFields(); // รีเซ็ตช่องกรอกชื่อด้วย
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// =====================================================
// 2. จัดการผู้ร่วมเดินทาง (สร้างช่องกรอกตามจำนวนจริง)
// =====================================================
const passengerCountInput = document.querySelector('input[name="passengerCount"]');
const passengerInputsContainer = document.getElementById("passengerInputs");
const fileUploadSection = document.getElementById("fileUploadSection");

function updatePassengerFields() {
    let count = Number(passengerCountInput.value) || 0;
    passengerInputsContainer.innerHTML = ""; // ล้างช่องเก่าออกก่อน

    if (count > 0 && count <= 6) {
        // กรณี 1-6 คน: สร้างช่องกรอกชื่อตามจำนวนที่ระบุ
        for (let i = 1; i <= count; i++) {
            const input = document.createElement("input");
            input.type = "text";
            input.name = `passenger${i}`;
            input.placeholder = `ชื่อผู้ร่วมเดินทางคนที่ ${i}`;
            input.className = "form-control mb-2 rounded-3";
            input.required = true; // บังคับกรอกถ้ามีช่องขึ้นมา
            passengerInputsContainer.appendChild(input);
        }
        fileUploadSection.style.display = "none";
    } else if (count > 6) {
        // กรณี 7 คนขึ้นไป: ซ่อนช่องกรอก และให้แนบไฟล์แทน
        fileUploadSection.style.display = "block";
        const fileInput = fileUploadSection.querySelector('input[type="file"]');
        if (fileInput) fileInput.required = true;
    } else {
        // กรณี 0 คน
        fileUploadSection.style.display = "none";
    }
}

passengerCountInput.addEventListener("input", updatePassengerFields);
// เรียกใช้ทันทีเมื่อโหลดหน้าเว็บ เพื่อให้แน่ใจว่าค่าเริ่มต้น (0) ทำงานถูกต้อง
updatePassengerFields();

// =====================================================
// 3. ส่งฟอร์ม (ปรับปรุงการส่งข้อมูล)
// =====================================================
const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));
let isSubmitting = false;

carForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const count = Number(passengerCountInput.value);
    const fileInput = carForm.querySelector('[name="passengerFile"]');
    let passengerFileBlob = null;

    // ตรวจสอบไฟล์กรณี > 6 คน
    if (count > 6) {
        if (!fileInput.files || fileInput.files.length === 0) {
            alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง เนื่องจากมีจำนวนเกิน 6 คนค่ะ");
            isSubmitting = false;
            return;
        }
        passengerFileBlob = fileInput.files[0];
    }

    // แสดง Modal สถานะ
    document.getElementById('modalText').innerHTML = "⏳ กำลังเตรียมข้อมูล...";
    document.getElementById('loadingIcon').style.display = "block";
    document.getElementById('modalFooter').style.display = "none";
    submitModal.show();

    try {
        // ดึงข้อมูลจากฟอร์มทั้งหมด
        const formDataObj = Object.fromEntries(new FormData(carForm).entries());
        
        // แปลงไฟล์เป็น Base64 ถ้ามี
        if (passengerFileBlob) {
            document.getElementById('modalText').innerHTML = "📤 กำลังอัปโหลดไฟล์รายชื่อ...";
            formDataObj.passengerFile = await fileToBase64(passengerFileBlob);
            formDataObj.passengerFileName = passengerFileBlob.name;
        }

        document.getElementById('modalText').innerHTML = "📝 กำลังบันทึกข้อมูลและสร้าง PDF...";

        // ระบบ Timeout 60 วินาที
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const result = await sendToGAS(formDataObj, controller.signal);
        clearTimeout(timeout);

        // จัดการผลลัพธ์
        document.getElementById('loadingIcon').style.display = "none";
        document.getElementById('modalFooter').style.display = "block";

        if (result.status === "success") {
            document.getElementById('modalText').innerHTML = 
                `<div class="text-center">
                    <h4 class="text-success">✅ จองรถสำเร็จ!</h4>
                    <p>ระบบบันทึกข้อมูลเรียบร้อยแล้วค่ะ</p>
                    <a href="${result.result.pdfUrl}" target="_blank" class="btn btn-primary btn-sm mt-2">📄 คลิกเพื่อเปิดดูใบขอใช้รถ (PDF)</a>
                </div>`;
            
            // รีเซ็ตหน้าเว็บ
            carForm.reset();
            updatePassengerFields();
            setTimeout(() => {
                cancelBtn.click(); // ปิดฟอร์มกลับไปหน้าหลัก
            }, 1500);

        } else {
            const errorMsg = result.message || "เกิดข้อผิดพลาดที่ฝั่ง Server";
            document.getElementById('modalText').innerHTML = "⚠️ ไม่สำเร็จ:<br>" + errorMsg;
        }

    } catch (err) {
        document.getElementById('loadingIcon').style.display = "none";
        document.getElementById('modalFooter').style.display = "block";
        document.getElementById('modalText').innerHTML = (err.name === "AbortError") 
            ? "❌ ใช้เวลานานเกินไป (Timeout) กรุณาตรวจสอบใน Google Sheet อีกครั้งค่ะ" 
            : "❌ เชื่อมต่อไม่สำเร็จ: " + err.message;
    } finally {
        isSubmitting = false;
    }
});

// =====================================================
// 4. Helper Functions
// =====================================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function sendToGAS(data, signal) {
    // ⚠️ ตรวจสอบ URL นี้ให้ดีว่าคือลิงก์ 'Deploy' ล่าสุด
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
    
    // ส่งแบบ URLSearchParams เพื่อความเสถียรของ Google Apps Script
    const params = new URLSearchParams();
    params.append("data", JSON.stringify(data));

    const res = await fetch(GAS_URL, {
        method: "POST",
        body: params,
        signal: signal
    });

    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
}
