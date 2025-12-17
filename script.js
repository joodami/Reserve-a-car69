const GAS_URL = "YOUR_GAS_WEB_APP_URL_HERE"; // ใส่ /exec ของ GAS

document.getElementById("showFormBtn").addEventListener("click", () => {
  document.getElementById("formSection").style.display = "block";
  window.scrollTo({ top: document.getElementById("formSection").offsetTop, behavior: 'smooth' });
});

document.getElementById("cancelBookingBtn").addEventListener("click", () => {
  document.getElementById("carForm").reset();
  document.getElementById("formSection").style.display = "none";
  updatePassengerInputs(0);
});

const passengerCountInput = document.querySelector("input[name='passengerCount']");
passengerCountInput.addEventListener("input", () => {
  const count = Number(passengerCountInput.value);
  updatePassengerInputs(count);
});

function updatePassengerInputs(count) {
  const passengerGroup = document.getElementById("passengerInputs");
  const fileSection = document.getElementById("fileUploadSection");
  const inputs = passengerGroup.querySelectorAll("input");

  if (count > 6) {
    passengerGroup.style.display = "none";
    fileSection.style.display = "block";
  } else {
    passengerGroup.style.display = "block";
    fileSection.style.display = "none";
    inputs.forEach((input, index) => {
      input.style.display = index < count ? "block" : "none";
    });
  }
}

document.getElementById("carForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const modal = new bootstrap.Modal(document.getElementById("submitModal"));
  const modalText = document.getElementById("modalText");
  const modalFooter = document.getElementById("modalFooter");
  modalText.textContent = "กำลังส่งข้อมูล...";
  modalFooter.style.display = "none";
  modal.show();

  let formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // ตรวจสอบไฟล์ผู้ร่วมเดินทาง
  const fileInput = form.querySelector("input[name='passengerFile']");
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    formData.passengerFileName = file.name;
    try {
      formData.passengerFile = await toBase64(file);
    } catch(err){
      modalText.textContent = "เกิดข้อผิดพลาดอ่านไฟล์ ❌";
      modalFooter.style.display = "block";
      console.error(err);
      return;
    }
  }

  // ส่งข้อมูลไป GAS
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    modalText.textContent = "ส่งข้อมูลสำเร็จ ✅";
    modalFooter.style.display = "block";
    form.reset();
    updatePassengerInputs(0);
    document.getElementById("formSection").style.display = "none";
  } catch (err) {
    modalText.textContent = "เกิดข้อผิดพลาด ❌";
    modalFooter.style.display = "block";
    console.error(err);
  }
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = err => reject(err);
  });
}
