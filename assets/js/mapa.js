/* =====================================================================
   VILALARA — MAPA (página Reservas, bloco "Como chegar")
   Estilo "Ultra Light with Labels" (Snazzy Maps): terra quase branca,
   mar cinzento-claro, estradas brancas, nomes a cinzento, sem ícones.
   - Com data-google-key preenchido: Google Maps com o estilo exato
     (assets/data/mapa-estilo-ultra-light.json).
   - Sem chave (protótipo): MapLibre + OpenFreeMap (gratuito, sem chave),
     com as cores acertadas pelas do estilo Ultra Light.
   O mapa abre já aproximado à zona do hotel (data-zoom).
   ===================================================================== */
(function () {
  var el = document.getElementById("mapa-vilalara");
  if (!el) return;
  var lat = parseFloat(el.dataset.lat), lng = parseFloat(el.dataset.lng), zoom = parseFloat(el.dataset.zoom) || 15;
  var chave = (el.dataset.googleKey || "").trim();
  // O VL fica no edifício do hotel (pode ser diferente do centro do mapa)
  var pinLat = parseFloat(el.dataset.pinLat) || lat, pinLng = parseFloat(el.dataset.pinLng) || lng;

  // Marcador: ponto escuro com anel branco e halo suave (cores do site)
  var svgPin = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
    '<circle cx="20" cy="20" r="19" fill="#2a2928" fill-opacity="0.10"/>' +
    '<circle cx="20" cy="20" r="8" fill="#2a2928" stroke="#ffffff" stroke-width="3"/></svg>';

  /* ---------- Google Maps (site final, com chave) ---------- */
  if (chave) {
    window.iniciarMapaVilalara = function () {
      fetch("assets/data/mapa-estilo-ultra-light.json").then(function (r) { return r.json(); }).then(function (estilo) {
        var mapa = new google.maps.Map(el, { center: { lat: lat, lng: lng }, zoom: Math.round(zoom), styles: estilo, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative" });
        new google.maps.Marker({ position: { lat: pinLat, lng: pinLng }, map: mapa, title: "Vilalara Grand Hotel Algarve",
          icon: { url: "assets/img/marca/monograma-escuro.png", scaledSize: new google.maps.Size(30, 30), anchor: new google.maps.Point(15, 15) } });
      });
    };
    var s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(chave) + "&callback=iniciarMapaVilalara";
    s.async = true;
    document.head.appendChild(s);
    return;
  }

  /* ---------- MapLibre + OpenFreeMap (protótipo, sem chave) ---------- */
  if (!window.maplibregl) return;

  // Cores do "Ultra Light with Labels" (valores do Snazzy já com a "lightness" aplicada)
  var COR = {
    terra: "#f7f7f7",        // landscape #f5f5f5 +20
    mar: "#ededed",          // water #e9e9e9 +17
    parque: "#e8e8e8",       // poi.park #dedede +21
    edificio: "#f0f0f0",
    estrada: "#ffffff",      // estradas brancas
    contornoEstrada: "#f0f0f0",
    limite: "#e6e6e6",       // administrative
    texto: "#8c8c8c",        // labels.text.fill #333 +40
    halo: "#ffffff"          // labels.text.stroke
  };

  var mapa = new maplibregl.Map({
    container: el,
    style: "https://tiles.openfreemap.org/styles/positron",
    center: [lng, lat],
    zoom: zoom,
    minZoom: 9,
    maxZoom: 18,
    cooperativeGestures: true,          // o scroll da página não faz zoom no mapa sem querer
    attributionControl: { compact: true }
  });
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

  mapa.on("load", function () {
    mapa.getStyle().layers.forEach(function (l) {
      var id = l.id;
      try {
        if (l.type === "background") mapa.setPaintProperty(id, "background-color", COR.terra);
        else if (l.type === "fill") {
          var c = /water/.test(id) ? COR.mar : /park|wood|landcover/.test(id) ? COR.parque : /building/.test(id) ? COR.edificio : COR.terra;
          mapa.setPaintProperty(id, "fill-color", c);
          if (/building/.test(id)) mapa.setPaintProperty(id, "fill-outline-color", "#e9e9e9");
        } else if (l.type === "line") {
          if (/waterway/.test(id)) mapa.setPaintProperty(id, "line-color", COR.mar);
          else if (/boundary/.test(id)) mapa.setPaintProperty(id, "line-color", COR.limite);
          else if (/casing/.test(id)) mapa.setPaintProperty(id, "line-color", COR.contornoEstrada);
          else if (/railway/.test(id)) mapa.setPaintProperty(id, "line-color", "#e4e4e4");
          else mapa.setPaintProperty(id, "line-color", COR.estrada);
        } else if (l.type === "symbol") {
          if (/shield/.test(id)) { mapa.setLayoutProperty(id, "visibility", "none"); return; }   // sem ícones
          mapa.setPaintProperty(id, "text-color", COR.texto);
          mapa.setPaintProperty(id, "text-halo-color", COR.halo);
          mapa.setPaintProperty(id, "text-halo-width", 1.4);
        }
      } catch (e) { /* camada sem esta propriedade: ignora */ }
    });
  });

  // Marcador com o monograma VL do Vilalara
  var pin = document.createElement("div");
  pin.className = "mapa-pin mapa-pin--vl";
  pin.innerHTML = '<img src="assets/img/marca/monograma-escuro.png" alt="" width="277" height="274">';
  pin.title = "Vilalara Grand Hotel Algarve";
  new maplibregl.Marker({ element: pin, anchor: "center" }).setLngLat([pinLng, pinLat]).addTo(mapa);
})();
