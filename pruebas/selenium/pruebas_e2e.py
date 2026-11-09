"""Pruebas end-to-end de toda la web de Konys Pizza con Selenium.

Abre Chrome, recorre el sitio del cliente (inicio, mesas, reserva, carta,
comprobante), el panel de administración, la vista móvil y revisiones de
calidad (imágenes, consola, enlaces). Al final genera un PDF con los
resultados y una captura por prueba en pruebas/selenium/reportes/.

Las pruebas NO crean, editan ni borran datos: solo navegan, leen y validan
formularios sin enviarlos. Así no ensucian la base de datos.

Uso:
    1) npm run dev                      (en otra terminal)
    2) python -m pip install -r pruebas/selenium/requirements.txt
    3) python pruebas/selenium/pruebas_e2e.py
       Opciones: --url http://localhost:5173   --visible (ver el navegador)

Panel admin con sesión (opcional): define estas variables de entorno con un
usuario de pruebas; si no están, esas pruebas salen como OMITIDA.
    KONYS_ADMIN_USUARIO, KONYS_ADMIN_PASSWORD
"""
import argparse
import json
import os
import time
import traceback
import urllib.request
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
ESCRITORIO = (1366, 900)
MOVIL = (390, 844)


class Omitida(Exception):
    """La prueba no aplica en esta ejecución (por ejemplo, faltan credenciales)."""


class Pruebas:
    def __init__(self, url, visible):
        opciones = webdriver.ChromeOptions()
        if not visible:
            opciones.add_argument("--headless=new")
        opciones.add_argument(f"--window-size={ESCRITORIO[0]},{ESCRITORIO[1]}")
        opciones.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        self.driver = webdriver.Chrome(options=opciones)
        self.url = url.rstrip("/")
        self.esperar = WebDriverWait(self.driver, ESPERA)
        self.resultados = []
        self.seccion = ""
        self.carpeta_capturas = CARPETA_REPORTES / "capturas"
        self.carpeta_capturas.mkdir(parents=True, exist_ok=True)
        self.usuario = os.environ.get("KONYS_ADMIN_USUARIO")
        self.password = os.environ.get("KONYS_ADMIN_PASSWORD")

    # --- utilidades -------------------------------------------------------
    def ir(self, ruta, recargar=False):
        self.driver.get(self.url + ruta)
        if recargar:  # cambiar solo el #hash no recarga la página
            self.driver.refresh()

    def buscar(self, selector, espera=ESPERA):
        return WebDriverWait(self.driver, espera).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))

    def existe(self, selector):
        return self.esperar.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))

    def todos(self, selector):
        return self.driver.find_elements(By.CSS_SELECTOR, selector)

    def clic(self, elemento):
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'}); arguments[0].click()", elemento)

    def ver(self, elemento):
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'})", elemento)

    def esperar_ruta(self, ruta):
        self.esperar.until(lambda d: d.execute_script("return location.pathname") == ruta)

    def tamano(self, ancho_alto):
        # Chrome no deja achicar la ventana a 390 px: se emula la pantalla del celular
        if ancho_alto == MOVIL:
            self.driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
                "width": MOVIL[0], "height": MOVIL[1], "deviceScaleFactor": 1, "mobile": True})
        else:
            self.driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})

    def capturar(self, nombre):
        ruta = self.carpeta_capturas / f"{len(self.resultados) + 1:02d}_{nombre}.png"
        self.driver.save_screenshot(str(ruta))
        return ruta

    def ejecutar(self, nombre, descripcion, prueba):
        movil = nombre in ("Menú móvil", "Sin scroll horizontal", "Reserva en móvil")
        inicio = time.perf_counter()
        try:
            detalle = prueba() or "OK"
            estado = "APROBADA"
        except Omitida as motivo:
            estado, detalle = "OMITIDA", str(motivo)
        except AssertionError as error:
            estado, detalle = "FALLIDA", str(error) or "La verificación no se cumplió"
        except Exception as error:  # elemento no encontrado, timeout, etc.
            mensaje = str(error).splitlines()[0] if str(error).strip() else "tiempo de espera agotado"
            estado, detalle = "ERROR", f"{type(error).__name__}: {mensaje}"
            traceback.print_exc()
        duracion = time.perf_counter() - inicio
        captura = None if estado == "OMITIDA" else self.capturar(nombre.lower().replace(" ", "_")[:40])
        if movil:
            self.tamano(ESCRITORIO)
        self.resultados.append({
            "seccion": self.seccion, "nombre": nombre, "descripcion": descripcion,
            "estado": estado, "detalle": detalle, "duracion": duracion, "captura": captura,
        })
        print(f"[{estado:8}] {self.seccion} > {nombre} ({duracion:.1f}s) - {detalle}")

    def abrir_modal(self):
        self.ir("/", recargar=True)
        self.clic(self.buscar(".tarjeta-mesa__accion"))
        return self.buscar(".modal")

    def iniciar_sesion(self):
        if not (self.usuario and self.password):
            raise Omitida("Define KONYS_ADMIN_USUARIO y KONYS_ADMIN_PASSWORD para probar el panel con sesión")
        self.ir("/admin")
        self.buscar(".acceso__formulario")
        if self.driver.execute_script("return location.pathname") != "/admin":
            return  # ya había sesión y redirigió al panel
        self.buscar("input[autocomplete='username']").send_keys(self.usuario)
        self.buscar("#clave").send_keys(self.password)
        self.clic(self.buscar(".acceso__formulario button[type='submit']"))
        self.esperar_ruta("/admin/reservas")
        self.buscar(".admin__contenido h1")

    # --- 1. Inicio --------------------------------------------------------
    def inicio_carga(self):
        self.ir("/")
        self.buscar(".hero__titulo")
        assert "konys" in self.driver.title.lower(), f"Título inesperado: {self.driver.title}"
        return f"Título: '{self.driver.title}'"

    def inicio_hero(self):
        self.ir("/")
        botones = [b.text.strip() for b in self.todos(".hero__acciones .boton")]
        chips = self.todos(".chip-horario")
        foto = self.buscar(".hero__foto img")
        assert len(botones) == 3, f"Se esperaban 3 botones en el hero, hay {len(botones)}"
        assert chips, "No se muestra el horario de atención"
        assert foto.get_attribute("alt"), "La foto principal no tiene texto alternativo"
        return f"Botones: {', '.join(botones)} · {len(chips)} chips de horario"

    def inicio_pasos(self):
        self.ir("/")
        pasos = self.todos(".paso__titulo")
        self.ver(pasos[0])
        assert len(pasos) == 3, f"Se esperaban 3 pasos, hay {len(pasos)}"
        return "Pasos: " + " → ".join(p.text for p in pasos)

    def inicio_secciones(self):
        self.ir("/")
        visitanos = self.buscar("#titulo-visitanos")
        self.buscar(".antojo__titulo")
        self.buscar("#titulo-detalles")
        self.ver(visitanos)
        return f"Visítanos ('{visitanos.text}'), Antojo y Congelados y detalles se muestran"

    def inicio_pie(self):
        self.ir("/")
        pie = self.buscar("#contacto")
        self.ver(pie)
        titulos = [t.text.title() for t in self.todos(".pie__titulo")]  # el CSS los pone en mayúsculas
        enlaces = self.todos(".pie__dato[href]")
        whatsapp = [e for e in enlaces if "wa.me" in e.get_attribute("href") or "whatsapp" in e.get_attribute("href")]
        assert {"Visítanos", "Horario", "Contacto"} <= set(titulos), f"Faltan columnas en el pie: {titulos}"
        assert whatsapp, "El pie no tiene enlace de WhatsApp"
        return f"Columnas: {', '.join(titulos)} · {len(enlaces)} enlaces de contacto"

    # --- 2. Navegación ----------------------------------------------------
    def nav_menu(self):
        self.ir("/")
        enlaces = [e.text for e in self.todos(".encabezado__nav .encabezado__enlace")]
        assert enlaces == ["Inicio", "Mesas", "Carta", "Contacto"], f"Menú inesperado: {enlaces}"
        return "Menú: " + ", ".join(enlaces)

    def nav_a_carta(self):
        self.ir("/")
        enlace = next(e for e in self.todos(".encabezado__enlace") if e.text == "Carta")
        self.clic(enlace)
        self.esperar_ruta("/carta")
        self.buscar(".carta__titulo")
        return "El enlace 'Carta' lleva a /carta sin recargar"

    def nav_reservar(self):
        self.ir("/carta")
        self.clic(self.buscar(".encabezado__nav .boton--pequeno"))
        self.esperar_ruta("/")
        mesas = self.buscar("#mesas")
        self.esperar.until(lambda d: abs(d.execute_script(
            "return arguments[0].getBoundingClientRect().top", mesas)) < 300)
        return "El botón 'Reservar' vuelve al inicio y baja a la sección de mesas"

    def nav_logo(self):
        self.ir("/carta")
        self.clic(self.buscar(".encabezado__logo"))
        self.esperar_ruta("/")
        self.buscar(".hero__titulo")
        return "El logo KONYS lleva al inicio"

    def nav_ruta_desconocida(self):
        self.ir("/esta-pagina-no-existe")
        self.buscar(".hero__titulo")
        return "Una ruta inexistente muestra el inicio en vez de una página rota"

    def nav_atras(self):
        self.ir("/")
        self.clic(next(e for e in self.todos(".encabezado__enlace") if e.text == "Carta"))
        self.esperar_ruta("/carta")
        self.driver.back()
        self.esperar_ruta("/")
        self.buscar(".hero__titulo")
        return "El botón Atrás del navegador vuelve al inicio"

    # --- 3. Mesas ---------------------------------------------------------
    def mesas_listado(self):
        self.ir("/#mesas", recargar=True)
        self.buscar(".tarjeta-mesa__nombre")
        nombres = [m.text for m in self.todos(".tarjeta-mesa__nombre")]
        estados = [e.text for e in self.todos(".tarjeta-mesa .estado")]
        self.ver(self.todos(".tarjeta-mesa")[0])
        assert nombres, "No se mostró ninguna mesa"
        assert len(estados) == len(nombres), "Alguna mesa no muestra su estado (Libre/Ocupada)"
        return f"{len(nombres)} mesas: " + ", ".join(f"{n} ({e})" for n, e in zip(nombres, estados))

    def mesas_filtro(self):
        self.ir("/#mesas", recargar=True)
        self.buscar(".tarjeta-mesa")
        total = len(self.todos(".tarjeta-mesa"))
        conteo = {}
        for opcion in self.todos(".selector-pastilla__opcion"):
            self.clic(opcion)
            time.sleep(0.3)
            assert opcion.get_attribute("aria-pressed") == "true", f"El filtro '{opcion.text}' no quedó activo"
            zona = opcion.text
            tarjetas = self.todos(".tarjeta-mesa__capacidad")
            if zona != "Todas":
                otras = [t.text for t in tarjetas if not t.text.startswith(zona)]
                assert not otras, f"Con el filtro '{zona}' aparecen mesas de otra zona: {otras}"
            conteo[zona] = len(tarjetas)
        assert conteo.get("Todas") == total, "El filtro 'Todas' no muestra todas las mesas"
        return "Mesas por filtro: " + ", ".join(f"{z}: {n}" for z, n in conteo.items())

    # --- 4. Reserva -------------------------------------------------------
    def reserva_modal(self):
        self.abrir_modal()
        titulo = self.buscar("#titulo-reserva").text
        self.buscar(".slot, .horas__vacio")
        slots = self.todos(".slot")
        return f"Se abrió '{titulo}' con {len(slots)} horarios para el primer día disponible"

    def reserva_calendario(self):
        self.abrir_modal()
        self.buscar(".slot, .horas__vacio")
        antes = self.buscar(".paso-titulo__extra").text
        dias = [d for d in self.todos(".modal__izquierda button") if d.text.strip().isdigit()
                and d.is_enabled() and d.get_attribute("aria-pressed") != "true"]
        assert dias, "No hay otro día habilitado para elegir"
        self.clic(dias[0])
        self.esperar.until(lambda d: self.buscar(".paso-titulo__extra").text != antes)
        self.buscar(".slot, .horas__vacio")
        return f"Al cambiar de día el título pasó de '{antes.strip(' ·')}' a '{self.buscar('.paso-titulo__extra').text.strip(' ·')}'"

    def reserva_hora(self):
        self.abrir_modal()
        self.buscar(".slot, .horas__vacio")
        libres = [s for s in self.todos(".slot") if s.get_attribute("aria-disabled") == "false"]
        if not libres:
            raise Omitida("No hay horarios libres ese día para elegir")
        self.clic(libres[0])
        assert libres[0].get_attribute("aria-pressed") == "true", "El horario no quedó marcado como elegido"
        return f"Se eligió la hora {libres[0].text} y quedó marcada"

    def reserva_telefono(self):
        self.abrir_modal()
        campo = self.buscar("input[type='tel']")
        campo.send_keys("300abc12-3 45xyz67")
        valor = campo.get_attribute("value")
        assert valor == "3001234567", f"El teléfono quedó como '{valor}', se esperaba '3001234567'"
        return f"Se escribió '300abc12-3 45xyz67' y el campo quedó '{valor}'"

    def reserva_nombre(self):
        self.abrir_modal()
        campo = self.buscar("input[autocomplete='name']")
        campo.send_keys("María123 Pérez#$")
        valor = campo.get_attribute("value")
        assert valor == "María Pérez", f"El nombre quedó como '{valor}', se esperaba 'María Pérez'"
        return f"Se escribió 'María123 Pérez#$' y el campo quedó '{valor}'"

    def reserva_personas(self):
        self.abrir_modal()
        mas = self.buscar("button[aria-label='Agregar una persona']")
        menos = self.buscar("button[aria-label='Quitar una persona']")
        campo = self.buscar("#personas")
        maximo = int(campo.get_attribute("max"))
        for _ in range(maximo + 2):
            self.clic(mas)
        assert int(campo.get_attribute("value")) == maximo, "El contador pasó la capacidad de la mesa"
        assert not mas.is_enabled(), "El botón + sigue activo en el máximo"
        for _ in range(maximo + 2):
            self.clic(menos)
        assert int(campo.get_attribute("value")) == 1, "El contador bajó de 1 persona"
        return f"El número de personas se mantiene entre 1 y {maximo} (capacidad de la mesa)"

    def reserva_sin_nombre(self):
        self.abrir_modal()
        self.buscar(".slot, .horas__vacio")
        self.clic(self.buscar(".modal button[type='submit']"))
        error = self.buscar(".texto-error")
        assert "nombre" in error.text.lower(), f"Mensaje inesperado: '{error.text}'"
        return f"Sin nombre muestra: '{error.text}' (no se envió nada)"

    def reserva_sin_hora(self):
        self.abrir_modal()
        self.buscar(".slot, .horas__vacio")
        self.buscar("input[autocomplete='name']").send_keys("Prueba Selenium")
        self.clic(self.buscar(".modal button[type='submit']"))
        aviso = self.buscar(".modal .alerta")
        assert "hora" in aviso.text.lower(), f"Mensaje inesperado: '{aviso.text}'"
        return f"Sin hora muestra: '{aviso.text}' (no se envió nada)"

    def reserva_cerrar(self):
        self.abrir_modal()
        self.clic(self.buscar(".modal .boton-cerrar"))
        self.esperar.until(lambda d: not self.todos(".modal"))
        self.abrir_modal()
        self.buscar(".modal-fondo").send_keys("")  # tecla Escape
        self.esperar.until(lambda d: not self.todos(".modal"))
        return "El modal se cierra con la X y con la tecla Escape"

    # --- 5. Carta ---------------------------------------------------------
    def carta_carga(self):
        self.ir("/carta")
        self.buscar(".carta__titulo")
        self.buscar(".plato")
        secciones = self.todos(".seccion-carta")
        platos = self.todos(".plato")
        assert platos, "La carta no tiene platos"
        return f"{len(platos)} platos en {len(secciones)} categorías"

    def carta_categorias(self):
        self.ir("/carta")
        self.buscar(".categoria-pastilla")
        pastillas = self.todos(".categoria-pastilla")
        ultima = pastillas[-1]
        destino = ultima.get_attribute("href").split("#")[1]
        self.clic(ultima)
        assert "categoria-pastilla--activa" in ultima.get_attribute("class"), "La categoría no quedó activa"
        seccion = self.buscar(f"#{destino}")
        self.esperar.until(lambda d: abs(d.execute_script(
            "return arguments[0].getBoundingClientRect().top", seccion)) < 400)
        return "Categorías: " + ", ".join(p.text for p in pastillas) + f" · el clic en '{ultima.text}' baja a su sección"

    def carta_platos(self):
        self.ir("/carta")
        self.buscar(".plato")
        incompletos, pendientes = [], []
        for plato in self.todos(".plato"):
            nombre = plato.find_element(By.CSS_SELECTOR, ".plato__nombre").get_attribute("textContent").strip()
            precio = plato.find_element(By.CSS_SELECTOR, ".plato__precio")
            if not nombre or not precio.get_attribute("textContent").strip():
                incompletos.append(nombre or "(sin nombre)")
            elif "plato__precio--pendiente" in precio.get_attribute("class"):
                pendientes.append(nombre)  # sin precio a propósito: la web lo marca como pendiente
        self.ver(self.todos(".plato")[0])
        assert not incompletos, f"Platos sin nombre o sin precio visible: {incompletos[:5]}"
        extra = f" · {len(pendientes)} con precio pendiente: {', '.join(pendientes)}" if pendientes else ""
        return f"Los {len(self.todos('.plato'))} platos muestran nombre y precio{extra}"

    # --- 6. Comprobante ---------------------------------------------------
    def confirmacion_vacia(self):
        self.ir("/")
        self.driver.execute_script("sessionStorage.removeItem('konys_reserva')")
        self.ir("/reserva-confirmada")
        titulo = self.buscar(".ticket__titulo").text
        assert "no encontramos" in titulo.lower(), f"Título inesperado: '{titulo}'"
        return f"Sin reserva muestra: '{titulo}' con botón para reservar"

    def confirmacion_ticket(self):
        # Reserva ficticia solo en el navegador: no toca la base de datos
        reserva = {
            "id": 999, "cliente_nombre": "Prueba Selenium", "cliente_contacto": "3001234567",
            "num_personas": 2, "fecha": datetime.now().strftime("%Y-%m-%d"),
            "hora_inicio": "19:00", "hora_fin": "20:00", "estado": "confirmada",
            "mesa": {"id": 1, "nombre": "Mesa de prueba", "zona": "terraza"},
        }
        self.ir("/")
        self.driver.execute_script("sessionStorage.setItem('konys_reserva', arguments[0])", json.dumps(reserva))
        self.ir("/reserva-confirmada")
        titulo = self.buscar("#titulo-ticket").text
        datos = self.buscar(".ticket__datos").text
        self.driver.execute_script("sessionStorage.removeItem('konys_reserva')")
        assert "Prueba" in titulo, f"El ticket no saluda al cliente: '{titulo}'"
        assert "N.º 999" in datos and "Mesa de prueba" in datos, "El ticket no muestra los datos de la reserva"
        return f"El comprobante muestra '{titulo}' con nombre, mesa, fecha, hora, personas y número"

    # --- 7. Administración ------------------------------------------------
    def admin_acceso(self):
        self.ir("/admin")
        self.buscar(".acceso__formulario")
        assert self.buscar("#clave").get_attribute("type") == "password", "La contraseña se ve en texto plano"
        return "El acceso pide usuario y contraseña (oculta)"

    def admin_ver_clave(self):
        self.ir("/admin")
        clave = self.buscar("#clave")
        clave.send_keys("abc")
        self.clic(self.buscar("button[aria-label='Mostrar contraseña']"))
        assert clave.get_attribute("type") == "text", "El botón del ojo no muestra la contraseña"
        self.clic(self.buscar("button[aria-label='Ocultar contraseña']"))
        assert clave.get_attribute("type") == "password", "El botón del ojo no vuelve a ocultarla"
        return "El botón del ojo muestra y oculta la contraseña"

    def admin_vacio(self):
        self.ir("/admin")
        self.clic(self.buscar(".acceso__formulario button[type='submit']"))
        aviso = self.buscar(".acceso__formulario .alerta").text
        assert "usuario" in aviso.lower(), f"Mensaje inesperado: '{aviso}'"
        return f"Sin datos muestra: '{aviso}'"

    def admin_incorrecto(self):
        self.ir("/admin")
        self.buscar("input[autocomplete='username']").send_keys("usuario_que_no_existe_selenium")
        self.buscar("#clave").send_keys("clave-incorrecta-123")
        self.clic(self.buscar(".acceso__formulario button[type='submit']"))
        aviso = self.buscar(".acceso__formulario .alerta").text
        assert "incorrect" in aviso.lower(), f"Mensaje inesperado: '{aviso}'"
        assert self.driver.execute_script("return location.pathname") == "/admin", "Entró al panel con datos falsos"
        return f"Con datos falsos muestra: '{aviso}' y no entra"

    def admin_protegido(self):
        rutas = ["/admin/reservas", "/admin/mesas", "/admin/horarios", "/admin/carta"]
        for ruta in rutas:
            self.ir(ruta)
            self.esperar_ruta("/admin")
            self.buscar(".acceso__formulario")
        return "Sin sesión, " + ", ".join(rutas) + " redirigen al login"

    def admin_volver(self):
        self.ir("/admin")
        self.clic(self.buscar(".acceso__volver"))
        self.esperar_ruta("/")
        self.buscar(".hero__titulo")
        return "'Volver al sitio' regresa al inicio"

    def admin_seccion(self, clave, titulo):
        def prueba():
            self.iniciar_sesion()
            self.ir(f"/admin/{clave}")
            h1 = self.buscar(".admin__contenido h1")
            self.buscar(".admin__contenido .tabla, .admin__contenido .tarjeta-item, .admin__contenido .tabla__vacia")
            assert titulo.lower() in h1.text.lower(), f"Título inesperado: '{h1.text}'"
            filas = len(self.todos(".admin__contenido .tabla tbody tr"))
            return f"La sección {titulo} carga con {filas} filas"
        return prueba

    def admin_salir(self):
        self.iniciar_sesion()
        self.clic(self.buscar(".admin__lateral .admin__salir"))
        self.esperar_ruta("/admin")
        self.ir("/admin/reservas")
        self.esperar_ruta("/admin")
        return "Cerrar sesión vuelve al login y el panel queda bloqueado"

    # --- 8. Móvil ---------------------------------------------------------
    def movil_menu(self):
        self.tamano(MOVIL)
        self.ir("/", recargar=True)
        boton = self.buscar(".encabezado__menu-boton")
        self.clic(boton)
        self.buscar(".encabezado__nav--abierto")
        assert boton.get_attribute("aria-expanded") == "true", "El menú no indica que está abierto"
        enlaces = [e.text for e in self.todos(".encabezado__nav--abierto .encabezado__enlace") if e.is_displayed()]
        self.clic(boton)
        assert boton.get_attribute("aria-expanded") == "false", "El menú no se cierra"
        self.clic(boton)  # se deja abierto para la captura del reporte
        self.buscar(".encabezado__nav--abierto")
        return "En móvil el botón ☰ abre el menú con: " + ", ".join(enlaces)

    def movil_sin_scroll(self):
        self.tamano(MOVIL)
        desbordadas = []
        for ruta in ["/", "/carta", "/admin", "/reserva-confirmada"]:
            self.ir(ruta, recargar=True)
            self.existe("h1")
            time.sleep(0.5)
            ancho = self.driver.execute_script(
                "return [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            if ancho[0] > ancho[1] + 1:
                desbordadas.append(f"{ruta} ({ancho[0]}px > {ancho[1]}px)")
        assert not desbordadas, "Páginas con scroll horizontal en móvil: " + ", ".join(desbordadas)
        return "Inicio, carta, admin y comprobante caben en 390 px sin scroll horizontal"

    def movil_reserva(self):
        self.tamano(MOVIL)
        self.abrir_modal()
        ancho = self.driver.execute_script("return document.querySelector('.modal').getBoundingClientRect().width")
        self.buscar(".slot, .horas__vacio")
        assert ancho >= MOVIL[0] - 40, f"El modal no ocupa la pantalla en móvil ({ancho:.0f}px)"
        return f"En móvil la reserva ocupa toda la pantalla ({ancho:.0f}px de ancho)"

    # --- 9. Calidad -------------------------------------------------------
    def calidad_imagenes(self):
        rotas = []
        total = 0
        for ruta in ["/", "/carta"]:
            self.ir(ruta, recargar=True)
            self.buscar("h1")
            self.buscar(".plato" if ruta == "/carta" else ".tarjeta-mesa")
            # Fuerza la carga de las imágenes diferidas (loading=lazy)
            self.driver.execute_script("document.querySelectorAll('img').forEach(i => i.loading = 'eager')")
            self.esperar.until(lambda d: d.execute_script(
                "return [...document.images].every(i => i.complete)"))
            imagenes = self.driver.execute_script(
                "return [...document.images].map(i => [i.currentSrc || i.src, i.naturalWidth])")
            total += len(imagenes)
            rotas += [f"{ruta}: {src}" for src, ancho in imagenes if ancho == 0]
        assert not rotas, f"{len(rotas)} imágenes rotas: {rotas[:5]}"
        return f"Las {total} imágenes de inicio y carta cargan correctamente"

    def calidad_consola(self):
        self.driver.get_log("browser")  # descarta lo anterior
        for ruta in ["/", "/carta", "/admin", "/reserva-confirmada"]:
            self.ir(ruta, recargar=True)
            self.existe("h1")
            time.sleep(1)
        errores = [l["message"] for l in self.driver.get_log("browser")
                   if l["level"] == "SEVERE" and "/api/admin/sesion" not in l["message"]]
        assert not errores, f"{len(errores)} errores en consola: {errores[:3]}"
        return "Sin errores de JavaScript en consola (se ignora el 401 esperado de /api/admin/sesion)"

    def calidad_enlaces(self):
        self.ir("/", recargar=True)
        self.buscar(".tarjeta-mesa")
        externos = self.driver.execute_script(
            "return [...document.querySelectorAll('a[href^=\"http\"]')].map(a => [a.href, a.target, a.rel])")
        malos = [h for h, t, r in externos if t != "_blank" or "noreferrer" not in r]
        assert externos, "No se encontraron enlaces externos"
        assert not malos, f"Enlaces externos sin target=_blank/noreferrer: {malos}"
        dominios = sorted({h.split("/")[2] for h, _, _ in externos})
        return f"{len(externos)} enlaces externos abren en pestaña nueva de forma segura ({', '.join(dominios)})"

    def calidad_api(self):
        self.ir("/")
        respuestas = self.driver.execute_async_script("""
            const listo = arguments[arguments.length - 1];
            Promise.all(['/api/mesas', '/api/horarios', '/api/platos', '/api/admin/reservas'].map(
              r => fetch(r).then(x => [r, x.status]).catch(() => [r, 0])
            )).then(listo);
        """)
        estados = dict(respuestas)
        publicas = {r: s for r, s in estados.items() if not r.startswith("/api/admin")}
        assert all(s == 200 for s in publicas.values()), f"API pública con errores: {publicas}"
        assert estados["/api/admin/reservas"] == 401, f"La API admin responde {estados['/api/admin/reservas']} sin sesión"
        return "API pública: " + ", ".join(f"{r} {s}" for r, s in publicas.items()) + " · /api/admin/reservas sin sesión: 401"

    def calidad_tiempo(self):
        tiempos = {}
        for ruta in ["/", "/carta"]:
            self.ir("/admin")  # sale de la página para medir una carga completa
            inicio = time.perf_counter()
            self.ir(ruta)
            self.buscar(".tarjeta-mesa" if ruta == "/" else ".plato")
            tiempos[ruta] = round((time.perf_counter() - inicio) * 1000)
        lentas = {r: t for r, t in tiempos.items() if t > 5000}
        assert not lentas, f"Páginas que tardan más de 5 s en cargar: {lentas}"
        return "Tiempo de carga: " + ", ".join(f"{r} {t} ms" for r, t in tiempos.items())

    # --- ejecución --------------------------------------------------------
    def correr(self):
        plan = {
            "Inicio": [
                ("Carga del inicio", "La página principal abre con su título", self.inicio_carga),
                ("Portada", "Botones, horario y foto principal", self.inicio_hero),
                ("Pasos para reservar", "Se muestran los 3 pasos", self.inicio_pasos),
                ("Secciones informativas", "Visítanos, menú y detalles", self.inicio_secciones),
                ("Pie de página", "Dirección, horario y contacto", self.inicio_pie),
            ],
            "Navegación": [
                ("Menú principal", "Enlaces del encabezado", self.nav_menu),
                ("Ir a la carta", "El menú lleva a /carta", self.nav_a_carta),
                ("Botón Reservar", "Lleva a la sección de mesas", self.nav_reservar),
                ("Logo", "El logo lleva al inicio", self.nav_logo),
                ("Ruta inexistente", "Una URL inválida no rompe la web", self.nav_ruta_desconocida),
                ("Botón Atrás", "El historial del navegador funciona", self.nav_atras),
            ],
            "Mesas": [
                ("Listado de mesas", "Mesas con su estado desde la API", self.mesas_listado),
                ("Filtro por zona", "Todas, Terraza y Salón filtran bien", self.mesas_filtro),
            ],
            "Reserva": [
                ("Abrir reserva", "Se abre el modal con horarios", self.reserva_modal),
                ("Cambiar de día", "El calendario carga otro día", self.reserva_calendario),
                ("Elegir hora", "Un horario libre queda marcado", self.reserva_hora),
                ("Teléfono solo números", "El teléfono descarta letras y símbolos", self.reserva_telefono),
                ("Nombre solo texto", "El nombre descarta números y símbolos", self.reserva_nombre),
                ("Número de personas", "El contador respeta la capacidad", self.reserva_personas),
                ("Validación sin nombre", "No deja enviar sin nombre", self.reserva_sin_nombre),
                ("Validación sin hora", "No deja enviar sin hora", self.reserva_sin_hora),
                ("Cerrar reserva", "Se cierra con la X y con Escape", self.reserva_cerrar),
            ],
            "Carta": [
                ("Carga de la carta", "Platos agrupados por categoría", self.carta_carga),
                ("Categorías", "Las pastillas llevan a cada sección", self.carta_categorias),
                ("Datos de los platos", "Cada plato tiene nombre y precio", self.carta_platos),
            ],
            "Comprobante": [
                ("Sin reserva", "Mensaje cuando no hay reserva", self.confirmacion_vacia),
                ("Ticket de reserva", "El comprobante muestra los datos", self.confirmacion_ticket),
            ],
            "Administración": [
                ("Pantalla de acceso", "Formulario de usuario y contraseña", self.admin_acceso),
                ("Mostrar contraseña", "El botón del ojo funciona", self.admin_ver_clave),
                ("Acceso sin datos", "Pide usuario y contraseña", self.admin_vacio),
                ("Acceso incorrecto", "Rechaza credenciales falsas", self.admin_incorrecto),
                ("Rutas protegidas", "El panel exige sesión", self.admin_protegido),
                ("Volver al sitio", "Enlace de regreso al inicio", self.admin_volver),
                ("Panel: Reservas", "Sección de reservas con sesión", self.admin_seccion("reservas", "Reservas")),
                ("Panel: Mesas", "Sección de mesas con sesión", self.admin_seccion("mesas", "Mesas")),
                ("Panel: Horarios", "Sección de horarios con sesión", self.admin_seccion("horarios", "Horarios")),
                ("Panel: Carta", "Sección de carta con sesión", self.admin_seccion("carta", "Carta")),
                ("Cerrar sesión", "Salir bloquea el panel", self.admin_salir),
            ],
            "Móvil": [
                ("Menú móvil", "El botón ☰ abre y cierra el menú", self.movil_menu),
                ("Sin scroll horizontal", "Las páginas caben en el celular", self.movil_sin_scroll),
                ("Reserva en móvil", "El modal ocupa toda la pantalla", self.movil_reserva),
            ],
            "Calidad": [
                ("Imágenes", "Ninguna imagen rota", self.calidad_imagenes),
                ("Consola", "Sin errores de JavaScript", self.calidad_consola),
                ("Enlaces externos", "Abren en pestaña nueva y seguros", self.calidad_enlaces),
                ("API", "Endpoints públicos y protección del admin", self.calidad_api),
                ("Velocidad", "Página y datos visibles en menos de 5 s", self.calidad_tiempo),
            ],
        }
        try:
            for seccion, pruebas in plan.items():
                self.seccion = seccion
                for nombre, descripcion, prueba in pruebas:
                    self.ejecutar(nombre, descripcion, prueba)
        finally:
            self.driver.quit()
        return self.resultados


# --- reporte PDF ----------------------------------------------------------
COLORES = {"APROBADA": (34, 139, 34), "FALLIDA": (200, 30, 30), "ERROR": (220, 120, 0), "OMITIDA": (110, 110, 110)}


def texto(t):
    # Las fuentes base de PDF usan latin-1: se reemplaza lo que no quepa
    return str(t).replace("→", "->").replace("☰", "menu").encode("latin-1", "replace").decode("latin-1")


def generar_pdf(resultados, url):
    fecha = datetime.now()
    ruta = CARPETA_REPORTES / f"reporte_selenium_{fecha:%Y%m%d_%H%M%S}.pdf"
    cuenta = {e: sum(r["estado"] == e for r in resultados) for e in COLORES}
    ejecutadas = len(resultados) - cuenta["OMITIDA"]

    pdf = FPDF()
    pdf.set_auto_page_break(True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 12, texto("Konys Pizza - Reporte de pruebas Selenium"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, texto(f"Fecha: {fecha:%d/%m/%Y %H:%M:%S}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, texto(f"URL probada: {url}"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, texto("Navegador: Google Chrome (Selenium WebDriver)"), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, texto(f"Duración total: {sum(r['duracion'] for r in resultados):.1f} s"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*(COLORES["APROBADA"] if cuenta["APROBADA"] == ejecutadas else COLORES["FALLIDA"]))
    pdf.cell(0, 8, texto(f"Resultado: {cuenta['APROBADA']} de {ejecutadas} pruebas aprobadas"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, texto(" · ".join(f"{e}: {n}" for e, n in cuenta.items())), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # Resumen por sección
    secciones = list(dict.fromkeys(r["seccion"] for r in resultados))
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(230, 230, 230)
    for ancho, titulo in zip((60, 30, 30, 30, 30), ("Sección", "Aprobadas", "Fallidas", "Errores", "Omitidas")):
        pdf.cell(ancho, 7, texto(titulo), border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 10)
    for s in secciones:
        grupo = [r for r in resultados if r["seccion"] == s]
        pdf.cell(60, 6, texto(s), border=1)
        for estado in ("APROBADA", "FALLIDA", "ERROR", "OMITIDA"):
            pdf.cell(30, 6, str(sum(r["estado"] == estado for r in grupo)), border=1)
        pdf.ln()
    pdf.ln(4)

    # Detalle de todas las pruebas
    anchos = (9, 28, 48, 24, 16, 65)
    pdf.set_font("Helvetica", "B", 9)
    for ancho, titulo in zip(anchos, ("#", "Sección", "Prueba", "Estado", "Tiempo", "Objetivo")):
        pdf.cell(ancho, 7, texto(titulo), border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    for i, r in enumerate(resultados, 1):
        pdf.cell(anchos[0], 6, str(i), border=1)
        pdf.cell(anchos[1], 6, texto(r["seccion"]), border=1)
        pdf.cell(anchos[2], 6, texto(r["nombre"]), border=1)
        pdf.set_text_color(*COLORES[r["estado"]])
        pdf.cell(anchos[3], 6, r["estado"], border=1)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(anchos[4], 6, f"{r['duracion']:.1f} s", border=1)
        pdf.cell(anchos[5], 6, texto(r["descripcion"][:44]), border=1)
        pdf.ln()

    # Una página por prueba con su resultado y captura
    for i, r in enumerate(resultados, 1):
        pdf.add_page()
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(110, 110, 110)
        pdf.cell(0, 6, texto(r["seccion"].upper()), new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
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
        if r["captura"] and r["captura"].exists():
            alto_libre = pdf.h - pdf.get_y() - 15
            pdf.image(str(r["captura"]), h=alto_libre) if _es_vertical(r["captura"]) else pdf.image(str(r["captura"]), w=pdf.epw)

    pdf.output(str(ruta))
    return ruta


def _es_vertical(ruta_png):
    # Las capturas de móvil son más altas que anchas: se ajustan por alto
    with open(ruta_png, "rb") as f:
        cabecera = f.read(24)
    ancho = int.from_bytes(cabecera[16:20], "big")
    alto = int.from_bytes(cabecera[20:24], "big")
    return alto > ancho


def main():
    parser = argparse.ArgumentParser(description="Pruebas Selenium de toda la web de Konys Pizza")
    parser.add_argument("--url", default="http://localhost:5173", help="URL de la web a probar")
    parser.add_argument("--visible", action="store_true", help="Mostrar el navegador mientras se prueba")
    args = parser.parse_args()

    try:
        urllib.request.urlopen(args.url, timeout=5)
    except Exception:
        raise SystemExit(f"No se pudo abrir {args.url}. ¿Está corriendo `npm run dev`? "
                         "Si Vite usa otro puerto, pásalo con --url.")

    print(f"Probando {args.url} ...\n")
    resultados = Pruebas(args.url, args.visible).correr()
    ruta = generar_pdf(resultados, args.url)
    malas = [r for r in resultados if r["estado"] in ("FALLIDA", "ERROR")]
    ejecutadas = sum(r["estado"] != "OMITIDA" for r in resultados)
    print(f"\n{ejecutadas - len(malas)}/{ejecutadas} pruebas aprobadas "
          f"({len(resultados) - ejecutadas} omitidas)")
    print(f"Reporte PDF: {ruta}")
    raise SystemExit(1 if malas else 0)


if __name__ == "__main__":
    main()
