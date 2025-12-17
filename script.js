// script.js

document.addEventListener("DOMContentLoaded", () => {
  const showFormBtn = document.getElementById("showFormBtn");
  const formSection = document.getElementById("formSection");
  const cancelBookingBtn = document.getElementById("cancelBookingBtn");
  const carForm = document.getElementById("carForm");
  const passengerCountInput = carForm.querySelector("input[name='passengerCount']");
  const passengerInputs = document.getElementById("passengerInputs");
  const fileUploadSection = document.getElementById("fileUploadSection");

  const submitModal = new bootstrap.Modal(document.getElementById("submitModal"));
  const modalText = document.getElementById("modalText");
  const modalFooter = document.getElementById("modalFooter");

  // แสดงฟอร์ม
  showFormBtn.addEventListener("click", () => {
    formSection.style.display = "block";
    window.scrollTo({ top: formSection.offsetTop, behavior: "smooth" });
  });

  // ยกเลิกฟอร์ม
  cancelBookingBtn.addEventListener("click", () => {
    formSection.style.display = "none";
    carForm.reset();
    passengerInputs.style.display = "flex";
    fileUploadSection.style.display = "none";
  });

  // อัปเดตผู้ร่วมเดินทาง
  passengerCountInput.addEventListener("input", () => {
    const count = parseInt(passengerCountInput.value) || 0;
    if (count >= 7) {
      passengerInputs.style.display = "none";
      fileUploadSection.style.display = "block";
    } else {
      passengerInputs.style.display = "flex";
      fileUploadSection.style.display = "none";
    }
  });

  // ส่งฟอร์ม
  carForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalText.textContent = "กำลังส่งข้อมูล...";
    modalFooter.style.display = "none";
    submitModal.show();

    const formData = new FormData(carForm);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    // อ่านไฟล์ PDF เป็น Base64 ถ้ามี
    const fileInput = carForm.querySelector("input[name='passengerFile']");
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        modalText.textContent = "❌ ไฟล์เกิน 5MB";
        modalFooter.style.display = "block";
        return;
      }
      data.passengerFileName = file.name;
      data.passengerFile = await readFileAsBase64(file);
    }

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec", {
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      modalText.innerHTML = `✅ ส่งข้อมูลสำเร็จ!<br>
        <a href="${result.pdfUrl}" target="_blank">📄 ดู PDF</a>`;
      modalFooter.style.display = "block";
      carForm.reset();
      passengerInputs.style.display = "flex";
      fileUploadSection.style.display = "none";
    } catch (err) {
      console.error(err);
      modalText.textContent = "❌ เกิดข้อผิดพลาดในการส่งข้อมูล!\n" + err.message;
      modalFooter.style.display = "block";
    }
  });

  // ฟังก์ชันช่วยอ่านไฟล์เป็น Base64
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
});
