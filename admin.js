const adminSessionKey = "roundsquare-admin-authorized";

if (window.sessionStorage.getItem(adminSessionKey) !== "true") {
  window.location.replace("signin.html");
}
