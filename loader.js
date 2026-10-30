
(function () {
  const MIN_MS = 450;
  const MAX_MS = 12000;
  let shownAt = 0;
  let hideTimer = null;
  let maxTimer = null;

  function ensureOverlay() {
    let el = document.getElementById("pantallaCarga");
    if (el) return el;

    el = document.createElement("div");
    el.id = "pantallaCarga";
    el.className = "pantalla_carga";
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("role", "status");
    el.innerHTML = `
      <div class="pantalla_carga_caja">
        <div class="pantalla_carga_anillo" aria-hidden="true">
          <img class="pantalla_carga_icono" src="assets/icono-calatrava.png" alt="">
        </div>
        <p class="pantalla_carga_texto">Procesando…</p>
        <p class="pantalla_carga_sub">Calatrava Parqueadero</p>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  function setMessage(msg) {
    const text = document.querySelector(".pantalla_carga_texto");
    if (text && msg) text.textContent = msg;
  }

  window.mostrarCarga = function (mensaje) {
    const el = ensureOverlay();
    setMessage(mensaje || "Procesando…");
    shownAt = Date.now();
    el.classList.add("activa");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("cargando");

    clearTimeout(maxTimer);
    maxTimer = setTimeout(function () {
      window.ocultarCarga();
    }, MAX_MS);
  };

  window.ocultarCarga = function (inmediato) {
    const el = document.getElementById("pantallaCarga");
    if (!el || !el.classList.contains("activa")) return;

    const elapsed = Date.now() - shownAt;
    const wait = inmediato ? 0 : Math.max(0, MIN_MS - elapsed);

    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      el.classList.remove("activa");
      el.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cargando");
      clearTimeout(maxTimer);
    }, wait);
  };

  function isActionButton(el) {
    if (!el || el.tagName !== "BUTTON") return false;
    if (el.type === "button" && !el.id) {
      const cls = el.className || "";
      if (
        /reserr|boton_aumentar|aumento/.test(cls) ||
        el.id === "verGrafico" ||
        el.id === "exportar"
      ) {
        return true;
      }
    }
    if (el.type === "submit") return true;
    if (el.id === "verGrafico" || el.id === "exportar") return true;
    if (/\breserr|\breserrr|\breserrrr|\bboton_aumentar\b/.test(el.className || "")) {
      return true;
    }
    return false;
  }

  function messageFor(el) {
    const id = el && el.id;
    const text = ((el && el.textContent) || "").trim().toLowerCase();
    if (id === "verGrafico") return "Cargando estadísticas…";
    if (id === "exportar") return "Exportando…";
    if (id === "logout") return "Cerrando sesión…";
    if (/reservar|reserva/.test(text)) return "Procesando reserva…";
    if (/aument|exten/.test(text)) return "Actualizando tiempo…";
    if (/iniciar|login|sesión/.test(text)) return "Iniciando sesión…";
    if (/registr/.test(text)) return "Creando cuenta…";
    if (/guardar|config|actualizar|guardar/.test(text)) return "Guardando…";
    if (/pagar|pago/.test(text)) return "Preparando pago…";
    return "Procesando…";
  }

  document.addEventListener(
    "submit",
    function (e) {
      if (e.target.closest(".swal2-container")) return;
      const formularioImprimir = e.target.closest('form[id^="imprimir-"]');

        if (formularioImprimir) {
            return;
        }
      window.mostrarCarga(messageFor(e.target.querySelector('[type="submit"]') || e.target));
    },
    true
    
  );

  document.addEventListener(
    "click",
    function (e) {
      if (e.target.closest(".swal2-container")) return;
      const btn = e.target.closest(
        "button, a.boton_aumentar, #logout, #comun, .reserr, .reserrr, .reserrrr"
      );
      if (!btn) return;

      if (btn.id === "logout") {
        window.mostrarCarga("Cerrando sesión…");
        return;
      }

      if (btn.id === "comun") {
        window.mostrarCarga("Generando uso común…");
        return;
      }

      if (btn.tagName === "A" && btn.classList.contains("boton_aumentar")) {
        window.mostrarCarga("Cargando aumento…");
        return;
      }

      /* Acciones locales rápidas: métricas/export no usan SweetAlert de éxito */
      if (btn.id === "verGrafico" || btn.id === "exportar") {
        window.mostrarCarga(messageFor(btn));
        setTimeout(function () {
          window.ocultarCarga();
        }, 0);
        return;
      }
      const formularioImprimir = btn.closest('form[id^="imprimir-"]');

if (formularioImprimir) {
    return;
}
      if (isActionButton(btn) || /\breserr|\breserrr|\breserrrr\b/.test(btn.className || "")) {
        window.mostrarCarga(messageFor(btn));
      }
    },
    true
  );

  /* Ocultar cuando aparece SweetAlert o al terminar navegación */
  const observer = new MutationObserver(function () {
    if (document.querySelector(".swal2-container")) {
      window.ocultarCarga(true);
    }
    const wompiAbierto = document.querySelector(
        'iframe[src*="wompi"]'
    );

    if (wompiAbierto) {
        window.ocultarCarga();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    ensureOverlay();
    observer.observe(document.body, { childList: true, subtree: true });

    /* Carga inicial breve en pantallas con datos dinámicos */
    const shells = [
      "#reservasContainer",
      "#adminContainer",
      "#reservasUsuarios",
      "#usosUsuarios",
      "#listausuarios",
      "#contenidousuario",
      "#espa_reser",
    ];
    const needsInitial = shells.some(function (sel) {
      const node = document.querySelector(sel);
      return node && !node.children.length;
    });

    if (needsInitial) {
      window.mostrarCarga("Cargando…");
      const start = Date.now();
      const check = setInterval(function () {
        const filled = shells.some(function (sel) {
          const node = document.querySelector(sel);
          return node && node.children.length > 0;
        });
        if (filled || Date.now() - start > 4000) {
          clearInterval(check);
          window.ocultarCarga();
        }
      }, 120);
    }
  });

  window.addEventListener("pageshow", function () {
    window.ocultarCarga();
  });

  /* Tema global SweetAlert2 acorde al sistema visual */
  function applySwalTheme() {
    if (typeof window.Swal === "undefined" || window.Swal.__cjThemed) return;
    window.Swal = window.Swal.mixin({
      customClass: {
        container: "cj-swal-container",
        popup: "cj-swal-popup",
        title: "cj-swal-title",
        htmlContainer: "cj-swal-html",
        actions: "cj-swal-actions",
        confirmButton: "cj-swal-confirm",
        cancelButton: "cj-swal-cancel",
        denyButton: "cj-swal-deny",
        input: "cj-swal-input",
      },
      buttonsStyling: false,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
    });
    window.Swal.__cjThemed = true;
  }

  applySwalTheme();
  document.addEventListener("DOMContentLoaded", applySwalTheme);

  function prepararDesplazamientoMenu() {
    const cuerpo = document.querySelector(".menu-cuerpo");
    const menu = document.querySelector(".menu");
    if (!cuerpo || !menu || cuerpo.dataset.deslizar) return;
    cuerpo.dataset.deslizar = "listo";

    function boton(direccion) {
      const control = document.createElement("button");
      control.type = "button";
      control.className = "menu-deslizar";
      control.setAttribute("aria-label", direccion < 0 ? "Ver opciones anteriores" : "Ver más opciones");
      control.innerHTML = direccion < 0
        ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 6 8 12l6 6"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>';
      control.addEventListener("click", function () {
        cuerpo.scrollBy({ left: direccion * Math.max(180, cuerpo.clientWidth * 0.6), behavior: "smooth" });
      });
      return control;
    }

    const anterior = boton(-1);
    const siguiente = boton(1);
    menu.insertBefore(anterior, cuerpo);
    cuerpo.insertAdjacentElement("afterend", siguiente);

    function actualizar() {
      const sobra = cuerpo.scrollWidth - cuerpo.clientWidth > 4;
      anterior.hidden = !sobra || cuerpo.scrollLeft <= 4;
      siguiente.hidden = !sobra || cuerpo.scrollLeft + cuerpo.clientWidth >= cuerpo.scrollWidth - 4;
    }

    cuerpo.addEventListener("scroll", actualizar, { passive: true });
    cuerpo.addEventListener("wheel", function (evento) {
      if (cuerpo.scrollWidth <= cuerpo.clientWidth + 4) return;
      const horizontal = Math.abs(evento.deltaX) > Math.abs(evento.deltaY);
      cuerpo.scrollLeft += horizontal ? evento.deltaX : evento.deltaY;
      evento.preventDefault();
    }, { passive: false });
    window.addEventListener("resize", actualizar);
    actualizar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepararDesplazamientoMenu);
  } else {
    prepararDesplazamientoMenu();
  }
})();

document.addEventListener("click", function (evento) {
  const boton = evento.target.closest(".clave-ojo");
  if (!boton) return;
  const campo = boton.closest(".clave-vista");
  if (!campo) return;
  const input = campo.querySelector("input");
  if (input) {
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    boton.setAttribute("aria-pressed", visible ? "true" : "false");
    boton.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
    return;
  }
  const codigo = campo.querySelector("[data-codigo]");
  if (!codigo) return;
  const visible = boton.getAttribute("aria-pressed") !== "true";
  codigo.textContent = visible ? codigo.dataset.codigo : "•".repeat(codigo.dataset.codigo.length);
  boton.setAttribute("aria-pressed", visible ? "true" : "false");
  boton.setAttribute("aria-label", visible ? "Ocultar código" : "Mostrar código");
});
