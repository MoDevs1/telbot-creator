document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (!data.loggedIn) {
      return (window.location.href = "/login.html");
    }

    const user = data.user;

    if (user.plan === "free" || user.plan === "pro") {
      window.location.href = "/bot-creator.html";
    } else if (user.plan === "pending") {
      window.location.href = "/pending.html";
    } else {
      window.location.href = "/plan-user-choose";
    }
  } catch (err) {
    console.error("🚨 Redirect Error:", err);
    window.location.href = "/login.html";
  }
});
