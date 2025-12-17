const GAS_URL = "https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec";

// banner
const bannerUrl = "https://firebasestorage.googleapis.com/v0/b/banner-web-app.appspot.com/o/banner%20%E0%B8%88%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B8%9669.jpg?alt=media";
document.getElementById("banner").style.backgroundImage = `url('${bannerUrl}')`;

// show / hide form
const showFormBtn = document.getElementById("showFormBtn");
const formSection = document.getElementById("formSection");
showFormBtn.onclick = () => {
  formSection.style.display = "block";
  showFormBtn.style.display = "none";
};

// submit form
document.getElementById("carForm").addEventListener("submit", e => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target).entries());

  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("modalText").innerText = "ส่งข้อมูลเรียบร้อยแล้ว";
    document.getElementById("modalFooter").style.display = "block";
    e.target.reset();
  })
  .catch(() => alert("เกิดข้อผิดพลาด"));
});
