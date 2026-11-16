/* =====================================================================
   VILALARA — RESERVAR MESA (reserva-restaurante.html)
   Página fictícia, com os passos do widget Zenchef do Coral:
   restaurante, pessoas (1 a 6), data, hora, sala e dados do cliente. Não envia nada: no fim mostra a confirmação.
   O restaurante vem no link: reserva-restaurante.html?r=coral
   ===================================================================== */
(function () {
  var form = document.querySelector(".rm-form");
  if (!form) return;

  /* ---------- Dados de cada restaurante ----------
     Horários e salas dos restaurantes que não são o Coral são fictícios (protótipo). */
  var RESTAURANTES = [
    { id: "coral", nome: "Coral", logo: "coral.png", menu: "https://qr.vilalara.com/u/c/menu-coral?_d=1",
      descricao: "No Coral, o Chef Diogo Pereira celebra a influência do Atlântico e do campo algarvio, explorando o melhor do mar sem esquecer os produtores locais e autênticos de carne, legumes e especiarias. Dois menus de degustação, de 9 e 6 momentos, oferecem uma experiência gastronómica única com vista mar. O Coral foi recentemente distinguido no Guia Michelin 2026.",
      turnos: [["Jantar", "19:00", "21:30"]], salas: ["Terraço", "Interior"] },
    { id: "raizes", nome: "Raízes", logo: "raizes.png", menu: "https://qr.vilalara.com/u/c/YZIzTiRM",
      descricao: "No centro da cozinha, a chama e as brasas dão vida a uma gastronomia simples e intensa, onde o tempo é ingrediente, como no nosso borrego assado durante 24 horas em forno de lenha.",
      turnos: [["Almoço", "12:30", "15:00"], ["Jantar", "19:00", "22:00"]], salas: ["Terraço", "Interior"] },
    { id: "trattoria", nome: "Trattoria", logo: "trattoria.png", menu: "https://qr.vilalara.com/u/c/trattoria-menu?_d=1",
      descricao: "Tradição italiana aliada a ingredientes algarvios. Pratos que personificam as melhores ofertas gastronómicas do Mediterrâneo.",
      turnos: [["Jantar", "19:00", "22:00"]], salas: ["Terraço", "Interior"] },
    { id: "a-costa", nome: "A-costa", logo: "a-costa.png", menu: "https://qr.vilalara.com/u/c/acosta-lunch-menu?_d=1",
      descricao: "A quintessência dos clássicos portugueses a qualquer hora. As melhores coisas valem sempre a pena ser revisitadas.",
      turnos: [["Almoço", "12:00", "15:30"], ["Jantar", "19:00", "22:30"]], salas: ["Terraço", "Interior"] },
    { id: "vento", nome: "Vento", logo: "vento.png", menu: "https://qr.vilalara.com/u/c/vento-menu?_d=1",
      descricao: "Inspirado pela natureza, guiado pela criatividade e pelo equilíbrio, o Vento reinventa as tradições mediterrânicas num espaço autêntico onde cada prato convida a uma viagem sensorial.",
      turnos: [["Almoço", "12:30", "15:00"], ["Jantar", "19:00", "22:00"]], salas: ["Terraço", "Interior"] },
    { id: "gaivotas", nome: "Gaivotas", logo: "gaivotas.png", menu: "https://qr.vilalara.com/u/c/gaivotas-menu",
      descricao: "Cozinha portuguesa com o Atlântico no centro, onde peixe, marisco, arrozes e caldos dão vida a clássicos executados com precisão e elegância mediterrânica.",
      turnos: [["Almoço", "12:30", "15:00"], ["Jantar", "19:00", "22:00"]], salas: ["Terraço", "Interior"] }
  ];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  var $ = function (s) { return document.querySelector(s); };
  var estado = { r: null, pessoas: 2, data: null, hora: null, sala: null };
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var mesVisto = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  function botaoOpcao(texto, ativo, aoClicar, extra) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "rm-opcao" + (extra ? " " + extra : "");
    b.innerHTML = texto; b.setAttribute("aria-pressed", ativo ? "true" : "false");
    b.addEventListener("click", aoClicar);
    return b;
  }
  function dataLonga(d) { return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }

  /* ---------- Restaurante ---------- */
  function escolherRestaurante(id) {
    var r = RESTAURANTES.filter(function (x) { return x.id === id; })[0] || RESTAURANTES[0];
    estado.r = r; estado.hora = null;
    estado.sala = r.salas[0];
    $("[data-rm-resumo-logo]").src = "assets/img/gastronomia/logos/" + r.logo;
    $("[data-rm-descricao]").textContent = r.descricao;
    var menu = $("[data-rm-menu]"); menu.hidden = !r.menu; if (r.menu) menu.href = r.menu;
    document.title = "Reservar mesa · " + r.nome + " · Vilalara";
    try { history.replaceState(null, "", "?r=" + r.id + location.hash); } catch (e) {}
    desenharRestaurantes(); desenharSalas(); desenharHoras(); resumo();
  }
  function desenharRestaurantes() {
    var caixa = $("[data-rm-restaurantes]"); caixa.innerHTML = "";
    RESTAURANTES.forEach(function (r) {
      caixa.appendChild(botaoOpcao('<img src="assets/img/gastronomia/logos/' + r.logo + '" alt="' + r.nome + '">', estado.r === r,
        function () { escolherRestaurante(r.id); }, "rm-opcao--logo"));
    });
  }

  /* ---------- Pessoas (1 a 6) ---------- */
  function desenharPessoas() {
    var caixa = $("[data-rm-pessoas]"); caixa.innerHTML = "";
    for (var n = 1; n <= 6; n++) (function (n) {
      caixa.appendChild(botaoOpcao(String(n), estado.pessoas === n, function () { estado.pessoas = n; desenharPessoas(); resumo(); }));
    })(n);
  }

  /* ---------- Calendário ---------- */
  function desenharCalendario() {
    var caixa = $("[data-rm-calendario]"); caixa.innerHTML = "";
    var topo = document.createElement("div"); topo.className = "rm-cal__topo";
    var ant = botaoOpcao("←", false, function () { mesVisto.setMonth(mesVisto.getMonth() - 1); desenharCalendario(); }, "rm-cal__seta");
    ant.setAttribute("aria-label", "Mês anterior"); ant.removeAttribute("aria-pressed");
    ant.disabled = mesVisto <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    var seg = botaoOpcao("→", false, function () { mesVisto.setMonth(mesVisto.getMonth() + 1); desenharCalendario(); }, "rm-cal__seta");
    seg.setAttribute("aria-label", "Mês seguinte"); seg.removeAttribute("aria-pressed");
    var tit = document.createElement("p"); tit.className = "rm-cal__mes"; tit.textContent = MESES[mesVisto.getMonth()] + " " + mesVisto.getFullYear();
    topo.append(ant, tit, seg); caixa.appendChild(topo);
    var grelha = document.createElement("div"); grelha.className = "rm-cal__grelha";
    DIAS.forEach(function (d) { var s = document.createElement("span"); s.className = "rm-cal__dia-semana"; s.textContent = d; grelha.appendChild(s); });
    var primeiro = (mesVisto.getDay() + 6) % 7;
    for (var i = 0; i < primeiro; i++) grelha.appendChild(document.createElement("span"));
    var dias = new Date(mesVisto.getFullYear(), mesVisto.getMonth() + 1, 0).getDate();
    for (var d = 1; d <= dias; d++) (function (d) {
      var data = new Date(mesVisto.getFullYear(), mesVisto.getMonth(), d);
      var ativo = estado.data && data.getTime() === estado.data.getTime();
      var b = botaoOpcao(String(d), ativo, function () { estado.data = data; estado.hora = null; desenharCalendario(); desenharHoras(); resumo(); }, "rm-cal__dia");
      b.disabled = data < hoje; b.setAttribute("aria-label", dataLonga(data));
      grelha.appendChild(b);
    })(d);
    caixa.appendChild(grelha);
  }

  /* ---------- Horas (de 15 em 15 minutos, por turno) ---------- */
  function minutos(h) { var p = h.split(":"); return +p[0] * 60 + +p[1]; }
  function hh(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
  function desenharHoras() {
    var caixa = $("[data-rm-horas]"); caixa.innerHTML = "";
    if (!estado.data) { caixa.innerHTML = '<p class="rm-nota">Escolha primeiro a data.</p>'; return; }
    var agora = new Date(), eHoje = estado.data.getTime() === hoje.getTime();
    estado.r.turnos.forEach(function (t) {
      var bloco = document.createElement("div"); bloco.className = "rm-turno";
      var nome = document.createElement("p"); nome.className = "rm-turno__nome"; nome.textContent = t[0]; bloco.appendChild(nome);
      var lista = document.createElement("div"); lista.className = "rm-opcoes";
      for (var m = minutos(t[1]); m <= minutos(t[2]); m += 15) (function (m) {
        var b = botaoOpcao(hh(m), estado.hora === hh(m), function () { estado.hora = hh(m); desenharHoras(); resumo(); }, "rm-opcao--hora");
        b.disabled = eHoje && m <= agora.getHours() * 60 + agora.getMinutes() + 60;   // até 1 hora antes
        lista.appendChild(b);
      })(m);
      bloco.appendChild(lista); caixa.appendChild(bloco);
    });
  }

  /* ---------- Sala ---------- */
  function desenharSalas() {
    var caixa = $("[data-rm-salas]"); caixa.innerHTML = "";
    estado.r.salas.forEach(function (s) {
      caixa.appendChild(botaoOpcao(s, estado.sala === s, function () { estado.sala = s; desenharSalas(); resumo(); }));
    });
  }

  /* ---------- Resumo ---------- */
  function resumo() {
    $("[data-rm-r-pessoas]").textContent = estado.pessoas + (estado.pessoas === 1 ? " pessoa" : " pessoas");
    $("[data-rm-r-data]").textContent = estado.data ? dataLonga(estado.data) : "—";
    $("[data-rm-r-hora]").textContent = estado.hora || "—";
    $("[data-rm-r-sala]").textContent = estado.sala || "—";
  }

  /* ---------- Enviar (fictício) ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var falta = [];
    if (!estado.data) falta.push("a data");
    if (!estado.hora) falta.push("a hora");
    if (!form.querySelector('[name="tratamento"]:checked')) falta.push("o tratamento (Sr. / Sra.)");
    form.querySelectorAll(".rm-dados [required]").forEach(function (c) {
      if (!c.value.trim() || (c.type === "email" && !/^\S+@\S+\.\S+$/.test(c.value))) falta.push(c.closest("label").querySelector("span").textContent.toLowerCase());
    });
    if (!form.querySelector('[name="privacidade"]').checked) falta.push("aceitar a Política de Privacidade");
    var erro = $("[data-rm-erro]");
    if (falta.length) { erro.hidden = false; erro.textContent = "Falta preencher: " + falta.join(", ") + "."; return; }
    erro.hidden = true;
    $("[data-rm-ok-texto]").textContent = "Mesa para " + estado.pessoas + (estado.pessoas === 1 ? " pessoa" : " pessoas") + " no " + estado.r.nome +
      ", " + dataLonga(estado.data) + " às " + estado.hora + (estado.sala ? " (" + estado.sala + ")" : "") + ".";
    var ok = $("[data-rm-ok]"); ok.hidden = false; ok.focus();
  });

  /* ---------- Início: restaurante do link (?r=coral) ---------- */
  var pedido = new URLSearchParams(location.search).get("r");
  desenharPessoas(); desenharCalendario();
  escolherRestaurante(pedido || "coral");
})();
