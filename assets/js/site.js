/* =====================================================================
   VILALARA — COMPORTAMENTOS
   Não é preciso mexer aqui para mudar fotos ou textos.
   1. Painel lateral (☰)
   2. Barra das páginas interiores: recolhe a descer, aparece a subir
   3. Home: categoria visível sublinhada no menu + deslocação das fotos
   ===================================================================== */
(function () {
  "use strict";

  var reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Painel lateral ---------- */
  var painel = document.querySelector(".painel");
  var veu = document.querySelector(".veu-painel");
  var botoesMenu = document.querySelectorAll("[data-abre-painel]");
  var botaoFechar = document.querySelector(".painel__fechar");
  var ultimoFoco = null;

  function abrirPainel() {
    if (!painel) return;
    ultimoFoco = document.activeElement;
    painel.classList.add("aberto");
    document.documentElement.classList.add("painel-aberto");   /* a página encolhe para a área ao lado do menu */
    if (veu) veu.classList.add("visivel");
    painel.removeAttribute("inert");
    botoesMenu.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    var primeiro = painel.querySelector("a, button");
    if (primeiro) setTimeout(function () { primeiro.focus({ preventScroll: true }); }, 50);
  }

  function fecharPainel() {
    if (!painel || !painel.classList.contains("aberto")) return;
    painel.classList.remove("aberto");
    document.documentElement.classList.remove("painel-aberto");
    if (veu) veu.classList.remove("visivel");
    painel.setAttribute("inert", "");
    botoesMenu.forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
  }

  if (painel) painel.setAttribute("inert", "");
  botoesMenu.forEach(function (b) { b.addEventListener("click", abrirPainel); });
  if (botaoFechar) botaoFechar.addEventListener("click", fecharPainel);
  if (veu) veu.addEventListener("click", fecharPainel);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharPainel(); });

  /* ---------- 1b. Seletor de idioma (só mostra as opções, ainda sem traduções) ---------- */
  document.querySelectorAll(".idioma").forEach(function (seletor) {
    var botao = seletor.querySelector(".idioma__botao");
    var lista = seletor.querySelector(".idioma__lista");
    var atual = seletor.querySelector(".idioma__atual");
    if (!botao || !lista) return;

    function abrir(sim) {
      lista.hidden = !sim;
      botao.setAttribute("aria-expanded", sim ? "true" : "false");
    }
    botao.addEventListener("click", function (e) {
      e.stopPropagation();
      abrir(lista.hidden);
    });
    lista.querySelectorAll("button").forEach(function (opcao) {
      opcao.addEventListener("click", function () {
        lista.querySelectorAll("button").forEach(function (b) { b.removeAttribute("aria-current"); });
        opcao.setAttribute("aria-current", "true");
        if (atual) atual.textContent = opcao.textContent;
        abrir(false);
        botao.focus();
      });
    });
    document.addEventListener("click", function (e) { if (!seletor.contains(e.target)) abrir(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lista.hidden) { abrir(false); botao.focus(); } });
  });

  /* ---------- 2. Barra interior: recolhe / aparece ----------
     Recolhe enquanto se faz scroll para baixo e volta a aparecer assim que
     o scroll para (ou quando se sobe). */
  var barra = document.querySelector(".cab-interior:not(.cab-transicao)");
  if (barra) {
    var ultimoY = window.scrollY;
    var pedido = false;
    var paragem = null;
    window.addEventListener("scroll", function () {
      clearTimeout(paragem);
      paragem = setTimeout(function () { barra.classList.remove("recolhido"); }, 220);   // parou de fazer scroll
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var limite = barra.offsetHeight;
        if (painel && painel.classList.contains("aberto")) {
          barra.classList.remove("recolhido");
        } else if (y > ultimoY && y > limite) {
          barra.classList.add("recolhido");      // a descer
        } else if (y < ultimoY - 2 || y <= limite) {
          barra.classList.remove("recolhido");   // a subir
        }
        ultimoY = y;
        pedido = false;
      });
    }, { passive: true });
  }

  /* ---------- 2b. Barra: a cor adapta-se ao que está por baixo ----------
     Por cima de fotografias ou fundos escuros/coloridos: branca.
     Por cima de fundos brancos/claros: escura (para se ver sempre). */
  if (barra) {
    var ultimaCor = "";
    function corPorBaixo(x, y) {
      var pilha = document.elementsFromPoint(x, y);
      for (var k = 0; k < pilha.length; k++) {
        var el = pilha[k];
        if (barra.contains(el) || el.closest(".painel, .veu-painel, .zoom-foto, .palavra-voadora")) continue;
        for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
          if (/^(IMG|VIDEO|PICTURE|CANVAS|IFRAME)$/.test(e.tagName)) return "foto";
          var cs = getComputedStyle(e);
          if (cs.backgroundImage && cs.backgroundImage !== "none") return "foto";
          var m = cs.backgroundColor.match(/[\d.]+/g);
          if (m && (m.length < 4 || parseFloat(m[3]) > 0.5)) {
            var lum = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
            return lum > 0.6 ? "claro" : "escuro";
          }
        }
        return "claro";   // nada pintado: fundo da página (branco)
      }
      return "claro";
    }
    function corDaBarra() {
      if (painel && painel.classList.contains("aberto")) return;
      var y = Math.max(4, Math.min(barra.offsetHeight / 2, window.innerHeight - 1));
      var w = document.documentElement.clientWidth, claros = 0, n = 0;
      [0.05, 0.25, 0.5, 0.75, 0.95].forEach(function (f) { n++; if (corPorBaixo(w * f, y) === "claro") claros++; });
      var cor = claros * 2 > n ? "escuro" : "claro";   // a maioria do fundo é clara → texto escuro
      if (cor === ultimaCor) return;
      ultimaCor = cor;
      barra.classList.toggle("cab--escuro", cor === "escuro");
      barra.classList.toggle("cab--claro", cor === "claro");
    }
    var pedidoCor = false;
    window.addEventListener("scroll", function () {
      if (pedidoCor) return; pedidoCor = true;
      requestAnimationFrame(function () { corDaBarra(); pedidoCor = false; });
    }, { passive: true });
    window.addEventListener("resize", corDaBarra);
    window.addEventListener("load", corDaBarra);
    setTimeout(corDaBarra, 300);
  }

  /* Reservas: os separadores filtram os alojamentos (Todos / Suítes / Residências / Pacotes) */
  document.querySelectorAll("[data-filtro]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      var f = botao.getAttribute("data-filtro");
      botao.closest("ul").querySelectorAll("[data-filtro]").forEach(function (b) {
        if (b === botao) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      document.querySelectorAll(".quarto[data-tipo]").forEach(function (q) {
        q.hidden = f === "todos" ? q.getAttribute("data-tipo") === "pacotes" : q.getAttribute("data-tipo") !== f;
      });
      marcaSozinho();
    });
  });
  // Por defeito, "Todos os quartos" mostra suítes e residências (os pacotes têm o seu separador)
  document.querySelectorAll('.quarto[data-tipo="pacotes"]').forEach(function (q) { q.hidden = true; });
  // Grelha de 3 colunas: se o último alojamento visível ficar sozinho na fila, ocupa a fila toda (versão horizontal)
  function marcaSozinho() {
    var vis = Array.prototype.filter.call(document.querySelectorAll(".quarto[data-tipo]"), function (q) { q.classList.remove("quarto--sozinho"); return !q.hidden; });
    if (vis.length % 3 === 1 && vis.length > 1) vis[vis.length - 1].classList.add("quarto--sozinho");
  }
  marcaSozinho();

  /* Menu lateral: botões + / − abrem e fecham os submenus.
     Ao abrir um submenu, os outros do mesmo nível que estavam abertos recolhem
     (só fica aberto um ramo de cada vez). */
  function mostrarSub(botao, abrir) {
    var sub = document.getElementById(botao.getAttribute("aria-controls"));
    botao.setAttribute("aria-expanded", abrir ? "true" : "false");
    if (sub) sub.hidden = !abrir;
  }
  document.querySelectorAll(".painel__abre").forEach(function (botao) {
    botao.addEventListener("click", function () {
      var abrir = botao.getAttribute("aria-expanded") !== "true";
      if (abrir) {
        var item = botao.closest("li");
        var lista = item && item.parentElement;
        if (lista) Array.prototype.forEach.call(lista.children, function (irmao) {
          if (irmao === item) return;
          var b = irmao.querySelector(":scope > .painel__linha > .painel__abre");
          if (b && b.getAttribute("aria-expanded") === "true") mostrarSub(b, false);
        });
      }
      mostrarSub(botao, abrir);
    });
  });

  /* Página interior de exemplo: mostra a categoria que veio no link (#suites, ...) */
  var nomeCategoria = document.querySelector("[data-nome-categoria]");
  function mostrarCategoria() {
    var id = (location.hash || "").replace("#", "");
    var ligacao = id && painel.querySelector('a[data-categoria="' + id + '"]');
    if (!ligacao) return;
    painel.querySelectorAll('a[aria-current]').forEach(function (a) { a.removeAttribute("aria-current"); });
    ligacao.setAttribute("aria-current", "page");
    nomeCategoria.textContent = ligacao.textContent;
    document.title = ligacao.textContent.trim() + " · Vilalara";
  }
  if (nomeCategoria && painel) {
    mostrarCategoria();
    window.addEventListener("hashchange", function () {
      mostrarCategoria();
      fecharPainel();
      window.scrollTo(0, 0);
    });
  }

  /* ---------- 2b. Landing: barra transparente enquanto a foto está no ecrã ---------- */
  var heroLanding = document.querySelector(".landing");
  if (barra && heroLanding && barra.hasAttribute("data-sobre-foto")) {
    var atualizarBarra = function () {
      var fundoHero = heroLanding.getBoundingClientRect().bottom;
      barra.classList.toggle("cab-interior--sobre-foto", fundoHero > barra.offsetHeight + 4);
    };
    window.addEventListener("scroll", atualizarBarra, { passive: true });
    window.addEventListener("resize", atualizarBarra);
    atualizarBarra();
  }

  /* ---------- 2c. Linha do tempo (bloco fixo; scroll ou clique no ano) ---------- */
  document.querySelectorAll(".linha-tempo").forEach(function (lt) {
    var anos = Array.prototype.slice.call(lt.querySelectorAll(".lt-ano"));
    var itens = Array.prototype.slice.call(lt.querySelectorAll(".lt-roda li"));
    var n = anos.length;
    if (!n) return;
    lt.style.setProperty("--n", n);
    var atual = -1;
    var empilhado = window.matchMedia("(max-width: 900px)");
    empilhado.addEventListener("change", function () { atual = -1; lerScroll(); });

    function ativar(i) {
      if (i === atual) return;
      atual = i;
      lt.style.setProperty("--i", i);
      anos.forEach(function (a, k) {
        a.classList.toggle("ativo", k === i);
        a.classList.toggle("passado", k < i);
        // no telemóvel todos os anos estão à vista (uns por baixo dos outros)
        a.setAttribute("aria-hidden", k === i || empilhado.matches ? "false" : "true");
      });
      itens.forEach(function (li, k) {
        li.classList.toggle("ativo", k === i);
        li.classList.toggle("longe", Math.abs(k - i) >= 3);
        var b = li.querySelector("button");
        if (b) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); }
      });
    }

    function percurso() { return lt.offsetHeight - window.innerHeight; }

    function lerScroll() {
      var p = -lt.getBoundingClientRect().top / Math.max(1, percurso());
      ativar(Math.min(n - 1, Math.max(0, Math.floor(p * n))));
    }

    var pedidoLt = false;
    window.addEventListener("scroll", function () {
      if (pedidoLt) return;
      pedidoLt = true;
      requestAnimationFrame(function () { lerScroll(); pedidoLt = false; });
    }, { passive: true });
    window.addEventListener("resize", lerScroll);
    lerScroll();

    // Clique num ano → leva o scroll até esse ano
    lt.querySelectorAll("[data-ir-ano]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = parseInt(b.getAttribute("data-ir-ano"), 10);
        var topo = lt.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: topo + ((k + 0.5) / n) * percurso(), behavior: reduzMovimento ? "auto" : "smooth" });
      });
    });
  });

  /* ---------- 2d. Tipologias (bloco fixo com deslocação lateral) ---------- */
  document.querySelectorAll(".tipologias").forEach(function (bloco) {
    var pista = bloco.querySelector(".tipologias__pista");
    var tipos = Array.prototype.slice.call(bloco.querySelectorAll(".tipo"));
    var botoes = Array.prototype.slice.call(bloco.querySelectorAll("[data-ir-tipo]"));
    var n = tipos.length;
    if (!pista || !n) return;
    bloco.style.setProperty("--n", n);
    var atual = -1;

    function percurso() { return Math.max(1, bloco.offsetHeight - window.innerHeight); }

    // Cada tipologia fica parada um pouco antes de deslizar para a seguinte
    function suavizar(x) {
      var seg = Math.floor(x), f = x - seg;
      var t = Math.min(1, Math.max(0, (f - 0.35) / 0.65));
      t = t * t * (3 - 2 * t);
      return seg + t;
    }

    function ativar(i) {
      if (i === atual) return;
      atual = i;
      botoes.forEach(function (b, k) {
        if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      tipos.forEach(function (t, k) { t.setAttribute("aria-hidden", k === i ? "false" : "true"); });
      // Se os nomes não couberem numa linha, centra o ativo SÓ dentro da lista
      // (scrollIntoView mexia também no scroll da página e prendia-a).
      var b = botoes[i];
      var lista = b && b.closest(".separadores");
      if (lista && lista.scrollWidth > lista.clientWidth) {
        var alvo = b.offsetLeft - (lista.clientWidth - b.offsetWidth) / 2;
        lista.scrollTo({ left: alvo, behavior: reduzMovimento ? "auto" : "smooth" });
      }
    }

    function lerScroll() {
      var p = Math.min(1, Math.max(0, -bloco.getBoundingClientRect().top / percurso()));
      var x = p * (n - 1);
      var xs = reduzMovimento ? Math.round(x) : suavizar(x);
      pista.style.setProperty("--x", xs.toFixed(4));
      ativar(Math.round(xs));
    }

    var pedido = false;
    window.addEventListener("scroll", function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(function () { lerScroll(); pedido = false; });
    }, { passive: true });
    window.addEventListener("resize", lerScroll);
    lerScroll();

    function irPara(k) {
      var topo = bloco.getBoundingClientRect().top + window.scrollY;
      var destino = n > 1 ? (k / (n - 1)) * percurso() : 0;
      window.scrollTo({ top: Math.round(topo + destino) + 1, behavior: reduzMovimento ? "auto" : "smooth" });
    }

    botoes.forEach(function (b) {
      b.addEventListener("click", function () { irPara(parseInt(b.getAttribute("data-ir-tipo"), 10)); });
    });

    // Setas ← →
    var setaAnt = bloco.querySelector("[data-tipo-anterior]");
    var setaSeg = bloco.querySelector("[data-tipo-seguinte]");
    function atualizarSetas() {
      if (setaAnt) setaAnt.disabled = atual <= 0;
      if (setaSeg) setaSeg.disabled = atual >= n - 1;
    }
    if (setaAnt) setaAnt.addEventListener("click", function () { irPara(Math.max(0, atual - 1)); });
    if (setaSeg) setaSeg.addEventListener("click", function () { irPara(Math.min(n - 1, atual + 1)); });
    var ativarOriginal = ativar;
    ativar = function (i) { ativarOriginal(i); atualizarSetas(); };
    atualizarSetas();

    // Ligação direta a um quarto (ex.: suites-residencias.html#master-suite)
    var pedidoInicial = location.hash && bloco.querySelector(".tipo" + location.hash.replace(/[^#\w-]/g, ""));
    if (pedidoInicial) {
      var k0 = tipos.indexOf(pedidoInicial);
      setTimeout(function () {
        var topo = bloco.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.round(topo + (n > 1 ? (k0 / (n - 1)) * percurso() : 0)) + 1, behavior: "auto" });
      }, 60);
    }

    // "Íman": quando o scroll para a meio de dois quartos, completa o
    // movimento até ao quarto seguinte (ou anterior, se estava a subir).
    var ultimoY = window.scrollY, direcao = 1, temporizador = null;
    function imantar() {
      var topoBloco = bloco.getBoundingClientRect().top;
      var p = -topoBloco / percurso();
      if (p <= 0.001 || p >= 0.999) return;           // fora do bloco: scroll normal
      var x = p * (n - 1);
      var base = Math.floor(x), f = x - base;
      if (f < 0.01 || f > 0.99) return;               // já está num quarto
      var alvo = direcao > 0 ? (f > 0.12 ? base + 1 : base) : (f < 0.88 ? base : base + 1);
      irPara(Math.min(n - 1, Math.max(0, alvo)));
    }
    var temFimDeScroll = "onscrollend" in window;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y !== ultimoY) direcao = y > ultimoY ? 1 : -1;
      ultimoY = y;
      if (temFimDeScroll) return;
      clearTimeout(temporizador);
      temporizador = setTimeout(imantar, 160);
    }, { passive: true });
    if (temFimDeScroll) window.addEventListener("scrollend", imantar);

    // Travão: com o bloco fixo no ecrã, cada gesto da roda/trackpad avança UMA tipologia.
    // A inércia do trackpad (muitos eventos seguidos) é ignorada até parar, para não saltar duas.
    // No primeiro quarto a subir e no último a descer, o scroll volta a ser normal (sai do bloco).
    var trancado = false, fimMinimo = 0, fimInercia = 0, destino = 0;
    function preso() {
      var r = bloco.getBoundingClientRect();
      return r.top <= 2 && r.bottom >= window.innerHeight - 2;
    }
    window.addEventListener("wheel", function (e) {
      if (n < 2 || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      var agora = performance.now();
      if (trancado) {
        var emInercia = agora < fimInercia;
        fimInercia = agora + 160;                       // cada evento prolonga a inércia
        if (agora < fimMinimo || emInercia) { e.preventDefault(); return; }
      }
      trancado = false;
      if (!preso() || Math.abs(e.deltaY) < 2) return;
      var dir = e.deltaY > 0 ? 1 : -1;
      var base = atual < 0 ? 0 : atual;
      var k = base + dir;
      if (k < 0 || k > n - 1) return;                   // saída do bloco: scroll normal
      e.preventDefault();
      destino = k; trancado = true;
      fimMinimo = agora + (reduzMovimento ? 250 : 750); fimInercia = agora + 160;
      irPara(k);
    }, { passive: false });
  });

  /* ---------- 2d-bis. Botão "Ver suíte"/"Ver restaurante" → a foto cresce até ao ecrã inteiro e abre o quarto ---------- */
  document.querySelectorAll("a[data-abre-quarto]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      var url = a.getAttribute("href");
      var fig = a.closest(".tipo") && a.closest(".tipo").querySelector(".tipo__foto");
      var img = fig && fig.querySelector("img");
      if (!img || reduzMovimento) return;              // sem animação: abre normalmente
      e.preventDefault();

      var r = fig.getBoundingClientRect();
      var foco = a.getAttribute("data-foco") || "50% 50%";
      var origem = getComputedStyle(img).objectPosition || "50% 50%";

      var caixa = document.createElement("div");
      caixa.className = "zoom-foto";
      caixa.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      var copia = document.createElement("img");
      copia.src = img.currentSrc || img.src;
      copia.alt = "";
      var veu = document.createElement("div");
      veu.className = "zoom-foto__veu";
      caixa.appendChild(copia);
      // a foto do banner da página de destino (pode ser outro ficheiro ou outro enquadramento):
      // aparece por cima enquanto a foto cresce, para no fim ficar igual ao banner e não haver salto
      var heroUrl = a.getAttribute("data-hero");
      var copiaHero = null;
      if (heroUrl) {
        copiaHero = document.createElement("img");
        copiaHero.src = heroUrl; copiaHero.alt = ""; copiaHero.style.opacity = "0";
        caixa.appendChild(copiaHero);
      }
      caixa.appendChild(veu);
      document.body.appendChild(caixa);
      document.documentElement.classList.add("a-abrir-quarto");

      // pré-carrega a página do quarto enquanto anima
      var pre = document.createElement("link");
      pre.rel = "prefetch"; pre.href = url;
      document.head.appendChild(pre);

      // o resto da página desaparece enquanto a foto cresce, num só movimento contínuo (sem "pulso"
      // antes: a foto aumentava, voltava atrás e só depois crescia); no fim, pausa curta e muda de página
      var duracao = 1500, pausa = 300, curva = "cubic-bezier(0.65, 0, 0.35, 1)";
      crescer();
      function crescer() {
      caixa.animate([
        { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" },
        { left: "0px", top: "0px", width: document.documentElement.clientWidth + "px", height: window.innerHeight + "px" }
      ], { duration: duracao, easing: curva, fill: "forwards" });
      // no fim, a foto fica com o mesmo enquadramento do hero da página do quarto
      copia.animate([
        { height: "100%", objectPosition: origem },
        { height: "114%", objectPosition: foco }
      ], { duration: duracao, easing: curva, fill: "forwards" });
      if (copiaHero) copiaHero.animate([
        { height: "100%", objectPosition: origem, opacity: 0 },
        { opacity: 0, offset: 0.15 },
        { opacity: 1, offset: 0.7 },
        { height: "114%", objectPosition: foco, opacity: 1 }
      ], { duration: duracao, easing: curva, fill: "forwards" });
      var anim = veu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracao, easing: curva, fill: "forwards" });
      anim.onfinish = function () {
        try { sessionStorage.setItem("vl-transicao", "quarto"); } catch (err) {}
        setTimeout(function () { window.location.href = url; }, pausa);
      };
      }
    });
  });

  // Na página do quarto: se chegou pela animação, o texto do hero aparece suavemente
  if (document.documentElement.classList.contains("chegada-quarto")) {
    requestAnimationFrame(function () {
      setTimeout(function () { document.documentElement.classList.add("chegou"); }, 120);
    });
  }

  // Ao voltar atrás no browser, a página de suítes aparece normal
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    document.documentElement.classList.remove("a-abrir-quarto");
    document.querySelectorAll(".zoom-foto").forEach(function (z) { z.remove(); });
  });

  /* ---------- 2d-ter. Áreas do Wellness: cada área ajusta-se ao ecrã e bloqueia (como a home) ----------
     Só dentro do bloco das áreas: um gesto = uma área. Antes da primeira e depois
     da última, o scroll volta a ser normal. */
  // também nas filas de tratamentos (Rituals, Thalassoterapia, Thalasso Flows)
  var blocoAreas = document.querySelector(".areas, .linhas");
  if (blocoAreas) {
    var areas = Array.prototype.slice.call(blocoAreas.querySelectorAll(".area"));
    var bloqueado = false, yAreas = window.scrollY, direcao = 1, esperaFim;
    var noTelemovel = function () { return window.matchMedia("(max-width: 900px)").matches; };
    var topoDe = function (a) { return a.getBoundingClientRect().top + window.scrollY; };
    var maisPerto = function () {
      var vh = window.innerHeight, melhor = -1, dist = Infinity;
      areas.forEach(function (a, k) {
        var t = a.getBoundingClientRect().top;
        if (Math.abs(t) < vh * 0.5 && Math.abs(t) < dist) { dist = Math.abs(t); melhor = k; }
      });
      return melhor;
    };
    var irParaArea = function (k) {
      bloqueado = true;
      window.scrollTo({ top: topoDe(areas[k]), behavior: reduzMovimento ? "auto" : "smooth" });
      setTimeout(function () { bloqueado = false; }, 950);
    };
    var marcarAtiva = function () {
      var k = maisPerto();
      areas.forEach(function (a, j) { a.classList.toggle("ativa", j === k && Math.abs(a.getBoundingClientRect().top) < 60); });
    };

    // roda do rato / trackpad: passa uma área de cada vez
    window.addEventListener("wheel", function (e) {
      if (noTelemovel() || Math.abs(e.deltaY) < 2) return;
      var k = maisPerto();
      if (k < 0) return;                                    // fora do bloco: scroll normal
      var d = e.deltaY > 0 ? 1 : -1;
      var t = areas[k].getBoundingClientRect().top;
      var alvo = (Math.abs(t) > 4 && (d > 0 ? t > 0 : t < 0)) ? k : k + d;   // primeiro ajusta, depois avança
      if (alvo < 0 || alvo >= areas.length) return;         // saída pelo topo ou pelo fim: livre
      e.preventDefault();
      if (!bloqueado) irParaArea(alvo);
    }, { passive: false });

    // toque, teclado e barra de scroll: quando o scroll para, encaixa na área mais próxima
    var encaixar = function () {
      if (bloqueado) return;
      var k = maisPerto();
      if (k < 0) return;
      var t = areas[k].getBoundingClientRect().top;
      if (Math.abs(t) <= 2) return;
      if (k === areas.length - 1 && direcao > 0 && t < 0) return;   // a sair pelo fim
      if (k === 0 && direcao < 0 && t > 0) return;                  // a sair pelo topo
      irParaArea(k);
    };
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y !== yAreas) direcao = y > yAreas ? 1 : -1;
      yAreas = y;
      marcarAtiva();
      if (!("onscrollend" in window)) { clearTimeout(esperaFim); esperaFim = setTimeout(encaixar, 160); }
    }, { passive: true });
    if ("onscrollend" in window) window.addEventListener("scrollend", encaixar);
    marcarAtiva();
  }

  /* ---------- 2e. Galeria do quarto: fotos entram com o scroll e depois "pairam" ---------- */
  document.querySelectorAll(".galeria").forEach(function (galeria) {
    var fotos = Array.prototype.slice.call(galeria.querySelectorAll("figure"));
    if (reduzMovimento || !("IntersectionObserver" in window)) {
      fotos.forEach(function (f) { f.classList.add("visivel"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visivel"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    fotos.forEach(function (f) { obs.observe(f); });

    // Cada foto desloca-se a uma velocidade ligeiramente diferente
    var velocidades = [0.06, 0.1, 0.04, 0.08, 0.05, 0.11, 0.07, 0.05];
    var pedidoG = false;
    function pairar() {
      var meio = window.innerHeight / 2;
      fotos.forEach(function (f, k) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        var d = (r.top + r.height / 2 - meio) * -velocidades[k % velocidades.length];
        f.querySelector("img").style.setProperty("--pairar", d.toFixed(1) + "px");
      });
      pedidoG = false;
    }
    window.addEventListener("scroll", function () {
      if (!pedidoG) { pedidoG = true; requestAnimationFrame(pairar); }
    }, { passive: true });
    pairar();
  });

  /* ---------- 2f. Galeria editorial (Elegant Suite): entrada, "pairar" e faixa que desliza ---------- */
  document.querySelectorAll(".galeria-ed").forEach(function (gal) {
    var fotos = Array.prototype.slice.call(gal.querySelectorAll(".ge-foto"));
    var pista = gal.querySelector(".ge-faixa__pista");
    var faixa = gal.querySelector(".ge-faixa");
    if (reduzMovimento || !("IntersectionObserver" in window)) {
      fotos.forEach(function (f) { f.classList.add("visivel"); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visivel"); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    fotos.forEach(function (f) { obs.observe(f); });
    var grandes = gal.querySelectorAll(".ge-abertura .ge-foto, .ge-fecho .ge-foto");
    var vel = [0.05, 0.09, 0.06, 0.1, 0.07];
    var pedido = false;
    function anima() {
      var vh = window.innerHeight, meio = vh / 2;
      grandes.forEach(function (f, k) {
        var r = f.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        f.querySelector("img").style.setProperty("--pairar", ((r.top + r.height / 2 - meio) * -vel[k % vel.length]).toFixed(1) + "px");
      });
      // a faixa anda para a esquerda enquanto atravessa o ecrã (só em ecrãs largos)
      if (pista && window.innerWidth > 900) {
        var r = faixa.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        var excesso = pista.scrollWidth - document.documentElement.clientWidth;
        var inicio = document.documentElement.clientWidth * 0.06;
        pista.style.setProperty("--desliza", (inicio - p * (excesso + inicio * 2)).toFixed(1) + "px");
      }
      pedido = false;
    }
    window.addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(anima); } }, { passive: true });
    window.addEventListener("resize", anima);
    anima();
  });

  /* ---------- 2g. Vídeo do quarto: toca quando está no ecrã; botão Pausar / Reproduzir ---------- */
  document.querySelectorAll(".video-quarto").forEach(function (bloco) {
    var video = bloco.querySelector("video"), botao = bloco.querySelector("[data-video-botao]");
    var pausadoPeloUtilizador = reduzMovimento;
    function mostra() { var p = video.paused; botao.textContent = p ? "Reproduzir" : "Pausar"; botao.setAttribute("aria-pressed", p ? "true" : "false"); }
    video.addEventListener("play", mostra); video.addEventListener("pause", mostra);
    botao.addEventListener("click", function () {
      if (video.paused) { pausadoPeloUtilizador = false; video.play(); } else { pausadoPeloUtilizador = true; video.pause(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!pausadoPeloUtilizador) video.play().catch(function () {}); } else video.pause();
      }, { threshold: 0.25 }).observe(video);
    }
    mostra();
  });

  /* ---------- 2h. Cartões de categoria (#suites, #residencias): salto quase imediato ----------
     Em vez de deslizar pela página (e passar pelas suítes a caminho das residências),
     a página desvanece, salta para o bloco e volta a aparecer. */
  document.querySelectorAll('.cartoes a[href^="#"]').forEach(function (a) {
    var alvo = a.getAttribute("href").length > 1 && document.querySelector(a.getAttribute("href"));
    if (!alvo) return;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var raiz = document.documentElement;
      var salta = function () {
        raiz.style.scrollBehavior = "auto";
        window.scrollTo(0, Math.round(alvo.getBoundingClientRect().top + window.scrollY));
        raiz.style.scrollBehavior = "";
        if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
        raiz.classList.remove("a-saltar");
      };
      if (reduzMovimento) { salta(); return; }
      raiz.classList.add("a-saltar");
      setTimeout(salta, 160);
    });
  });

  /* ---------- 2i. Reservas: "Marcar tratamento" chega com o tratamento já escolhido ----------
     Os botões das páginas do Wellness levam a reservas.html?tratamento=<valor>#marcar-tratamento */
  var escolhaTrat = document.querySelector('#marcar-tratamento select[name="tratamento"]');
  if (escolhaTrat) {
    var pedidoTrat = new URLSearchParams(location.search).get("tratamento");
    if (pedidoTrat && escolhaTrat.querySelector('option[value="' + pedidoTrat.replace(/[^\w-]/g, "") + '"]')) {
      escolhaTrat.value = pedidoTrat;
    }
  }

  /* ---------- 2j. Banner fixo: o título acompanha a parte da foto que ainda se vê ----------
     O banner fica parado e o conteúdo sobe por cima; sem isto, o título ficava tapado logo no início.
     O texto sobe metade do scroll, para ficar sempre a meio da parte visível da foto. */
  var bannerFixo = document.querySelector(".landing--fixo");
  if (bannerFixo && !reduzMovimento) {
    var pedidoBanner = false;
    var moveTitulo = function () {
      pedidoBanner = false;
      var y = Math.min(Math.max(window.scrollY, 0), bannerFixo.offsetHeight);
      bannerFixo.style.setProperty("--sobe", (-y / 2).toFixed(1) + "px");
    };
    window.addEventListener("scroll", function () {
      if (pedidoBanner) return; pedidoBanner = true; requestAnimationFrame(moveTitulo);
    }, { passive: true });
    moveTitulo();
  }

  /* ---------- 3. Home ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var menuHome = document.querySelector(".menu-categorias");
  if (!slides.length) return;

  var ligacoesMenu = menuHome ? menuHome.querySelectorAll("a[data-slide]") : [];

  function marcarAtiva(id) {
    ligacoesMenu.forEach(function (a) {
      if (a.getAttribute("data-slide") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  // Categoria visível → sublinhada
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= 0.55) marcarAtiva(e.target.id);
    });
  }, { threshold: [0.55] });
  slides.forEach(function (s) { observador.observe(s); });

  // Clique numa categoria (menu de baixo ou botão Descobrir) → abre a landing
  // com a animação: o resto do menu desaparece, a palavra vai para o centro
  // e cresce, a barra muda e aparece a seta. Depois muda de página.
  var aAbrir = false;

  function esperarQuieto(el, depois) {
    var inicio = performance.now();
    (function verificar() {
      var topo = el.getBoundingClientRect().top;
      if (Math.abs(topo) < 2 || performance.now() - inicio > 1400) { setTimeout(depois, 80); return; }
      requestAnimationFrame(verificar);
    })();
  }

  function abrirCategoria(id, url) {
    if (aAbrir) return;
    var slide = document.getElementById(id);
    var palavra = menuHome && menuHome.querySelector('a[data-slide="' + id + '"]');
    if (!slide || !palavra || reduzMovimento || getComputedStyle(menuHome).display === "none") {
      window.location.href = url;
      return;
    }
    aAbrir = true;
    if (Math.abs(slide.getBoundingClientRect().top) > 2) slide.scrollIntoView({ behavior: "smooth" });

    esperarQuieto(slide, function () {
      marcarAtiva(id);
      var r = palavra.getBoundingClientRect();
      var tamOrigem = parseFloat(getComputedStyle(palavra).fontSize);
      var medidor = document.createElement("span");
      medidor.style.fontSize = "var(--tam-titulo-landing)";
      document.body.appendChild(medidor);
      var tamDestino = parseFloat(getComputedStyle(medidor).fontSize);
      medidor.remove();

      var voadora = document.createElement("p");
      voadora.className = "palavra-voadora";
      voadora.textContent = palavra.textContent;
      voadora.style.fontSize = tamOrigem + "px";
      voadora.style.left = r.left + "px";
      voadora.style.top = r.top + "px";
      voadora.style.lineHeight = r.height + "px";
      document.body.appendChild(voadora);
      palavra.classList.add("escolhida");
      document.documentElement.classList.add("a-abrir");

      var vr = voadora.getBoundingClientRect();
      // Centro da área visível SEM a barra de scroll (é aí que o título da landing fica:
      // com innerWidth a palavra parava ~7 px ao lado do título)
      var dx = document.documentElement.clientWidth / 2 - (vr.left + vr.width / 2);
      var dy = document.documentElement.clientHeight / 2 - (vr.top + vr.height / 2);
      var escala = tamDestino / tamOrigem;
      var fim = "translate(" + dx + "px, " + dy + "px) scale(" + escala + ")";
      var curva = "cubic-bezier(0.65, 0, 0.35, 1)";
      var anim = voadora.animate([
        { transform: "translate(0, 0) scale(1)" },
        { transform: fim }
      ], { duration: 1100, easing: curva, fill: "forwards" });

      // 60.º Aniversário: a landing abre com o selo em vez da palavra.
      // A palavra desfaz-se (as letras afastam-se e desfocam) e o selo forma-se
      // no mesmo sítio, a rodar como se as letras se enrolassem no círculo.
      // O selo fica exatamente onde está no banner da página → passagem sem salto.
      var selo = slide.getAttribute("data-landing-selo");
      if (selo) {
        var caixa = document.createElement("div");
        caixa.className = "hero-quarto__texto hero-restaurante";
        caixa.setAttribute("aria-hidden", "true");
        caixa.innerHTML = '<img class="hero-restaurante__logo hero-restaurante__logo--60" src="' + selo + '" alt="" width="155" height="156">';
        caixa.style.opacity = "0";
        slide.appendChild(caixa);
        var imgSelo = caixa.querySelector("img");
        anim.onfinish = function () {
          var ls = parseFloat(getComputedStyle(voadora).letterSpacing) || 0;
          voadora.animate([
            { transform: fim, letterSpacing: ls + "px", opacity: 1, filter: "blur(0)" },
            { transform: fim + " scale(1.12)", letterSpacing: (ls + 6) + "px", opacity: 0, filter: "blur(6px)" }
          ], { duration: 900, easing: curva, fill: "forwards" });
          caixa.style.opacity = "1";
          var forma = imgSelo.animate([
            { opacity: 0, transform: "rotate(-75deg) scale(0.7)", filter: "brightness(0) invert(1) blur(8px)" },
            { opacity: 1, transform: "rotate(0deg) scale(1)", filter: "brightness(0) invert(1) blur(0)" }
          ], { duration: 1300, delay: 250, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
          forma.onfinish = function () { setTimeout(function () { window.location.href = url; }, 300); };
        };
        return;
      }
      anim.onfinish = function () { setTimeout(function () { window.location.href = url; }, 350); };
    });
  }

  document.querySelectorAll("[data-abre-categoria]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // abrir noutro separador funciona normalmente
      e.preventDefault();
      abrirCategoria(a.getAttribute("data-abre-categoria"), a.getAttribute("href"));
    });
  });

  // Clique em HOME → volta ao primeiro ecrã
  ligacoesMenu.forEach(function (a) {
    if (a.getAttribute("href").charAt(0) !== "#") return;
    a.addEventListener("click", function (e) {
      var alvo = document.querySelector(a.getAttribute("href"));
      if (!alvo) return;
      e.preventDefault();
      alvo.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth" });
    });
  });

  // Ao voltar atrás no browser, a home aparece normal (sem o estado da animação)
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    aAbrir = false;
    document.documentElement.classList.remove("a-abrir");
    document.querySelectorAll(".palavra-voadora, .slide > .hero-restaurante[aria-hidden]").forEach(function (v) { v.remove(); });
    document.querySelectorAll(".menu-categorias a.escolhida").forEach(function (a) { a.classList.remove("escolhida"); });
  });

  // Rodapé visível → esconde a barra de categorias
  var rodape = document.querySelector(".rodape");
  if (rodape && menuHome) {
    new IntersectionObserver(function (entradas) {
      menuHome.classList.toggle("escondido", entradas[0].isIntersecting);
    }, { threshold: 0.15 }).observe(rodape);
  }

  // Vídeo de fundo: parado para quem pede menos movimento; pausa quando sai do ecrã (poupa bateria)
  document.querySelectorAll(".slide__video").forEach(function (v) {
    if (reduzMovimento) { v.removeAttribute("autoplay"); v.pause(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
      }, { threshold: 0.1 }).observe(v);
    }
  });

  // Deslocação das fotografias (a imagem anda mais devagar que o scroll)
  if (!reduzMovimento) {
    var agendado = false;
    function deslocar() {
      var alturaEcra = window.innerHeight;
      slides.forEach(function (s) {
        var topo = s.getBoundingClientRect().top;
        if (topo > alturaEcra || topo < -alturaEcra) return;
        var progresso = topo / alturaEcra;           // 1 = a entrar, 0 = no lugar, -1 = a sair
        var media = s.querySelector(".slide__media");
        if (media) media.style.setProperty("--desloc", (progresso * -10).toFixed(2) + "vh");
      });
      agendado = false;
    }
    window.addEventListener("scroll", function () {
      if (!agendado) { agendado = true; requestAnimationFrame(deslocar); }
    }, { passive: true });
    window.addEventListener("resize", deslocar);
    deslocar();
  }
})();

/* Áreas do Wellness: a foto muda conforme a opção da lista em que está o rato (ou o foco). */
(function () {
  var areas = document.querySelectorAll(".area");
  Array.prototype.forEach.call(areas, function (area) {
    var links = area.querySelectorAll(".area__lista a[data-foto]");
    var fig = area.querySelector(".area__foto");
    if (!links.length || !fig) return;
    var foto = document.createElement("img");
    foto.className = "area__foto-troca";
    foto.alt = "";
    foto.setAttribute("aria-hidden", "true");
    fig.appendChild(foto);
    var textura = null, texturaOrig = area.querySelector(".area__textura");
    if (texturaOrig) {
      textura = texturaOrig.cloneNode(false);
      textura.classList.add("area__textura-troca");
      texturaOrig.parentNode.insertBefore(textura, texturaOrig.nextSibling);
    }
    var carregadas = false;
    function preCarregar() {
      if (carregadas) return;
      carregadas = true;
      Array.prototype.forEach.call(links, function (a) { var i = new Image(); i.src = a.getAttribute("data-foto"); });
    }
    function mostra(a) {
      preCarregar();
      var src = a.getAttribute("data-foto");
      foto.src = src;
      if (textura) textura.src = src;
      area.classList.add("a-trocar");
    }
    function volta() { area.classList.remove("a-trocar"); }
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener("mouseenter", function () { mostra(a); });
      a.addEventListener("focus", function () { mostra(a); });
      a.addEventListener("mouseleave", volta);
      a.addEventListener("blur", volta);
    });
  });
})();


/* ---------------------------------------------------------------------
   Checkout (finalizar reserva): lê ?tarifa=nr|web|online&quartos=N,
   atualiza o resumo e valida o formulário (protótipo: não envia nada).
   Nas tarifas, o "Continuar" leva o número de quartos escolhido.
   --------------------------------------------------------------------- */
(function () {
  document.querySelectorAll("[data-co-continuar]").forEach(function (a) {
    a.addEventListener("click", function () {
      var sel = a.closest(".tarifa__acoes").querySelector("select");
      if (sel) a.href = a.href.split("&quartos=")[0] + "&quartos=" + (sel.selectedIndex + 1);
    });
  });

  var raiz = document.querySelector("[data-checkout]");
  if (!raiz) return;
  var TARIFAS = JSON.parse(raiz.getAttribute("data-co-tarifas"));   /* preços de cada tarifa, escritos na página */
  var UNI = (raiz.getAttribute("data-co-unidade") || "quarto|quartos").split("|");
  var q = new URLSearchParams(location.search);
  var chave = TARIFAS[q.get("tarifa")] ? q.get("tarifa") : Object.keys(TARIFAS)[0];
  var t = TARIFAS[chave];
  var selQ = raiz.querySelector("[data-co-quartos]");
  var n0 = parseInt(q.get("quartos"), 10);
  if (n0 >= 1 && n0 <= 3) selQ.value = String(n0);
  var $ = function (s) { return raiz.querySelector(s); };
  var eur = function (v) { return v.toFixed(2).replace(".", ",") + " €"; };

  $("[data-co-tarifa-nome]").textContent = t.nome;
  raiz.querySelectorAll("[data-co-cond]").forEach(function (d) { d.hidden = d.getAttribute("data-co-cond") !== chave; });
  if (!t.deposito) {
    $("[data-co-garantia]").textContent = "Esta tarifa não requer depósito. O cartão de crédito serve apenas como garantia da reserva e o pagamento é feito no hotel.";
  }

  function atualiza() {
    var n = parseInt(selQ.value, 10);
    var estadia = t.preco * n, taxa = 2 * n;
    var base = Math.round(estadia / 1.06 * 100) / 100;
    $("[data-co-estadia]").textContent = "1 noite · " + 2 * n + " hóspedes · " + n + " " + (n > 1 ? UNI[1] : UNI[0]);
    $("[data-co-base]").textContent = eur(base);
    $("[data-co-iva]").textContent = eur(estadia - base);
    $("[data-co-taxa]").textContent = eur(taxa);
    $("[data-co-total]").textContent = eur(estadia + taxa);
    $("[data-co-agora-txt]").textContent = t.deposito ? "A pagar agora (depósito)" : "A pagar agora";
    $("[data-co-agora]").textContent = eur(t.deposito ? estadia : 0);
    $("[data-co-hotel]").textContent = eur(t.deposito ? taxa : estadia + taxa);
  }
  selQ.addEventListener("change", atualiza);
  atualiza();

  var form = raiz.querySelector("form"), erro = $("[data-co-erro]"), ok = $("[data-co-ok]");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = "";
    if (!form.checkValidity()) msg = "Preencha os campos obrigatórios (*) e aceite as condições.";
    else if (form.email.value.trim().toLowerCase() !== form.email2.value.trim().toLowerCase()) msg = "Os dois e-mails não coincidem.";
    erro.textContent = msg;
    erro.hidden = !msg;
    if (!msg) { ok.hidden = false; ok.focus(); }
  });
})();

/* Ocasiões: o botão "Planear" de cada ocasião leva ao formulário e já escolhe o tipo de ocasião. */
(function () {
  var sel = document.querySelector('#pedido select[name="ocasiao"]');
  if (!sel) return;
  document.querySelectorAll("[data-ocasiao]").forEach(function (a) {
    a.addEventListener("click", function () { sel.value = a.getAttribute("data-ocasiao"); });
  });
})();

/* Formulários com data-pedido-email (experiências): valida e abre o e-mail com os dados preenchidos. */
(function () {
  document.querySelectorAll("form[data-pedido-email]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var linhas = [];
      form.querySelectorAll(".pedido__campo").forEach(function (campo) {
        var rot = campo.querySelector("span"), el = campo.querySelector("input, select, textarea");
        if (!rot || !el || !el.value) return;
        var valor = el.tagName === "SELECT" ? el.options[el.selectedIndex].text : el.value;
        linhas.push(rot.textContent.replace(/ /g, " ") + ": " + valor.replace(/ /g, " "));
      });
      if (form.hospede && form.hospede.checked) linhas.push("Hospedado no Vilalara: sim");
      var sel = form.querySelector("select");
      var assunto = form.getAttribute("data-pedido-assunto") + (sel ? " · " + sel.options[sel.selectedIndex].text.replace(/ /g, " ") : "");
      location.href = "mailto:" + form.getAttribute("data-pedido-email") + "?subject=" + encodeURIComponent(assunto) + "&body=" + encodeURIComponent(linhas.join("\n"));
      var ok = form.querySelector(".pedido__ok"); if (ok) ok.hidden = false;
    });
  });
})();

/* ---------------------------------------------------------------------
   Cursor gaivota (experiência): só em dispositivos com rato.
   A gaivota é desenhada em SVG a cada fotograma (corpo + duas asas com
   ombro, cotovelo e ponta), por isso o movimento é contínuo:
   – a voar: bate as asas com a descida mais lenta e forte do que a subida
     (~0,8 a ~1,3 batidas por segundo); devagar, dá algumas batidas e plana um pouco;
   – parada: plana com as asas em "M", a ondular devagar;
   – a descer depressa: recolhe as asas e mergulha;
   – nas curvas e ao virar, inclina as asas (uma sobe, a outra desce);
   – ao mudar de lado, a cabeça e a cauda rodam para o outro lado (a meio vê-se de frente).
   – quando o rato para: pousa numa transformação contínua (o corpo muda de forma, as asas
     dobram-se e as patas descem) até ficar uma gaivota em pé; ao mexer o rato levanta voo.
   Desenho com o bico à esquerda; "lado" passa de 1 (esquerda) a -1 (direita).
   --------------------------------------------------------------------- */
(function () {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var NS = "http://www.w3.org/2000/svg";
  var el = document.createElement("div");
  el.className = "gaivota-cursor"; el.setAttribute("aria-hidden", "true");
  var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 100 50");
  var asaDir = document.createElementNS(NS, "path"), corpo = document.createElementNS(NS, "path"), asaEsq = document.createElementNS(NS, "path");
  /* corpo visto de baixo: bico fino, cabeça redonda com pescoço, peito, cauda em cunha */
  corpo.setAttribute("d", "M34.2 29.9 Q36.4 28.6 38.6 28.2 Q38.8 25.3 41.7 24.8 Q44.3 24.5 45.6 25.9 Q52.4 25.3 59.2 26.5 L64.4 26.7 L68.6 26.1 L67.9 27.9 L68.9 29.6 L64.2 29.6 Q56.4 32.6 48.6 32 Q43.4 31.6 40.9 30.4 Q38.8 30 36.8 30.2 Z");
  /* Transformação voo → em pé (como num vídeo): o corpo muda de forma ponto a ponto (os dois desenhos
     têm os mesmos pontos: bico, cabeça, nuca, costas, cauda, barriga, peito), as asas dobram-se para
     dentro do corpo e as patas saem da barriga até ao chão. */
  var asasG = document.createElementNS(NS, "g"), asasG2 = document.createElementNS(NS, "g");
  asasG.appendChild(asaDir); asasG2.appendChild(asaEsq);
  var patas = document.createElementNS(NS, "path"); patas.setAttribute("class", "gaivota-patas");
  svg.appendChild(asasG); svg.appendChild(corpo); svg.appendChild(asasG2); svg.appendChild(patas);
  var MOLDE = ["M", 2, "Q", 4, "Q", 4, "Q", 4, "Q", 4, "L", 2, "L", 2, "L", 2, "L", 2, "L", 2, "Q", 4, "Q", 4, "Q", 4];
  function numeros(d) { return d.match(/-?[0-9.]+/g).map(Number); }
  /* em voo: o desenho original, já com o "corpo mais cheio" (×1,3 na largura, ×1,55 na altura) */
  var NV = numeros(corpo.getAttribute("d")).map(function (n, k) { return k % 2 ? 28.6 + (n - 28.6) * 1.55 : 50 + (n - 50.5) * 1.3; });
  /* em pé (silhueta de perfil): cabeça redonda e alta, bico curvo, peito cheio, cauda em ponta */
  var NP = numeros("M30.9 10.1 Q33.5 8.4 36.4 7.8 Q37.6 4.2 42.6 4.1 Q47 4.2 47.4 8.2 Q48.2 15.5 56 22.5 L63.5 29 L71.3 34 L66.5 35 L69.8 37.2 L60.5 35.4 Q53.5 36.4 47 34.6 Q37.4 31.6 37.2 15.5 Q36.6 11.6 33.2 10.8 Z");
  /* patas (em pé): anca, calcanhar no chão, dedos para a frente */
  var PATAS = [[47.2, 33.8, 46.9, 45.6, 41.6, 46], [53.2, 33.8, 52.9, 46.4, 47.9, 47]];
  /* tamanho da gaivota em pé: ~74 %, centrada no ponto do rato, para ter o mesmo peso visual da gaivota em voo */
  var ESC = 0.74;
  function reduz(n, k) { return k % 2 ? 26 + (n - 26) * ESC : 50 + (n - 50) * ESC; }
  NP = NP.map(reduz);
  PATAS = PATAS.map(function (P) { return P.map(reduz); });
  el.appendChild(svg); document.body.appendChild(el);
  document.documentElement.classList.add("cursor-gaivota");

  var SX = 50, SY = 26.4;                       /* ombro (por cima do corpo) */
  function f(n) { return n.toFixed(2); }
  /* uma asa: dir = -1 (esquerda) ou 1 (direita); sobe = cotovelo, ponta = ponta da asa (com atraso);
     abre = 1 aberta, 0 recolhida (mergulho); escala = comprimento (perspetiva) */
  function asa(dir, sobe, ponta, abre, escala) {
    var L = 44 * escala * (0.5 + 0.5 * abre);
    var ex = SX + dir * L * 0.37, ey = SY - 16 * sobe;                       /* cotovelo */
    var tx = SX + dir * L - dir * (1 - abre) * 4, ty = SY - 19 * ponta + 3 + (1 - abre) * 5;   /* ponta */
    return "M" + f(SX + dir * 1.2) + " " + f(SY - 2.4) +
      " Q" + f(SX + dir * L * 0.17) + " " + f(ey - 4.8) + " " + f(ex) + " " + f(ey - 3.3) +        /* bordo de ataque: braço largo */
      " Q" + f(ex + dir * L * 0.38) + " " + f((ey + ty) / 2 - 2.6) + " " + f(tx) + " " + f(ty) +   /* mão afilada até à ponta */
      " Q" + f(ex + dir * L * 0.3) + " " + f((ey + ty) / 2 + 2.6) + " " + f(ex + dir * 1.5) + " " + f(ey + 3.4) +
      " Q" + f(ex - dir * L * 0.05) + " " + f(ey + 5.6) + " " + f(SX + dir * L * 0.14) + " " + f(SY + 5.4) +   /* bordo de fuga curvo */
      " Q" + f(SX + dir * 5) + " " + f(SY + 5.4) + " " + f(SX + dir * 3.5) + " " + f(SY + 4) + " Z";
  }

  var x = -100, y = -100, vx = 0, vy = 0, inclina = 0, ultimo = 0, antes = 0;
  var alvoLado = 1, lado = 1, vLado = 0, empurra = 0, balanco = 0, curva = 0, rumo = 0, rodar = 0;
  var pousa = 0;                               /* 0 a voar, 1 pousada (em pé) */
  var fase = 0, amp = 0.07, base = 0.5, pBase = -0.12, abre = 1, batidas = 0, planaAte = 0;
  function aproxima(v, alvo, k, dt) { return v + (alvo - v) * Math.min(1, dt * k); }

  function desenha(t) {
    var dt = Math.min(0.05, (t - (antes || t)) / 1000); antes = t;
    var parada = t - ultimo > 200;
    /* pousar demora ~0,8 s, levantar voo ~0,45 s, sempre ao mesmo ritmo (a suavidade vem da curva abaixo) */
    pousa = t - ultimo > 300 ? Math.min(1, pousa + dt / 0.8) : Math.max(0, pousa - dt / 0.45);
    vx *= 0.9; vy *= 0.9;
    var vel = Math.sqrt(vx * vx + vy * vy);
    var mergulho = !parada && vy > 5 && vy > Math.abs(vx) * 1.2;
    var voa = !parada && vel > 0.8;
    /* a voar devagar: 3 batidas e depois plana ~1 s (como as gaivotas); depressa: bate sempre */
    var aPlanar = !voa || (t < planaAte && vel < 8);
    var aAmp = mergulho ? 0.05 : aPlanar ? 0.07 : 0.72;
    var aBase = mergulho ? 0.55 : aPlanar ? 0.5 : 0.18;      /* cotovelos: a planar ficam levantados ("M") */
    var aPBase = mergulho ? 0.5 : aPlanar ? -0.12 : 0.08;    /* pontas: a planar descaem */
    amp = aproxima(amp, aAmp, 3, dt); base = aproxima(base, aBase, 3, dt); pBase = aproxima(pBase, aPBase, 3, dt);
    abre = aproxima(abre, mergulho ? 0.25 : 1, 5, dt);
    var freq = aPlanar ? 0.3 : 0.8 + Math.min(0.5, vel / 25);
    var antesFase = fase;
    fase += dt * freq * Math.PI * 2;
    if (!aPlanar && Math.floor(fase / (Math.PI * 2)) > Math.floor(antesFase / (Math.PI * 2))) {
      batidas++;
      if (vel < 8 && batidas >= 3) { batidas = 0; planaAte = t + 900 + Math.random() * 500; }
    }
    /* onda assimétrica: a descida (força) é mais lenta do que a subida */
    var w = fase + 0.32 * Math.sin(fase);
    var sobe = base + amp * Math.sin(w), ponta = pBase + amp * 1.15 * Math.sin(w - 0.75);

    /* curvas: a variação do rumo inclina as asas; ao mudar de lado também */
    if (voa) {
      var r = Math.atan2(vy, vx), d = r - rumo;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      curva = aproxima(curva, Math.max(-0.35, Math.min(0.35, d / Math.max(dt, 0.008) * 0.04)), 5, dt);
      rumo = r;
    } else curva = aproxima(curva, 0, 3, dt);
    /* viragem como uma mola amortecida: arranca devagar, roda e trava sem saltos (~0,6 s) */
    vLado += ((alvoLado - lado) * 36 - vLado * 12) * dt;
    lado += vLado * dt;
    var banco = -vLado * 0.075 + curva;                              /* ao virar, inclina as asas aos poucos; >0: asa esquerda sobe */
    /* perspetiva 3/4: a asa do lado da cabeça fica mais curta e um pouco mais alta (está mais longe),
       a do lado da cauda fica inteira — assim a silhueta não é simétrica (não parece um bigode) */
    var longe = 0.16 * lado;                                         /* >0: a asa esquerda é a de longe */
    var e = pousa * pousa * pousa * (pousa * (pousa * 6 - 15) + 10);   /* curva suave: arranca e chega devagar */
    var abreV = abre * (1 - e);                                      /* ao pousar, as asas dobram-se */
    asaEsq.setAttribute("d", asa(-1, sobe + banco + longe * 0.6, ponta + banco * 1.3 + longe * 0.4, abreV, 0.84 - longe));
    asaDir.setAttribute("d", asa(1, sobe - banco - longe * 0.6, ponta - banco * 1.3 - longe * 0.4, abreV, 0.84 + longe));
    var sx = lado;                                                   /* a meio da viragem vê-se de frente (corpo estreito), sem saltos */
    /* asas: encolhem e recolhem para o dorso da gaivota em pé */
    var asT = "translate(" + f(50 + 2 * e * sx) + " " + f(26.4 - 1.8 * e) + ") scale(" + f(1 - 0.88 * e) + " " + f(1 - 0.75 * e) + ") translate(-50 -26.4)";
    asasG.setAttribute("transform", asT); asasG2.setAttribute("transform", asT);
    /* corpo: cada ponto passa do desenho em voo para o desenho em pé */
    var d = "", k = 0;
    for (var m = 0; m < MOLDE.length; m += 2) {
      d += MOLDE[m];
      for (var q = 0; q < MOLDE[m + 1]; q += 2, k += 2) {
        d += f(50 + (NV[k] + (NP[k] - NV[k]) * e - 50) * sx) + " " + f(NV[k + 1] + (NP[k + 1] - NV[k + 1]) * e) + " ";
      }
    }
    corpo.setAttribute("d", d + "Z");
    /* patas: só na segunda metade, crescem da barriga até ao chão */
    var pp = Math.max(0, Math.min(1, (e - 0.5) / 0.5));
    if (pp < 0.02) patas.setAttribute("d", "");
    else {
      var dp = "";
      PATAS.forEach(function (P) {
        var bx = P[0] + (P[2] - P[0]) * pp, by = P[1] + (P[3] - P[1]) * pp;
        var tx = bx + (P[4] - P[2]) * pp, ty = by + (P[5] - P[3]) * pp;
        dp += "M" + f(50 + (P[0] - 50) * sx) + " " + f(P[1]) + " L" + f(50 + (bx - 50) * sx) + " " + f(by) + " L" + f(50 + (tx - 50) * sx) + " " + f(ty) + " ";
      });
      patas.setAttribute("d", dp);
    }

    /* inclinação do corpo: a subir/descer, para o lado da cabeça; balanço nas viragens e curvas */
    var alvoInc = voa || mergulho ? Math.max(-32, Math.min(32, Math.atan2(vy, Math.abs(vx) + 0.001) * 180 / Math.PI * 0.55)) : Math.sin(t / 900) * 3;
    inclina = aproxima(inclina, alvoInc, 5, dt);
    balanco = aproxima(balanco, banco * 14, 6, dt);
    var bob = aPlanar ? Math.sin(t / 700) * 1.2 : -Math.sin(w) * 1.1;   /* o corpo sobe ligeiramente a cada batida */
    rodar = aproxima(rodar, -inclina * lado + balanco, 5, dt);       /* o ângulo final também é suavizado: sem saltos ao virar */
    el.style.transform = "translate(" + f(x - 30) + "px," + f(y - 16.5 + bob * (1 - e)) + "px) rotate(" + f(rodar * (1 - e)) + "deg)";   /* pousada: quieta e direita */
    requestAnimationFrame(desenha);
  }
  window.addEventListener("mousemove", function (e) {
    var dx = e.clientX - x, dy = e.clientY - y;
    x = e.clientX; y = e.clientY; ultimo = performance.now();
    vx = vx * 0.6 + dx * 0.4; vy = vy * 0.6 + dy * 0.4;
    /* só vira depois de andar uns píxeis seguidos para o outro lado */
    empurra = empurra * 0.9 + dx;
    if (empurra > 14) alvoLado = -1; else if (empurra < -14) alvoLado = 1;
    el.classList.add("visivel");
    var tg = e.target;
    el.classList.toggle("em-texto", !!(tg.closest && tg.closest('textarea, [contenteditable], input:not([type="checkbox"]):not([type="radio"]):not([type="date"])')));
  }, { passive: true });
  document.addEventListener("mouseleave", function () { el.classList.remove("visivel"); });

  /* Cor da gaivota: preta em fundos claros, branca em fundos escuros.
     Vê o que está por baixo do rato (de cima para baixo na pilha de elementos):
     foto ou vídeo → brilho dessa zona da imagem; cor de fundo opaca → brilho dessa cor. */
  var tela = document.createElement("canvas"); tela.width = tela.height = 8;
  var ctx = tela.getContext("2d", { willReadFrequently: true });
  var imagensFundo = {};
  function luz(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function brilhoMedia(media, rect, px, py, cs) {
    var nw = media.naturalWidth || media.videoWidth, nh = media.naturalHeight || media.videoHeight;
    if (!nw || !nh) return null;
    /* object-fit: cover (o habitual no site) com object-position */
    var esc = Math.max(rect.width / nw, rect.height / nh);
    var pos = ((cs && cs.objectPosition) || "50% 50%").split(" ");
    var ox = (rect.width - nw * esc) * (parseFloat(pos[0]) / 100 || 0.5);
    var oy = (rect.height - nh * esc) * (parseFloat(pos[1] || "50%") / 100 || 0.5);
    var sx = (px - rect.left - ox) / esc, sy = (py - rect.top - oy) / esc, raio = 24 / esc;
    try {
      ctx.clearRect(0, 0, 8, 8);
      ctx.drawImage(media, Math.max(0, sx - raio), Math.max(0, sy - raio), raio * 2, raio * 2, 0, 0, 8, 8);
      var d = ctx.getImageData(0, 0, 8, 8).data, s = 0;
      for (var i = 0; i < d.length; i += 4) s += luz(d[i], d[i + 1], d[i + 2]);
      return s / 64;
    } catch (err) { return null; }
  }
  function brilhoSob(px, py) {
    var pilha = document.elementsFromPoint(px, py);
    for (var i = 0; i < pilha.length; i++) {
      var n = pilha[i];
      if (n === el || el.contains(n)) continue;
      var cs = getComputedStyle(n);
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.3) continue;
      if (n.tagName === "IMG" || n.tagName === "VIDEO") {
        var v = brilhoMedia(n, n.getBoundingClientRect(), px, py, cs);
        if (v !== null) return v;
      }
      var bi = cs.backgroundImage;
      if (bi && bi !== "none") {
        var m = bi.match(/url\(["']?([^"')]+)["']?\)/);
        if (m) {
          var im = imagensFundo[m[1]];
          if (!im) { im = imagensFundo[m[1]] = new Image(); im.src = m[1]; }
          if (im.complete && im.naturalWidth) { var vb = brilhoMedia(im, n.getBoundingClientRect(), px, py, { objectPosition: cs.backgroundPosition }); if (vb !== null) return vb; }
        }
      }
      var cor = cs.backgroundColor.match(/[\d.]+/g);
      if (cor && (cor.length < 4 || parseFloat(cor[3]) > 0.5)) return luz(+cor[0], +cor[1], +cor[2]);
    }
    return 1;
  }
  var clara = false, ultimaVez = 0;
  function verFundo() {
    if (x < 0) return;
    var b = brilhoSob(x, y);
    var agoraClara = clara ? b < 0.45 : b < 0.34;                   /* só fundos mesmo escuros; histerese: não pisca na fronteira */
    if (agoraClara !== clara) { clara = agoraClara; el.classList.toggle("clara", clara); }
  }
  window.addEventListener("mousemove", function () {
    var t = performance.now();
    if (t - ultimaVez > 90) { ultimaVez = t; verFundo(); }
  }, { passive: true });
  window.addEventListener("scroll", function () { verFundo(); }, { passive: true });
  setInterval(verFundo, 400);                                       /* vídeos e diapositivos mudam por baixo */
  requestAnimationFrame(desenha);
})();

/* ---------- Histórias: filtro por tema ----------
   "Todas" mostra a composição editorial; um tema mostra só esses artigos numa grelha simples. */
(function () {
  var comp = document.querySelector("[data-revista]");
  var res = document.querySelector("[data-revista-resultado]");
  var filtro = document.querySelector(".historias-filtro");
  if (!comp || !res || !filtro) return;
  filtro.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-filtro]");
    if (!b) return;
    var tema = b.getAttribute("data-filtro");
    filtro.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    res.innerHTML = "";
    if (tema === "todas") { res.hidden = true; comp.hidden = false; return; }
    comp.querySelectorAll('.rv[data-tema="' + tema + '"]').forEach(function (a) { res.appendChild(a.cloneNode(true)); });
    comp.hidden = true; res.hidden = false;
  });
})();

/* Cartões do Wellness: a frase curta fica sempre em duas linhas — a largura máxima é metade do seu comprimento */
document.querySelectorAll(".tratamentos .tratamento p").forEach(function (p) {
  var n = p.textContent.replace(/\s+/g, " ").trim().length;
  p.style.setProperty("--meia-frase", Math.ceil(n / 2) + 2 + "ch");
});
