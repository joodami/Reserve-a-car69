document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const fileInput = carForm.querySelector('[name="passengerFile"]');
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // --- 1. จัดการ Dynamic Fields & File Section ---
    passengerCountInput.addEventListener("input", function() {
        const count = Number(this.value) || 0;
        passengerInputsContainer.innerHTML = ""; 
        
        // ถ้า 1-6 คน ให้กรอกชื่อรายคน
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
            fileInput.required = false; // ไม่ต้องแนบไฟล์
        } 
        // ถ้า 7 คนขึ้นไป ให้แนบไฟล์
        else if (count >= 7) {
            fileUploadSection.style.display = "block";
            fileInput.required = true; // บังคับแนบไฟล์
        } else {
            fileUploadSection.style.display = "none";
            fileInput.required = false;
        }
    });

    // --- 2. ฟังก์ชันหลักในการส่งข้อมูล ---
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const modalText = document.getElementById('modalText');
        const modalFooter = document.getElementById('modalFooter');
        const loadingIcon = document.getElementById('loadingIcon');

        // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
        if (fileInput.files.length > 0) {
            const fileSize = fileInput.files[0].size / 1024 / 1024; // MB
            if (fileSize > 5) {
                alert("❌ ขนาดไฟล์ใหญ่เกินไป! กรุณาแนบไฟล์ PDF ที่มีขนาดไม่เกิน 5MB ค่ะ");
                return;
            }
        }

        modalText.innerHTML = "⏳ <b>กำลังดำเนินการ...</b><br>ระบบกำลังบันทึกข้อมูลและสร้างไฟล์ PDF<br><small class='text-muted'>กรุณารอประมาณ 10-15 วินาทีนะคะ</small>";
        loadingIcon.style.display = "block";
        modalFooter.style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // ส่งไฟล์เฉพาะกรณีมีคน > 6 คน และมีการเลือกไฟล์
            if (formDataObj.passengerCount >= 7 && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            } else {
                delete formDataObj.passengerFile; // ลบออกเพื่อให้ JSON ไม่หนัก
            }

            // *** อัปเดต URL ของคุณตรงนี้ ***
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwlDYshdlJdNS_xwtKGs90EZ51N8wZsPRzoeOzi_YgdLAgRm-QIxlJX3wUnw-Danxr1/exec";
            
            const response = await fetch(GAS_URL, {
                method: "POST",
                mode: "cors", 
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(formDataObj)
            });

            const resData = await response.json();

            if (resData.status === "success" && resData.result && resData.result.pdfUrl) {
                loadingIcon.style.display = "none";
                modalFooter.style.display = "block";
                modalText.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        <h4 class="text-success fw-bold mt-3">จองรถสำเร็จเรียบร้อย!</h4>
                        <div class="d-grid gap-2 mt-4">
                            <a href="${resData.result.pdfUrl}" target="_blank" class="btn btn-primary btn-lg rounded-pill shadow">
                                <i class="bi bi-file-earmark-pdf-fill me-2"></i> เปิดดูไฟล์ PDF คำขอ
                            </a>
                        </div>
                    </div>`;
                carForm.reset();
                passengerInputsContainer.innerHTML = "";
            } else {
                throw new Error(resData.message || "ประมวลผลไม่สำเร็จ");
            }

        } catch (err) {
            loadingIcon.style.display = "none";
            modalFooter.style.display = "block";
            modalText.innerHTML = `<div class="text-center text-danger"><h5 class="fw-bold">เกิดข้อผิดพลาด</h5><p>${err.message}</p></div>`;
        }
    });

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // --- 3. UI Control ---
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
