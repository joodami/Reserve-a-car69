document.addEventListener('DOMContentLoaded', function() {
    const showFormBtn = document.getElementById("showFormBtn");
    const formSection = document.getElementById("formSection");
    const cancelBtn = document.getElementById("cancelBookingBtn");
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // --- 1. จัดการช่องกรอกชื่อผู้ร่วมเดินทาง ---
    function updatePassengerFields() {
        const count = Number(passengerCountInput.value) || 0;
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
        } else if (count > 6) {
            fileUploadSection.style.display = "block";
        } else {
            fileUploadSection.style.display = "none";
        }
    }
    passengerCountInput.addEventListener("input", updatePassengerFields);

    // --- 2. ปุ่มเปิด-ปิดฟอร์ม ---
    showFormBtn.addEventListener("click", () => {
        formSection.style.display = "block";
        showFormBtn.parentElement.style.display = "none";
        formSection.scrollIntoView({ behavior: "smooth" });
    });

    cancelBtn.addEventListener("click", () => {
        carForm.reset();
        formSection.style.display = "none";
        showFormBtn.parentElement.style.display = "block";
        updatePassengerFields();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // --- 3. การส่งข้อมูล ---
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        document.getElementById('modalText').innerHTML = "⏳ กำลังดำเนินการ...";
        document.getElementById('loadingIcon').style.display = "block";
        document.getElementById('modalFooter').style.display = "none";
        submitModal.show();

        try {
            const formDataObj = Object.fromEntries(new FormData(carForm).entries());
            const fileInput = carForm.querySelector('[name="passengerFile"]');

            // จัดการไฟล์ถ้ามี
            if (fileInput && fileInput.files[0]) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            const params = new URLSearchParams();
            params.append("data", JSON.stringify(formDataObj));

            const res = await fetch(GAS_URL, { method: "POST", body: params });
            const result = await res.json();

            document.getElementById('loadingIcon').style.display = "none";
            document.getElementById('modalFooter').style.display = "block";

            if (result.status === "success") {
                document.getElementById('modalText').innerHTML = 
                    `<div class="text-center">
                        <h4 class="text-success">✅ จองสำเร็จ!</h4>
                        <a href="${result.result.pdfUrl}" target="_blank" class="btn btn-primary btn-sm mt-3">📄 เปิดดูใบขอใช้รถ (PDF)</a>
                    </div>`;
                carForm.reset();
                setTimeout(() => { cancelBtn.click(); }, 3000);
            } else {
                document.getElementById('modalText').innerText = "⚠️ ผิดพลาด: " + result.message;
            }
        } catch (err) {
            document.getElementById('loadingIcon').style.display = "none";
            document.getElementById('modalFooter').style.display = "block";
            document.getElementById('modalText').innerText = "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ";
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
});
