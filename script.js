document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // --- 1. จัดการ Dynamic Fields (ชื่อผู้ร่วมเดินทาง) ---
    passengerCountInput.addEventListener("input", function() {
        const count = Number(this.value) || 0;
        passengerInputsContainer.innerHTML = ""; 
        if (count > 0 && count <= 6) {
            for (let i = 1; i <= count; i++) {
                const input = document.createElement("input");
                input.type = "text";
                input.name = `passenger${i}`;
                input.placeholder = `ชื่อผู้ร่วมเดินทางคนที่ ${i}`;
                input.className = "form-control mb-2 rounded-3 shadow-sm";
                input.required = true;
                passengerInputsContainer.appendChild(input);
            }
            fileUploadSection.style.display = "none";
        } else {
            fileUploadSection.style.display = count > 6 ? "block" : "none";
        }
    });

    // --- 2. ฟังก์ชันหลักในการส่งข้อมูล ---
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const modalText = document.getElementById('modalText');
        const modalFooter = document.getElementById('modalFooter');
        const loadingIcon = document.getElementById('loadingIcon');

        // แสดงสถานะเริ่มต้นใน Modal
        modalText.innerHTML = "⏳ <b>กำลังดำเนินการ...</b><br>ระบบกำลังบันทึกข้อมูลและสร้างไฟล์ PDF<br><small class='text-muted'>กรุณารอประมาณ 10-15 วินาที อย่าเพิ่งปิดหน้านี้นะคะ</small>";
        loadingIcon.style.display = "block";
        modalFooter.style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // จัดการไฟล์แนบ (ถ้ามี)
            const fileInput = carForm.querySelector('[name="passengerFile"]');
            if (fileInput && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            // URL ของ Web App (ตรวจสอบให้แน่ใจว่าเป็น Deployment ล่าสุด)
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            // ส่งข้อมูลด้วยเทคนิค Bypass CORS
            const response = await fetch(GAS_URL, {
                method: "POST",
                mode: "cors", 
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(formDataObj)
            });

            const resData = await response.json();

            // ตรวจสอบสถานะการตอบกลับ
            if (resData.status === "success" && resData.result && resData.result.pdfUrl) {
                loadingIcon.style.display = "none";
                modalFooter.style.display = "block";
                modalText.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        <h4 class="text-success fw-bold mt-3">จองรถสำเร็จเรียบร้อย!</h4>
                        <p class="text-muted">บันทึกข้อมูลและส่งแจ้งเตือน LINE แล้วค่ะ</p>
                        
                        <div class="d-grid gap-2 mt-4">
                            <a href="${resData.result.pdfUrl}" target="_blank" class="btn btn-primary btn-lg rounded-pill shadow">
                                <i class="bi bi-file-earmark-pdf-fill me-2"></i> เปิดดูไฟล์ PDF คำขอ
                            </a>
                        </div>
                    </div>
                `;
                // ล้างค่าฟอร์มหลังสำเร็จ
                carForm.reset();
                passengerInputsContainer.innerHTML = "";
            } else {
                const errorMsg = resData.message || resData.result?.error || "ประมวลผลไม่สำเร็จ";
                throw new Error(errorMsg);
            }

        } catch (err) {
            console.error("Submission Error:", err);
            loadingIcon.style.display = "none";
            modalFooter.style.display = "block";
            modalText.innerHTML = `
                <div class="text-center text-danger">
                    <i class="bi bi-exclamation-octagon-fill" style="font-size: 3.5rem;"></i>
                    <h5 class="mt-3 fw-bold">เกิดข้อผิดพลาดในการส่งข้อมูล</h5>
                    <p class="small text-muted">${err.message}</p>
                    <p class="small">โปรดตรวจสอบ URL ของ Web App หรือลองใหม่อีกครั้งค่ะ</p>
                </div>
            `;
        }
    });

    // ฟังก์ชันช่วยแปลงไฟล์เป็น Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // --- 3. จัดการ UI ปุ่มเปิด-ปิดฟอร์ม ---
    document.getElementById("showFormBtn").onclick = () => {
        document.getElementById("formSection").style.display = "block";
        document.getElementById("showFormBtn").parentElement.style.display = "none";
        document.getElementById("formSection").scrollIntoView({ behavior: 'smooth' });
    };
    
    document.getElementById("cancelBookingBtn").onclick = () => {
        carForm.reset();
        document.getElementById("formSection").style.display = "none";
        document.getElementById("showFormBtn").parentElement.style.display = "block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});
