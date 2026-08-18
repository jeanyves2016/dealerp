frappe.pages["gestion-logistique-dashboard"].on_page_load = function (wrapper) {

    // CSS local du dashboard
    const dashboard_style = document.createElement("style");
    dashboard_style.id = "dealerp-dashboard-style";

    if (!document.getElementById("dealerp-dashboard-style")) {
        dashboard_style.textContent = ".deal-dashboard {\n    padding: 10px 8px 50px;\n    max-width: 1500px;\n    margin: 0 auto;\n}\n\n.deal-dashboard-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 20px;\n    margin-bottom: 32px;\n}\n\n.deal-dashboard-kicker {\n    font-size: 11px;\n    font-weight: 700;\n    letter-spacing: 1.5px;\n    color: var(--text-muted);\n    margin-bottom: 6px;\n}\n\n.deal-dashboard-header h1 {\n    font-size: 30px;\n    font-weight: 700;\n    margin: 0 0 5px;\n    color: var(--heading-color);\n}\n\n.deal-dashboard-header p {\n    margin: 0;\n    color: var(--text-muted);\n    font-size: 14px;\n}\n\n.deal-dashboard-actions {\n    display: flex;\n    gap: 8px;\n}\n\n.deal-section-title {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    margin: 28px 0 14px;\n}\n\n.deal-section-title span {\n    font-size: 16px;\n    font-weight: 700;\n    color: var(--heading-color);\n}\n\n.deal-section-title small {\n    color: var(--text-muted);\n    font-size: 12px;\n}\n\n.deal-kpi-grid {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 16px;\n}\n\n.deal-kpi {\n    min-height: 130px;\n    border-radius: 14px;\n    padding: 22px;\n    display: flex;\n    align-items: center;\n    gap: 17px;\n    cursor: pointer;\n    transition: all 0.2s ease;\n    border: 1px solid var(--border-color);\n    background: var(--card-bg);\n}\n\n.deal-kpi:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);\n}\n\n.deal-kpi-icon {\n    width: 48px;\n    height: 48px;\n    border-radius: 12px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 20px;\n}\n\n.deal-kpi-blue .deal-kpi-icon {\n    background: #e8f0ff;\n    color: #2563eb;\n}\n\n.deal-kpi-cyan .deal-kpi-icon {\n    background: #e5f8fb;\n    color: #0891b2;\n}\n\n.deal-kpi-purple .deal-kpi-icon {\n    background: #f1eaff;\n    color: #7c3aed;\n}\n\n.deal-kpi-orange .deal-kpi-icon {\n    background: #fff2df;\n    color: #ea580c;\n}\n\n.deal-kpi-label {\n    font-size: 13px;\n    color: var(--text-muted);\n    margin-bottom: 3px;\n}\n\n.deal-kpi-value {\n    font-size: 28px;\n    line-height: 1.1;\n    font-weight: 700;\n    color: var(--heading-color);\n}\n\n.deal-kpi-link {\n    font-size: 11px;\n    margin-top: 7px;\n    color: var(--text-muted);\n}\n\n.deal-alert-row {\n    margin-top: 16px;\n}\n\n.deal-alert {\n    display: flex;\n    align-items: center;\n    gap: 14px;\n    padding: 15px 18px;\n    border-radius: 12px;\n    cursor: pointer;\n}\n\n.deal-alert-danger {\n    background: #fff1f2;\n    border: 1px solid #fecdd3;\n    color: #be123c;\n}\n\n.deal-alert-icon {\n    font-size: 18px;\n}\n\n.deal-alert strong {\n    font-size: 18px;\n    margin-right: 5px;\n}\n\n.deal-alert span {\n    font-size: 13px;\n}\n\n.deal-alert-arrow {\n    margin-left: auto;\n}\n\n.deal-finance-grid {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 16px;\n}\n\n.deal-finance-card {\n    background: var(--card-bg);\n    border: 1px solid var(--border-color);\n    border-radius: 14px;\n    padding: 20px;\n}\n\n.deal-finance-warning {\n    border-left: 4px solid #f59e0b;\n}\n\n.deal-finance-top {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    color: var(--text-muted);\n    font-size: 13px;\n}\n\n.deal-finance-top i {\n    font-size: 16px;\n}\n\n.deal-finance-value {\n    margin-top: 13px;\n    font-size: 24px;\n    font-weight: 700;\n    color: var(--heading-color);\n}\n\n.deal-finance-caption {\n    margin-top: 6px;\n    color: var(--text-muted);\n    font-size: 11px;\n}\n\n.deal-progress {\n    height: 6px;\n    background: var(--control-bg);\n    border-radius: 10px;\n    overflow: hidden;\n    margin-top: 12px;\n}\n\n.deal-progress div {\n    height: 100%;\n    width: 0;\n    border-radius: 10px;\n    background: #2563eb;\n    transition: width 0.5s ease;\n}\n\n.deal-two-columns {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 16px;\n    margin-top: 28px;\n}\n\n.deal-panel {\n    background: var(--card-bg);\n    border: 1px solid var(--border-color);\n    border-radius: 14px;\n    overflow: hidden;\n}\n\n.deal-panel-header {\n    padding: 18px 20px;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    border-bottom: 1px solid var(--border-color);\n}\n\n.deal-panel-header h3 {\n    margin: 0;\n    font-size: 15px;\n    font-weight: 700;\n}\n\n.deal-panel-header span {\n    display: block;\n    margin-top: 3px;\n    color: var(--text-muted);\n    font-size: 11px;\n}\n\n.deal-table {\n    width: 100%;\n}\n\n.deal-table-row {\n    display: grid;\n    grid-template-columns: 1fr 1.4fr 1fr;\n    gap: 10px;\n    padding: 13px 20px;\n    border-bottom: 1px solid var(--border-color);\n    font-size: 12px;\n    align-items: center;\n}\n\n.deal-table-row:last-child {\n    border-bottom: 0;\n}\n\n.deal-table-head {\n    font-size: 10px;\n    text-transform: uppercase;\n    letter-spacing: .5px;\n    color: var(--text-muted);\n    background: var(--control-bg);\n}\n\n.deal-clickable {\n    cursor: pointer;\n}\n\n.deal-clickable:hover {\n    background: var(--control-bg);\n}\n\n.deal-empty,\n.deal-loading {\n    padding: 35px 20px;\n    text-align: center;\n    color: var(--text-muted);\n    font-size: 13px;\n}\n\n.deal-quick-grid {\n    display: grid;\n    grid-template-columns: repeat(6, 1fr);\n    gap: 12px;\n}\n\n.deal-quick-grid button {\n    border: 1px solid var(--border-color);\n    background: var(--card-bg);\n    border-radius: 12px;\n    padding: 17px 10px;\n    cursor: pointer;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 8px;\n    color: var(--text-color);\n    transition: all .2s ease;\n}\n\n.deal-quick-grid button:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 5px 18px rgba(0, 0, 0, .06);\n}\n\n.deal-quick-grid i {\n    font-size: 19px;\n    color: #2563eb;\n}\n\n.deal-quick-grid span {\n    font-size: 11px;\n    text-align: center;\n}\n\n@media (max-width: 1100px) {\n    .deal-kpi-grid,\n    .deal-finance-grid {\n        grid-template-columns: repeat(2, 1fr);\n    }\n\n    .deal-quick-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n}\n\n@media (max-width: 800px) {\n    .deal-dashboard-header {\n        flex-direction: column;\n        align-items: flex-start;\n    }\n\n    .deal-two-columns {\n        grid-template-columns: 1fr;\n    }\n}\n\n@media (max-width: 600px) {\n    .deal-kpi-grid,\n    .deal-finance-grid {\n        grid-template-columns: 1fr;\n    }\n\n    .deal-quick-grid {\n        grid-template-columns: repeat(2, 1fr);\n    }\n\n    .deal-table-row {\n        grid-template-columns: 1fr 1fr;\n    }\n\n    .deal-table-row > div:last-child {\n        display: none;\n    }\n}\n\n.deal-chart-panel {\n    margin-top: 28px;\n    padding: 22px;\n    border: 1px solid var(--border-color);\n    border-radius: 14px;\n    background: var(--card-bg);\n}\n\n.deal-chart-panel .deal-panel-header {\n    margin-bottom: 15px;\n}\n\n.deal-financial-chart {\n    width: 100%;\n    min-height: 280px;\n}\n\n";
        document.head.appendChild(dashboard_style);
    }



    const css_id = "gestion-logistique-dashboard-css";

    if (!document.getElementById(css_id)) {
        const link = document.createElement("link");
        link.id = css_id;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = "/assets/dealerp/css/gestion_logistique_dashboard.css";
        document.head.appendChild(link);
    }

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "Tableau de bord",
        single_column: true
    });

    $(wrapper).find(".layout-main-section").html(`
        <div class="deal-dashboard">

            <div class="deal-dashboard-header">
                <div>
                    <div class="deal-dashboard-kicker">
                        GESTION LOGISTIQUE
                    </div>

                    <h1>
                        Tableau de bord
                    </h1>

                    <p>
                        Vue d'ensemble de votre activité logistique et financière.
                    </p>
                </div>

                <div class="deal-dashboard-actions">
                    <button class="btn btn-default deal-refresh">
                        <i class="fa fa-refresh"></i>
                        Actualiser
                    </button>

                    <button class="btn btn-primary deal-new-dossier">
                        <i class="fa fa-plus"></i>
                        Nouveau dossier
                    </button>
                </div>
            </div>

            <div class="deal-section-title">
                <span>Activité opérationnelle</span>
            </div>

            <div class="deal-kpi-grid">

                <div class="deal-kpi deal-kpi-blue" data-route="Dossier">
                    <div class="deal-kpi-icon">
                        <i class="fa fa-folder-open"></i>
                    </div>

                    <div>
                        <div class="deal-kpi-label">Dossiers</div>
                        <div class="deal-kpi-value" id="kpi-dossiers">—</div>
                        <div class="deal-kpi-link">
                            Voir les dossiers →
                        </div>
                    </div>
                </div>

                <div class="deal-kpi deal-kpi-cyan" data-route="Expedition">
                    <div class="deal-kpi-icon">
                        <i class="fa fa-truck"></i>
                    </div>

                    <div>
                        <div class="deal-kpi-label">Expéditions</div>
                        <div class="deal-kpi-value" id="kpi-expeditions">—</div>
                        <div class="deal-kpi-link">
                            Voir les expéditions →
                        </div>
                    </div>
                </div>

                <div class="deal-kpi deal-kpi-purple" data-route="Prestation">
                    <div class="deal-kpi-icon">
                        <i class="fa fa-cubes"></i>
                    </div>

                    <div>
                        <div class="deal-kpi-label">Prestations</div>
                        <div class="deal-kpi-value" id="kpi-prestations">—</div>
                        <div class="deal-kpi-link">
                            Voir les prestations →
                        </div>
                    </div>
                </div>

                <div class="deal-kpi deal-kpi-orange" data-route="Task">
                    <div class="deal-kpi-icon">
                        <i class="fa fa-tasks"></i>
                    </div>

                    <div>
                        <div class="deal-kpi-label">Tâches</div>
                        <div class="deal-kpi-value" id="kpi-taches">—</div>
                        <div class="deal-kpi-link">
                            Voir les tâches →
                        </div>
                    </div>
                </div>

            </div>

            <div class="deal-alert-row">

                <div class="deal-alert deal-alert-danger" data-route="Task">
                    <div class="deal-alert-icon">
                        <i class="fa fa-exclamation-triangle"></i>
                    </div>

                    <div>
                        <strong id="kpi-retard">—</strong>
                        <span>tâches en retard</span>
                    </div>

                    <i class="fa fa-arrow-right deal-alert-arrow"></i>
                </div>

            </div>

            <div class="deal-section-title">
                <span>Situation financière</span>
                <small>ERPNext Accounting</small>
            </div>

            <div class="deal-finance-grid">

                <div class="deal-finance-card">
                    <div class="deal-finance-top">
                        <span>CA facturé</span>
                        <i class="fa fa-file-text-o"></i>
                    </div>

                    <div class="deal-finance-value" id="finance-ca">
                        —
                    </div>

                    <div class="deal-finance-caption">
                        Factures clients soumises
                    </div>
                </div>

                <div class="deal-finance-card">
                    <div class="deal-finance-top">
                        <span>Encaissements</span>
                        <i class="fa fa-money"></i>
                    </div>

                    <div class="deal-finance-value" id="finance-encaissements">
                        —
                    </div>

                    <div class="deal-finance-caption">
                        Paiements reçus
                    </div>
                </div>

                <div class="deal-finance-card deal-finance-warning">
                    <div class="deal-finance-top">
                        <span>Impayés</span>
                        <i class="fa fa-warning"></i>
                    </div>

                    <div class="deal-finance-value" id="finance-impayes">
                        —
                    </div>

                    <div class="deal-finance-caption">
                        Créances restantes
                    </div>
                </div>

                <div class="deal-finance-card">
                    <div class="deal-finance-top">
                        <span>Taux d'encaissement</span>
                        <i class="fa fa-line-chart"></i>
                    </div>

                    <div class="deal-finance-value" id="finance-taux">
                        —
                    </div>

                    <div class="deal-progress">
                        <div id="finance-progress"></div>
                    </div>

                    <div class="deal-finance-caption">
                        Encaissements / CA facturé
                    </div>
                </div>

            </div>

            <div class="deal-chart-panel">

            <div class="deal-panel-header">
                <div>
                    <h3>Évolution financière</h3>
                    <span>CA facturé et encaissements — 6 derniers mois</span>
                </div>
            </div>

            <div id="financial-chart" class="deal-financial-chart">
                <div class="deal-loading">Chargement...</div>
            </div>

        </div>

        <div class="deal-two-columns">

                <div class="deal-panel">

                    <div class="deal-panel-header">
                        <div>
                            <h3>Dossiers récents</h3>
                            <span>Dernières affaires modifiées</span>
                        </div>

                        <button class="btn btn-sm btn-default deal-see-dossiers">
                            Tout voir
                        </button>
                    </div>

                    <div id="recent-dossiers">
                        <div class="deal-loading">Chargement...</div>
                    </div>

                </div>

                <div class="deal-panel">

                    <div class="deal-panel-header">
                        <div>
                            <h3>Expéditions récentes</h3>
                            <span>Dernières opérations logistiques</span>
                        </div>

                        <button class="btn btn-sm btn-default deal-see-expeditions">
                            Tout voir
                        </button>
                    </div>

                    <div id="recent-expeditions">
                        <div class="deal-loading">Chargement...</div>
                    </div>

                </div>

            </div>

            <div class="deal-quick-access">

                <div class="deal-section-title">
                    <span>Accès rapides</span>
                </div>

                <div class="deal-quick-grid">

                    <button data-route="Quotation">
                        <i class="fa fa-file-text-o"></i>
                        <span>Devis</span>
                    </button>

                    <button data-route="Sales Order">
                        <i class="fa fa-shopping-cart"></i>
                        <span>Commandes clients</span>
                    </button>

                    <button data-route="Sales Invoice">
                        <i class="fa fa-file-invoice"></i>
                        <span>Factures clients</span>
                    </button>

                    <button data-route="Purchase Invoice">
                        <i class="fa fa-file-text-o"></i>
                        <span>Factures fournisseurs</span>
                    </button>

                    <button data-route="Payment Entry">
                        <i class="fa fa-money"></i>
                        <span>Paiements</span>
                    </button>

                    <button data-route="Customer">
                        <i class="fa fa-users"></i>
                        <span>Clients</span>
                    </button>

                </div>

            </div>

        </div>
    `);

    // ---------------------------------------------------------
    // NAVIGATION
    // ---------------------------------------------------------

    function open_list(doctype) {
        frappe.set_route("List", doctype);
    }

    function open_new(doctype) {
        frappe.new_doc(doctype);
    }

    $(wrapper).on("click", "[data-route]", function () {
        open_list($(this).attr("data-route"));
    });

    $(wrapper).on("click", ".deal-new-dossier", function () {
        open_new("Dossier");
    });

    $(wrapper).on("click", ".deal-see-dossiers", function () {
        open_list("Dossier");
    });

    $(wrapper).on("click", ".deal-see-expeditions", function () {
        open_list("Expedition");
    });

    $(wrapper).on("click", ".deal-refresh", function () {
        load_dashboard();
    });

    // ---------------------------------------------------------
    // FORMATAGE
    // ---------------------------------------------------------

    function currency(value) {
        const amount = Number(value || 0);
        const currency_code = frappe.defaults.get_default("currency") || "XOF";

        return new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + " " + currency_code;
    }

    function escape_html(value) {
        return frappe.utils.escape_html(value || "");
    }

    // ---------------------------------------------------------
    // TABLE DOSSIERS
    // ---------------------------------------------------------

    function render_dossiers(rows) {

        if (!rows || !rows.length) {
            $("#recent-dossiers").html(`
                <div class="deal-empty">
                    Aucun dossier récent
                </div>
            `);
            return;
        }

        let html = `
            <div class="deal-table">
                <div class="deal-table-row deal-table-head">
                    <div>Dossier</div>
                    <div>Client</div>
                    <div>Responsable</div>
                </div>
        `;

        rows.forEach(row => {

            html += `
                <div class="deal-table-row deal-clickable"
                     data-doctype="Dossier"
                     data-name="${escape_html(row.name)}">

                    <div>
                        <strong>${escape_html(row.name)}</strong>
                    </div>

                    <div>
                        ${escape_html(row.customer || "—")}
                    </div>

                    <div>
                        ${escape_html(row.owner_user || "—")}
                    </div>

                </div>
            `;
        });

        html += `</div>`;

        $("#recent-dossiers").html(html);
    }

    // ---------------------------------------------------------
    // TABLE EXPEDITIONS
    // ---------------------------------------------------------

    function render_expeditions(rows) {

        if (!rows || !rows.length) {
            $("#recent-expeditions").html(`
                <div class="deal-empty">
                    Aucune expédition récente
                </div>
            `);
            return;
        }

        let html = `
            <div class="deal-table">
                <div class="deal-table-row deal-table-head">
                    <div>Expédition</div>
                    <div>Client</div>
                    <div>Transport</div>
                </div>
        `;

        rows.forEach(row => {

            html += `
                <div class="deal-table-row deal-clickable"
                     data-doctype="Expedition"
                     data-name="${escape_html(row.name)}">

                    <div>
                        <strong>${escape_html(row.name)}</strong>
                    </div>

                    <div>
                        ${escape_html(row.custom_client || "—")}
                    </div>

                    <div>
                        ${escape_html(row.mode_transport || "—")}
                    </div>

                </div>
            `;
        });

        html += `</div>`;

        $("#recent-expeditions").html(html);
    }

    $(wrapper).on("click", ".deal-clickable", function () {

        const doctype = $(this).data("doctype");
        const name = $(this).data("name");

        frappe.set_route("Form", doctype, name);
    });

    // ---------------------------------------------------------
    // CHARGEMENT
    // ---------------------------------------------------------

    function render_financial_chart(rows) {

    if (!rows || !rows.length) {
        $("#financial-chart").html(`
            <div class="deal-empty">
                Aucune donnée financière disponible
            </div>
        `);
        return;
    }

    const labels = rows.map(row => {
        const parts = String(row.mois || "").split("-");
        if (parts.length !== 2) return row.mois;

        const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            1
        );

        return date.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric"
        });
    });

    const ca = rows.map(row => Number(row.ca || 0));
    const encaissements = rows.map(row => Number(row.encaissements || 0));

    $("#financial-chart").empty();

    new frappe.Chart("#financial-chart", {
        data: {
            labels: labels,
            datasets: [
                {
                    name: "CA facturé",
                    values: ca
                },
                {
                    name: "Encaissements",
                    values: encaissements
                }
            ]
        },

        type: "line",

        height: 280,

        colors: [
            "#2563eb",
            "#16a34a"
        ],

        lineOptions: {
            hideDots: 0,
            regionFill: 1,
            spline: 1
        },

        axisOptions: {
            xIsSeries: 1
        },

        tooltipOptions: {
            formatTooltipY: value => {
                return new Intl.NumberFormat("fr-FR", {
                    maximumFractionDigits: 0
                }).format(value) + " XOF";
            }
        }
    });
}

function load_dashboard() {

        $(".deal-refresh i")
            .addClass("fa-spin");

        frappe.call({
            method: "dealerp.api.dashboard.get_dashboard_data",

            callback: function (response) {

                console.log("DEALERP DASHBOARD RESPONSE :", response);

                let data = response.message || {};

                if (typeof data === "string") {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        console.error("Impossible de parser response.message :", e);
                        data = {};
                    }
                }

                console.log("DEALERP DASHBOARD DATA :", data);
                console.log(
                    "DEALERP EVOLUTION FINANCIERE :",
                    data.evolution_financiere
                );

                $("#kpi-dossiers").text(data.dossiers || 0);
                $("#kpi-expeditions").text(data.expeditions || 0);
                $("#kpi-prestations").text(data.prestations || 0);
                $("#kpi-taches").text(data.taches || 0);
                $("#kpi-retard").text(data.taches_en_retard || 0);

                $("#finance-ca").text(currency(data.ca));
                $("#finance-encaissements").text(currency(data.encaissements));
                $("#finance-impayes").text(currency(data.impayes));

                const taux = Number(data.taux_encaissement || 0);

                $("#finance-taux").text(`${taux.toFixed(1)} %`);
                $("#finance-progress").css(
                    "width",
                    `${Math.min(taux, 100)}%`
                );

                render_dossiers(data.dossiers_recents || []);
                render_expeditions(data.expeditions_recentes || []);
                render_financial_chart(data.evolution_financiere || []);
            },

            error: function () {

                frappe.msgprint({
                    title: "Erreur",
                    message: "Impossible de charger le tableau de bord.",
                    indicator: "red"
                });
            },

            always: function () {

                $(".deal-refresh i")
                    .removeClass("fa-spin");
            }
        });
    }

    load_dashboard();
};
