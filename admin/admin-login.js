document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://gaawqovwiplzdmqviqyl.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdxb3Z3aXBsemRtcXZpcXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTA1NTcsImV4cCI6MjA4NDAyNjU1N30.N4qbON4Wqn0ghaUO8eCMMjwEIHhdH3693ySoJKZdVvU";

  const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const loginBtn = document.getElementById("loginBtn");
  const errorMsg = document.getElementById("errorMsg");

  loginBtn.addEventListener("click", async () => {
    errorMsg.innerText = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorMsg.innerText = "Please enter email and password";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMsg.innerText = error.message;
      return;
    }

    // ✅ SUCCESS
    window.location.href = "admin-dashboard.html";
  });
});
