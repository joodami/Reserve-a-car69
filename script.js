const GAS_URL = "https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec"; // ใส่ /exec ของ GAS

document.getElementById("showFormBtn").addEventListener("click", () => {
  document.getElementById("formSection").style.display = "block";
  window.scrollTo({ top: document.getElementById("formSection").offsetTop, behavior: 'smooth' });
});

document.getElementById("cancelBookingBtn").addEventListener("click", () => {
  document.getElementById("carForm").reset();
  document.getElementById("formSection").style.display = "none";
  document.getElementById("passengerInputs").style.display = "block";
  document.getElementById("fileUploadSection").style.display = "none";
});

const passengerCountInput = document.querySelector("input[name='passengerCount']");
passengerCountInput.addEventListener("input", () => {
  const count = Number(passengerCountInput.value);
  const passengerGroup = document.getElementById("passengerInputs");
  const fileSection = document.getElementById("fileUploadSection");
  if (count > 6) {
    passengerGroup.style.display = "none";
    fileSection.style.display = "block";
  } else {
    passengerGroup.style.display = "block";
    fileSection.style.display = "none";
    const inputs = passengerGroup.querySelectorAll("input");
    inputs.forEach((input, index) => {
      input.style.display = index < count ? "block" : "none";
    });
  }
});

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

  // Encode PDF file ถ้ามี
  if (formData.passengerFile && formData.passengerFile.size) {
    const file = form.querySelector("input[name='passengerFile']").files[0];
    formData.passengerFileName = file.name;
    formData.passengerFile = await toBase64(file);
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" }
  })
  .then(res => res.json())
  .then(data => {
    modalText.textContent = "ส่งข้อมูลสำเร็จ ✅";
    modalFooter.style.display = "block";
    form.reset();
    document.getElementById("formSection").style.display = "none";
  })
  .catch(err => {
    modalText.textContent = "เกิดข้อผิดพลาด ❌";
    console.error(err);
    modalFooter.style.display = "block";
  });
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}
