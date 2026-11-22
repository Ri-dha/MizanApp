// Runs before the first paint so a dark device never flashes the light theme (ADR ui-1), and the
// chosen template never flashes another one (ADR styles-1).
;(function () {
  var choice = "system"
  var style = "mizan"
  try {
    choice = localStorage.getItem("mizan.theme") || "system"
    var saved = JSON.parse(localStorage.getItem("mizan.preferences") || "{}").appStyle
    if (saved === "clear" || saved === "soft") style = saved
  } catch (e) {}
  var dark = choice === "dark" || (choice !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  var colours = { mizan: ["#f3f5f9", "#0b1220"], clear: ["#f5f5f7", "#000000"], soft: ["#f1f6f8", "#101518"] }
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.setAttribute("data-style", style)
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", colours[style][dark ? 1 : 0])
})()
