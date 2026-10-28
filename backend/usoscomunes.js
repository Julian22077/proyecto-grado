import { auth } from "./firebase.js";
import { esAdmin } from "./rol.js";
import { avatar } from "./avatar.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { iniciarContadorUsoComun } from "./contador.js";
const { jsPDF } = window.jspdf;

const reservasUsuariosContainer = document.getElementById("usosUsuarios");
const buscador = document.getElementById("buscarReserva");

onAuthStateChanged(auth, async (usuarioAuth) => {
  if (!usuarioAuth) {
    window.location.href = "login.html";
    return;
  }
  if (!(await esAdmin(usuarioAuth))) {
    window.location.href = "usuario.html";
    return;
  }
  const token = await usuarioAuth.getIdToken();

  const usosadmin = await fetch("https://proyecto-grado-rouge.vercel.app/usoscomunes", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  })
  const comunes = await usosadmin.json();
  if (!usosadmin.ok) {
    Swal.fire({
      title: "Error",
      text: comunes.error,
      icon: "error"
    });
    return;
  }
  function MostrarReserva(lista) {
    let html = "";
    lista.forEach((data) => {
      html += `
      <article class="datos_generales reserva-card">
        <header class="filll reserva-card-top">
          <div class="reserva-card-user">
            <span class="reserva-avatar" aria-hidden="true">${avatar(data.placa)}</span>
            <div>
              <button type="button" class="nombree btn-placa" id="placa-${data.id}">
              ${data.placa}
              </button>
              <p class="reserva-cupo">Cupo ${data.parqueaderoId}</p>
            </div>
          </div>
          <div class="reserva-card-actions">
            <p id="contadorr-${data.id}" class="estado ${data.estado}"></p>
          </div>
        </header>
        <div class="reservas_admin_totales reserva-card-body">
          <div class="prim">
            <div class="fill">
              <span class="reserva-meta-label">Valor</span>
              <p class="reserva-meta-value">$${data.precio}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Fecha</span>
              <p class="reserva-meta-value">${data.fecha}</p>
            </div>
          </div>
          <div class="sec">
            <div class="fill">
              <span class="reserva-meta-label">Entrada</span>
              <p class="reserva-meta-value">${data.horaEntrada}</p>
            </div>
            <div class="fill">
              <span class="reserva-meta-label">Salida</span>
              <p class="reserva-meta-value">${data.horaSalida || "—"}</p>
            </div>
          </div>
        </div>
        <footer class="reserva-card-actions uso-acciones">
          <form id="salio-${data.id}">
            <button type="submit" class="reserrrr">Finalizar Ingreso Directo</button>
          </form>
          <form id="pago-${data.id}">
            <button type="submit" class="reserrrr">Registrar Pago</button>
          </form>
          <form id="imprimir-${data.id}">
            <button type="submit" class="reserrrr">Imprimir factura</button>
          </form>
          <form id="imprimir-comprobante-${data.id}">
            <button type="submit" class="reserrrr">Imprimir comprobante</button>
          </form>
        </footer>
      </article>
            `;
    });
    if (!html) {
      html = `
      <div class="dash-empty">
        <p class="dash-empty-title">Sin Ingresos Directos</p>
        <p class="dash-empty-text">No hay ingresos para mostrar en este momento.</p>
      </div>`;
    }
    reservasUsuariosContainer.innerHTML = html;

    lista.forEach((data) => {

      const contador = document.getElementById(`contadorr-${data.id}`);

      if (contador) {
        iniciarContadorUsoComun(
          data.horaEntrada,
          data.estado,
          contador,
          data.creado
        );
      }

    });
    lista.forEach((data) => {
      const salio = document.getElementById(`salio-${data.id}`);
      salio.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const saliocomun = await fetch("https://proyecto-grado-rouge.vercel.app/finalizarusoComun", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ comunId: data.id })
          })
          const datacomun = await saliocomun.json();
          if (!saliocomun.ok) {
            await Swal.fire({
              title: "Error",
              text: datacomun.error,
              icon: "error"
            });
            return;
          }
          await Swal.fire({
            title: "Ingreso finalizado",
            text: "El usuario ha llegado y finalizado su ingreso con éxito",
            icon: "success",
          });
          window.location.reload();
        } catch (error) {
          console.error(error);
          await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
          });
        }
      });
      const pago = document.getElementById(`pago-${data.id}`);
      pago.addEventListener("submit", async (e) => {
        e.preventDefault();
        Swal.fire({
          title: "Agregue el metodo de pago",
          html: `<div class="formulario">
            <label for="metodoPago">Método de pago</label>
        <select id="metodoPago" class="swal2-select">
            <option value="">Seleccione una opción</option>
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="tarjeta">Tarjeta</option>
        </select>
        </div>`,
          showCancelButton: true,
          confirmButtonText: "Confirmar Pago",
          cancelButtonText: "Cancelar",
          preConfirm: async () => {
            const metodoPago = document.getElementById("metodoPago").value;
            if (!metodoPago) {
              Swal.showValidationMessage("Por favor, selecciona un método de pago.");
              return;
            }
            return { metodoPago };
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            const metodoPago = result.value.metodoPago;
            try {
              const pagar = await fetch("https://proyecto-grado-rouge.vercel.app/validarpago", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ comunId: data.id, metodoPago: metodoPago })
              })
              const datos = await pagar.json();
              if (!pagar.ok) {
                await Swal.fire({
                  title: "Error",
                  text: datos.error,
                  icon: "error"
                });
                return;
              }
              await Swal.fire({
                title: "Pago confirmado",
                text: "El pago se ha realizado con éxito",
                icon: "success",
              });
              window.location.reload();
            } catch (error) {
              console.error(error);
              await Swal.fire({
                title: "Error",
                text: error.message,
                icon: "error",
              });
            }
          }
        })
      })
      const placa = document.getElementById(`placa-${data.id}`);

      placa.addEventListener("click", async () => {

        const resultado = await Swal.fire({
          title: "Actualizar placa",
          input: "text",
          inputValue: data.placa,
          inputLabel: "Nueva placa",
          inputPlaceholder: "Ejemplo: ABC123",
          showCancelButton: true,
          confirmButtonText: "Actualizar",
          cancelButtonText: "Cancelar",
          inputAttributes: {
            maxlength: 6,
            style: "text-transform: uppercase"
          },
          preConfirm: (valor) => {
            const nuevaPlaca = valor.trim().toUpperCase();
            if (!/^[A-Z]{3}[0-9]{3}$/.test(nuevaPlaca)&&!/^[A-Z]{3}[0-9]{2}[A-Z]$/.test(nuevaPlaca)) {
              Swal.showValidationMessage("La placa debe tener el formato ABC123 o ABC12D");
              return false;
            }

            return nuevaPlaca;
          }
        });

        if (!resultado.isConfirmed) {
          return;
        }

        try {

          const actualizar = await fetch(
            "https://proyecto-grado-rouge.vercel.app/actualizarplaca",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                comunId: data.id,
                placa: resultado.value
              })
            }
          );

          const datos = await actualizar.json();

          if (!actualizar.ok) {
            await Swal.fire({
              title: "Error",
              text: datos.error,
              icon: "error"
            });
            return;
          }

          await Swal.fire({
            title: "Placa actualizada",
            text: "La placa fue actualizada con exito",
            icon: "success"
          });

          window.location.reload();

        } catch (error) {

          console.error(error);

          await Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error"
          });

        }
      });
      const imprimir = document.getElementById(`imprimir-${data.id}`)
      imprimir.addEventListener("submit", (e) => {
        e.preventDefault()
        if (data.estado === "activo") {
          Swal.fire({
            title: "Error",
            text: "El usuario aun no ha salido",
            icon: "error"
          })
          return;
        }
        if (!data.pago) {
          Swal.fire({
            title: "Error",
            text: "Debe registrar el pago para imprimir la factura",
            icon: "error"
          })
          return;
        }
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [80, 150]

        })
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(16)
        pdf.text("Parqueadero", 40, 12, { align: "center" })
        pdf.text("Calatrava", 40, 19, { align: "center" })
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        pdf.line(5, 24, 75, 24)
        pdf.text(`Placa:${data.placa}`, 5, 32)
        pdf.text(`Parqueadero:${data.parqueaderoId}`, 5, 40)
        pdf.text(`Fecha: ${data.fecha}`, 5, 48)
        pdf.text(`Hora entrada: ${data.horaEntrada}`, 5, 56)
        pdf.text(`Hora salida: ${data.horaSalida}`, 5, 64)
        pdf.text(`Precio: ${data.precio}`, 5, 72)
        pdf.text(`Metodo Pago: ${data.metodoPago}`, 5, 80)
        pdf.line(5, 88, 75, 88)
        pdf.setFont("helvetica", "bold");
        pdf.text("Gracias por su vista", 40, 96, { align: "center" })
        const pdfurl = pdf.output("bloburl")
        const ventana = window.open(pdfurl, "_blank")
        if (!ventana) {
          Swal.fire({
            title: "Ventana bloqueada",
            text: "Permita las ventanas emergentes para imprimir la factura.",
            icon: "warning"
          });
        }
      })
      const comprobante = document.getElementById(`imprimir-comprobante-${data.id}`)
      comprobante.addEventListener("submit", (e) => {
        e.preventDefault()
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [80, 90]
        })
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(16)
        pdf.text("Parqueadero", 40, 12, { align: "center" })
        pdf.text("Calatrava", 40, 19, { align: "center" })
        pdf.setFontSize(11)
        pdf.text("Comprobante de uso", 40, 28, { align: "center" })
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        pdf.line(5, 34, 75, 34)
        pdf.text(`Placa: ${data.placa}`, 5, 44)
        pdf.text(`Fecha: ${data.fecha}`, 5, 52)
        pdf.text(`Hora entrada: ${data.horaEntrada}`, 5, 60)
        pdf.line(5, 68, 75, 68)
        pdf.setFont("helvetica", "bold")
        pdf.text("Gracias por su visita", 40, 78, { align: "center" })
        const pdfurl = pdf.output("bloburl")
        const ventana = window.open(pdfurl, "_blank")
        if (!ventana) {
          Swal.fire({
            title: "Ventana bloqueada",
            text: "Permita las ventanas emergentes para imprimir el comprobante.",
            icon: "warning"
          });
        }
      })

    });
  }

  MostrarReserva(comunes);

  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase();
    const filtradas = comunes.filter((data) => {
      return data.placa.toLowerCase().includes(texto)
    });
    MostrarReserva(filtradas);
  });
});
