document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 السكريبت اشتغل");

  document.getElementById("chooseFreeBtn").onclick = async () => {
    console.log("🟢 تم الضغط على زر المجانية");
    const res = await fetch("/api/choose-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan: "free" }),
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "/index.html";
  };

  document.getElementById("chooseProBtn").onclick = async () => {
    console.log("🟢 تم الضغط على زر المتقدمة");
    const res = await fetch("/api/choose-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan: "pro" }),
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) window.location.href = "/index.html";
  };
});
