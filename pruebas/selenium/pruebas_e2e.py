"""Pruebas end-to-end de Konys Pizza con Selenium.

Abre Chrome, recorre la web y al final genera un PDF con los resultados
(con capturas de pantalla) en pruebas/selenium/reportes/.

Las pruebas NO crean reservas: solo navegan y validan el formulario,
así que no ensucian la base de datos.

Uso:
    1) npm run dev                      (en otra terminal)
    2) python -m pip install -r pruebas/selenium/requirements.txt
    3) python pruebas/selenium/pruebas_e2e.py
       Opciones: --url http://localhost:5173   --visible (ver el navegador)
"""
import argparse
import time
import traceback
from datetime import datetime
from pathlib import Path

from fpdf import FPDF
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

CARPETA = Path(__file__).resolve().parent
CARPETA_REPORTES = CARPETA / "reportes"
ESPERA = 15  # segundos máximos para que aparezca un elemento


class Pruebas:
    def __init__(self, url, visible):
        opciones = webdriver.ChromeOptions()
        if not visible:
            opciones.add_argument("--headless=new")
        opciones.add_argument("--window-size=1366,900")
        self.driver = webdriver.Chrome(options=opciones)
        self.url = url.rstrip("/")
        self.esperar = WebDriverWait(self.driver, ESPERA)
        self.resultados = []
        self.carpeta_capturas = CARPETA_REPORTES / "capturas"
        self.carpeta_capturas.mkdir(parents=True, exist_ok=True)

    # --- utilidades -------------------------------------------------------
    def ir(self, ruta):
        self.driver.get(self.url + ruta)

    def buscar(self, selector):
        return self.esperar.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))

    def capturar(self, nombre):
        ruta = self.carpeta_capturas / f"{len(self.resultados) + 1:02d}_{nombre}.png"
        self.driver.save_screenshot(str(ruta))
        return ruta

    def ejecutar(self, nombre, descripcion, prueba):
        inicio = time.perf_counter()
        try:
            detalle = prueba() or "OK"
            estado = "APROBADA"
        except AssertionError as error:
            estado, detalle = "FALLIDA", str(error) or "La verificación no se cumplió"
        except Exception as error:  # error inesperado (elemento no encontrado, timeout...)
            estado, detalle = "ERROR", f"{type(error).__name__}: {str(error).splitlines()[0] if str(error) else ''}"
            traceback.print_exc()
        duracion = time.perf_counter() - inicio
        captura = self.capturar(nombre.lower().replace(" ", "_")[:40])
        self.resultados.append({
            "nombre": nombre, "descripcion": descripcion, "estado": estado,
            "detalle": detalle, "duracion": duracion, "captura": captura,
        })
        print(f"[{estado:8}] {nombre} ({duracion:.1f}s) - {detalle}")

    # --- pruebas ----------------------------------------------------------
    def prueba_inicio(self):
        self.ir("/")
        assert "konys" in self.driver.title.lower() or self.buscar(".hero"), "No cargó la página de inicio"
        self.buscar(".hero")
        return f"Título de la página: '{self.driver.title}'"

    def prueba_mesas(self):
        self.ir("/#mesas")
        self.buscar(".tarjeta-mesa__nombre")
        mesas = self.driver.find_elements(By.CSS_SELECTOR, ".tarjeta-mesa__nombre")
        assert mesas, "No se mostró ninguna mesa"
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'})", mesas[0])
        return f"Se listaron {len(mesas)} mesas (API /api/mesas responde)"

    def abrir_modal(self):
        # Recarga completa: cambiar solo el #hash no cierra el modal anterior
        self.ir("/")
        self.driver.refresh()
        boton = self.buscar(".tarjeta-mesa__accion")
        self.driver.execute_script("arguments[0].click()", boton)
        return self.buscar(".modal")

    def prueba_modal(self):
        self.abrir_modal()
        titulo = self.buscar("#titulo-reserva").text
        self.buscar(".slot, .horas__vacio")  # carga la disponibilidad
        slots = self.driver.find_elements(By.CSS_SELECTOR, ".slot")
        return f"Se abrió '{titulo}' con {len(slots)} horarios"

    def prueba_telefono(self):
        self.abrir_modal()
        campo = self.buscar("input[type='tel']")
        campo.clear()
        campo.send_keys("300abc12-3 45xyz67")
        valor = campo.get_attribute("value")
        assert valor == "3001234567", f"El teléfono quedó como '{valor}', se esperaba '3001234567'"
        return f"Se escribió '300abc12-3 45xyz67' y el campo quedó '{valor}'"

    def prueba_nombre(self):
        self.abrir_modal()
        campo = self.buscar("input[autocomplete='name']")
        campo.clear()
        campo.send_keys("María123 Pérez#$")
        valor = campo.get_attribute("value")
        assert valor == "María Pérez", f"El nombre quedó como '{valor}', se esperaba 'María Pérez'"
        return f"Se escribió 'María123 Pérez#$' y el campo quedó '{valor}'"

    def prueba_validacion(self):
        self.abrir_modal()
        self.buscar(".slot, .horas__vacio")
        boton = self.buscar(".modal button[type='submit']")
        self.driver.execute_script("arguments[0].click()", boton)
        error = self.buscar(".texto-error")
        assert "nombre" in error.text.lower(), f"Mensaje inesperado: '{error.text}'"
        return f"Sin datos, el formulario muestra: '{error.text}' (no se envió nada)"

    def prueba_carta(self):
        self.ir("/carta")
        self.buscar(".carta__titulo")
        self.buscar(".plato")
        platos = self.driver.find_elements(By.CSS_SELECTOR, ".plato")
        assert platos, "La carta no tiene platos"
        return f"La carta muestra {len(platos)} platos"

    def prueba_admin(self):
        self.ir("/admin")
        self.buscar(".acceso__formulario")
        campos = self.driver.find_elements(By.CSS_SELECTOR, ".acceso__formulario input")
        assert len(campos) >= 2, "El formulario de acceso no tiene usuario y contraseña"
        return "El panel de administración pide usuario y contraseña"

    def correr(self):
        lista = [
            ("Inicio", "La página principal carga", self.prueba_inicio),
            ("Listado de mesas", "Las mesas se cargan desde la API", self.prueba_mesas),
            ("Modal de reserva", "Se abre la ventana de reserva con horarios", self.prueba_modal),
            ("Telefono solo numeros", "El teléfono descarta letras y símbolos", self.prueba_telefono),
            ("Nombre solo texto", "El nombre descarta números y símbolos", self.prueba_nombre),
            ("Validacion del formulario", "No deja enviar sin nombre", self.prueba_validacion),
            ("Carta digital", "La carta muestra los platos", self.prueba_carta),
            ("Acceso administrador", "La página de acceso carga", self.prueba_admin),
        ]
        try:
            for nombre, descripcion, prueba in lista:
                self.ejecutar(nombre, descripcion, prueba)
        finally:
            self.driver.quit()
        return self.resultados


# --- reporte PDF ----------------------------------------------------------
COLORES = {"APROBADA": (34, 139, 34), "FALLIDA": (200, 30, 30), "ERROR": (220, 120, 0)}


def texto(t):
    # Las fuentes base de PDF usan latin-1: se reemplaza lo que no quepa
    return str(t).encode("latin-1", "replace").decode("latin-1")


def generar_pdf(resultados, url):
    fecha = datetime.now()
    ruta = CARPETA_REPORTES / f"reporte_selenium_{fecha:%Y%m%d_%H%M%S}.pdf"
    aprobadas = sum(r["estado"] == "APROBADA" for r in resultados)

    pdf = FPDF()
    pdf.set_auto_page_break(True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, texto("Konys Pizza - Reporte de pruebas Selenium"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, texto(f"Fecha: {fecha:%d/%m/%Y %H:%M:%S}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, texto(f"URL probada: {url}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, texto(f"Navegador: Google Chrome (Selenium WebDriver)"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 13)
    color = COLORES["APROBADA"] if aprobadas == len(resultados) else COLORES["FALLIDA"]
    pdf.set_text_color(*color)
    pdf.cell(0, 9, texto(f"Resultado: {aprobadas} de {len(resultados)} pruebas aprobadas"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)

    # Tabla resumen
    anchos = (10, 62, 28, 20, 70)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(230, 230, 230)
    for ancho, titulo in zip(anchos, ("#", "Prueba", "Estado", "Tiempo", "Descripción")):
        pdf.cell(ancho, 8, texto(titulo), border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for i, r in enumerate(resultados, 1):
        pdf.cell(anchos[0], 7, str(i), border=1)
        pdf.cell(anchos[1], 7, texto(r["nombre"]), border=1)
        pdf.set_text_color(*COLORES[r["estado"]])
        pdf.cell(anchos[2], 7, r["estado"], border=1)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(anchos[3], 7, f"{r['duracion']:.1f} s", border=1)
        pdf.cell(anchos[4], 7, texto(r["descripcion"][:42]), border=1)
        pdf.ln()

    # Detalle con captura de cada prueba
    for i, r in enumerate(resultados, 1):
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 9, texto(f"{i}. {r['nombre']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*COLORES[r["estado"]])
        pdf.cell(0, 7, texto(f"{r['estado']}  ({r['duracion']:.1f} s)"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, texto(f"Objetivo: {r['descripcion']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 6, texto(f"Resultado: {r['detalle']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        if r["captura"].exists():
            pdf.image(str(r["captura"]), w=pdf.epw)

    pdf.output(str(ruta))
    return ruta


def main():
    parser = argparse.ArgumentParser(description="Pruebas Selenium de Konys Pizza")
    parser.add_argument("--url", default="http://localhost:5173", help="URL de la web a probar")
    parser.add_argument("--visible", action="store_true", help="Mostrar el navegador mientras se prueba")
    args = parser.parse_args()

    print(f"Probando {args.url} ...\n")
    resultados = Pruebas(args.url, args.visible).correr()
    ruta = generar_pdf(resultados, args.url)
    aprobadas = sum(r["estado"] == "APROBADA" for r in resultados)
    print(f"\n{aprobadas}/{len(resultados)} pruebas aprobadas")
    print(f"Reporte PDF: {ruta}")
    raise SystemExit(0 if aprobadas == len(resultados) else 1)


if __name__ == "__main__":
    main()
