/* 공유용 단독 페이지의 주석 — app/components/article-notes.tsx 를 순수 JS로
   옮긴 것(2026-10-06). 하는 일은 셋뿐이다.
   ① 본문 표시를 원문자로 — 「1)」을 「①」꼴로
   ② 넓은 화면(1180px 이상)에서는 주석을 오른쪽 여백의 그 줄 높이에 세운다(방주)
   ③ 좁으면 미주 — 미주에도 원문자 번호(누르면 본문으로)와 되돌아가는 화살표
   팝업(툴팁)은 쓰지 않는다 — 편집장 결정. */
(function () {
  var SIDE_MIN_WIDTH = 1180;
  var NOTE_GAP = 14;

  var body = document.querySelector(".article-body");
  var prose = document.querySelector(".article-prose");
  var endnotes = document.querySelector(".wp-block-footnotes");
  if (!body || !prose || !endnotes) return;

  var markers = Array.prototype.slice.call(
    prose.querySelectorAll('sup a[href^="#note-"]')
  );

  function jumpTo(target) {
    if (target) target.scrollIntoView({ block: "center" });
  }
  function bindJump(link, resolve) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      jumpTo(resolve());
    });
  }

  /* ① */
  markers.forEach(function (marker) {
    var id = marker.getAttribute("href").slice(1);
    var num = (marker.textContent || "").replace(/[^0-9]/g, "");
    marker.textContent = num;
    marker.classList.add("note-mark");
    marker.id = "ref-" + id;
    marker.setAttribute("aria-label", "주석 " + num);
    bindJump(marker, function () { return document.getElementById(id); });
  });

  /* ③ */
  endnotes.classList.add("notes-circled");
  markers.forEach(function (marker) {
    var id = marker.getAttribute("href").slice(1);
    var item = document.getElementById(id);
    if (!item || item.querySelector(".note-num")) return;
    var toMarker = function () {
      return document.getElementById("ref-" + id) ||
        document.querySelector('sup a[href="#' + id + '"]');
    };
    var num = document.createElement("a");
    num.className = "note-num";
    num.href = "#ref-" + id;
    num.textContent = marker.textContent || "";
    num.setAttribute("aria-label", "본문으로 돌아가기");
    bindJump(num, toMarker);
    item.prepend(num);

    var back = document.createElement("a");
    back.className = "note-back";
    back.href = "#ref-" + id;
    back.textContent = "↑";
    back.setAttribute("aria-label", "본문으로 돌아가기");
    bindJump(back, toMarker);
    item.append(back);
  });

  /* ② */
  var column = document.createElement("div");
  column.className = "side-notes";
  column.setAttribute("aria-hidden", "true");
  body.appendChild(column);

  function build() {
    var wide = window.innerWidth >= SIDE_MIN_WIDTH;
    body.classList.toggle("has-side-notes", wide);
    column.innerHTML = "";
    if (!wide) return;

    var bodyTop = body.getBoundingClientRect().top + window.scrollY;
    var floor = 0;
    markers.forEach(function (marker) {
      var id = marker.getAttribute("href").slice(1);
      var source = document.getElementById(id);
      if (!source) return;

      var note = document.createElement("aside");
      note.className = "side-note";
      var num = document.createElement("span");
      num.className = "side-note-num";
      num.textContent = marker.textContent || "";
      var text = document.createElement("div");
      text.className = "side-note-text";
      text.innerHTML = source.innerHTML;
      var n1 = text.querySelector(".note-num"); if (n1) n1.remove();
      var n2 = text.querySelector(".note-back"); if (n2) n2.remove();
      note.append(num, text);
      column.appendChild(note);

      var markerBox = marker.getBoundingClientRect();
      var markerCenter = markerBox.top + markerBox.height / 2 + window.scrollY - bodyTop;
      var noteLine = parseFloat(getComputedStyle(note).lineHeight) || 0;
      var top = Math.max(markerCenter - noteLine / 2, floor);
      note.style.top = top + "px";
      floor = top + note.offsetHeight + NOTE_GAP;
    });
  }

  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  Array.prototype.forEach.call(prose.querySelectorAll("img"), function (img) {
    if (!img.complete) img.addEventListener("load", build, { once: true });
  });
  if (window.ResizeObserver) new ResizeObserver(build).observe(prose);
  var pending = 0;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(build);
  });
})();
