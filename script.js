// =====================================================
// แสดง/ซ่อนฟอร์ม
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
});

// =====================================================
// ผู้ร่วมเดินทาง
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
      input.value = "";
    } else input.style.display = "none";
  });
  fileUploadSection.style.display = count > 6 ? "block" : "none";
}

passengerCount.addEventListener("input", updatePassengerFields);
updatePassengerFields();

// =====================================================
// ส่งฟอร์ม
// =====================================================
const form = document.getElementById('carForm');
const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // ตรวจฟิลด์ required
  const requiredFields = form.querySelectorAll('[required]');
  for (const field of requiredFields) {
    if (!field.value.trim()) {
      alert(`กรุณากรอกช่อง: ${field.previousElementSibling.textContent}`);
      field.focus();
      return;
    }
  }

  const count = Number(form.querySelector('input[name="passengerCount"]').value);
  const fileInput = form.querySelector('[name="passengerFile"]');
  let passengerFile = null;

  if (count > 6) {
    if (fileInput.files.length === 0) {
      alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง");
      fileInput.focus();
      return;
    }
    const file = fileInput.files[0];
    if (file.type !== "application/pdf") {
      alert("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
      fileInput.focus();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ต้องเล็กกว่า 5 MB");
      fileInput.focus();
      return;
    }
    passengerFile = file;
  }

  // ✅ แสดง modal กำลังส่ง
  document.getElementById('modalText').innerHTML = "กำลังส่งข้อมูล กรุณารอสักครู่...";
  document.getElementById('loadingIcon').style.display = "block";
  document.getElementById('modalFooter').style.display = "none";
  submitModal.show();

  // เตรียมข้อมูลส่ง GAS
  const formData = Object.fromEntries(new FormData(form).entries());
  formData.passengerCount = count;

  if (passengerFile) {
    formData.passengerFile = await fileToBase64(passengerFile);
    formData.passengerFileName = passengerFile.name;
  } else {
    formData.passengerFile = null;
    formData.passengerFileName = "-";
  }

  // ✅ ส่งข้อมูลไป GAS เบื้องหลัง
  sendToGAS(formData);

  // ✅ แสดง modal สำเร็จหลัง 1.5 วินาที พร้อมล้างฟอร์ม
  setTimeout(() => {
    document.getElementById('modalText').innerHTML = "ส่งข้อมูลเรียบร้อยแล้ว ✅";
    document.getElementById('loadingIcon').style.display = "none";
    document.getElementById('modalFooter').style.display = "block";

    // ล้างฟอร์มและซ่อนฟอร์ม
    form.reset();
    updatePassengerFields();
    formSection.style.display = "none";
    showFormBtn.style.display = "inline-block";
  }, 3000); // ปรับเวลา 1000-3000 ms ตามต้องการ
});

// =====================================================
// ฟังก์ชันช่วยแปลงไฟล์ PDF เป็น Base64
// =====================================================
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// =====================================================
// ส่งข้อมูลไป GAS
// =====================================================
async function sendToGAS(data){
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain" // ✅ สำคัญมาก
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log("RESULT:", result);

  } catch(err) {
    console.error("ERROR:", err);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
}
