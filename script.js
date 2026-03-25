// =====================================================
// 1. จัดการการแสดงผลฟอร์ม (คงเดิมแต่ปรับ Smooth)
// =====================================================
const showFormBtn = document.getElementById("showFormBtn");
const formSection = document.getElementById("formSection");
const cancelBtn = document.getElementById("cancelBookingBtn");

showFormBtn.addEventListener("click", () => {
    formSection.style.display = "block";
    showFormBtn.style.display = "none";
    formSection.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
    document.getElementById("carForm").reset();
    formSection.style.display = "none";
    showFormBtn.style.display = "inline-block";
    updatePassengerFields();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// =====================================================
// 2. จัดการผู้ร่วมเดินทาง (คงเดิม)
// =====================================================
const passengerCount = document.querySelector('input[name="passengerCount"]');
const passengerInputs = document.querySelectorAll('#passengerInputs input');
const fileUploadSection = document.getElementById("fileUploadSection");

function updatePassengerFields() {
    let count = Number(passengerCount.value);
    passengerInputs.forEach((input, index) => {
        if (count === 0) input.style.display = "none";
        else if (count <= 6) {
            input.style.display = (index < count) ? "block" : "none";
        } else input.style.display = "none";
    });
    fileUploadSection.style.display = count > 6 ? "block" : "none";
}

passengerCount.addEventListener("input", updatePassengerFields);
updatePassengerFields();

// =====================================================
// 3. ส่งฟอร์ม (ปรับปรุงลำดับการทำงานและข้อความ)
// =====================================================
const form = document.getElementById('carForm');
const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));
let isSubmitting = false;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    // ตรวจสอบข้อมูลเบื้องต้น
    const count = Number(form.querySelector('input[name="passengerCount"]').value);
    const fileInput = form.querySelector('[name="passengerFile"]');
    let passengerFileBlob = null;

    if (count > 6) {
        if (fileInput.files.length === 0) {
            alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง");
            isSubmitting = false; return;
        }
        passengerFileBlob = fileInput.files[0];
    }

    // แสดง Modal สถานะ
    document.getElementById('modalText').innerHTML = "⏳ กำลังเตรียมข้อมูลและอัปโหลดไฟล์...";
    document.getElementById('loadingIcon').style.display = "block";
    document.getElementById('modalFooter').style.display = "none";
    submitModal.show();

    try {
        const formData = Object.fromEntries(new FormData(form).entries());
        
        // แปลงไฟล์เป็น Base64 ถ้ามี
        if (passengerFileBlob) {
            document.getElementById('modalText').innerHTML = "📤 กำลังอัปโหลดไฟล์รายชื่อ...";
            formData.passengerFile = await fileToBase64(passengerFileBlob);
            formData.passengerFileName = passengerFileBlob.name;
        }

        document.getElementById('modalText').innerHTML = "📝 กำลังสร้างเอกสาร PDF และแจ้งเตือน LINE...";

        // สร้างระบบ Timeout 60 วินาที
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const result = await sendToGAS(formData, controller.signal);
        clearTimeout(timeout);

        // จัดการผลลัพธ์
        document.getElementById('loadingIcon').style.display = "none";
        document.getElementById('modalFooter').style.display = "block";

        if (result.status === "success") {
            document.getElementById('modalText').innerHTML = 
                `<div class="text-center">
                    <h4 class="text-success">✅ สำเร็จ!</h4>
                    <p>ระบบบันทึกข้อมูลและส่ง LINE เรียบร้อยแล้วค่ะ</p>
                    <a href="${result.result.pdfUrl}" target="_blank" class="btn btn-outline-primary btn-sm">📄 เปิดดูใบขอใช้รถ (PDF)</a>
                </div>`;
            
            // เคลียร์ฟอร์ม
            form.reset();
            updatePassengerFields();
            formSection.style.display = "none";
            showFormBtn.style.display = "inline-block";

        } else {
            const errorMsg = (result.result && result.result.errors) ? result.result.errors.join("<br>") : (result.message || "ไม่ทราบสาเหตุ");
            document.getElementById('modalText').innerHTML = "⚠️ พบปัญหาบางประการ:<br>" + errorMsg;
        }

    } catch (err) {
        document.getElementById('loadingIcon').style.display = "none";
        document.getElementById('modalFooter').style.display = "block";
        document.getElementById('modalText').innerHTML = (err.name === "AbortError") 
            ? "❌ ระบบใช้เวลานานเกินไป กรุณาเช็กใน Google Sheet หรือ LINE" 
            : "❌ เชื่อมต่อสคริปต์ไม่สำเร็จ: " + err.message;
    } finally {
        isSubmitting = false;
    }
});

// =====================================================
// 4. Helper Functions (คงเดิม)
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
    // ⚠️ อย่าลืมเปลี่ยน URL ตรงนี้ให้เป็นตัวล่าสุดที่คุณ Deploy นะคะ
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
    
    const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(JSON.stringify(data)),
        signal: signal
    });

    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
}
