document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // จัดการช่องผู้ร่วมเดินทาง
    passengerCountInput.addEventListener("input", function() {
        const count = Number(this.value) || 0;
        passengerInputsContainer.innerHTML = ""; 
        if (count > 0 && count <= 6) {
            for (let i = 1; i <= count; i++) {
                const input = document.createElement("input");
                input.type = "text";
                input.name = `passenger${i}`;
                input.placeholder = `ชื่อผู้ร่วมเดินทางคนที่ ${i}`;
                input.className = "form-control mb-2 rounded-3";
                input.required = true;
                passengerInputsContainer.appendChild(input);
            }
            fileUploadSection.style.display = "none";
        } else {
            fileUploadSection.style.display = count > 6 ? "block" : "none";
        }
    });

    // ส่งฟอร์ม
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const modalText = document.getElementById('modalText');
        const modalFooter = document.getElementById('modalFooter');
        const loadingIcon = document.getElementById('loadingIcon');

        modalText.innerHTML = "⏳ กำลังดำเนินการ... <br>กรุณารอสักครู่ ระบบกำลังสร้างไฟล์ PDF และบันทึกข้อมูลค่ะ";
        loadingIcon.style.display = "block";
        modalFooter.style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            const fileInput = carForm.querySelector('[name="passengerFile"]');
            if (fileInput && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            // ส่งแบบรับข้อมูลกลับ (ไม่ใช้ no-cors เพื่อให้ได้ URL)
            const response = await fetch(GAS_URL, {
                method: "POST",
                body: new URLSearchParams({ "data": JSON.stringify(formDataObj) })
            });

            const resData = await response.json();

            if (resData.status === "success" && resData.result.isComplete) {
                loadingIcon.style.display = "none";
                modalFooter.style.display = "block";
                modalText.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                        <h4 class="text-success fw-bold mt-2">จองรถเรียบร้อยแล้วค่ะ</h4>
                        <p class="text-muted">ระบบบันทึกข้อมูลและส่งแจ้งเตือนเรียบร้อยแล้ว</p>
                        <a href="${resData.result.pdfUrl}" target="_blank" class="btn btn-primary rounded-pill w-100 mt-3 py-2 shadow-sm">
                            <i class="bi bi-file-earmark-pdf"></i> เปิดดูไฟล์ PDF ที่นี่
                        </a>
                    </div>
                `;
                carForm.reset();
            } else {
                throw new Error("ระบบขัดข้อง: " + (resData.result.error || "Unknown"));
            }
        } catch (err) {
            loadingIcon.style.display = "none";
            modalFooter.style.display = "block";
            modalText.innerHTML = `<span class="text-danger">❌ เกิดข้อผิดพลาด: ${err.message}</span>`;
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

    // ปุ่มเปิด-ปิดฟอร์มหน้าเว็บ
    document.getElementById("showFormBtn").onclick = () => {
        document.getElementById("formSection").style.display = "block";
        document.getElementById("showFormBtn").parentElement.style.display = "none";
    };
    document.getElementById("cancelBookingBtn").onclick = () => {
        carForm.reset();
        document.getElementById("formSection").style.display = "none";
        document.getElementById("showFormBtn").parentElement.style.display = "block";
    };
});
