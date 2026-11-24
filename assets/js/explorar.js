/* =================================================================
   EXPLORAR O VILALARA (2026-11-24)
   Câmara "de drone" sobre o mapa ilustrado: o mapa é um plano 3D
   (rotateX = inclinação, rotateZ = rumo, scale = altitude) e a câmara
   desliza com suavidade até cada ponto. Os textos são provisórios e
   devem ser validados pela equipa.
   ================================================================= */
(function () {
  "use strict";
  var raiz = document.querySelector("[data-explorar]");
  if (!raiz) return;

  var cena = raiz.querySelector("[data-cena]");
  var mapa = raiz.querySelector("[data-mapa]");
  var camadaPontos = raiz.querySelector("[data-pontos]");        /* âncoras invisíveis, dentro do mapa 3D */
  var camadaMarcadores = raiz.querySelector("[data-marcadores]"); /* círculos, numa camada plana */
  var painel = raiz.querySelector("[data-painel]");
  var corpo = raiz.querySelector("[data-painel-corpo]");
  var barra = raiz.querySelector("[data-barra]");
  var filtros = raiz.querySelector("[data-filtros]");
  var dica = raiz.querySelector("[data-dica]");
  var video = raiz.querySelector(".explorar__video");
  var botaoVisita = raiz.querySelector("[data-visita]");
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* texto com espaços inseparáveis depois das palavras curtas (regra de tipografia do site) */
  function nb(s) {
    var re = /(^|[\s ])(a|o|as|os|e|é|à|às|ao|aos|de|do|da|dos|das|em|no|na|nos|nas|um|uma|para|por|pelo|pela|com|sem|se|que|ou|entre|sobre|como|até)\s/gi;
    return s.replace(re, "$1$2 ").replace(re, "$1$2 ");
  }

  var CATEGORIAS = [
    { id: "todos", nome: "Todos" },
    { id: "resort", nome: "O resort" },
    { id: "gastronomia", nome: "Gastronomia" },
    { id: "piscinas", nome: "Piscinas & praia" },
    { id: "clubs", nome: "Wellness & clubs" },
    { id: "suites", nome: "Suítes & residências" }
  ];
  var NOME_CAT = {};
  CATEGORIAS.forEach(function (c) { NOME_CAT[c.id] = c.nome; });

  /* posições em % da foto aérea (assets/img/explorar/foto.jpg), marcadas sobre os edifícios */
  var PONTOS = [
    { n: 1, pos: [[65.42, 43.27]], cat: "resort", nome: "Entrada principal",
      texto: "A chegada ao Vilalara faz-se por entre pinheiros e jardins. É aqui que começa a estadia, a poucos passos da receção.",
      foto: "assets/img/home/01-home.jpg" },
    { n: 2, pos: [[51.72, 49.78]], cat: "resort", nome: "Receção & Boutique",
      texto: "O primeiro olá e o último até já. Ao lado da receção, a boutique guarda peças e lembranças para levar um pouco do Vilalara para casa.",
      foto: "assets/img/our-heritage/hoje-m1.jpg" },
    { n: 3, pos: [[54.77, 62.53]], cat: "gastronomia", nome: "Coral & A-Costa", sub: "Éden do Mar · Mar de Brasas",
      texto: "Dois restaurantes junto à falésia: o Coral, onde a riqueza do Atlântico e a autenticidade do Algarve se expressam com precisão e elegância, e o A-Costa, com os clássicos portugueses a qualquer hora.",
      foto: "assets/img/gastronomia/coral.jpg", link: "coral.html", linkTexto: "Descobrir o Coral" },
    { n: 4, pos: [[54.77, 66.54]], cat: "piscinas", nome: "Pool Club A-Costa", sub: "Piscina",
      texto: "Piscinas sobre a falésia, com o mar como horizonte e o A-Costa ao lado para um almoço descontraído ao sol.",
      foto: "assets/img/our-heritage/hoje-m5.jpg", link: "a-costa.html", linkTexto: "Descobrir o A-Costa" },
    { n: 5, pos: [[48.93, 57.03]], cat: "resort", nome: "A Praça",
      texto: "O coração do resort, onde os caminhos se cruzam entre jardins e buganvílias, a meio caminho entre as residências e o mar.",
      foto: "assets/img/our-heritage/hoje-m4.jpg" },
    { n: 6, pos: [[50.2, 70.54]], cat: "piscinas", nome: "Acesso à praia",
      texto: "Um caminho desce a falésia até à areia dourada da Praia das Gaivotas.",
      foto: "assets/img/clubs/beach-club-rocha.jpg" },
    { n: 7, pos: [[50.71, 74.04]], cat: "piscinas", nome: "Beach Club",
      texto: "Para quem tem uma afinidade profunda com o oceano: uma meditação ao nascer do sol, um mergulho ao meio-dia, um passeio pela areia ao luar.",
      foto: "assets/img/clubs/beach-club.jpg", link: "beach-club.html", linkTexto: "Descobrir o Beach Club" },
    { n: 8, pos: [[36.51, 65.04]], cat: "resort", nome: "Jardim Pinhal", sub: "Pine Tree Garden",
      texto: "Um pinhal de sombra e silêncio, para caminhar entre as residências e o mar ao som das cigarras.",
      foto: "assets/img/our-heritage/hoje-m6.jpg" },
    { n: 9, pos: [[13.69, 57.53]], cat: "gastronomia", nome: "Trattoria Pantaleone",
      texto: "Tradição italiana aliada a ingredientes algarvios, em pratos que personificam o melhor do Mediterrâneo.",
      foto: "assets/img/gastronomia/trattoria.jpg", link: "trattoria.html", linkTexto: "Descobrir a Trattoria" },
    { n: 10, pos: [[16.22, 60.28]], cat: "piscinas", nome: "Piscina “Loureiros”", sub: "Piscina",
      texto: "Uma piscina tranquila, rodeada de jardim, junto às residências do lado poente do resort.",
      foto: "assets/img/our-heritage/2009-piscina-arcos.jpg" },
    { n: 11, pos: [[22.82, 18.0]], cat: "clubs", nome: "Wellness Club",
      texto: "Thalasso, spa, wellness e soluções anti-envelhecimento: uma viagem entre o mar e os jardins do Vilalara, com uma equipa experiente e dedicada.",
      foto: "assets/img/clubs/wellness-club.jpg", link: "wellness.html", linkTexto: "Descobrir o Wellness" },
    { n: 12, pos: [[31.94, 24.26]], cat: "gastronomia", nome: "Vento & Piscina “Cascatas”", sub: "Restaurante · Family pool",
      texto: "O Vento reinventa as tradições mediterrânicas num espaço inspirado pela natureza. Ao lado, a piscina Cascatas foi pensada para as famílias.",
      foto: "assets/img/gastronomia/vento.jpg", link: "vento.html", linkTexto: "Descobrir o Vento" },
    { n: 13, pos: [[42.59, 26.76]], cat: "clubs", nome: "Kids Club", sub: "Multisport area",
      texto: "Um paraíso para os pequenos heróis: um ambiente seguro e supervisionado para brincar, explorar e fazer novos amigos.",
      foto: "assets/img/clubs/kids-club.jpg", link: "kids-club.html", linkTexto: "Descobrir o Kids Club" },
    { n: 14, pos: [[50.71, 38.52]], cat: "clubs", nome: "Racket Club", sub: "Ténis, padel & pickleball",
      texto: "Seja qual for o seu nível, uma experiência refinada de ténis e padel, organizada em parceria com a LUX Tennis.",
      foto: "assets/img/clubs/racket-club.jpg", link: "racket-club.html", linkTexto: "Descobrir o Racket Club" },
    { n: 15, pos: [[59.33, 45.52]], cat: "gastronomia", nome: "Raízes", sub: "Horta da Terra",
      texto: "No centro da cozinha, a chama e as brasas dão vida a uma gastronomia simples e intensa, pensada para partilhar à mesa.",
      foto: "assets/img/gastronomia/raizes.jpg", link: "raizes.html", linkTexto: "Descobrir o Raízes" },
    { n: 16, pos: [[38.54, 56.03]], cat: "suites", nome: "As Glicínias", sub: "Residências 1–12, 27",
      texto: "Residências em socalcos sobre o pinhal, a poucos passos da praça e do caminho para a praia.",
      foto: "assets/img/suites/cartao-residencias.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 17, pos: [[31.44, 53.53]], cat: "suites", nome: "As Buganvílias", sub: "Residências 14–22, 14A–21A",
      texto: "Uma ala curva, aberta para os jardins interiores do resort e para a luz do sul.",
      foto: "assets/img/suites/private-residences.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 18, pos: [[36.0, 38.02]], cat: "suites", nome: "Os Hibíscus", sub: "3110–3434",
      texto: "Suítes no centro do resort, entre a piscina Cascatas e a praça.",
      foto: "assets/img/suites/elegant-suite.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 19, pos: [[32.45, 10.75], [41.07, 19.51]], cat: "suites", nome: "Os Pinheiros", sub: "4201–4410",
      texto: "Duas alas na parte alta do resort, junto ao Wellness Club e rodeadas de pinheiros.",
      foto: "assets/img/suites/master-suite.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 20, pos: [[18.0, 64.53]], cat: "suites", nome: "As Oliveiras", sub: "5021–5302",
      texto: "No lado poente, junto à piscina Loureiros e ao pinhal que desce até à falésia.",
      foto: "assets/img/suites/casa-laranjo.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 21, pos: [[14.7, 52.03]], cat: "suites", nome: "As Amendoeiras", sub: "Residências 6401–6705",
      texto: "Residências no extremo poente, com jardins próprios e vistas sobre o pinhal.",
      foto: "assets/img/suites/casa-levy.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 22, pos: [[23.32, 36.02]], cat: "suites", nome: "As Acácias", sub: "9001–9404",
      texto: "Uma ala recolhida, entre o verde, no coração do resort.",
      foto: "assets/img/suites/grand-suite.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" },
    { n: 23, pos: [[61.87, 58.03]], cat: "suites", nome: "The Cliff Residences", sub: "Residências 7001–7103",
      texto: "Na beira da falésia, com o Atlântico como vista e a Praia das Gaivotas logo abaixo.",
      foto: "assets/img/suites/ocean-suite.jpg", link: "suites-residencias.html", linkTexto: "Ver Suítes & Residências" }
  ];
  PONTOS.forEach(function (p) {
    p.cx = p.pos.reduce(function (s, q) { return s + q[0]; }, 0) / p.pos.length / 100;
    p.cy = p.pos.reduce(function (s, q) { return s + q[1]; }, 0) / p.pos.length / 100;
  });

  /* ---------- câmara ---------- */
  var RACIO = 3600 / 3551;            /* altura / largura da foto aérea */
  var S = 1000, SH = 1000;            /* tamanho do mapa em px (recalculado) */
  var tel = false;
  var cam = { x: 0.48, y: 0.45, z: 0.6, t: 0, r: 6, ox: 0, oy: 0 };   /* começa alto e rodado: o drone desce e endireita */
  var alvo = { x: 0.45, y: 0.45, z: 0.5, t: 0, r: 12, ox: 0, oy: 0 };
  var velocidade = 1.6;
  var ativo = null, filtro = "todos", aComecar = false;

  /* vista geral: enquadra o resort e a praia na área livre do ecrã (sem o painel, o cabeçalho e a barra) */
  var ZONA = { x0: 0.05, x1: 0.74, y0: 0.05, y1: 0.84 };
  var ZOOM_MAX_PX = 2550;   /* altura máxima da foto no ecrã, em px (o nível escolhido pelo utilizador) */
  function vistaGeral() {
    var painelLargura = (!tel && painel && painel.classList.contains("aberto")) ? Math.min(440, raiz.clientWidth) : 0;
    var w = raiz.clientWidth - painelLargura, h = raiz.clientHeight - (tel ? 150 : 150);
    /* a foto fica centrada na área livre (x = 0,5), com o resort e a praia dentro do enquadramento */
    /* no telemóvel o ecrã é estreito: centra no resort, para os pontos da ponta não ficarem cortados */
    var cx = tel ? (ZONA.x0 + ZONA.x1) / 2 : 0.5;
    var meia = Math.max(cx - ZONA.x0, ZONA.x1 - cx);
    var z = Math.min(w * 0.96 / (2 * meia * S), h / ((ZONA.y1 - ZONA.y0) * SH));
    return { x: cx, y: (ZONA.y0 + ZONA.y1) / 2 + (tel ? 0.02 : 0.01), z: z, t: 0, r: 0 };
  }
  function medir() {
    tel = window.innerWidth < 700;
    S = Math.max(raiz.clientWidth, raiz.clientHeight * 1.05);
    SH = S * RACIO;
    mapa.style.width = S + "px";
    mapa.style.height = SH + "px";
  }
  function limita() {
    /* zoom máximo (2026-11-24): a foto nunca passa de ~2550px de altura no ecrã, para não perder qualidade */
    alvo.z = Math.min(ZOOM_MAX_PX / SH, Math.max(vistaGeral().z * 0.8, alvo.z));
    /* arrastar só até às margens da foto (2026-11-24): a borda nunca entra na área livre do ecrã */
    var painelLargura = (!tel && painel && painel.classList.contains("aberto")) ? Math.min(440, raiz.clientWidth) : 0;
    var meiaX = (raiz.clientWidth - painelLargura) / 2 / (alvo.z * S);
    var meiaY = raiz.clientHeight / 2 / (alvo.z * SH);
    alvo.x = meiaX >= 0.5 ? 0.5 : Math.min(1 - meiaX, Math.max(meiaX, alvo.x));
    alvo.y = meiaY >= 0.5 ? 0.5 : Math.min(1 - meiaY, Math.max(meiaY, alvo.y));
  }

  var ultimo = performance.now();
  function quadro(agora) {
    var dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    var k = reduzido ? 1 : 1 - Math.exp(-dt * velocidade);
    ["x", "y", "z", "t", "r", "ox", "oy"].forEach(function (c) { cam[c] += (alvo[c] - cam[c]) * k; });
    /* deriva lenta, como um drone a pairar */
    var d = reduzido ? 0 : 1;
    var dr = d * Math.sin(agora / 9000) * 0.9;
    var dx = d * Math.sin(agora / 13000) * 0.006;
    var dy = d * Math.cos(agora / 11000) * 0.005;
    var r = cam.r + dr;
    mapa.style.left = "calc(50% + " + cam.ox.toFixed(1) + "px)";
    mapa.style.top = "calc(50% + " + cam.oy.toFixed(1) + "px)";
    mapa.style.transform =
      "rotateX(" + cam.t.toFixed(3) + "deg) rotateZ(" + r.toFixed(3) + "deg) scale(" + cam.z.toFixed(4) + ") " +
      "translate(" + (-(cam.x + dx) * S).toFixed(1) + "px," + (-(cam.y + dy) * SH).toFixed(1) + "px)";
    mapa.style.setProperty("--t", cam.t.toFixed(3) + "deg");
    mapa.style.setProperty("--r", r.toFixed(3) + "deg");
    /* cada círculo segue a sua âncora no mapa 3D, mas é desenhado plano: fica sempre redondo */
    var base = raiz.getBoundingClientRect(), H = base.height || 1;
    for (var i = 0; i < elementos.length; i++) {
      var o = elementos[i], a = o.ancora.getBoundingClientRect();
      var x = a.left - base.left, y = a.top - base.top;
      var k = 1;
      o.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      o.el.style.setProperty("--k", k.toFixed(3));
      o.el.style.visibility = (y < -40 || y > H + 60 || x < -60 || x > base.width + 60) ? "hidden" : "";
    }
    requestAnimationFrame(quadro);
  }

  /* ---------- pontos ---------- */
  var elementos = [];   /* {p, el} */
  PONTOS.forEach(function (p, i) {
    p.pos.forEach(function (q) {
      var ancora = document.createElement("div");
      ancora.className = "explorar__ancora";
      ancora.style.left = q[0] + "%";
      ancora.style.top = q[1] + "%";
      camadaPontos.appendChild(ancora);
      var el = document.createElement("div");
      el.className = "explorar__ponto";
      el.style.setProperty("--atraso", (0.1 + i * 0.02).toFixed(2) + "s");
      el.innerHTML =
        '<div class="explorar__pino">' +
          '<span class="explorar__nome" aria-hidden="true"></span>' +
          '<button type="button"></button>' +
          '<span class="explorar__haste" aria-hidden="true"></span>' +
          '<span class="explorar__chao" aria-hidden="true"></span>' +
        "</div>";
      el.querySelector(".explorar__nome").textContent = p.nome;
      var b = el.querySelector("button");
      b.textContent = p.n;
      b.setAttribute("aria-label", p.n + ", " + p.nome);
      b.addEventListener("click", function (e) { e.stopPropagation(); pararVisita(); abrir(p); });
      camadaMarcadores.appendChild(el);
      elementos.push({ p: p, el: el, ancora: ancora });
    });
  });

  function visiveis() {
    return PONTOS.filter(function (p) { return filtro === "todos" || p.cat === filtro; });
  }

  /* ---------- painel ---------- */
  function abrir(p) {
    ativo = p;
    elementos.forEach(function (o) { o.el.classList.toggle("ativo", o.p === p); });
    alvo.x = p.cx; alvo.y = p.cy;
    alvo.z = tel ? 1.3 : 2.1;
    alvo.t = 0;
    alvo.ox = tel ? 0 : -Math.min(440, raiz.clientWidth) / 2;   /* centro da área livre, ao lado da janela */
    alvo.oy = tel ? -raiz.clientHeight * 0.2 : 0;   /* no telemóvel, o ponto fica por cima da folha */
    limita();
    var lista = visiveis();
    var i = lista.indexOf(p);
    var ant = lista[(i - 1 + lista.length) % lista.length] || p;
    var seg = lista[(i + 1) % lista.length] || p;
    corpo.innerHTML =
      '<figure class="explorar__foto"><img alt=""></figure>' +
      '<div class="explorar__info">' +
        '<p class="explorar__cat"></p>' +
        '<h2 id="painel-titulo"><span class="explorar__num"></span><span class="explorar__titulo-local"></span></h2>' +
        (p.sub ? '<p class="explorar__sub"></p>' : "") +
        '<p class="explorar__texto"></p>' +
        (p.link ? '<a class="botao-contorno"></a>' : "") +
      "</div>" +
      '<nav class="explorar__nav" aria-label="Outros espaços">' +
        '<button type="button" data-ir="-1"><span>Anterior</span><strong></strong></button>' +
        '<button type="button" data-ir="1"><span>Seguinte</span><strong></strong></button>' +
      "</nav>";
    var img = corpo.querySelector("img");
    img.src = p.foto;
    img.alt = p.nome;
    corpo.querySelector(".explorar__cat").textContent = NOME_CAT[p.cat];
    corpo.querySelector(".explorar__num").textContent = p.n;
    corpo.querySelector(".explorar__titulo-local").textContent = nb(p.nome);
    if (p.sub) corpo.querySelector(".explorar__sub").textContent = p.sub;
    corpo.querySelector(".explorar__texto").textContent = nb(p.texto);
    if (p.link) { var a = corpo.querySelector(".botao-contorno"); a.href = p.link; a.textContent = nb(p.linkTexto); }
    var nav = corpo.querySelectorAll(".explorar__nav button");
    nav[0].querySelector("strong").textContent = String(ant.n).padStart(2, "0") + " · " + ant.nome;
    nav[1].querySelector("strong").textContent = String(seg.n).padStart(2, "0") + " · " + seg.nome;
    nav[0].addEventListener("click", function () { pararVisita(); abrir(ant); });
    nav[1].addEventListener("click", function () { pararVisita(); abrir(seg); });
    mostrarPainel();
  }
  function lista(intro) {
    pararVisita();
    ativo = null;
    elementos.forEach(function (o) { o.el.classList.remove("ativo"); });
    /* painel de entrada: só a lista dos espaços, sem título nem texto (pedido de 2026-11-24) */
    var html = intro
      ? '<div class="explorar__lista explorar__lista--intro">'
      : '<div class="explorar__lista"><h2>Todos os espaços</h2>';
    CATEGORIAS.slice(1).forEach(function (c) {
      var ps = PONTOS.filter(function (p) { return p.cat === c.id; });
      html += "<h3>" + c.nome + '</h3><ul data-cat="' + c.id + '">' + ps.map(function (p) {
        return '<li><button type="button" data-n="' + p.n + '"><span>' + p.n + "</span>" + p.nome + "</button></li>";
      }).join("") + "</ul>";
    });
    corpo.innerHTML = html + "</div>";
    corpo.querySelectorAll("[data-n]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = PONTOS.filter(function (q) { return String(q.n) === b.dataset.n; })[0];
        if (filtro !== "todos" && p.cat !== filtro) escolherFiltro("todos", true);
        abrir(p);
      });
    });
    alvo.ox = tel ? 0 : -Math.min(440, raiz.clientWidth) / 2;   /* centro da área livre, ao lado da janela */
    alvo.oy = tel ? -raiz.clientHeight * 0.2 : 0;
    mostrarPainel();
  }
  function mostrarPainel() {
    if (dica) dica.hidden = true;
    /* na lista de entrada não há nada para fechar; num espaço, o × volta à lista */
    var x = raiz.querySelector("[data-fechar]");
    x.hidden = !tel && !!corpo.querySelector(".explorar__lista--intro");
    x.setAttribute("aria-label", tel ? "Fechar" : "Voltar à lista");
    painel.classList.add("aberto");
    raiz.classList.add("explorar--com-painel");
    painel.setAttribute("aria-hidden", "false");
    corpo.scrollTop = 0;
    if (window.vilalaraQuebrasFrase) { try { window.vilalaraQuebrasFrase(); } catch (e) {} }
  }
  function fechar() {
    /* no computador a janela lateral está sempre presente (2026-11-24): "fechar" volta à lista */
    if (!tel) {
      lista(true);
      var g0 = vistaGeral();
      alvo.z = Math.max(g0.z, alvo.z * 0.6);
      return;
    }
    painel.classList.remove("aberto");
    raiz.classList.remove("explorar--com-painel");
    painel.setAttribute("aria-hidden", "true");
    elementos.forEach(function (o) { o.el.classList.remove("ativo"); });
    ativo = null;
    alvo.ox = 0; alvo.oy = 0;
    var g = vistaGeral();
    alvo.z = Math.max(g.z, alvo.z * 0.6);
    alvo.t = g.t;
  }
  raiz.querySelector("[data-fechar]").addEventListener("click", function () { pararVisita(); fechar(); });
  raiz.querySelector("[data-lista]").addEventListener("click", function () { lista(); });

  /* ---------- filtros ---------- */
  CATEGORIAS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = c.nome;
    b.dataset.cat = c.id;
    b.setAttribute("aria-pressed", c.id === "todos" ? "true" : "false");
    b.addEventListener("click", function () { pararVisita(); escolherFiltro(c.id); });
    filtros.appendChild(b);
  });
  function escolherFiltro(id, semCamara) {
    filtro = id;
    filtros.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === id ? "true" : "false"); });
    elementos.forEach(function (o) {
      var fora = id !== "todos" && o.p.cat !== id;
      o.el.classList.toggle("esbatido", fora);
      o.el.querySelector("button").tabIndex = fora ? -1 : 0;
    });
    if (semCamara) return;
    if (painel.classList.contains("aberto")) fechar();
    /* enquadra os pontos da categoria */
    var ps = visiveis(), g = vistaGeral();
    if (id === "todos") { alvo.x = g.x; alvo.y = g.y; alvo.z = g.z; alvo.t = g.t; return; }
    var xs = ps.map(function (p) { return p.cx; }), ys = ps.map(function (p) { return p.cy; });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    alvo.x = (x0 + x1) / 2; alvo.y = (y0 + y1) / 2;
    alvo.z = Math.min(2.2, Math.max(g.z, 0.55 / Math.max(x1 - x0, (y1 - y0) * 1.3, 0.12)));
    alvo.t = g.t;
    limita();
  }

  /* ---------- zoom e vista geral ---------- */
  raiz.querySelectorAll("[data-zoom]").forEach(function (b) {
    b.addEventListener("click", function () { pararVisita(); alvo.z *= b.dataset.zoom === "1" ? 1.35 : 1 / 1.35; limita(); });
  });
  raiz.querySelector("[data-geral]").addEventListener("click", function () {
    pararVisita(); fechar();
    var g = vistaGeral(); alvo.x = g.x; alvo.y = g.y; alvo.z = g.z; alvo.t = g.t; alvo.r = g.r;
  });

  /* ---------- visita guiada ---------- */
  var temporizador = null, passo = 0;
  function pararVisita() {
    if (!temporizador) return;
    clearTimeout(temporizador); temporizador = null;
    botaoVisita.setAttribute("aria-pressed", "false");
    raiz.querySelector("[data-visita-texto]").textContent = "Visita guiada";
    velocidade = 1.6;
  }
  function proximoPasso() {
    var ps = visiveis();
    abrir(ps[passo % ps.length]);
    passo++;
    temporizador = setTimeout(proximoPasso, 7000);
  }
  botaoVisita.addEventListener("click", function () {
    if (temporizador) { pararVisita(); return; }
    botaoVisita.setAttribute("aria-pressed", "true");
    raiz.querySelector("[data-visita-texto]").textContent = "Pausar visita";
    velocidade = 0.9;                     /* voo mais lento, mais cinematográfico */
    var ps = visiveis();
    passo = ativo ? (ps.indexOf(ativo) + 1) : 0;
    proximoPasso();
  });

  /* ---------- arrastar e pinçar ---------- */
  var toques = {}, arrasto = null;
  cena.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    toques[e.pointerId] = { x: e.clientX, y: e.clientY };
    cena.setPointerCapture(e.pointerId);
    cena.classList.add("a-arrastar");
    pararVisita();
    var ids = Object.keys(toques);
    if (ids.length === 2) {
      var a = toques[ids[0]], b = toques[ids[1]];
      arrasto = { pinca: Math.hypot(a.x - b.x, a.y - b.y), z: alvo.z };
    } else arrasto = null;
    if (dica && !dica.hidden) dica.hidden = true;
  });
  cena.addEventListener("pointermove", function (e) {
    var t = toques[e.pointerId];
    if (!t) return;
    var ids = Object.keys(toques);
    if (ids.length === 2 && arrasto) {
      t.x = e.clientX; t.y = e.clientY;
      var a = toques[ids[0]], b = toques[ids[1]];
      alvo.z = arrasto.z * Math.hypot(a.x - b.x, a.y - b.y) / arrasto.pinca;
      limita();
      return;
    }
    var dx = e.clientX - t.x, dy = e.clientY - t.y;
    t.x = e.clientX; t.y = e.clientY;
    var r = (cam.r) * Math.PI / 180, c = Math.cos(cam.t * Math.PI / 180) || 1;
    var sy = dy / c;
    var ux = dx * Math.cos(-r) - sy * Math.sin(-r);
    var uy = dx * Math.sin(-r) + sy * Math.cos(-r);
    var mx = -ux / (cam.z * S), my = -uy / (cam.z * SH);
    alvo.x += mx; alvo.y += my; limita();
    cam.x = alvo.x; cam.y = alvo.y;
  });
  function largar(e) {
    delete toques[e.pointerId];
    if (!Object.keys(toques).length) { cena.classList.remove("a-arrastar"); arrasto = null; }
  }
  cena.addEventListener("pointerup", largar);
  cena.addEventListener("pointercancel", largar);
  /* pinçar no trackpad (ctrl + roda); a roda normal continua a fazer scroll à página */
  /* zoom com a roda do rato (ou pinça no trackpad), na direção do cursor */
  cena.addEventListener("wheel", function (e) {
    e.preventDefault();
    pararVisita();
    var base = raiz.getBoundingClientRect();
    var cx = base.left + base.width / 2 + cam.ox, cy = base.top + base.height / 2 + cam.oy;
    var mx = alvo.x + (e.clientX - cx) / (alvo.z * S), my = alvo.y + (e.clientY - cy) / (alvo.z * SH);
    var passo = e.ctrlKey ? 0.012 : 0.0022;
    alvo.z *= Math.exp(-e.deltaY * passo);
    limita();
    alvo.x = mx - (e.clientX - cx) / (alvo.z * S);
    alvo.y = my - (e.clientY - cy) / (alvo.z * SH);
    limita();
    if (dica && !dica.hidden) dica.hidden = true;
  }, { passive: false });

  /* ---------- teclado ---------- */
  document.addEventListener("keydown", function (e) {
    if (raiz.classList.contains("explorar--abertura")) return;
    if (e.key === "Escape" && painel.classList.contains("aberto")) { pararVisita(); fechar(); }
    if (ativo && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      var ps = visiveis(), i = ps.indexOf(ativo);
      pararVisita();
      abrir(ps[(i + (e.key === "ArrowRight" ? 1 : -1) + ps.length) % ps.length]);
    }
  });

  /* ---------- abertura: o drone desce sobre o mapa ---------- */
  function comecar() {
    if (aComecar) return;
    aComecar = true;
    raiz.classList.add("explorar--a-descer", "explorar--a-entrar");
    raiz.classList.remove("explorar--abertura");
    velocidade = 3.2;   /* descida curta (2026-11-24): a foto assenta centrada em ~1 s */
    barra.hidden = false;
    /* no computador, a informação fica à direita desde o início e o mapa desloca-se para a esquerda */
    if (!tel) lista(true);
    var g = vistaGeral();
    alvo.x = g.x; alvo.y = g.y; alvo.z = g.z; alvo.t = g.t; alvo.r = g.r;
    setTimeout(function () { window.dispatchEvent(new Event("scroll")); }, 900);
    setTimeout(function () {
      raiz.classList.remove("explorar--a-descer");
      setTimeout(function () { raiz.classList.remove("explorar--a-entrar"); }, 1200);
      velocidade = 1.6;
      if (dica) { dica.hidden = false; setTimeout(function () { dica.hidden = true; }, 6000); }
      if (video) video.pause();
      window.dispatchEvent(new Event("scroll"));   /* o cabeçalho volta a ver a cor do fundo */
    }, reduzido ? 0 : 900);
  }

  /* menu lateral fixo à esquerda, só nesta página e só no computador (2026-11-24) */
  var menuLateral = document.querySelector(".painel");
  function menuFixo() {
    var html = document.documentElement, fixo = window.innerWidth > 900;
    html.classList.toggle("menu-fixo", fixo);
    if (!menuLateral) return;
    if (fixo) {
      html.classList.add("painel-aberto");
      menuLateral.classList.add("aberto");
      menuLateral.removeAttribute("inert");
    } else if (html.classList.contains("painel-aberto") && !menuLateral.matches(":focus-within")) {
      html.classList.remove("painel-aberto");
      menuLateral.classList.remove("aberto");
      menuLateral.setAttribute("inert", "");
    }
  }
  menuFixo();
  medir();
  /* o menu abre fixo, mas pode ser fechado (×) e reaberto (☰): o mapa reajusta-se à nova largura */
  if (menuLateral) new MutationObserver(function () {
    setTimeout(function () {
      medir();
      if (!ativo && aComecar) { var g = vistaGeral(); alvo.x = g.x; alvo.y = g.y; alvo.z = g.z; }
      if (!tel && painel.classList.contains("aberto")) alvo.ox = -Math.min(440, raiz.clientWidth) / 2;
    }, 420);
  }).observe(menuLateral, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", function () { medir(); if (!ativo && !raiz.classList.contains("explorar--abertura")) { var g = vistaGeral(); alvo.z = g.z; alvo.t = g.t; } });
  requestAnimationFrame(function (t) { ultimo = t; quadro(t); });
  /* sem introdução: o drone desce logo sobre o mapa */
  /* só começa quando a foto já carregou (assim os números nunca aparecem sobre o fundo vazio) */
  var fotoMapa = raiz.querySelector(".explorar__img");
  function quandoPronta() {
    setTimeout(comecar, 30);
    /* abre com a foto leve (1,3 MB) e troca pela grande (nítida no zoom) quando esta acabar de carregar */
    var grande = fotoMapa.getAttribute("data-grande");
    if (grande && !tel) { var g = new Image(); g.onload = function () { fotoMapa.src = grande; }; g.src = grande; }
  }
  if (fotoMapa.complete && fotoMapa.naturalWidth) quandoPronta();
  else { fotoMapa.addEventListener("load", quandoPronta, { once: true }); fotoMapa.addEventListener("error", quandoPronta, { once: true }); }
})();
